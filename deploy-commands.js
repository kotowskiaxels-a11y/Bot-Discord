require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.toJSON) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

loadCommands(commandsPath);

if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN manquant dans le fichier .env');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('CLIENT_ID manquant dans le fichier .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Déploiement de ${commands.length} commandes globalement...`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`${data.length} commandes slash enregistrées avec succès.`);
  } catch (error) {
    console.error('Erreur lors du déploiement des commandes:', error);
  }
})();
