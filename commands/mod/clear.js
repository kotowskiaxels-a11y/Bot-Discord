const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages en masse')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Filtrer par utilisateur')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    try {
      let count = 0;
      if (targetUser) {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => m.author.id === targetUser.id);
        const toDelete = Array.from(userMessages.values()).slice(0, amount);
        const deleted = await interaction.channel.bulkDelete(toDelete, true);
        count = deleted.size !== undefined ? deleted.size : toDelete.length;
      } else {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        count = deleted.size !== undefined ? deleted.size : amount;
      }

      if (typeof logAction === 'function') {
        const targetStr = targetUser ? `<@${targetUser.id}>` : `${count} messages`;
        await logAction(interaction.guild, 'CLEAR', interaction.user, targetStr, `Suppression de ${count} messages`);
      }

      const responseContent = `🗑️ ${count} messages supprimes.`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors du clear:', error);
      const errorContent = '❌ Erreur lors de la suppression des messages (les messages de plus de 14 jours ne peuvent pas être supprimés en masse).';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
