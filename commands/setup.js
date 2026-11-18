const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { setConfig, getServices } = require('../database/db');
const { sendTicketPanel } = require('../systems/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configuration du bot Virtual Vision')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('tickets')
        .setDescription('Configurer le système de tickets')
        .addChannelOption(opt => opt.setName('category').setDescription('Catégorie des tickets').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addChannelOption(opt => opt.setName('log_channel').setDescription('Salon de logs').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addRoleOption(opt => opt.setName('staff_role').setDescription('Rôle staff').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('moderation')
        .setDescription('Configurer la modération')
        .addChannelOption(opt => opt.setName('log_channel').setDescription('Salon de logs modération').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addRoleOption(opt => opt.setName('mute_role').setDescription('Rôle mute').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('reviews')
        .setDescription('Configurer le salon des avis')
        .addChannelOption(opt => opt.setName('channel').setDescription('Salon des avis').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Envoyer le panel de commande de tickets')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'tickets') {
      const category = interaction.options.getChannel('category');
      const logChannel = interaction.options.getChannel('log_channel');
      const staffRole = interaction.options.getRole('staff_role');

      setConfig(interaction.guildId, 'ticket_category', category.id);
      setConfig(interaction.guildId, 'ticket_log_channel', logChannel.id);
      setConfig(interaction.guildId, 'staff_role', staffRole.id);

      return interaction.reply({ content: '✅ Tickets configurés.', ephemeral: true });
    }

    if (sub === 'moderation') {
      const logChannel = interaction.options.getChannel('log_channel');
      const muteRole = interaction.options.getRole('mute_role');

      setConfig(interaction.guildId, 'mod_log_channel', logChannel.id);
      if (muteRole) setConfig(interaction.guildId, 'mute_role', muteRole.id);

      return interaction.reply({ content: '✅ Modération configurée.', ephemeral: true });
    }

    if (sub === 'reviews') {
      const channel = interaction.options.getChannel('channel');
      setConfig(interaction.guildId, 'review_channel', channel.id);
      return interaction.reply({ content: '✅ Salon avis configuré.', ephemeral: true });
    }

    if (sub === 'panel') {
      const services = getServices();
      if (services.length === 0) {
        return interaction.reply({ content: 'Aucun service actif.', ephemeral: true });
      }
      await sendTicketPanel(interaction.channel, services);
      return interaction.reply({ content: '✅ Panel envoyé.', ephemeral: true });
    }
  }
};
