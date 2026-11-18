const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Afficher les informations d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      let warnCount = 0;
      if (typeof db.getWarnings === 'function') {
        const warnings = await db.getWarnings(interaction.guildId, targetUser.id);
        warnCount = Array.isArray(warnings) ? warnings.length : (typeof warnings === 'number' ? warnings : 0);
      }

      const avatarURL = targetUser.displayAvatarURL ? targetUser.displayAvatarURL({ dynamic: true }) : null;
      const joinedStr = member?.joinedTimestamp
        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:d>`
        : 'Non membre';
      const createdStr = targetUser.createdTimestamp
        ? `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:d> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`
        : 'Inconnu';
      const rolesCount = member ? Math.max(0, member.roles.cache.size - 1) : 0;

      const embed = new EmbedBuilder()
        .setAuthor({ name: targetUser.tag || targetUser.username, iconURL: avatarURL })
        .setThumbnail(avatarURL)
        .setColor(member?.displayColor || 0x5865F2)
        .addFields(
          { name: '🆔 ID', value: targetUser.id, inline: true },
          { name: '📅 Âge du compte', value: createdStr, inline: true },
          { name: '📥 Rejoint', value: joinedStr, inline: true },
          { name: '🎭 Rôles', value: `${rolesCount}`, inline: true },
          { name: '⚠️ Avertissements', value: `${warnCount}`, inline: true }
        );

      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ embeds: [embed] });
      }
      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      const errorContent = '❌ Erreur lors de la récupération des informations utilisateur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
