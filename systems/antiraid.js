/**
 * Self-Configuring Anti-Raid System for Discord Bot
 * Requires ZERO configuration and works out of the box.
 * 
 * Features:
 * - Anti-Link: Blocks invites, standard URLs, shorteners, and obfuscated links.
 * - Anti-Spam: Detects repeated messages, rapid messaging, mass mentions, custom emoji spam, ALL CAPS.
 * - Anti-Image/GIF: Detects image, GIF, and sticker spam.
 * - Anti-Join Raid: Detects 5+ joins in 10s, activates lockdown, auto-kicks <7d accounts, auto-unlocks after 60s.
 * - Progressive Punishment: 1st delete, 2nd timeout 5m, 3rd timeout 1h, 4th+ ban. Resets after 24h.
 * - Self-Configuring: Auto-exempts staff (MANAGE_MESSAGES), logs to mod-log channel if present, otherwise acts silently.
 */

// In-memory tracking data structures
const userMessageHistory = new Map();     // key: `${guildId}:${userId}` -> Array<{ content: string, timestamp: number }>
const userMediaHistory = new Map();       // key: `${guildId}:${userId}` -> Array<{ count: number, timestamp: number }>
const userOffenses = new Map();           // key: `${guildId}:${userId}` -> { count: number, lastOffense: number }
const guildJoinHistory = new Map();       // key: guildId -> number[] (timestamps)
const guildLockdownState = new Map();     // key: guildId -> { isLocked: boolean, unlockTimeout: NodeJS.Timeout | null, lastRapidJoin: number }
const configuredModLogChannels = new Map(); // key: guildId -> channelId

// Deduplication for event processing
const processedMessages = new WeakSet();
const processedMembers = new WeakSet();

// Time constants
const TEN_SECONDS_MS = 10 * 1000;
const FIVE_SECONDS_MS = 5 * 1000;
const SIXTY_SECONDS_MS = 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a guild member has staff privileges (MANAGE_MESSAGES exemption)
 * @param {import('discord.js').GuildMember} member 
 * @returns {boolean}
 */
function isStaff(member) {
  if (!member) return false;

  // Guild owner is always staff
  if (member.guild && member.guild.ownerId === member.id) return true;

  if (member.permissions) {
    try {
      // PermissionFlagsBits / String / Bitfield checks
      // MANAGE_MESSAGES: 1n << 13n (8192)
      // ADMINISTRATOR: 1n << 3n (8)
      if (
        member.permissions.has('ManageMessages') ||
        member.permissions.has('MANAGE_MESSAGES') ||
        member.permissions.has('Administrator') ||
        member.permissions.has('ADMINISTRATOR') ||
        member.permissions.has(8192n) ||
        member.permissions.has(8n) ||
        member.permissions.has(8192) ||
        member.permissions.has(8)
      ) {
        return true;
      }
    } catch (_) {
      try {
        if (member.permissions.has('ManageMessages') || member.permissions.has('MANAGE_MESSAGES')) {
          return true;
        }
      } catch (__) {}
    }
  }

  return false;
}

/**
 * Detect all types of links (standard, discord invites, shorteners, and obfuscated variants)
 * @param {string} content 
 * @returns {boolean}
 */
function detectLink(content) {
  if (!content || typeof content !== 'string') return false;

  // 1. Direct standard URL / invite pattern
  const directRegex = /(?:https?:\/\/|www\.)\S+|\bdiscord(?:app)?\.(?:gg|com\/invite)\/\S+/i;
  if (directRegex.test(content)) return true;

  // 2. Remove invisible / zero-width characters and normalize obfuscated dot/slash notations
  let clean = content
    .replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, '')
    .replace(/\[dot\]|\(dot\)|\{dot\}|\[\.\]|\(\.\)/gi, '.')
    .replace(/\[slash\]|\(slash\)|\{slash\}|\[\/\]|\(\/\)/gi, '/')
    .replace(/\[colon\]|\(colon\)/gi, ':');

  if (directRegex.test(clean)) return true;

  // 3. Space collapse around punctuation: e.g. "discord . gg / invite" -> "discord.gg/invite"
  const collapsedPunctuation = clean.replace(/\s*([.:\/?&=_-])\s*/g, '$1');
  if (directRegex.test(collapsedPunctuation)) return true;

  // 4. Discord invite links
  const inviteRegex = /(?:discord(?:app)?\.(?:gg|com\/(?:invite|channels))|discord\.gg)\/[a-z0-9_-]+/i;
  if (inviteRegex.test(clean) || inviteRegex.test(collapsedPunctuation)) return true;

  // 5. Common URL shortener patterns
  const shortenerRegex = /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|buff\.ly|adf\.ly|bitly\.com|rb\.gy|cutt\.ly|shorturl\.at|v\.gd|qr\.ae)\/[a-z0-9_-]+/i;
  if (shortenerRegex.test(clean) || shortenerRegex.test(collapsedPunctuation)) return true;

  // 6. Complete whitespace removal to detect spaced-out URLs e.g. "h t t p s : / /" or "d i s c o r d . g g"
  const noSpaces = clean.replace(/\s+/g, '');
  if (directRegex.test(noSpaces) || inviteRegex.test(noSpaces) || shortenerRegex.test(noSpaces)) return true;

  // 7. General domain with TLD and path (e.g. site.com/xyz)
  const domainWithSlashRegex = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|io|co|gg|xyz|top|ru|info|link|click|live|online|site|store|app|dev|me|tv|cc|to|club|vip|shop|pro|space)\/[^\s]+/i;
  if (domainWithSlashRegex.test(clean) || domainWithSlashRegex.test(collapsedPunctuation) || domainWithSlashRegex.test(noSpaces)) return true;

  return false;
}

