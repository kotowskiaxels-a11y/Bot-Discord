/**
 * Virtual Vision Bot — Dashboard Web
 * Logique JavaScript complète de l'application Single Page (SPA)
 * Thème : Dark mode violet/bleu pour le serveur Virtual Vision (Montage Vidéo)
 */

// ==========================================================================
// Configuration & Constantes
// ==========================================================================
const STORAGE_KEYS = {
  SECRET: 'vv_dashboard_secret',
  API_URL: 'vv_dashboard_api_url',
  GUILD_ID: 'vv_dashboard_guild_id'
};

// URL par défaut de l'API (window.location.origin ou port local)
const DEFAULT_API_URL = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file'))
  ? window.location.origin
  : 'http://localhost:3000';

function getApiUrl() {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
}

function getSecret() {
  return localStorage.getItem(STORAGE_KEYS.SECRET) || '';
}

// ==========================================================================
// Données de Démonstration / Fallback (Virtual Vision)
// Utilisées pour un affichage interactif immédiat si le serveur bot est hors-ligne
// ==========================================================================
let mockData = {
  stats: {
    totalTickets: 142,
    openTickets: 5,
    avgRating: 4.9,
    revenue: 3840.00,
    resolveRate: '99.2%',
    avgDelivery: '36h',
    positiveRatio: '96.8%',
    activeEditors: 6
  },
  tickets: [
    {
      id: "TICK-1042",
      user: { id: "48291048591829384", tag: "Alexandre_Vlog#4092" },
      service: "Montage YouTube Long (20 min)",
      claimedBy: "Thomas (Monteur)",
      status: "open",
      createdAt: "2026-11-17T18:32:00Z",
      transcript: [
        { author: "Alexandre_Vlog#4092", time: "17/11/2026 18:32", content: "Bonjour l'équipe Virtual Vision ! J'ai 1h30 de rushs pour un vlog voyage au Japon. J'aimerais un rendu très immersif avec du sound design et une colorimétrie chaleureuse." },
        { author: "Virtual Vision Bot", time: "17/11/2026 18:32", content: "Commande enregistrée ! Un monteur va prendre en charge votre ticket sous peu." },
        { author: "Thomas (Monteur)", time: "17/11/2026 18:40", content: "Salut Alexandre ! Je prends ton projet en main. Peux-tu me partager le lien Drive ou WeTransfer des rushs ainsi que tes musiques souhaitées ?" },
        { author: "Alexandre_Vlog#4092", time: "17/11/2026 18:45", content: "Super merci ! Voici le dossier Drive : drive.google.com/drive/folders/japan-vlog. Hâte de voir la V1 !" }
      ]
    },
    {
      id: "TICK-1041",
      user: { id: "84729104857291039", tag: "Zenith_Esport#1102" },
      service: "Gaming & Fragmovies / Esport",
      claimedBy: "Lucas (Monteur)",
      status: "claimed",
      createdAt: "2026-11-17T14:15:00Z",
      transcript: [
        { author: "Zenith_Esport#1102", time: "17/11/2026 14:15", content: "Yo ! On a besoin d'un édit Valorant de 2 minutes pour notre équipe, synchro avec de la phonk." },
        { author: "Lucas (Monteur)", time: "17/11/2026 14:22", content: "Parfait, je gère les fragmovies dynamiques. Rushs bien reçus en 1440p 60fps." }
      ]
    },
    {
      id: "TICK-1040",
      user: { id: "19283746501928374", tag: "Clara_Fitness#8841" },
      service: "Shorts / TikTok / Reels",
      claimedBy: "Sarah (Monteuse)",
      status: "claimed",
      createdAt: "2026-11-17T09:20:00Z",
      transcript: [
        { author: "Clara_Fitness#8841", time: "17/11/2026 09:20", content: "Hello ! J'ai un pack de 5 vidéos TikTok avec sous-titres animés et zooms dynamiques." },
        { author: "Sarah (Monteuse)", time: "17/11/2026 09:35", content: "Coucou Clara, c'est noté. Les sous-titres seront stylisés aux couleurs de ta charte." }
      ]
    },
    {
      id: "TICK-1039",
      user: { id: "62719284710293847", tag: "Maxime_Studio#2209" },
      service: "Motion Design / Intro",
      claimedBy: "Thomas (Monteur)",
      status: "closed",
      createdAt: "2026-11-16T11:00:00Z",
      transcript: [
        { author: "Maxime_Studio#2209", time: "16/11/2026 11:00", content: "Demande d'animation de logo 4K 60fps." },
        { author: "Thomas (Monteur)", time: "16/11/2026 16:30", content: "Livraison effectuée avec succès via fichier .mov en ProRes." },
        { author: "Maxime_Studio#2209", time: "16/11/2026 16:45", content: "C'est validé, merci beaucoup pour la réactivité !" }
      ]
    },
    {
      id: "TICK-1038",
      user: { id: "91827364501928374", tag: "David_Podcasts#3301" },
      service: "Étalonnage & Color Grading",
      claimedBy: "Lucas (Monteur)",
      status: "closed",
      createdAt: "2026-11-15T15:10:00Z",
      transcript: [
        { author: "David_Podcasts#3301", time: "15/11/2026 15:10", content: "Correction colorimétrique pour un podcast multi-caméras." },
        { author: "Lucas (Monteur)", time: "15/11/2026 21:00", content: "Étalonnage terminé et conforme au profil DaVinci Resolve." }
      ]
    }
  ],
  reviews: [
    {
      id: "rev-201",
      reviewer: "Alexandre_Vlog",
      staff: "Thomas (Monteur)",
      service: "Montage YouTube Long (20 min)",
      rating: 5,
      comment: "Montage absolument incroyable ! Les transitions et le sound design ajoutent une vraie valeur ajoutée à ma vidéo. Le public a adoré !",
      visible: true,
      date: "2026-11-16"
    },
    {
      id: "rev-202",
      reviewer: "Zenith_Esport",
      staff: "Lucas (Monteur)",
      service: "Gaming & Fragmovies / Esport",
      rating: 5,
      comment: "Synchronisation musicale parfaite, les kills ressortent à la perfection. Très professionnel et respect des délais.",
      visible: true,
      date: "2026-11-15"
    },
    {
      id: "rev-203",
      reviewer: "Clara_Fitness",
      staff: "Sarah (Monteuse)",
      service: "Shorts / TikTok / Reels",
      rating: 5,
      comment: "Mes TikTok font deux fois plus de vues grâce aux sous-titres dynamiques. Merci infiniment à Sarah !",
      visible: true,
      date: "2026-11-14"
    },
    {
      id: "rev-204",
      reviewer: "Kylian_Gaming",
      staff: "Lucas (Monteur)",
      service: "Gaming & Fragmovies / Esport",
      rating: 4,
      comment: "Très bon rendu général, quelques petites retouches demandées sur la V1 qui ont été corrigées très rapidement.",
      visible: true,
      date: "2026-11-13"
    },
    {
      id: "rev-205",
      reviewer: "Julien_Entreprise",
      staff: "Thomas (Monteur)",
      service: "Motion Design / Intro",
      rating: 5,
      comment: "Animation corporate très soignée, livrée en avance sur le planning.",
      visible: false,
      date: "2026-11-11"
    }
  ],
  warnings: [
    {
      id: "warn-101",
      userId: "92837461528392019",
      userTag: "BadTroll#9981",
      moderator: "Koto (Admin)",
      reason: "Spam publicitaire de liens non autorisés en salon public",
      date: "16/11/2026 21:14"
    },
    {
      id: "warn-102",
      userId: "18273645019283746",
      userTag: "AngryUser#4412",
      moderator: "Thomas (Modérateur)",
      reason: "Langage inapproprié et insultes envers un autre membre",
      date: "14/11/2026 15:30"
    },
    {
      id: "warn-103",
      userId: "48291048591829300",
      userTag: "NoisyBot#0001",
      moderator: "Système Anti-Raid",
      reason: "Mention multiple de rôles sans permission",
      date: "12/11/2026 03:12"
    }
  ],
  antiRaidLogs: [
    {
      id: "raid-501",
      type: "🛡️ Détection Mass Join",
      target: "12 comptes créés le même jour",
      action: "Expulsion automatique (Kick) & Mode Panique activé",
      details: "Comptes suspects rejoignant en moins de 3 secondes avec des pseudos similaires.",
      date: "16/11/2026 23:45"
    },
    {
      id: "raid-502",
      type: "🔗 Filtrage Liens Phishing",
      target: "ScamBot#8831 (ID: 382910482910)",
      action: "Message supprimé & Ban automatique",
      details: "Tentative de partage de faux lien 'Nitro gratuit'.",
      date: "15/11/2026 19:10"
    },
    {
      id: "raid-503",
      type: "⚡ Spam Mention Everyone",
      target: "RaidAccount#1209 (ID: 994827102948)",
      action: "Timeout 24h & Rôle suspendu",
      details: "Tentative de mention @everyone bloquée par le bot.",
      date: "14/11/2026 02:04"
    }
  ],
  config: {
    guildId: "112233445566778899",
    channels: {
      tickets: "112233445566770001",
      reviews: "112233445566770002",
      logs: "112233445566770003",
      announcements: "112233445566770004",
      welcome: "112233445566770005"
    },
    roles: {
      staff: "112233445566779001",
      admin: "112233445566779002",
      client: "112233445566779003",
      ping: "112233445566779004"
    }
  },
  services: [
    {
      id: "srv-1",
      emoji: "📱",
      name: "Shorts / TikTok / Reels",
      description: "Montage dynamique vertical (60s), sous-titres animés tendance, sound design et zooms percutants.",
      price: 25.00,
      active: true
    },
    {
      id: "srv-2",
      emoji: "🎬",
      name: "Montage YouTube Long (10-25 min)",
      description: "Édition complète de vidéo YouTube (Vlog, facecam, documentaire). Rythme soutenu, transitions soignées et musique libre de droits.",
      price: 65.00,
      active: true
    },
    {
      id: "srv-3",
      emoji: "🎮",
      name: "Gaming & Fragmovies / Esport",
      description: "Montage de gameplay synchronisé sur la musique, effets visuels percutants (slow-mo, shake, velocity), sound design.",
      price: 45.00,
      active: true
    },
    {
      id: "srv-4",
      emoji: "🎨",
      name: "Motion Design / Intro & Outro",
      description: "Animation de logo 2D/3D personnalisée en 4K 60fps, bannières animées et transitions personnalisées aux couleurs de votre marque.",
      price: 40.00,
      active: true
    },
    {
      id: "srv-5",
      emoji: "🌈",
      name: "Étalonnage & Color Grading",
      description: "Correction colorimétrique cinématographique avancée sous DaVinci Resolve pour sublimer vos rushs bruts.",
      price: 35.00,
      active: true
    }
  ]
};

