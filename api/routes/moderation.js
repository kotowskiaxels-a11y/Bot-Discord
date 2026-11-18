const { Router } = require('express');
const { getAllWarnings, deleteWarning, getAntiRaidLogs, db } = require('../../database/db');
const router = Router();

router.get('/warnings', (req, res) => {
  try {
    const guildId = req.query.guild_id || null;
    res.json({ success: true, data: getAllWarnings(guildId) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/warnings/:id', (req, res) => {
  try {
    deleteWarning(req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/antiraid/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    res.json({ success: true, data: getAntiRaidLogs(limit) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/moderation/stats', (req, res) => {
  try {
    const totalWarnings = db.prepare('SELECT COUNT(*) as c FROM warnings').get().c;
    const totalAntiraid = db.prepare('SELECT COUNT(*) as c FROM antiraid_log').get().c;
    const topWarned = db.prepare(`
      SELECT user_id, COUNT(*) as count FROM warnings
      GROUP BY user_id ORDER BY count DESC LIMIT 10
    `).all();
    res.json({ success: true, data: { totalWarnings, totalAntiraid, topWarned } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