/**
 * Check if content is ALL CAPS (80%+ uppercase letters, 10+ characters)
 * @param {string} content 
 * @returns {boolean}
 */
function isAllCaps(content) {
  if (!content || content.length < 10) return false;

  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 8) return false; // Must have sufficient letters

  const upper = letters.replace(/[^A-Z]/g, '').length;
  return (upper / letters.length) >= 0.8;
}

/**
 * Count images, GIFs, and stickers in a message
 * @param {import('discord.js').Message} message 
 * @returns {number}
 */
function getMediaCount(message) {
  let count = 0;

  // Attachments (images / gifs / media)
  if (message.attachments && message.attachments.size > 0) {
    for (const [, att] of message.attachments) {
      const isImg = (att.contentType && att.contentType.startsWith('image/')) ||
                    /\.(png|jpe?g|gif|webp)$/i.test(att.name || att.url || '');
      if (isImg) count++;
    }
  }

  // Stickers
  if (message.stickers && message.stickers.size > 0) {
    count += message.stickers.size;
  }

  // Image/GIF URLs in content (e.g. Tenor, Giphy, direct media links)
  const gifUrlRegex = /https?:\/\/\S*(?:tenor\.com|giphy\.com|\.(?:gif|png|jpe?g|webp))\S*/gi;
  const urlMatches = (message.content || '').match(gifUrlRegex);
  if (urlMatches) {
    count += urlMatches.length;
  }

  return count;
}

/**
 * Locate mod-log channel if configured or auto-detect by common naming conventions
 * @param {import('discord.js').Guild} guild 
 * @returns {import('discord.js').TextChannel | null}
 */
function findModLogChannel(guild) {
  if (!guild || !guild.channels || !guild.channels.cache) return null;

  // 1. In-memory configured channel
  if (configuredModLogChannels.has(guild.id)) {
    const channelId = configuredModLogChannels.get(guild.id);
    const channel = guild.channels.cache.get(channelId);
    if (channel && (typeof channel.isTextBased !== 'function' || channel.isTextBased())) {
      return channel;
    }
  }

  // 2. Custom guild property if present
  if (guild.modLogChannelId) {
    const channel = guild.channels.cache.get(guild.modLogChannelId);
    if (channel && (typeof channel.isTextBased !== 'function' || channel.isTextBased())) {
      return channel;
    }
  }

  // 3. Auto-detect by standard channel names
  const candidateNames = [
    'mod-log',
    'mod-logs',
    'modlog',
    'modlogs',
    'security-log',
    'security-logs',
    'audit-log',
    'audit-logs',
    'bot-log',
    'bot-logs',
    'logs'
  ];

  const found = guild.channels.cache.find(c => {
    if (typeof c.isTextBased === 'function' && !c.isTextBased()) return false;
    const name = (c.name || '').toLowerCase();
    return candidateNames.includes(name);
  });

  return found || null;
}

/**
 * Log an action to mod-log channel if available; otherwise act completely silently
 * ALL bot messages about anti-raid actions must be VERY SHORT.
 * @param {import('discord.js').Guild} guild 
 * @param {string} messageText 
 */
async function logAction(guild, messageText) {
  try {
    const channel = findModLogChannel(guild);
    if (channel) {
      await channel.send(messageText).catch(() => {});
    }
  } catch (_) {
    // Fail silently
  }
}