// ==========================================================================
// Fonction d'Appel API Principale (avec X-Dashboard-Secret)
// ==========================================================================
let isApiOffline = false;

async function apiCall(method, endpoint, body = null) {
  const secret = getSecret();
  const url = `${getApiUrl()}${endpoint}`;

  const headers = {
    'X-Dashboard-Secret': secret
  };

  if (body !== null && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method: method.toUpperCase(),
    headers: headers
  };

  if (body !== null) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
      setConnectionStatus(false, "Non autorisé");
      showToast("Clé secrète invalide ou refusée par l'API du bot.", "error");
      showLoginScreen();
      throw new Error("Authentification échouée");
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errText}`);
    }

    setConnectionStatus(true, "En ligne");
    isApiOffline = false;

    // Si la réponse est vide (204 No Content)
    if (response.status === 204) {
      return null;
    }

    const json = await response.json();
    // Unwrap: l'API renvoie { success, data }, on retourne data directement
    if (json && json.success && json.data !== undefined) {
      return json.data;
    }
    return json;
  } catch (error) {
    // Mode repli si le bot Discord ou son API n'est pas encore en route
    console.warn(`[Virtual Vision API] Appel vers ${endpoint} indisponible, mode local/simulation :`, error.message);
    setConnectionStatus(false, "Hors ligne");
    isApiOffline = true;
    return handleMockFallback(method, endpoint, body);
  }
}

/**
 * Gère le repli intelligent sur les données en mémoire lorsque le serveur bot est éteint
 */
function handleMockFallback(method, endpoint, body) {
  const m = method.toUpperCase();

  // Tickets
  if (endpoint.startsWith('/api/tickets')) {
    if (m === 'GET') {
      return [...mockData.tickets];
    }
  }

  // Avis
  if (endpoint.startsWith('/api/reviews')) {
    if (m === 'GET') {
      return [...mockData.reviews];
    }
    const matchId = endpoint.match(/\/api\/reviews\/([^/]+)/);
    const revId = matchId ? matchId[1] : null;

    if (m === 'PATCH' && endpoint.includes('/visibility')) {
      const rev = mockData.reviews.find(r => r.id === revId);
      if (rev) {
        rev.visible = body && body.visible !== undefined ? body.visible : !rev.visible;
      }
      return { success: true, review: rev };
    }

    if (m === 'PUT' && revId) {
      const rev = mockData.reviews.find(r => r.id === revId);
      if (rev && body) {
        if (body.rating !== undefined) rev.rating = Number(body.rating);
        if (body.comment !== undefined) rev.comment = body.comment;
      }
      return { success: true, review: rev };
    }

    if (m === 'DELETE' && revId) {
      mockData.reviews = mockData.reviews.filter(r => r.id !== revId);
      return { success: true };
    }
  }

  // Modération / Warnings
  if (endpoint.startsWith('/api/warnings')) {
    if (m === 'GET') {
      return [...mockData.warnings];
    }
    const matchId = endpoint.match(/\/api\/warnings\/([^/]+)/);
    const warnId = matchId ? matchId[1] : null;
    if (m === 'DELETE' && warnId) {
      mockData.warnings = mockData.warnings.filter(w => w.id !== warnId);
      return { success: true };
    }
  }

  // Logs Anti-Raid
  if (endpoint.startsWith('/api/antiraid') || endpoint.startsWith('/api/logs')) {
    return [...mockData.antiRaidLogs];
  }

  // Configuration
  if (endpoint.startsWith('/api/config')) {
    if (m === 'GET') {
      return { ...mockData.config };
    }
    if (m === 'PUT' || m === 'POST') {
      if (body) {
        mockData.config = { ...mockData.config, ...body };
      }
      return { success: true, config: mockData.config };
    }
  }

  // Services
  if (endpoint.startsWith('/api/services')) {
    if (m === 'GET') {
      return [...mockData.services];
    }
    if (m === 'POST' && body) {
      const newService = {
        id: `srv-${Date.now()}`,
        emoji: body.emoji || '🎬',
        name: body.name || 'Nouveau Service',
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        active: body.active !== undefined ? body.active : true
      };
      mockData.services.push(newService);
      return newService;
    }

    const matchId = endpoint.match(/\/api\/services\/([^/]+)/);
    const srvId = matchId ? matchId[1] : null;

    if (m === 'PUT' && srvId && body) {
      const idx = mockData.services.findIndex(s => s.id === srvId);
      if (idx !== -1) {
        mockData.services[idx] = { ...mockData.services[idx], ...body };
        return mockData.services[idx];
      }
    }

    if (m === 'DELETE' && srvId) {
      mockData.services = mockData.services.filter(s => s.id !== srvId);
      return { success: true };
    }
  }

  // Stats
  if (endpoint.startsWith('/api/stats')) {
    return { ...mockData.stats };
  }

  return { success: true };
}

// ==========================================================================
// Statut de Connexion (Indicateur Vert/Rouge)
// ==========================================================================
function setConnectionStatus(connected, text) {
  const dot = document.getElementById('connectionDot');
  const label = document.getElementById('connectionText');

  if (!dot || !label) return;

  if (connected) {
    dot.className = 'status-dot connected';
    label.textContent = text || 'Connecté';
  } else {
    dot.className = 'status-dot disconnected';
    label.textContent = text || 'Déconnecté';
  }
}

// ==========================================================================
// Authentification & Écran de Connexion
// ==========================================================================
function checkAuth() {
  const secret = getSecret();
  const loginScreen = document.getElementById('loginScreen');

  if (!secret) {
    showLoginScreen();
  } else {
    if (loginScreen) loginScreen.style.display = 'none';
    loadDashboard();
  }
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.style.display = 'flex';
  }
  const secretInput = document.getElementById('secretKeyInput');
  if (secretInput) {
    secretInput.value = getSecret();
    secretInput.focus();
  }
  const apiUrlInput = document.getElementById('apiUrlInput');
  if (apiUrlInput) {
    apiUrlInput.value = localStorage.getItem(STORAGE_KEYS.API_URL) || '';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const secretInput = document.getElementById('secretKeyInput');
  const apiUrlInput = document.getElementById('apiUrlInput');

  const secret = secretInput ? secretInput.value.trim() : '';
  const apiUrl = apiUrlInput ? apiUrlInput.value.trim() : '';

  if (!secret) {
    showToast("Veuillez saisir votre clé secrète.", "error");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.SECRET, secret);
  if (apiUrl) {
    localStorage.setItem(STORAGE_KEYS.API_URL, apiUrl);
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_URL);
  }

  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'none';

  showToast("Connexion validée ! Chargement du tableau de bord...", "success");
  loadDashboard();
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.SECRET);
  setConnectionStatus(false, "Déconnecté");
  showLoginScreen();
  showToast("Vous avez été déconnecté.", "info");
}

// ==========================================================================
// Navigation entre les Sections SPA
// ==========================================================================
const sectionTitles = {
  accueil: { title: "Accueil & Vue d'Ensemble", subtitle: "Vue globale de l'activité du serveur Virtual Vision" },
  tickets: { title: "Gestion des Commandes Vidéo", subtitle: "Suivi des tickets, statuts et transcriptions des échanges" },
  avis: { title: "Modération des Avis Clients", subtitle: "Retours d'expérience, notes par étoiles et visibilité publique" },
  moderation: { title: "Modération & Anti-Raid", subtitle: "Sanctions, avertissements et surveillance en temps réel" },
  configuration: { title: "Configuration du Bot & Services", subtitle: "Paramètres des salons Discord, rôles et catalogue des tarifs" },
  statistiques: { title: "Statistiques & Performances", subtitle: "Métriques de rendu, satisfaction et répartition des commandes" }
};

function navigateToSection(sectionId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(sec => {
    if (sec.id === `section-${sectionId}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Mettre à jour l'en-tête
  const titleElem = document.getElementById('currentSectionTitle');
  const subElem = document.getElementById('currentSectionSubtitle');
  if (sectionTitles[sectionId]) {
    if (titleElem) titleElem.textContent = sectionTitles[sectionId].title;
    if (subElem) subElem.textContent = sectionTitles[sectionId].subtitle;
  }

  // Fermer la sidebar mobile si ouverte
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }

  // Rafraîchir les données spécifiques à la section si nécessaire
  if (sectionId === 'tickets') loadTickets();
  if (sectionId === 'avis') loadReviews();
  if (sectionId === 'moderation') { loadWarnings(); loadAntiRaidLogs(); }
  if (sectionId === 'configuration') { loadConfig(); loadServices(); }
  if (sectionId === 'statistiques') loadStats();
}

