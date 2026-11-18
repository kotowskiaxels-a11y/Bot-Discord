const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'virtualvision.db');
const db = new Database(dbPath);

// Activer WAL pour de meilleures performances
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ═══════════════════════════════════════════
// Création des tables
// ═══════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    guild_id TEXT PRIMARY KEY,
    ticket_category TEXT,
    ticket_log_channel TEXT,
    mod_log_channel TEXT,
    review_channel TEXT,
    staff_role TEXT,
    mute_role TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    emoji TEXT DEFAULT '🎬',
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT UNIQUE,
    guild_id TEXT,
    user_id TEXT,
    username TEXT,
    service_id INTEGER,
    service_name TEXT,
    price TEXT,
    status TEXT DEFAULT 'open',
    claimed_by TEXT,
    staff_id TEXT,
    staff_tag TEXT,
    created_at TEXT,
    claimed_at TEXT,
    closed_at TEXT,
    transcript_path TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    user_id TEXT,
    username TEXT,
    staff_id TEXT,
    rating INTEGER DEFAULT 5,
    comment TEXT DEFAULT '',
    service_id INTEGER,
    visible INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    moderator_id TEXT,
    reason TEXT DEFAULT 'Aucune raison',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS antiraid_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    action TEXT,
    reason TEXT,
    created_at TEXT
  );
`);

// ═══════════════════════════════════════════
// Seed des services par défaut
// ═══════════════════════════════════════════

const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
if (serviceCount === 0) {
  const insert = db.prepare('INSERT INTO services (name, description, price, emoji) VALUES (?, ?, ?, ?)');
  const seeds = [
    ['Montage Basique', 'Montage vidéo simple avec cuts et transitions', 15, '🎬'],
    ['Montage Avancé', 'Montage complet avec effets et color grading', 30, '🎥'],
    ['Motion Design', 'Animations et motion graphics personnalisés', 45, '✨'],
    ['Miniature/Thumbnail', 'Création de miniature YouTube/Twitch', 10, '🖼️'],
    ['Intro/Outro', 'Animation d\'intro ou outro personnalisée', 20, '🎵'],
    ['Pack Complet', 'Montage + miniature + intro/outro', 75, '📦']
  ];
  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(...item);
  });
  insertMany(seeds);
}

// ═══════════════════════════════════════════
// Helpers Config
// ═══════════════════════════════════════════

function getConfig(guildId) {
  let config = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId);
  if (!config) {
    db.prepare('INSERT OR IGNORE INTO config (guild_id) VALUES (?)').run(guildId);
    config = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId);
  }
  // Aliases pour compatibilité
  if (config) {
    config.ticketCategoryId = config.ticket_category;
    config.staffRoleId = config.staff_role;
    config.logChannelId = config.ticket_log_channel;
    config.modLogChannelId = config.mod_log_channel;
    config.reviewChannelId = config.review_channel;
    config.muteRoleId = config.mute_role;
  }
  return config || {};
}

function setConfig(guildId, key, value) {
  const config = getConfig(guildId);
  const allowed = ['ticket_category', 'ticket_log_channel', 'mod_log_channel', 'review_channel', 'staff_role', 'mute_role'];
  if (!allowed.includes(key)) return;
  db.prepare(`UPDATE config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
}

function updateConfig(guildId, data) {
  const config = getConfig(guildId);
  const allowed = ['ticket_category', 'ticket_log_channel', 'mod_log_channel', 'review_channel', 'staff_role', 'mute_role'];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      db.prepare(`UPDATE config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
    }
  }
}

// ═══════════════════════════════════════════
// Helpers Services
// ═══════════════════════════════════════════

function getServices() {
  return db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY id').all();
}

function getAllServices() {
  return db.prepare('SELECT * FROM services ORDER BY id').all();
}

function getServiceById(id) {
  return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

function addService(name, description, price, emoji) {
  const result = db.prepare('INSERT INTO services (name, description, price, emoji) VALUES (?, ?, ?, ?)').run(name, description || '', price, emoji || '🎬');
  return { id: result.lastInsertRowid, name, description, price, emoji, active: 1 };
}

function updateService(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (['name', 'description', 'price', 'emoji', 'active'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return null;
  values.push(id);
  db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getServiceById(id);
}

function deleteService(id) {
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(id);
}

// ═══════════════════════════════════════════
// Helpers Tickets
// ═══════════════════════════════════════════

function saveTicket(data) {
  db.prepare(`
    INSERT INTO tickets (channel_id, guild_id, user_id, username, service_id, service_name, price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.channelId, data.guildId, data.userId, data.username || '', data.serviceId, data.serviceName || '', data.price || '', data.status || 'open', data.createdAt || new Date().toISOString());
}

function getTicket(channelId) {
  return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
}

function getTicketById(id) {
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
}

function getAllTickets(filters = {}) {
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters.user_id) { query += ' AND user_id = ?'; params.push(filters.user_id); }
  if (filters.claimed_by || filters.staff_id) { query += ' AND staff_id = ?'; params.push(filters.claimed_by || filters.staff_id); }
  query += ' ORDER BY id DESC';
  return db.prepare(query).all(...params);
}

