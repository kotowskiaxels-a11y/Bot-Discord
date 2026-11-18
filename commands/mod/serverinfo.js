const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Afficher les informations du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const { guild } = interaction;

    try {
      const iconURL = guild.iconURL ? guild.iconURL({ dynamic: true }) : null;
      const createdStr = guild.createdTimestamp
        ? `<t:${Math.floor(guild.createdTimestamp / 1000)}:d> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`
        : 'Inconnu';
      const boostLevel = `Niveau ${guild.premiumTier ?? 0} (${guild.premiumSubscriptionCount || 0} boosts)`;

      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setThumbnail(iconURL)
        .setColor(0x5865F2)
        .addFields(
          { name: '👥 Membres', value: `${guild.memberCount ?? 0}`, inline: true },
          { name: '💬 Salons', value: `${guild.channels?.cache?.size ?? 0}`, inline: true },
          { name: '🎭 Rôles', value: `${guild.roles?.cache?.size ?? 0}`, inline: true },
          { name: '📅 Création', value: createdStr, inline: true },
          { name: '🚀 Boost', value: boostLevel, inline: true }
        );

      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ embeds: [embed] });
      }
      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de la récupération des infos serveur:', error);
      const errorContent = '❌ Erreur lors de la récupération des informations du serveur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
