const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addWarning, getWarningCount } = require('../../database/db');

let logAction;
try { ({ logAction } = require('../../systems/moderation')); } catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un utilisateur')
    .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Raison').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    try {
      addWarning(interaction.guildId, target.id, reason, interaction.user.id);
      const count = getWarningCount(interaction.guildId, target.id);

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'WARN', interaction.user, target, reason);
      }

      await interaction.reply({ content: `⚠️ <@${target.id}> averti (${count}ème). Raison: ${reason}` });
    } catch (error) {
      console.error('Erreur warn:', error);
      await interaction.reply({ content: '❌ Erreur.', ephemeral: true }).catch(() => {});
    }
  }
};
