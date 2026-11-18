const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../database/db.js');

const ACTION_COLORS = {
  BAN: 0xED4245,
  KICK: 0xE67E22,
  MUTE: 0xFEE75C,
  UNMUTE: 0x57F287,
  WARN: 0xF1C40F,
  CLEAR: 0x95A5A6,
  SLOWMODE: 0x3498DB
};

async function logAction(guild, action, moderator, target, reason) {
  if (!guild) return null;

  try {
    const config = typeof getConfig === 'function' ? await getConfig(guild.id) : null;
    const logChannelId = config?.modLogChannelId || config?.modLogChannel || config?.logChannelId || config?.modLogsChannelId;
    if (!logChannelId) return null;

    const channel = guild.channels?.cache?.get(logChannelId) ||
      (guild.channels?.fetch ? await guild.channels.fetch(logChannelId).catch(() => null) : null);

    if (!channel || typeof channel.send !== 'function') return null;

    const actUpper = (action || 'ACTION').toUpperCase();
    const color = ACTION_COLORS[actUpper] || 0x5865F2;

    let targetStr = 'N/A';
    if (typeof target === 'string') {
      targetStr = target;
    } else if (target && target.id) {
      targetStr = `<@${target.id}> (${target.tag || target.username || target.id})`;
    }

    let modStr = 'N/A';
    if (typeof moderator === 'string') {
      modStr = moderator;
    } else if (moderator && moderator.id) {
      modStr = `<@${moderator.id}> (${moderator.tag || moderator.username || moderator.id})`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${actUpper}`)
      .setColor(color)
      .addFields(
        { name: 'Cible', value: targetStr, inline: true },
        { name: 'Modérateur', value: modStr, inline: true },
        { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false }
      )
      .setTimestamp();

    return await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du log de modération:', error);
    return null;
  }
}

module.exports = {
  logAction
};
module.exports.logAction = logAction;
module.exports.default = { logAction };
