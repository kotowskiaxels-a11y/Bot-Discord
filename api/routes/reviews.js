const { Router } = require('express');
const { getAllReviews, getReviewById, updateReview, deleteReview, getStaffRating, db } = require('../../database/db');
const router = Router();

router.get('/reviews', (req, res) => {
  try {
    const filters = {};
    if (req.query.staff_id) filters.staff_id = req.query.staff_id;
    if (req.query.service_id) filters.service_id = req.query.service_id;
    if (req.query.min_rating) filters.min_rating = parseInt(req.query.min_rating);
    res.json({ success: true, data: getAllReviews(filters) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/reviews/stats', (req, res) => {
  try {
    const staffStats = db.prepare(`
      SELECT staff_id, AVG(rating) as avg_rating, COUNT(*) as total
      FROM reviews WHERE visible = 1 AND staff_id IS NOT NULL
      GROUP BY staff_id
    `).all();

    const serviceStats = db.prepare(`
      SELECT r.service_id, s.name as service_name, AVG(r.rating) as avg_rating, COUNT(*) as total
      FROM reviews r LEFT JOIN services s ON r.service_id = s.id
      WHERE r.visible = 1 AND r.service_id IS NOT NULL
      GROUP BY r.service_id
    `).all();

    res.json({ success: true, data: { staffStats, serviceStats } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/reviews/:id', (req, res) => {
  try {
    const review = getReviewById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Avis introuvable.' });
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/reviews/:id', (req, res) => {
  try {
    const review = updateReview(req.params.id, req.body);
    if (!review) return res.status(404).json({ success: false, error: 'Avis introuvable.' });
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/reviews/:id', (req, res) => {
  try {
    const result = deleteReview(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Avis introuvable.' });
    res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.patch('/reviews/:id/visibility', (req, res) => {
  try {
    const review = getReviewById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Avis introuvable.' });
    const updated = updateReview(req.params.id, { visible: !review.visible });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
