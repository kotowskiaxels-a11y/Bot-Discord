const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le mute (timeout) d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        const notFound = '❌ Utilisateur introuvable sur le serveur.';
        if (interaction.replied || interaction.deferred) {
          return await interaction.followUp({ content: notFound, ephemeral: true });
        }
        return await interaction.reply({ content: notFound, ephemeral: true });
      }

      await member.timeout(null);

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'UNMUTE', interaction.user, targetUser, 'Unmute');
      }

      const responseContent = `🔊 <@${targetUser.id}> unmute.`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors du unmute:', error);
      const errorContent = '❌ Impossible de retirer le mute de cet utilisateur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
