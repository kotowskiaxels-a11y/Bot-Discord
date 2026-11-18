const { Events } = require('discord.js');
const {
  handleServiceSelect,
  handleClaim,
  handleClose,
  handleConfirmClose,
  handleReviewStars,
  handleReviewSubmit
} = require('../systems/tickets');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    const botClient = client || interaction.client;

    // ── Slash Commands ──
    if (interaction.isChatInputCommand()) {
      const command = botClient.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur commande ${interaction.commandName}:`, error);
        const reply = { content: 'Erreur.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    // ── Select Menus ──
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket-service-select') {
        return handleServiceSelect(interaction);
      }
    }

    // ── Buttons ──
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === 'ticket-claim') return handleClaim(interaction);
      if (id === 'ticket-close') return handleClose(interaction);
      if (id === 'ticket-confirm-close') return handleConfirmClose(interaction);
      if (id === 'ticket-cancel-close') {
        return interaction.message.delete().catch(() => {});
      }

      // Review stars (review-star-1_ticketId_staffId ... review-star-5_...)
      if (id.startsWith('review-star-')) {
        return handleReviewStars(interaction);
      }
    }

    // ── Modals ──
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('review-comment-modal')) {
        return handleReviewSubmit(interaction);
      }
    }
  }
};
