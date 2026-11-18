const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un utilisateur du serveur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison de l\'expulsion')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        const notFound = '❌ Utilisateur introuvable sur le serveur.';
        if (interaction.replied || interaction.deferred) {
          return await interaction.followUp({ content: notFound, ephemeral: true });
        }
        return await interaction.reply({ content: notFound, ephemeral: true });
      }

      await member.kick(reason);

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'KICK', interaction.user, targetUser, reason);
      }

      const responseContent = `👢 <@${targetUser.id}> kick. Raison: ${reason}`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors de l\'expulsion:', error);
      const errorContent = '❌ Impossible d\'expulser cet utilisateur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
