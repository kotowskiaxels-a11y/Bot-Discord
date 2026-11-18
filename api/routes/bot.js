const { Router } = require('express');
const router = Router();

router.get('/bot/info', (req, res) => {
  try {
    const client = req.app.locals.client;
    if (!client || !client.user) return res.json({ success: true, data: { status: 'offline' } });
    res.json({
      success: true,
      data: {
        username: client.user.username,
        discriminator: client.user.discriminator,
        avatar: client.user.displayAvatarURL({ size: 128 }),
        guildCount: client.guilds.cache.size,
        uptime: Math.floor(client.uptime / 1000),
        status: 'online'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/bot/guilds', (req, res) => {
  try {
    const client = req.app.locals.client;
    if (!client) return res.json({ success: true, data: [] });
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      icon: g.iconURL({ size: 64 })
    }));
    res.json({ success: true, data: guilds });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/bot/guilds/:guildId/message', async (req, res) => {
  try {
    const client = req.app.locals.client;
    if (!client) return res.status(503).json({ success: false, error: 'Bot hors ligne.' });
    const { channel_id, content } = req.body;
    if (!channel_id || !content) return res.status(400).json({ success: false, error: 'channel_id et content requis.' });
    const channel = await client.channels.fetch(channel_id);
    if (!channel || !channel.isTextBased()) return res.status(404).json({ success: false, error: 'Salon introuvable.' });
    const msg = await channel.send(content);
    res.json({ success: true, data: { messageId: msg.id } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
