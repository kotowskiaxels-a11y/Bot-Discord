const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
let discordClient = null;

app.use(cors());
app.use(express.json());

// Servir le dashboard
app.use(express.static(path.join(__dirname, '../dashboard')));

// Middleware d'auth pour /api/
function authMiddleware(req, res, next) {
  // Routes publiques
  if (req.path === '/api/status') return next();

  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return next();

  const header = req.headers['x-dashboard-secret'];
  if (!header || header !== secret) {
    return res.status(401).json({ success: false, error: 'Non autorisé.' });
  }
  next();
}

app.use('/api', authMiddleware);

// Routes
const configRoutes = require('./routes/config');
const ticketRoutes = require('./routes/tickets');
const reviewRoutes = require('./routes/reviews');
const moderationRoutes = require('./routes/moderation');
const botRoutes = require('./routes/bot');

app.use('/api', configRoutes);
app.use('/api', ticketRoutes);
app.use('/api', reviewRoutes);
app.use('/api', moderationRoutes);
app.use('/api', botRoutes);

// Status public
app.get('/api/status', (req, res) => {
  res.json({ success: true, data: { status: 'online', timestamp: new Date().toISOString() } });
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

function startServer(client) {
  discordClient = client;
  app.locals.client = client;
  const port = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Dashboard: http://localhost:${port}`);
  });
  return { app, server };
}

module.exports = startServer;
module.exports.startServer = startServer;
module.exports.app = app;
