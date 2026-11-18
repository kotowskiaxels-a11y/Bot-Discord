const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Définir le mode lent dans ce salon')
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('Durée en secondes (0-21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'SLOWMODE', interaction.user, `<#${interaction.channelId}>`, `${seconds}s`);
      }

      const responseContent = `🐌 Slowmode: ${seconds}s`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors du paramétrage du slowmode:', error);
      const errorContent = '❌ Impossible de modifier le slowmode de ce salon.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
