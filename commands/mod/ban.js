const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un utilisateur du serveur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison du bannissement')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('delete_days')
        .setDescription('Jours de messages à supprimer (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    try {
      await interaction.guild.members.ban(targetUser.id, {
        reason,
        deleteMessageSeconds: deleteDays * 86400
      });

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'BAN', interaction.user, targetUser, reason);
      }

      const responseContent = `🔨 <@${targetUser.id}> banni. Raison: ${reason}`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      const errorContent = '❌ Impossible de bannir cet utilisateur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
