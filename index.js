require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Events
} = require('discord.js');
const startServer = require('./api/server');
const { setupAntiRaid } = require('./systems/antiraid');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    (GatewayIntentBits.GuildModeration ?? GatewayIntentBits.GuildBans),
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

client.commands = new Collection();

// Charger commandes récursivement
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.name && typeof command.execute === 'function') {
        client.commands.set(command.data.name, command);
      }
    }
  }
}
loadCommands(path.join(__dirname, 'commands'));

// Charger events
const eventsDir = path.join(__dirname, 'events');
if (fs.existsSync(eventsDir)) {
  for (const file of fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(eventsDir, file));
    if (event?.name && typeof event.execute === 'function') {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  }
}

// Anti-raid auto-configuré
setupAntiRaid(client);

// Ready : enregistrer les commandes slash
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Connecté: ${readyClient.user.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    const cmds = client.commands.map(cmd => cmd.data.toJSON());
    const clientId = process.env.CLIENT_ID || readyClient.user.id;

    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(clientId, process.env.GUILD_ID), { body: cmds });
      console.log(`${cmds.length} commandes synchronisées (serveur).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: cmds });
      console.log(`${cmds.length} commandes synchronisées (global).`);
    }
  } catch (err) {
    console.error('Erreur sync commandes:', err);
  }
});

// Démarrer le serveur API
startServer(client);

// Login
if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN absent dans .env');
} else {
  client.login(process.env.BOT_TOKEN);
}

module.exports = client;