/**
 * Apply progressive punishment to an offending user
 * 1st offense: Delete message silently
 * 2nd offense: Timeout 5 minutes
 * 3rd offense: Timeout 1 hour
 * 4th+ offense: Ban
 * Offenses reset after 24 hours
 * 
 * @param {import('discord.js').Message} message 
 * @param {string} reasonCategory - e.g. 'Anti-spam', 'Anti-link'
 * @param {string} detail - Description for internal log
 */
async function punishUser(message, reasonCategory, detail) {
  const guild = message.guild;
  const member = message.member;
  const user = message.author;
  const key = `${guild.id}:${user.id}`;
  const now = Date.now();

  // Retrieve or initialize offenses with 24-hour expiration
  let record = userOffenses.get(key);
  if (!record || (now - record.lastOffense > TWENTY_FOUR_HOURS_MS)) {
    record = { count: 0, lastOffense: now };
  }

  record.count += 1;
  record.lastOffense = now;
  userOffenses.set(key, record);

  const offenseCount = record.count;

  // Always delete offending message
  if (message.deletable) {
    await message.delete().catch(() => {});
  }

  if (offenseCount === 1) {
    // 1st offense: Delete message silently
    await logAction(guild, `Shield ${reasonCategory} | <@${user.id}> message deleted (1st offense)`);
    return;
  }

  if (offenseCount === 2) {
    // 2nd offense: Timeout 5 minutes
    const timeoutDuration = 5 * 60 * 1000;
    try {
      if (member && (member.moderatable ?? true)) {
        await member.timeout(timeoutDuration, `Anti-raid: ${reasonCategory} (2nd offense - ${detail})`);
      }
    } catch (e) {
      console.error(`Anti-raid: Failed to timeout member ${user.id}:`, e.message);
    }
    await logAction(guild, `Shield ${reasonCategory} | <@${user.id}> timeout 5min`);
    return;
  }

  if (offenseCount === 3) {
    // 3rd offense: Timeout 1 hour
    const timeoutDuration = 60 * 60 * 1000;
    try {
      if (member && (member.moderatable ?? true)) {
        await member.timeout(timeoutDuration, `Anti-raid: ${reasonCategory} (3rd offense - ${detail})`);
      }
    } catch (e) {
      console.error(`Anti-raid: Failed to timeout member ${user.id}:`, e.message);
    }
    await logAction(guild, `Shield ${reasonCategory} | <@${user.id}> timeout 1h`);
    return;
  }

  if (offenseCount >= 4) {
    // 4th+ offense: Ban
    try {
      if (member && (member.bannable ?? true)) {
        await member.ban({
          deleteMessageSeconds: 86400,
          days: 1, // Backward compatibility for discord.js v13
          reason: `Anti-raid: ${reasonCategory} (4th+ offense - ${detail})`
        });
      } else if (guild.bans) {
        await guild.bans.create(user.id, {
          deleteMessageSeconds: 86400,
          days: 1,
          reason: `Anti-raid: ${reasonCategory} (4th+ offense - ${detail})`
        });
      }
    } catch (e) {
      console.error(`Anti-raid: Failed to ban member ${user.id}:`, e.message);
    }
    await logAction(guild, `Shield Anti-raid | <@${user.id}> banned`);
    return;
  }
}

/**
 * Handle incoming message for anti-raid / anti-spam / anti-link checks
 * @param {import('discord.js').Message} message 
 */
