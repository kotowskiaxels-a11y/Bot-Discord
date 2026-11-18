/**
 * Échappe les caractères HTML dangereux.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formate une date en chaîne lisible (DD/MM/YYYY HH:mm:ss).
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Calcule et formate la durée entre deux dates.
 */
function formatDuration(startDate, endDate) {
  if (!startDate) return 'Inconnue';
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return 'N/A';

  const diffSec = Math.floor((end - start) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

/**
 * Convertit un texte markdown Discord basique en HTML sécurisé.
 */
function parseDiscordMarkdown(content) {
  if (!content) return '';
  let safe = escapeHtml(content);

  // Blocs de code ```code```
  safe = safe.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');

  // Code inline `code`
  safe = safe.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');

  // Gras **texte**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italique *texte* ou _texte_
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  safe = safe.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Mentions utilisateur <@id>
  safe = safe.replace(/&lt;@!?([0-9]+)&gt;/g, '<span class="mention">@Utilisateur</span>');
  // Mentions salon <#id>
  safe = safe.replace(/&lt;#([0-9]+)&gt;/g, '<span class="mention">#salon</span>');

  // Retours à la ligne
  safe = safe.replace(/\n/g, '<br>');

  return safe;
}

/**
 * Génère le code HTML complet et autonome du transcript d'un ticket.
 * @param {Object} ticketData - Données du ticket (serviceName, price, staffTag, username, createdAt, closedAt, etc.)
 * @param {Array|Collection} messages - Messages Discord du salon
 * @returns {string} Document HTML autonome
 */
function generateTranscript(ticketData = {}, messages = []) {
  const service = ticketData.serviceName || 'Service non spécifié';
  const price = ticketData.price || 'N/A';
  const staff = ticketData.staffTag || ticketData.staffName || 'Non assigné';
  const clientUser = ticketData.username || ticketData.userTag || ticketData.userId || 'Client';
  const createdAtStr = formatDate(ticketData.createdAt);
  const closedAtStr = formatDate(ticketData.closedAt || new Date());
  const durationStr = formatDuration(ticketData.createdAt, ticketData.closedAt);

  // Normalisation des messages en tableau chronologique
  let msgList = [];
  if (Array.isArray(messages)) {
    msgList = [...messages];
  } else if (messages && typeof messages.values === 'function') {
    msgList = Array.from(messages.values());
  }

  // Tri chronologique croissant
  msgList.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.createdTimestamp || 0).getTime();
    const timeB = new Date(b.createdAt || b.createdTimestamp || 0).getTime();
    return timeA - timeB;
  });

  // Construction du rendu HTML des messages
  let messagesHtml = '';
  for (const msg of msgList) {
    const author = msg.author || {};
    const isBot = Boolean(author.bot);
    const authorName = escapeHtml(author.displayName || author.username || author.tag || 'Utilisateur');
    const avatarUrl = (typeof author.displayAvatarURL === 'function' ? author.displayAvatarURL() : author.avatarURL) ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%235865F2"/><text x="20" y="25" fill="%23ffffff" font-size="16" text-anchor="middle" font-family="sans-serif">?</text></svg>';
    const msgDate = formatDate(msg.createdAt || msg.createdTimestamp);
    const contentHtml = parseDiscordMarkdown(msg.content);

    // Pièces jointes (images / fichiers)
    let attachmentsHtml = '';
    const attachments = msg.attachments ? (Array.isArray(msg.attachments) ? msg.attachments : Array.from(msg.attachments.values())) : [];

    for (const att of attachments) {
      const url = escapeHtml(att.url || att.proxyURL || '');
      const name = escapeHtml(att.name || 'Fichier');
      const isImage = (att.contentType && att.contentType.startsWith('image/')) || /\.(png|jpe?g|gif|webp)$/i.test(name || url);

      if (isImage) {
        attachmentsHtml += `
          <div class="attachment-item">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              <img src="${url}" alt="${name}" class="attachment-image" loading="lazy" />
            </a>
          </div>
        `;
      } else {
        attachmentsHtml += `
          <div class="attachment-file">
            <svg class="file-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="file-link">${name}</a>
          </div>
        `;
      }
    }

    // Embeds éventuels
    let embedsHtml = '';
    if (msg.embeds && msg.embeds.length > 0) {
      for (const embed of msg.embeds) {
        const embedTitle = escapeHtml(embed.title || '');
        const embedDesc = parseDiscordMarkdown(embed.description || '');
        const embedColor = embed.hexColor || '#7c3aed';

        let fieldsHtml = '';
        if (embed.fields && embed.fields.length > 0) {
          fieldsHtml = '<div class="embed-fields">';
          for (const field of embed.fields) {
            fieldsHtml += `
              <div class="embed-field ${field.inline ? 'inline' : ''}">
                <div class="field-name">${escapeHtml(field.name)}</div>
                <div class="field-value">${parseDiscordMarkdown(field.value)}</div>
              </div>
            `;
          }
          fieldsHtml += '</div>';
        }

        embedsHtml += `
          <div class="discord-embed" style="border-left-color: ${embedColor};">
            ${embedTitle ? `<div class="embed-title">${embedTitle}</div>` : ''}
            ${embedDesc ? `<div class="embed-description">${embedDesc}</div>` : ''}
            ${fieldsHtml}
          </div>
        `;
      }
    }

    messagesHtml += `
      <div class="message-row">
        <img class="avatar" src="${escapeHtml(avatarUrl)}" alt="${authorName}" />
        <div class="message-body">
          <div class="message-header">
            <span class="author-name ${author.id === ticketData.staffId ? 'staff-name' : ''}">${authorName}</span>
            ${isBot ? '<span class="badge bot-badge">BOT</span>' : ''}
            ${author.id === ticketData.staffId ? '<span class="badge staff-badge">STAFF</span>' : ''}
            <span class="timestamp">${msgDate}</span>
          </div>
          ${contentHtml ? `<div class="message-content">${contentHtml}</div>` : ''}
          ${attachmentsHtml ? `<div class="message-attachments">${attachmentsHtml}</div>` : ''}
          ${embedsHtml ? `<div class="message-embeds">${embedsHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Document HTML complet
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript • Virtual Vision • ${escapeHtml(service)}</title>
  <style>
    :root {
      --bg-body: #111218;
      --bg-panel: #1e1f29;
      --bg-card: #272838;
      --bg-hover: #222330;
      --accent-purple: #8b5cf6;
      --accent-blue: #3b82f6;
      --accent-cyan: #38bdf8;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --border: rgba(139, 92, 246, 0.25);
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-body);
      color: var(--text-main);
      font-family: var(--font);
      line-height: 1.5;
      padding: 24px;
      display: flex;
      justify-content: center;
    }

    .container {
      width: 100%;
      max-width: 900px;
      background: var(--bg-panel);
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #181135 0%, #291557 60%, #161a3f 100%);
      padding: 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .logo-badge {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 22px;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
      flex-shrink: 0;
    }

    .header-text h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .header-text p {
      color: #c4b5fd;
      font-size: 13px;
      margin-top: 2px;
    }

    /* INFO BAR */
    .info-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      padding: 16px 24px;
      background: rgba(15, 15, 23, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .info-item {
      background: var(--bg-card);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 2px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .info-value.price {
      color: var(--accent-cyan);
    }

    .info-value.staff {
      color: #c084fc;
    }

    /* MESSAGES */
    .messages-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-row {
      display: flex;
      gap: 14px;
      padding: 6px 10px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }

    .message-row:hover {
      background: var(--bg-hover);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: #2b2d31;
    }

    .message-body {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3px;
      flex-wrap: wrap;
    }

    .author-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .author-name.staff-name {
      color: #c084fc;
    }

    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .bot-badge {
      background: #5865f2;
      color: #fff;
    }

    .staff-badge {
      background: #7c3aed;
      color: #fff;
    }

    .timestamp {
      font-size: 11px;
      color: var(--text-muted);
    }

    .message-content {
      font-size: 14px;
      color: var(--text-main);
      word-break: break-word;
    }

    .mention {
      background: rgba(88, 101, 242, 0.3);
      color: #c9cdfb;
      padding: 0 4px;
      border-radius: 3px;
      font-weight: 500;
    }

    .inline-code {
      background: #111216;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      color: #fca5a5;
    }

    .code-block {
      background: #111216;
      padding: 10px;
      border-radius: 6px;
      margin: 6px 0;
      overflow-x: auto;
      font-family: monospace;
      font-size: 13px;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* ATTACHMENTS */
    .message-attachments {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .attachment-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: block;
    }

    .attachment-file {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
    }

    .file-icon {
      color: var(--accent-purple);
    }

    .file-link {
      color: var(--accent-cyan);
      text-decoration: none;
    }

    .file-link:hover {
      text-decoration: underline;
    }

    /* DISCORD EMBEDS */
    .discord-embed {
      margin-top: 8px;
      background: #1e1f28;
      border-left: 4px solid var(--accent-purple);
      border-radius: 4px;
      padding: 12px;
      max-width: 520px;
    }

    .embed-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }

    .embed-description {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .embed-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 6px;
    }

    .embed-field {
      flex: 1 1 100%;
    }

    .embed-field.inline {
      flex: 1 1 calc(50% - 10px);
    }

    .field-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .field-value {
      font-size: 13px;
      color: #e2e8f0;
    }

    /* FOOTER */
    .footer {
      padding: 18px 24px;
      background: #111218;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer span {
      color: var(--accent-purple);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="logo-badge">VV</div>
      <div class="header-text">
        <h1>Virtual Vision</h1>
        <p>Transcript de commande • ${escapeHtml(service)}</p>
      </div>
    </div>

    <!-- TICKET INFO BAR -->
    <div class="info-bar">
      <div class="info-item">
        <div class="info-label">Service</div>
        <div class="info-value">${escapeHtml(service)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tarif</div>
        <div class="info-value price">${escapeHtml(price)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Staff</div>
        <div class="info-value staff">${escapeHtml(staff)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Client</div>
        <div class="info-value">${escapeHtml(clientUser)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Durée</div>
        <div class="info-value">${escapeHtml(durationStr)}</div>
      </div>
    </div>

    <!-- MESSAGES -->
    <div class="messages-container">
      ${messagesHtml || '<div style="color: #64748b; text-align: center; padding: 20px;">Aucun message enregistré.</div>'}
    </div>

    <!-- FOOTER -->
    <div class="footer">
      Transcript genere par <span>Virtual Vision Bot</span> • Clôturé le ${closedAtStr || 'Récemment'}
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateTranscript
};
