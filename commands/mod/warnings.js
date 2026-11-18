const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings } = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Avertissements d\'un utilisateur')
    .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const warnings = getWarnings(interaction.guildId, target.id);

    const embed = new EmbedBuilder()
      .setTitle(`Avertissements — ${target.username}`)
      .setColor(0xFEE75C)
      .setThumbnail(target.displayAvatarURL());

    if (!warnings.length) {
      embed.setDescription('Aucun avertissement.');
    } else {
      const list = warnings.map((w, i) => {
        const date = w.created_at ? `<t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:d>` : '';
        return `\`#${i + 1}\` ${w.reason} ${date}`;
      }).join('\n');
      embed.setDescription(list);
      embed.setFooter({ text: `Total: ${warnings.length}` });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