async function handleMessage(message) {
  if (!message || !message.guild || !message.author || message.author.bot) return;

  // Deduplicate in case both event handler and client listener are active
  if (processedMessages.has(message)) return;
  processedMessages.add(message);

  // Exempt staff members (MANAGE_MESSAGES permission)
  if (isStaff(message.member)) return;

  const content = message.content || '';
  const now = Date.now();
  const userKey = `${message.guild.id}:${message.author.id}`;

  // ----------------------------------------------------
  // a) Anti-Link Check
  // ----------------------------------------------------
  if (detectLink(content)) {
    await punishUser(message, 'Anti-link', 'Forbidden link detected');
    return;
  }

  // ----------------------------------------------------
  // b) Anti-Spam Check: Mass mentions (5+ mentions)
  // ----------------------------------------------------
  let mentionCount = 0;
  if (message.mentions) {
    mentionCount += message.mentions.users?.size || 0;
    mentionCount += message.mentions.roles?.size || 0;
    if (message.mentions.everyone) mentionCount += 1;
  }
  const rawMentions = (content.match(/<@!?\d+>|<@&\d+>|@everyone|@here/g) || []).length;
  if (Math.max(mentionCount, rawMentions) >= 5) {
    await punishUser(message, 'Anti-spam', 'Mass mentions (5+)');
    return;
  }

  // ----------------------------------------------------
  // b) Anti-Spam Check: Mass emoji spam (10+ custom emojis)
  // ----------------------------------------------------
  const customEmojis = (content.match(/<a?:[a-zA-Z0-9_]+:\d+>/g) || []).length;
  if (customEmojis >= 10) {
    await punishUser(message, 'Anti-spam', 'Mass emoji spam (10+)');
    return;
  }

  // ----------------------------------------------------
  // b) Anti-Spam Check: ALL CAPS (80%+ caps, 10+ chars)
  // ----------------------------------------------------
  if (isAllCaps(content)) {
    await punishUser(message, 'Anti-spam', 'ALL CAPS spam');
    return;
  }

  // ----------------------------------------------------
  // b) Message History Tracking & Rate Limits
  // ----------------------------------------------------
  let history = userMessageHistory.get(userKey) || [];
  // Prune entries older than 15 seconds
  history = history.filter(m => (now - m.timestamp) <= 15000);
  history.push({ content, timestamp: now });
  userMessageHistory.set(userKey, history);

  // Check 1: Same message repeated 3+ times in 10 seconds
  const recent10s = history.filter(m => (now - m.timestamp) <= TEN_SECONDS_MS);
  const normalizedCurrent = content.trim().toLowerCase();
  const sameMessageCount = recent10s.filter(m => m.content.trim().toLowerCase() === normalizedCurrent).length;
  if (sameMessageCount >= 3) {
    await punishUser(message, 'Anti-spam', 'Repeated message spam (3+ in 10s)');
    return;
  }

  // Check 2: 5+ messages in 5 seconds from same user
  const recent5s = history.filter(m => (now - m.timestamp) <= FIVE_SECONDS_MS);
  if (recent5s.length >= 5) {
    await punishUser(message, 'Anti-spam', 'Fast messaging (5+ in 5s)');
    return;
  }

  // ----------------------------------------------------
  // c) Anti-Image/GIF Spam: 3+ images/GIFs/stickers in 10s
  // ----------------------------------------------------
  const mediaInCurrent = getMediaCount(message);
  if (mediaInCurrent > 0) {
    let mediaHistory = userMediaHistory.get(userKey) || [];
    mediaHistory = mediaHistory.filter(item => (now - item.timestamp) <= TEN_SECONDS_MS);
    mediaHistory.push({ count: mediaInCurrent, timestamp: now });
    userMediaHistory.set(userKey, mediaHistory);

    const totalMedia10s = mediaHistory.reduce((sum, item) => sum + item.count, 0);
    if (totalMedia10s >= 3) {
      await punishUser(message, 'Anti-spam', 'Media spam (3+ images/GIFs/stickers in 10s)');
      return;
    }
  }
}

/**
 * Handle new member joins for join-raid detection and raid lockdown
 * @param {import('discord.js').GuildMember} member 
 */
async function handleMemberAdd(member) {
  if (!member || !member.guild || !member.user || member.user.bot) return;

  // Deduplicate
  if (processedMembers.has(member)) return;
  processedMembers.add(member);

  const guild = member.guild;
  const now = Date.now();
  const guildId = guild.id;

  // Track join timestamps in 10-second rolling window
  let joins = (guildJoinHistory.get(guildId) || []).filter(ts => (now - ts) <= TEN_SECONDS_MS);
  joins.push(now);
  guildJoinHistory.set(guildId, joins);

  let state = guildLockdownState.get(guildId);
  if (!state) {
    state = { isLocked: false, unlockTimeout: null, lastRapidJoin: 0 };
    guildLockdownState.set(guildId, state);
  }

  // Detect 5+ joins in 10 seconds -> lockdown mode
  if (joins.length >= 5) {
    state.lastRapidJoin = now;
    if (!state.isLocked) {
      state.isLocked = true;
      await logAction(guild, 'Shield Anti-raid | Lockdown activated');
    }

    // Reset / extend 60-second unlock timer
    if (state.unlockTimeout) {
      clearTimeout(state.unlockTimeout);
    }
    state.unlockTimeout = setTimeout(() => {
      checkAndUnlock(guild);
    }, SIXTY_SECONDS_MS);
    if (state.unlockTimeout.unref) state.unlockTimeout.unref();
  }

  // During lockdown mode: auto-kick new accounts (less than 7 days old)
  if (state.isLocked) {
    const accountAge = now - member.user.createdTimestamp;
    if (accountAge < SEVEN_DAYS_MS) {
      try {
        if (member.kickable ?? true) {
          await member.kick('Anti-raid: Account younger than 7 days during lockdown');
          await logAction(guild, `Shield Anti-raid | <@${member.id}> kicked (new account)`);
        }
      } catch (err) {
        console.error(`Anti-raid: Failed to kick raid member ${member.id}:`, err.message);
      }
    }
  }
}

