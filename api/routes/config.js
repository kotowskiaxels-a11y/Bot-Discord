const { Router } = require('express');
const { getConfig, updateConfig, getServices, getAllServices, getServiceById, addService, updateService, deleteService } = require('../../database/db');
const router = Router();

// ── Config ──

router.get('/config/:guildId', (req, res) => {
  try {
    const config = getConfig(req.params.guildId);
    res.json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/config/:guildId', (req, res) => {
  try {
    updateConfig(req.params.guildId, req.body);
    const config = getConfig(req.params.guildId);
    res.json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Services ──

router.get('/services', (req, res) => {
  try {
    const all = req.query.all === 'true' ? getAllServices() : getServices();
    res.json({ success: true, data: all });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/services', (req, res) => {
  try {
    const { name, description, price, emoji } = req.body;
    if (!name || price === undefined) return res.status(400).json({ success: false, error: 'name et price requis.' });
    const service = addService(name, description, price, emoji);
    res.json({ success: true, data: service });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/services/:id', (req, res) => {
  try {
    const service = updateService(req.params.id, req.body);
    res.json({ success: true, data: service });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/services/:id', (req, res) => {
  try {
    deleteService(req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
