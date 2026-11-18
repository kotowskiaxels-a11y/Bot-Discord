const { Router } = require('express');
const { getAllTickets, getTicketById, updateTicketById, getStats } = require('../../database/db');
const fs = require('fs');
const path = require('path');
const router = Router();

router.get('/tickets', (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.user_id) filters.user_id = req.query.user_id;
    if (req.query.staff_id) filters.staff_id = req.query.staff_id;
    res.json({ success: true, data: getAllTickets(filters) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    res.json({ success: true, data: getStats() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/tickets/:id', (req, res) => {
  try {
    const ticket = getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket introuvable.' });
    res.json({ success: true, data: ticket });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/tickets/:id/transcript', (req, res) => {
  try {
    const ticket = getTicketById(req.params.id);
    if (!ticket || !ticket.transcript_path) return res.status(404).json({ success: false, error: 'Transcript introuvable.' });
    if (!fs.existsSync(ticket.transcript_path)) return res.status(404).json({ success: false, error: 'Fichier introuvable.' });
    const html = fs.readFileSync(ticket.transcript_path, 'utf-8');
    res.type('html').send(html);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/tickets/:id', (req, res) => {
  try {
    updateTicketById(req.params.id, req.body);
    const ticket = getTicketById(req.params.id);
    res.json({ success: true, data: ticket });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
