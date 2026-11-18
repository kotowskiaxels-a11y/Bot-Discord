const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Génère une bannière PNG de 800x200 avec les informations de prise en charge du ticket.
 * @param {string} serviceName - Nom du service commandé
 * @param {string} price - Prix du service
 * @param {number} staffRating - Note moyenne du staff
 * @param {string} staffName - Pseudo du staff prenant en charge
 * @returns {Promise<Buffer>} Buffer PNG de l'image générée
 */
async function generateBanner(serviceName, price, staffRating, staffName) {
  const width = 800;
  const height = 200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. Fond sombre avec dégradé violet / bleu (charte Virtual Vision)
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0c0a1a');
  bgGradient.addColorStop(0.3, '#19113b');
  bgGradient.addColorStop(0.7, '#281458');
  bgGradient.addColorStop(1, '#0e122b');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Halos lumineux d'ambiance
  // Halo supérieur violet
  const glowTop = ctx.createRadialGradient(width - 80, 20, 10, width - 80, 20, 220);
  glowTop.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
  glowTop.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  // Halo inférieur bleu
  const glowBottom = ctx.createRadialGradient(90, height - 20, 10, 90, height - 20, 180);
  glowBottom.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
  glowBottom.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  // 3. Bordure externe néon
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Lignes décoratives légères
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.lineTo(width, 150);
  ctx.moveTo(0, 120);
  ctx.lineTo(width, 70);
  ctx.stroke();

  // 4. Logo ou Fallback text
  const logoPath = path.resolve(__dirname, '../assets/logo.png');
  let logoLoaded = false;

  if (fs.existsSync(logoPath)) {
    try {
      const logoImage = await loadImage(logoPath);
      ctx.save();
      ctx.beginPath();
      ctx.arc(65, 100, 38, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImage, 27, 62, 76, 76);
      ctx.restore();

      // Anneau autour du logo
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(65, 100, 40, 0, Math.PI * 2);
      ctx.stroke();

      logoLoaded = true;
    } catch (err) {
      logoLoaded = false;
    }
  }

  if (!logoLoaded) {
    // Fallback texte : badge circulaire stylisé VV
    ctx.save();
    const badgeGrad = ctx.createLinearGradient(25, 60, 105, 140);
    badgeGrad.addColorStop(0, '#7c3aed');
    badgeGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(65, 100, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VV', 65, 101);
    ctx.restore();
  }

  // 5. En-tête : 'Virtual Vision' branding
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('VIRTUAL VISION • COMMANDE EN COURS', 125, 26);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SERVICE DE MONTAGE VIDÉO', width - 30, 28);

  // 6. Nom du service (large text)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let displayService = serviceName || 'Service';
  if (displayService.length > 28) {
    displayService = displayService.slice(0, 26) + '...';
  }
  ctx.fillText(displayService, 125, 52);

  // Ligne séparatrice
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(125, 96);
  ctx.lineTo(width - 30, 96);
  ctx.stroke();

  // 7. Prix (medium text)
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`Tarif : ${price || 'Sur devis'}`, 125, 112);

  // 8. Évaluation du staff sous forme d'étoiles
  const ratingNum = typeof staffRating === 'number' && !isNaN(staffRating) ? staffRating : 5.0;
  const clampedRating = Math.min(5, Math.max(0, ratingNum));
  const fullStars = Math.round(clampedRating);
  const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '22px sans-serif';
  ctx.fillText(`${stars}`, 125, 150);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`(${clampedRating.toFixed(1)}/5)`, 250, 153);

  // 9. Staff prenant en charge (à droite)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 15px sans-serif';
  const displayStaff = staffName ? `Staff : ${staffName}` : 'Staff : Virtual Vision';
  ctx.fillText(displayStaff, width - 30, 154);

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateBanner
};
