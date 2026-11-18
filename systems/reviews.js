const db = require('../database/db.js');

/**
 * Récupère tous les avis visibles pour un membre du staff.
 * @param {string} [staffId] - L'ID Discord du staff (optionnel)
 * @returns {Promise<Array>} Liste des avis visibles
 */
async function getReviews(staffId) {
  return await db.getReviews(staffId);
}

/**
 * Récupère tous les avis avec des filtres optionnels.
 * @param {Object} [filters={}] - Filtres (staffId, userId, ticketId, visible, minRating, maxRating)
 * @returns {Promise<Array>} Liste des avis filtrés
 */
async function getAllReviews(filters = {}) {
  return await db.getAllReviews(filters);
}

/**
 * Calcule la note moyenne d'un membre du staff.
 * @param {string} staffId - L'ID Discord du staff
 * @returns {Promise<number>} Note moyenne arrondie à 1 décimale (défaut 5.0 si aucun avis)
 */
async function getAverageRating(staffId) {
  const reviews = await db.getReviews(staffId);
  if (!reviews || reviews.length === 0) {
    return 5.0;
  }
  const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
  const avg = total / reviews.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Active ou désactive la visibilité d'un avis.
 * @param {string} reviewId - L'ID de l'avis
 * @returns {Promise<Object|null>} L'avis mis à jour ou null
 */
async function toggleReviewVisibility(reviewId) {
  const review = await db.getReviewById(reviewId);
  if (!review) return null;
  const newVisibility = review.visible === undefined ? false : !review.visible;
  return await db.updateReview(reviewId, { visible: newVisibility });
}

/**
 * Supprime un avis de la base de données.
 * @param {string} reviewId - L'ID de l'avis à supprimer
 * @returns {Promise<Object|boolean>} L'avis supprimé ou false
 */
async function deleteReview(reviewId) {
  return await db.deleteReview(reviewId);
}

/**
 * Modifie la note et/ou le commentaire d'un avis existant.
 * @param {string} reviewId - L'ID de l'avis
 * @param {Object} newData - Nouvelles données ({ rating, comment })
 * @returns {Promise<Object|null>} L'avis mis à jour ou null
 */
async function editReview(reviewId, newData = {}) {
  const review = await db.getReviewById(reviewId);
  if (!review) return null;

  const updates = {};
  if (newData.rating !== undefined) {
    const parsedRating = Number(newData.rating);
    if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      updates.rating = parsedRating;
    }
  }
  if (newData.comment !== undefined) {
    updates.comment = String(newData.comment).trim();
  }

  return await db.updateReview(reviewId, updates);
}

module.exports = {
  getReviews,
  getAllReviews,
  getAverageRating,
  toggleReviewVisibility,
  deleteReview,
  editReview
};