/**
 * Auto-unlock after 60 seconds of no rapid joins
 * @param {import('discord.js').Guild} guild 
 */
async function checkAndUnlock(guild) {
  const state = guildLockdownState.get(guild.id);
  if (!state || !state.isLocked) return;

  const now = Date.now();
  const recentJoins = (guildJoinHistory.get(guild.id) || []).filter(ts => (now - ts) <= TEN_SECONDS_MS);

  if (recentJoins.length >= 5) {
    // Rapid joins still occurring, postpone unlock by another 60 seconds
    state.unlockTimeout = setTimeout(() => {
      checkAndUnlock(guild);
    }, SIXTY_SECONDS_MS);
    if (state.unlockTimeout.unref) state.unlockTimeout.unref();
    return;
  }

  // 60 seconds of no rapid joins: unlock!
  state.isLocked = false;
  state.unlockTimeout = null;
  await logAction(guild, 'Shield Anti-raid | Lockdown lifted');
}

/**
 * Configure or manually set a mod-log channel for a guild
 * @param {string} guildId 
 * @param {string} channelId 
 */
function setModLogChannel(guildId, channelId) {
  configuredModLogChannels.set(guildId, channelId);
}

/**
 * Retrieve current raid lockdown state for a guild
 * @param {string} guildId 
 * @returns {{ isLocked: boolean }}
 */
function getGuildRaidState(guildId) {
  const state = guildLockdownState.get(guildId);
  return { isLocked: !!(state && state.isLocked) };
}

/**
 * Set up all listeners on the client (Zero configuration required)
 * @param {import('discord.js').Client} client 
 */
function setupAntiRaid(client) {
  if (!client || typeof client.on !== 'function') return;

  if (client._antiRaidListenersSetup) return;
  client._antiRaidListenersSetup = true;

  client.on('messageCreate', async (message) => {
    try {
      await handleMessage(message);
    } catch (err) {
      console.error('Anti-raid error in messageCreate:', err);
    }
  });

  client.on('guildMemberAdd', async (member) => {
    try {
      await handleMemberAdd(member);
    } catch (err) {
      console.error('Anti-raid error in guildMemberAdd:', err);
    }
  });
}

// Periodic auto-cleanup interval for in-memory tracking maps
const cleanupInterval = setInterval(() => {
  const now = Date.now();

  // Cleanup message history older than 15s
  for (const [key, history] of userMessageHistory.entries()) {
    const valid = history.filter(item => (now - item.timestamp) <= 15000);
    if (valid.length === 0) {
      userMessageHistory.delete(key);
    } else {
      userMessageHistory.set(key, valid);
    }
  }

  // Cleanup media history older than 15s
  for (const [key, history] of userMediaHistory.entries()) {
    const valid = history.filter(item => (now - item.timestamp) <= 15000);
    if (valid.length === 0) {
      userMediaHistory.delete(key);
    } else {
      userMediaHistory.set(key, valid);
    }
  }

  // Reset offenses older than 24 hours
  for (const [key, record] of userOffenses.entries()) {
    if (now - record.lastOffense > TWENTY_FOUR_HOURS_MS) {
      userOffenses.delete(key);
    }
  }

  // Cleanup guild join timestamps older than 15s
  for (const [guildId, joins] of guildJoinHistory.entries()) {
    const valid = joins.filter(ts => (now - ts) <= 15000);
    if (valid.length === 0) {
      guildJoinHistory.delete(guildId);
    } else {
      guildJoinHistory.set(guildId, valid);
    }
  }
}, SIXTY_SECONDS_MS);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

module.exports = {
  setupAntiRaid,
  handleMessage,
  handleMemberAdd,
  detectLink,
  isAllCaps,
  getMediaCount,
  isStaff,
  setModLogChannel,
  getGuildRaidState,
  findModLogChannel
};