function updateTicket(channelId, data) {
  const fields = [];
  const values = [];
  const allowed = ['status', 'claimed_by', 'staff_id', 'staff_tag', 'claimed_at', 'closed_at', 'transcript_path', 'transcriptFile'];
  for (const [key, value] of Object.entries(data)) {
    const dbKey = key === 'transcriptFile' ? 'transcript_path' : key;
    if (allowed.includes(key)) {
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(channelId);
  db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE channel_id = ?`).run(...values);
}

function updateTicketById(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (['status', 'claimed_by', 'staff_id', 'staff_tag', 'claimed_at', 'closed_at', 'transcript_path'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ═══════════════════════════════════════════
// Helpers Reviews
// ═══════════════════════════════════════════

function saveReview(data) {
  const result = db.prepare(`
    INSERT INTO reviews (ticket_id, user_id, username, staff_id, rating, comment, service_id, visible, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.ticketId || null, data.userId, data.username || '', data.staffId || null, data.rating || 5, data.comment || '', data.serviceId || null, data.visible !== false ? 1 : 0, data.createdAt || new Date().toISOString());
  return { id: result.lastInsertRowid, ...data };
}

function getReviews(staffId) {
  if (staffId) {
    return db.prepare('SELECT * FROM reviews WHERE staff_id = ? AND visible = 1 ORDER BY id DESC').all(staffId);
  }
  return db.prepare('SELECT * FROM reviews WHERE visible = 1 ORDER BY id DESC').all();
}

function getAllReviews(filters = {}) {
  let query = 'SELECT r.*, s.name as service_name FROM reviews r LEFT JOIN services s ON r.service_id = s.id WHERE 1=1';
  const params = [];
  if (filters.staffId || filters.staff_id) { query += ' AND r.staff_id = ?'; params.push(filters.staffId || filters.staff_id); }
  if (filters.userId || filters.user_id) { query += ' AND r.user_id = ?'; params.push(filters.userId || filters.user_id); }
  if (filters.service_id) { query += ' AND r.service_id = ?'; params.push(filters.service_id); }
  if (filters.min_rating) { query += ' AND r.rating >= ?'; params.push(filters.min_rating); }
  if (filters.visible !== undefined) { query += ' AND r.visible = ?'; params.push(filters.visible ? 1 : 0); }
  query += ' ORDER BY r.id DESC';
  return db.prepare(query).all(...params);
}

function getReviewById(reviewId) {
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
}

function updateReview(reviewId, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (['rating', 'comment', 'visible'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === 'visible' ? (value ? 1 : 0) : value);
    }
  }
  if (fields.length === 0) return null;
  values.push(reviewId);
  db.prepare(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getReviewById(reviewId);
}

function deleteReview(reviewId) {
  const review = getReviewById(reviewId);
  if (!review) return false;
  db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
  return review;
}

function getStaffRating(staffId) {
  const row = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE staff_id = ? AND visible = 1').get(staffId);
  return row && row.avg ? Math.round(row.avg * 10) / 10 : 5.0;
}

// ═══════════════════════════════════════════
// Helpers Warnings
// ═══════════════════════════════════════════

function addWarning(guildId, userId, reason, moderatorId) {
  const result = db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(guildId, userId, moderatorId, reason || 'Aucune raison', new Date().toISOString());
  return result.lastInsertRowid;
}

function getWarnings(guildId, userId) {
  if (userId) {
    return db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC').all(guildId, userId);
  }
  return db.prepare('SELECT * FROM warnings WHERE guild_id = ? ORDER BY id DESC').all(guildId);
}

function getAllWarnings(guildId) {
  if (guildId) {
    return db.prepare('SELECT * FROM warnings WHERE guild_id = ? ORDER BY id DESC').all(guildId);
  }
  return db.prepare('SELECT * FROM warnings ORDER BY id DESC').all();
}

function deleteWarning(id) {
  db.prepare('DELETE FROM warnings WHERE id = ?').run(id);
}

function getWarningCount(guildId, userId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  return row ? row.count : 0;
}

// ═══════════════════════════════════════════
// Helpers Anti-Raid Log
// ═══════════════════════════════════════════

function logAntiRaidAction(guildId, userId, action, reason) {
  db.prepare('INSERT INTO antiraid_log (guild_id, user_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(guildId, userId, action, reason, new Date().toISOString());
}

function getAntiRaidLogs(limit = 100) {
  return db.prepare('SELECT * FROM antiraid_log ORDER BY id DESC LIMIT ?').all(limit);
}

// ═══════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════

function getStats() {
  const totalTickets = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
  const openTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open' OR status = 'claimed'").get().c;
  const totalReviews = db.prepare('SELECT COUNT(*) as c FROM reviews WHERE visible = 1').get().c;
  const avgRow = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE visible = 1').get();
  const avgRating = avgRow && avgRow.avg ? Math.round(avgRow.avg * 10) / 10 : 0;
  const revenueRow = db.prepare("SELECT SUM(CAST(price AS REAL)) as total FROM tickets WHERE status = 'closed'").get();
  const estimatedRevenue = revenueRow && revenueRow.total ? revenueRow.total : 0;
  const totalWarnings = db.prepare('SELECT COUNT(*) as c FROM warnings').get().c;
  const totalAntiraid = db.prepare('SELECT COUNT(*) as c FROM antiraid_log').get().c;

  return { totalTickets, openTickets, totalReviews, avgRating, estimatedRevenue, totalWarnings, totalAntiraid };
}

// ═══════════════════════════════════════════
// Export
// ═══════════════════════════════════════════

module.exports = {
  db,
  // Config
  getConfig, setConfig, updateConfig,
  // Services
  getServices, getAllServices, getServiceById, addService, updateService, deleteService,
  // Tickets
  saveTicket, getTicket, getTicketById, getAllTickets, updateTicket, updateTicketById,
  // Reviews
  saveReview, getReviews, getAllReviews, getReviewById, updateReview, deleteReview, getStaffRating,
  // Warnings
  addWarning, getWarnings, getAllWarnings, deleteWarning, getWarningCount,
  // Alias
  warnUser: addWarning, saveWarning: addWarning, getUserWarnings: getWarnings,
  // Anti-raid
  logAntiRaidAction, getAntiRaidLogs,
  // Stats
  getStats
};