function scrollToServices() {
  setTimeout(() => {
    const el = document.getElementById('servicesCard');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

// ==========================================================================
// Notifications Toast
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✔️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <div class="toast-content">
      <span>${icon}</span>
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" aria-label="Fermer">✕</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  // Animation d'entrée
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-dismiss après 3,8 secondes
  setTimeout(() => {
    removeToast(toast);
  }, 3800);
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// ==========================================================================
// Gestionnaire de Modale Universelle
// ==========================================================================
function openModal(title, bodyHtml, footerHtml = '') {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const footerEl = document.getElementById('modalFooter');

  if (!overlay || !bodyEl) return;

  if (titleEl) titleEl.innerHTML = title;
  bodyEl.innerHTML = bodyHtml;

  if (footerEl) {
    if (footerHtml) {
      footerEl.innerHTML = footerHtml;
      footerEl.style.display = 'flex';
    } else {
      footerEl.style.display = 'none';
      footerEl.innerHTML = '';
    }
  }

  overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// ==========================================================================
// Chargement Global du Dashboard
// ==========================================================================
async function loadDashboard(silent = false) {
  if (!silent) {
    console.log("[Virtual Vision] Initialisation des données...");
  }

  try {
    await Promise.all([
      loadStats(),
      loadTickets(),
      loadReviews(),
      loadWarnings(),
      loadAntiRaidLogs(),
      loadConfig(),
      loadServices()
    ]);

    if (!silent) {
      showToast("Données du serveur actualisées", "info");
    }
  } catch (err) {
    console.error("Erreur lors de l'actualisation globale :", err);
  }
}

// ==========================================================================
// 1. Statistiques & Vue d'Ensemble (Overview)
// ==========================================================================
async function loadStats() {
  const stats = await apiCall('GET', '/api/stats');
  if (!stats) return;

  const totalTicketsEl = document.getElementById('statTotalTickets');
  const openTicketsEl = document.getElementById('statOpenTickets');
  const avgRatingEl = document.getElementById('statAvgRating');
  const revenueEl = document.getElementById('statRevenue');

  if (totalTicketsEl) totalTicketsEl.textContent = stats.totalTickets !== undefined ? stats.totalTickets : 0;
  if (openTicketsEl) openTicketsEl.textContent = stats.openTickets !== undefined ? stats.openTickets : 0;
  if (avgRatingEl) avgRatingEl.textContent = `${Number(stats.avgRating || 0).toFixed(1)} / 5`;
  if (revenueEl) revenueEl.textContent = `${formatMoney(stats.revenue || 0)} €`;

  const resolveEl = document.getElementById('statsResolveRate');
  const deliveryEl = document.getElementById('statsAvgDelivery');
  const positiveEl = document.getElementById('statsPositiveRatio');
  const editorsEl = document.getElementById('statsActiveEditors');

  if (resolveEl && stats.resolveRate) resolveEl.textContent = stats.resolveRate;
  if (deliveryEl && stats.avgDelivery) deliveryEl.textContent = stats.avgDelivery;
  if (positiveEl && stats.positiveRatio) positiveEl.textContent = stats.positiveRatio;
  if (editorsEl && stats.activeEditors) editorsEl.textContent = stats.activeEditors;
}

// ==========================================================================
// 2. Gestion des Tickets & Transcriptions
// ==========================================================================
let currentTicketsList = [];

async function loadTickets() {
  const tickets = await apiCall('GET', '/api/tickets');
  if (!Array.isArray(tickets)) return;

  currentTicketsList = tickets;
  renderTicketsTable();
  renderOverviewRecentTickets();

  // Mise à jour du compteur dans l'en-tête de section
  const badge = document.getElementById('ticketsCountBadge');
  if (badge) {
    badge.textContent = `${tickets.length} ticket(s)`;
  }
}

function renderTicketsTable() {
  const tbody = document.getElementById('ticketsTableBody');
  if (!tbody) return;

  const statusFilter = document.getElementById('ticketStatusFilter')?.value || 'all';
  const searchTerm = (document.getElementById('ticketSearchInput')?.value || '').toLowerCase().trim();

  let filtered = currentTicketsList.filter(ticket => {
    // Filtre de statut
    if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }
    // Filtre de recherche
    if (searchTerm) {
      const userTag = (ticket.user?.tag || '').toLowerCase();
      const userId = (ticket.user?.id || '').toLowerCase();
      const service = (ticket.service || '').toLowerCase();
      const id = (ticket.id || '').toLowerCase();
      return userTag.includes(searchTerm) || userId.includes(searchTerm) || service.includes(searchTerm) || id.includes(searchTerm);
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Aucun ticket correspondant aux filtres.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const badgeClass = getBadgeClassForStatus(t.status);
    const badgeLabel = getBadgeLabelForStatus(t.status);
    const formattedDate = formatDate(t.createdAt);

    return `
      <tr>
        <td><code>${escapeHtml(t.id)}</code></td>
        <td>
          <strong>${escapeHtml(t.user?.tag || 'Utilisateur inconnu')}</strong>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(t.user?.id || '')}</div>
        </td>
        <td>${escapeHtml(t.service || 'Demande personnalisée')}</td>
        <td>${escapeHtml(t.claimedBy || '—')}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">${formattedDate}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewTranscript('${t.id}')">
            📜 Transcription
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverviewRecentTickets() {
  const tbody = document.getElementById('overviewRecentTicketsBody');
  if (!tbody) return;

  const topRecent = currentTicketsList.slice(0, 4);

  if (topRecent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">Aucune commande enregistrée.</td></tr>`;
    return;
  }

  tbody.innerHTML = topRecent.map(t => {
    const badgeClass = getBadgeClassForStatus(t.status);
    const badgeLabel = getBadgeLabelForStatus(t.status);

    return `
      <tr style="cursor: pointer;" onclick="viewTranscript('${t.id}')">
        <td><code>${escapeHtml(t.id)}</code></td>
        <td>${escapeHtml(t.user?.tag || 'Client')}</td>
        <td>${escapeHtml(t.service || 'Montage')}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      </tr>
    `;
  }).join('');
}

function viewTranscript(ticketId) {
  const ticket = currentTicketsList.find(t => t.id === ticketId);
  if (!ticket) {
    showToast("Ticket introuvable.", "error");
    return;
  }

  const messages = ticket.transcript || [];
  let transcriptHtml = '';

  if (messages.length === 0) {
    transcriptHtml = `<div class="table-empty">Aucun message enregistré dans ce ticket.</div>`;
  } else {
    transcriptHtml = `
      <div class="transcript-box">
        ${messages.map(m => `
          <div class="transcript-msg">
            <div class="transcript-author">
              <span>${escapeHtml(m.author)}</span>
              <span class="transcript-time">${escapeHtml(m.time)}</span>
            </div>
            <div class="transcript-content">${escapeHtml(m.content)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const modalContent = `
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <div>
        <strong>Client :</strong> ${escapeHtml(ticket.user?.tag || 'Inconnu')} (${escapeHtml(ticket.user?.id || '')})<br>
        <strong>Service demandé :</strong> ${escapeHtml(ticket.service || 'N/A')}<br>
        <strong>Monteur assigné :</strong> ${escapeHtml(ticket.claimedBy || 'Non assigné')}
      </div>
      <div>
        <span class="badge ${getBadgeClassForStatus(ticket.status)}">${getBadgeLabelForStatus(ticket.status)}</span>
      </div>
    </div>
    ${transcriptHtml}
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
  `;

  openModal(`📜 Transcription du Ticket <strong>${escapeHtml(ticket.id)}</strong>`, modalContent, footer);
}

function getBadgeClassForStatus(status) {
  if (status === 'open') return 'badge-open';
  if (status === 'claimed') return 'badge-claimed';
  return 'badge-closed';
}

function getBadgeLabelForStatus(status) {
  if (status === 'open') return '🟢 Ouvert';
  if (status === 'claimed') return '🟡 Pris en charge';
  return '⚪ Fermé';
}

// ==========================================================================
// 3. Gestion des Avis (Reviews CRUD & Modération)
// ==========================================================================
let currentReviewsList = [];

async function loadReviews() {
  const reviews = await apiCall('GET', '/api/reviews');
  if (!Array.isArray(reviews)) return;

  currentReviewsList = reviews;
  populateReviewFilterDropdowns();
  renderReviewsTable();
  renderOverviewRecentReviews();

  const countBadge = document.getElementById('reviewsCountBadge');
  if (countBadge) {
    countBadge.textContent = `${reviews.length} avis`;
  }
}

function populateReviewFilterDropdowns() {
  const staffFilter = document.getElementById('reviewStaffFilter');
  const serviceFilter = document.getElementById('reviewServiceFilter');

  if (staffFilter) {
    const prevVal = staffFilter.value;
    const staffs = [...new Set(currentReviewsList.map(r => r.staff).filter(Boolean))];
    staffFilter.innerHTML = `<option value="all">Tous les monteurs (${staffs.length})</option>` +
      staffs.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    staffFilter.value = prevVal || 'all';
  }

  if (serviceFilter) {
    const prevVal = serviceFilter.value;
    const services = [...new Set(currentReviewsList.map(r => r.service).filter(Boolean))];
    serviceFilter.innerHTML = `<option value="all">Tous les services (${services.length})</option>` +
      services.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    serviceFilter.value = prevVal || 'all';
  }
}

function renderReviewsTable() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  const staffFilter = document.getElementById('reviewStaffFilter')?.value || 'all';
  const serviceFilter = document.getElementById('reviewServiceFilter')?.value || 'all';
  const ratingFilter = document.getElementById('reviewRatingFilter')?.value || 'all';
  const searchTerm = (document.getElementById('reviewSearchInput')?.value || '').toLowerCase().trim();

  let filtered = currentReviewsList.filter(r => {
    if (staffFilter !== 'all' && r.staff !== staffFilter) return false;
    if (serviceFilter !== 'all' && r.service !== serviceFilter) return false;
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter, 10);
      if (r.rating < minRating) return false;
    }
    if (searchTerm) {
      const reviewer = (r.reviewer || '').toLowerCase();
      const comment = (r.comment || '').toLowerCase();
      if (!reviewer.includes(searchTerm) && !comment.includes(searchTerm)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Aucun avis ne correspond aux critères sélectionnés.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const starString = '⭐'.repeat(Math.max(1, Math.min(5, r.rating || 5)));
    const isChecked = r.visible ? 'checked' : '';

    return `
      <tr>
        <td><strong>${escapeHtml(r.reviewer || 'Anonyme')}</strong></td>
        <td><span style="color: var(--accent-text); font-weight: 500;">${escapeHtml(r.staff || 'Non spécifié')}</span></td>
        <td><span style="font-size: 0.85rem;">${escapeHtml(r.service || 'Montage Vidéo')}</span></td>
        <td><span class="star-rating" title="${r.rating}/5 étoiles">${starString}</span></td>
        <td style="max-width: 320px;">
          <div style="font-size: 0.88rem; color: var(--text); overflow: hidden; text-overflow: ellipsis;">
            "${escapeHtml(r.comment || '')}"
          </div>
        </td>
        <td>
          <label class="switch" title="Activer/Désactiver l'affichage public de cet avis">
            <input type="checkbox" ${isChecked} onchange="toggleReviewVisibility('${r.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="editReview('${r.id}')" title="Modifier l'avis">
              ✏️ Éditer
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')" title="Supprimer définitivement">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverviewRecentReviews() {
  const container = document.getElementById('overviewRecentReviewsList');
  if (!container) return;

  const topRecent = currentReviewsList.slice(0, 3);
  if (topRecent.length === 0) {
    container.innerHTML = `<div class="table-empty">Aucun avis reçu pour le moment.</div>`;
    return;
  }

  container.innerHTML = topRecent.map(r => `
    <div style="background: rgba(15, 52, 96, 0.2); border: 1px solid var(--card-border); padding: 12px 14px; border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 700; color: #ffffff;">${escapeHtml(r.reviewer)}</span>
        <span class="star-rating">${'⭐'.repeat(r.rating || 5)}</span>
      </div>
      <div style="font-size: 0.84rem; color: var(--text-muted); font-style: italic;">
        "${escapeHtml(r.comment)}"
      </div>
      <div style="font-size: 0.75rem; color: var(--accent-text); margin-top: 4px;">
        Par ${escapeHtml(r.staff)} • ${escapeHtml(r.service)}
      </div>
    </div>
  `).join('');
}

async function toggleReviewVisibility(id, newVisibility) {
  const res = await apiCall('PATCH', `/api/reviews/${id}/visibility`, { visible: newVisibility });
  if (res) {
    const rev = currentReviewsList.find(r => r.id === id);
    if (rev) rev.visible = newVisibility;
    showToast(`Visibilité de l'avis ${newVisibility ? 'activée (public)' : 'désactivée (masqué)'}`, "info");
  } else {
    showToast("Impossible de changer la visibilité de l'avis.", "error");
    renderReviewsTable();
  }
}

let activeEditRating = 5;

function editReview(id) {
  const review = currentReviewsList.find(r => r.id === id);
  if (!review) return;

  activeEditRating = review.rating || 5;

  const content = `
    <div style="margin-bottom: 14px;">
      <p style="font-size: 0.9rem; color: var(--text-muted);">
        Avis laissé par <strong>${escapeHtml(review.reviewer)}</strong> pour le monteur <strong>${escapeHtml(review.staff)}</strong> (${escapeHtml(review.service)}).
      </p>
    </div>

    <div class="form-group">
      <label>Note par étoiles (1 à 5)</label>
      <div class="star-rating-selector" id="starRatingSelector">
        <span data-star="1">★</span>
        <span data-star="2">★</span>
        <span data-star="3">★</span>
        <span data-star="4">★</span>
        <span data-star="5">★</span>
      </div>
      <input type="hidden" id="editReviewRatingVal" value="${activeEditRating}">
    </div>

    <div class="form-group">
      <label for="editReviewComment">Commentaire du client</label>
      <textarea id="editReviewComment" class="form-control" rows="4" required>${escapeHtml(review.comment || '')}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
    <button class="btn btn-primary" onclick="saveEditedReview('${review.id}')">💾 Enregistrer les Modifications</button>
  `;

  openModal(`✏️ Éditer l'Avis de <strong>${escapeHtml(review.reviewer)}</strong>`, content, footer);

  // Initialisation des étoiles interactives
  updateInteractiveStars(activeEditRating);
  const starSpans = document.querySelectorAll('#starRatingSelector span');
  starSpans.forEach(span => {
    span.addEventListener('click', () => {
      activeEditRating = parseInt(span.getAttribute('data-star'), 10);
      updateInteractiveStars(activeEditRating);
    });
  });
}

function updateInteractiveStars(count) {
  const starSpans = document.querySelectorAll('#starRatingSelector span');
  starSpans.forEach(span => {
    const starNum = parseInt(span.getAttribute('data-star'), 10);
    if (starNum <= count) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
  const hiddenInput = document.getElementById('editReviewRatingVal');
  if (hiddenInput) hiddenInput.value = count;
}

async function saveEditedReview(id) {
  const commentInput = document.getElementById('editReviewComment');
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!comment) {
    showToast("Le commentaire ne peut pas être vide.", "error");
    return;
  }

  const payload = {
    rating: activeEditRating,
    comment: comment
  };

  const result = await apiCall('PUT', `/api/reviews/${id}`, payload);
  if (result) {
    const rev = currentReviewsList.find(r => r.id === id);
    if (rev) {
      rev.rating = activeEditRating;
      rev.comment = comment;
    }
    closeModal();
    renderReviewsTable();
    renderOverviewRecentReviews();
    showToast("Avis client mis à jour avec succès !", "success");
  } else {
    showToast("Échec de la mise à jour de l'avis.", "error");
  }
}

function deleteReview(id) {
  const review = currentReviewsList.find(r => r.id === id);
  if (!review) return;

  const content = `
    <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text);">
      Êtes-vous certain de vouloir supprimer définitivement l'avis laissé par <strong>${escapeHtml(review.reviewer)}</strong> ?
    </p>
    <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--danger); padding: 10px 14px; margin-top: 14px; border-radius: 4px; font-size: 0.85rem; color: #fca5a5;">
      ⚠️ Cette action est irréversible. L'avis sera retiré de la base de données et du salon Discord public.
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
    <button class="btn btn-danger" onclick="confirmDeleteReview('${review.id}')">🗑️ Confirmer la Suppression</button>
  `;

  openModal(`Supprimer l'Avis de ${escapeHtml(review.reviewer)}`, content, footer);
}

async function confirmDeleteReview(id) {
  const result = await apiCall('DELETE', `/api/reviews/${id}`);
  if (result) {
    currentReviewsList = currentReviewsList.filter(r => r.id !== id);
    closeModal();
    renderReviewsTable();
    renderOverviewRecentReviews();
    showToast("Avis supprimé avec succès.", "success");
  } else {
    showToast("Impossible de supprimer l'avis.", "error");
  }
}

// ==========================================================================
// 4. Modération : Avertissements & Logs Anti-Raid
// ==========================================================================
let currentWarningsList = [];
let currentAntiRaidLogsList = [];

function switchModTab(tabName) {
  const btnWarnings = document.getElementById('tabBtnWarnings');
  const btnAntiRaid = document.getElementById('tabBtnAntiRaid');
  const paneWarnings = document.getElementById('tabPaneWarnings');
  const paneAntiRaid = document.getElementById('tabPaneAntiRaid');

  if (tabName === 'warnings') {
    btnWarnings.classList.add('active');
    btnAntiRaid.classList.remove('active');
    paneWarnings.classList.add('active');
    paneAntiRaid.classList.remove('active');
  } else {
    btnWarnings.classList.remove('active');
    btnAntiRaid.classList.add('active');
    paneWarnings.classList.remove('active');
    paneAntiRaid.classList.add('active');
  }
}

async function loadWarnings() {
  const warnings = await apiCall('GET', '/api/warnings');
  if (!Array.isArray(warnings)) return;

  currentWarningsList = warnings;
  renderWarningsTable();
}

function renderWarningsTable() {
  const tbody = document.getElementById('warningsTableBody');
  if (!tbody) return;

  if (currentWarningsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Aucun avertissement actif enregistré sur le serveur.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentWarningsList.map(w => `
    <tr>
      <td><code>${escapeHtml(w.id)}</code></td>
      <td>
        <strong>${escapeHtml(w.userTag || 'Inconnu')}</strong>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(w.userId || '')}</div>
      </td>
      <td><span style="color: var(--accent-text); font-weight: 500;">${escapeHtml(w.moderator || 'Modérateur')}</span></td>
      <td>${escapeHtml(w.reason || 'Raison non spécifiée')}</td>
      <td style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(w.date || 'Récemment')}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteWarning('${w.id}')" title="Révoquer cet avertissement">
          🗑️ Supprimer
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteWarning(id) {
  const warn = currentWarningsList.find(w => w.id === id);
  if (!warn) return;

  const content = `
    <p style="font-size: 0.95rem; color: var(--text);">
      Voulez-vous révoquer l'avertissement <strong>#${escapeHtml(warn.id)}</strong> attribué à <strong>${escapeHtml(warn.userTag)}</strong> ?
    </p>
    <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">
      <strong>Motif :</strong> "${escapeHtml(warn.reason)}"
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
    <button class="btn btn-danger" onclick="confirmDeleteWarning('${warn.id}')">Supprimer l'Avertissement</button>
  `;

  openModal(`Supprimer l'Avertissement #${escapeHtml(warn.id)}`, content, footer);
}

async function confirmDeleteWarning(id) {
  const res = await apiCall('DELETE', `/api/warnings/${id}`);
  if (res) {
    currentWarningsList = currentWarningsList.filter(w => w.id !== id);
    closeModal();
    renderWarningsTable();
    showToast("Avertissement révoqué et supprimé !", "success");
  } else {
    showToast("Erreur lors de la suppression de l'avertissement.", "error");
  }
}

async function loadAntiRaidLogs() {
  const logs = await apiCall('GET', '/api/antiraid/logs');
  if (!Array.isArray(logs)) return;

  currentAntiRaidLogsList = logs;
  renderAntiRaidTable();
}

function renderAntiRaidTable() {
  const tbody = document.getElementById('antiRaidTableBody');
  if (!tbody) return;

  if (currentAntiRaidLogsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Aucun événement de raid suspect détecté.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentAntiRaidLogsList.map(log => `
    <tr>
      <td><code>${escapeHtml(log.id)}</code></td>
      <td><strong>${escapeHtml(log.type)}</strong></td>
      <td style="color: var(--text);">${escapeHtml(log.target)}</td>
      <td><span class="badge badge-claimed">${escapeHtml(log.action)}</span></td>
      <td style="font-size: 0.85rem; max-width: 280px;">${escapeHtml(log.details)}</td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(log.date)}</td>
    </tr>
  `).join('');
}

// ==========================================================================
// 5. Configuration du Serveur (Salons & Rôles)
// ==========================================================================
async function loadConfig(guildId = null) {
  const targetGuildId = guildId || localStorage.getItem(STORAGE_KEYS.GUILD_ID) || "112233445566778899";
  const cfg = await apiCall('GET', `/api/config/${targetGuildId}`);
  if (!cfg) return;

  const guildInput = document.getElementById('cfgGuildId');
  if (guildInput) guildInput.value = cfg.guildId || targetGuildId;

  // Salons
  if (cfg.channels) {
    setValue('cfgTicketChannel', cfg.channels.tickets);
    setValue('cfgReviewsChannel', cfg.channels.reviews);
    setValue('cfgLogsChannel', cfg.channels.logs);
    setValue('cfgAnnouncementsChannel', cfg.channels.announcements);
    setValue('cfgWelcomeChannel', cfg.channels.welcome);
  }

  // Rôles
  if (cfg.roles) {
    setValue('cfgStaffRole', cfg.roles.staff);
    setValue('cfgAdminRole', cfg.roles.admin);
    setValue('cfgClientRole', cfg.roles.client);
    setValue('cfgPingRole', cfg.roles.ping);
  }
}

function setValue(elementId, val) {
  const el = document.getElementById(elementId);
  if (el) el.value = val || '';
}

function reloadConfig() {
  const guildInput = document.getElementById('cfgGuildId');
  const guildId = guildInput ? guildInput.value.trim() : null;
  loadConfig(guildId);
  showToast("Configuration rechargée depuis le bot.", "info");
}

async function handleConfigSubmit(e) {
  e.preventDefault();

  const guildId = document.getElementById('cfgGuildId')?.value.trim();
  if (!guildId) {
    showToast("Le Guild ID est obligatoire.", "error");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.GUILD_ID, guildId);

  const payload = {
    guildId: guildId,
    channels: {
      tickets: document.getElementById('cfgTicketChannel')?.value.trim() || '',
      reviews: document.getElementById('cfgReviewsChannel')?.value.trim() || '',
      logs: document.getElementById('cfgLogsChannel')?.value.trim() || '',
      announcements: document.getElementById('cfgAnnouncementsChannel')?.value.trim() || '',
      welcome: document.getElementById('cfgWelcomeChannel')?.value.trim() || ''
    },
    roles: {
      staff: document.getElementById('cfgStaffRole')?.value.trim() || '',
      admin: document.getElementById('cfgAdminRole')?.value.trim() || '',
      client: document.getElementById('cfgClientRole')?.value.trim() || '',
      ping: document.getElementById('cfgPingRole')?.value.trim() || ''
    }
  };

  const res = await apiCall('PUT', `/api/config/${guildId}`, payload);
  if (res) {
    showToast("Configuration du serveur enregistrée avec succès !", "success");
  } else {
    showToast("Erreur lors de l'enregistrement de la configuration.", "error");
  }
}

// ==========================================================================
// 6. Gestion CRUD des Services de Montage (avec Édition Inline)
// ==========================================================================
let currentServicesList = [];
let editingServiceId = null;

async function loadServices() {
  const services = await apiCall('GET', '/api/services');
  if (!Array.isArray(services)) return;

  currentServicesList = services;
  renderServicesTable();
}

function renderServicesTable() {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  if (currentServicesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Aucun service de montage configuré. Ajoutez-en un !</td></tr>`;
    return;
  }

  tbody.innerHTML = currentServicesList.map(srv => {
    // Si la ligne est en cours d'édition inline
    if (editingServiceId === srv.id) {
      return `
        <tr class="inline-edit-row" style="background: rgba(123, 47, 190, 0.12);">
          <td>
            <input type="text" id="inlineEmoji_${srv.id}" class="form-control inline-input" value="${escapeHtml(srv.emoji || '🎬')}" style="width: 50px; text-align: center;">
          </td>
          <td>
            <input type="text" id="inlineName_${srv.id}" class="form-control inline-input" value="${escapeHtml(srv.name || '')}">
          </td>
          <td>
            <textarea id="inlineDesc_${srv.id}" class="form-control inline-input" rows="2">${escapeHtml(srv.description || '')}</textarea>
          </td>
          <td>
            <input type="number" step="0.5" id="inlinePrice_${srv.id}" class="form-control inline-input" value="${srv.price !== undefined ? srv.price : 0}">
          </td>
          <td>
            <label class="switch">
              <input type="checkbox" id="inlineActive_${srv.id}" ${srv.active ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-success btn-sm" onclick="saveInlineService('${srv.id}')" title="Sauvegarder">
                💾
              </button>
              <button class="btn btn-secondary btn-sm" onclick="cancelInlineService()" title="Annuler">
                ❌
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    // Affichage normal
    const isChecked = srv.active ? 'checked' : '';
    return `
      <tr>
        <td style="font-size: 1.5rem; text-align: center;">${escapeHtml(srv.emoji || '🎬')}</td>
        <td><strong>${escapeHtml(srv.name || '')}</strong></td>
        <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 320px;">${escapeHtml(srv.description || '')}</td>
        <td><strong style="color: var(--accent-text); font-size: 1.05rem;">${formatMoney(srv.price || 0)} €</strong></td>
        <td>
          <label class="switch">
            <input type="checkbox" ${isChecked} onchange="toggleServiceStatus('${srv.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="editService('${srv.id}')" title="Éditer en ligne">
              ✏️ Modifier
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteService('${srv.id}')" title="Supprimer">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleAddServiceForm() {
  const box = document.getElementById('addServiceBox');
  if (!box) return;
  if (box.style.display === 'none' || box.style.display === '') {
    box.style.display = 'block';
    const nameInput = document.getElementById('newServiceName');
    if (nameInput) nameInput.focus();
  } else {
    box.style.display = 'none';
  }
}

async function handleAddServiceSubmit(e) {
  e.preventDefault();

  const emoji = document.getElementById('newServiceEmoji')?.value.trim() || '🎬';
  const name = document.getElementById('newServiceName')?.value.trim();
  const desc = document.getElementById('newServiceDesc')?.value.trim();
  const price = parseFloat(document.getElementById('newServicePrice')?.value);
  const active = document.getElementById('newServiceActive')?.checked || false;

  if (!name || isNaN(price)) {
    showToast("Veuillez renseigner le nom et un prix valide.", "error");
    return;
  }

  const payload = {
    emoji,
    name,
    description: desc,
    price,
    active
  };

  const created = await apiCall('POST', '/api/services', payload);
  if (created) {
    if (isApiOffline) {
      // Déjà ajouté dans mockData par le fallback
    } else {
      currentServicesList.push(created);
    }
    document.getElementById('addServiceForm')?.reset();
    toggleAddServiceForm();
    await loadServices();
    showToast("Nouveau service de montage ajouté !", "success");
  } else {
    showToast("Erreur lors de l'ajout du service.", "error");
  }
}

function editService(id) {
  editingServiceId = id;
  renderServicesTable();
}

function cancelInlineService() {
  editingServiceId = null;
  renderServicesTable();
}

async function saveInlineService(id) {
  const emoji = document.getElementById(`inlineEmoji_${id}`)?.value.trim() || '🎬';
  const name = document.getElementById(`inlineName_${id}`)?.value.trim();
  const desc = document.getElementById(`inlineDesc_${id}`)?.value.trim();
  const price = parseFloat(document.getElementById(`inlinePrice_${id}`)?.value);
  const active = document.getElementById(`inlineActive_${id}`)?.checked || false;

  if (!name || isNaN(price)) {
    showToast("Le nom et un prix valide sont obligatoires.", "error");
    return;
  }

  const payload = { emoji, name, description: desc, price, active };
  const updated = await apiCall('PUT', `/api/services/${id}`, payload);

  if (updated) {
    const srv = currentServicesList.find(s => s.id === id);
    if (srv) {
      srv.emoji = emoji;
      srv.name = name;
      srv.description = desc;
      srv.price = price;
      srv.active = active;
    }
    editingServiceId = null;
    renderServicesTable();
    showToast("Service de montage mis à jour avec succès !", "success");
  } else {
    showToast("Impossible de mettre à jour le service.", "error");
  }
}

async function toggleServiceStatus(id, newActive) {
  const srv = currentServicesList.find(s => s.id === id);
  if (!srv) return;

  const payload = { ...srv, active: newActive };
  const res = await apiCall('PUT', `/api/services/${id}`, payload);
  if (res) {
    srv.active = newActive;
    showToast(`Service ${newActive ? 'activé' : 'désactivé'} pour les commandes.`, "info");
  } else {
    showToast("Erreur lors de la modification du statut du service.", "error");
    renderServicesTable();
  }
}

function deleteService(id) {
  const srv = currentServicesList.find(s => s.id === id);
  if (!srv) return;

  const content = `
    <p style="font-size: 0.95rem; color: var(--text);">
      Êtes-vous certain de vouloir supprimer l'offre de montage <strong>${escapeHtml(srv.name)}</strong> (${formatMoney(srv.price)} €) ?
    </p>
    <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--danger); padding: 10px 14px; margin-top: 14px; border-radius: 4px; font-size: 0.85rem; color: #fca5a5;">
      ⚠️ Les clients ne pourront plus commander cette formule via les tickets Discord.
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
    <button class="btn btn-danger" onclick="confirmDeleteService('${srv.id}')">Supprimer le Service</button>
  `;

  openModal(`Supprimer le Service "${escapeHtml(srv.name)}"`, content, footer);
}

async function confirmDeleteService(id) {
  const res = await apiCall('DELETE', `/api/services/${id}`);
  if (res) {
    currentServicesList = currentServicesList.filter(s => s.id !== id);
    closeModal();
    renderServicesTable();
    showToast("Service de montage supprimé du catalogue.", "success");
  } else {
    showToast("Erreur lors de la suppression du service.", "error");
  }
}

// ==========================================================================
// Utilitaires Divers & Formatage
// ==========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ==========================================================================
// Initialisation au Chargement du Document
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Barre Latérale
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-section');
      if (target) navigateToSection(target);
    });
  });

  // Menu Mobile Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileBtn) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Fermeture de la modale
  const modalClose = document.getElementById('modalCloseBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Bouton Actualiser Manuel
  const refreshBtn = document.getElementById('refreshDataBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDashboard();
    });
  }

  // Événements Filtres Tickets
  const ticketStatusFilter = document.getElementById('ticketStatusFilter');
  const ticketSearch = document.getElementById('ticketSearchInput');
  const resetTicketFilters = document.getElementById('resetTicketFiltersBtn');

  if (ticketStatusFilter) ticketStatusFilter.addEventListener('change', renderTicketsTable);
  if (ticketSearch) ticketSearch.addEventListener('input', renderTicketsTable);
  if (resetTicketFilters) {
    resetTicketFilters.addEventListener('click', () => {
      if (ticketStatusFilter) ticketStatusFilter.value = 'all';
      if (ticketSearch) ticketSearch.value = '';
      renderTicketsTable();
    });
  }

  // Événements Filtres Avis
  const staffFilter = document.getElementById('reviewStaffFilter');
  const serviceFilter = document.getElementById('reviewServiceFilter');
  const ratingFilter = document.getElementById('reviewRatingFilter');
  const reviewSearch = document.getElementById('reviewSearchInput');
  const resetReviewFilters = document.getElementById('resetReviewFiltersBtn');

  if (staffFilter) staffFilter.addEventListener('change', renderReviewsTable);
  if (serviceFilter) serviceFilter.addEventListener('change', renderReviewsTable);
  if (ratingFilter) ratingFilter.addEventListener('change', renderReviewsTable);
  if (reviewSearch) reviewSearch.addEventListener('input', renderReviewsTable);
  if (resetReviewFilters) {
    resetReviewFilters.addEventListener('click', () => {
      if (staffFilter) staffFilter.value = 'all';
      if (serviceFilter) serviceFilter.value = 'all';
      if (ratingFilter) ratingFilter.value = 'all';
      if (reviewSearch) reviewSearch.value = '';
      renderReviewsTable();
    });
  }

  // Formulaires
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const configForm = document.getElementById('configForm');
  if (configForm) configForm.addEventListener('submit', handleConfigSubmit);

  const addServiceForm = document.getElementById('addServiceForm');
  if (addServiceForm) addServiceForm.addEventListener('submit', handleAddServiceSubmit);

  // Vérifier la présence de la clé secrète et démarrer
  checkAuth();

  // Auto-rafraîchissement toutes les 30 secondes
  setInterval(() => {
    if (getSecret() && !editingServiceId) {
      loadDashboard(true);
    }
  }, 30000);
});
