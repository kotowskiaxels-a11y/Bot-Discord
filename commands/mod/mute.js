const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let logAction;
try {
  ({ logAction } = require('../../systems/moderation.js'));
} catch {}

function parseDuration(str) {
  if (!str || typeof str !== 'string') return null;

  const trimmed = str.trim();
  const simpleMatch = trimmed.match(/^(\d+)\s*([a-zA-Z]+)$/);
  if (simpleMatch) {
    const val = parseInt(simpleMatch[1], 10);
    const unit = simpleMatch[2].toLowerCase();
    switch (unit) {
      case 's': case 'sec': case 'second': case 'seconds': case 'seconde': case 'secondes':
        return val * 1000;
      case 'm': case 'min': case 'minute': case 'minutes':
        return val * 60 * 1000;
      case 'h': case 'hour': case 'hours': case 'heure': case 'heures':
        return val * 60 * 60 * 1000;
      case 'd': case 'day': case 'days': case 'j': case 'jour': case 'jours':
        return val * 24 * 60 * 60 * 1000;
      case 'w': case 'week': case 'weeks': case 'semaine': case 'semaines':
        return val * 7 * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  }

  const multiMatches = trimmed.match(/(\d+)\s*([a-zA-Z]+)/g);
  if (!multiMatches) return null;

  let totalMs = 0;
  for (const token of multiMatches) {
    const part = token.match(/^(\d+)\s*([a-zA-Z]+)$/);
    if (!part) return null;
    const val = parseInt(part[1], 10);
    const unit = part[2].toLowerCase();
    if (['s', 'sec', 'secondes'].includes(unit)) totalMs += val * 1000;
    else if (['m', 'min', 'minutes'].includes(unit)) totalMs += val * 60 * 1000;
    else if (['h', 'heure', 'heures', 'hours'].includes(unit)) totalMs += val * 3600 * 1000;
    else if (['d', 'j', 'jour', 'jours', 'days'].includes(unit)) totalMs += val * 86400 * 1000;
    else if (['w', 'semaine', 'semaines', 'weeks'].includes(unit)) totalMs += val * 7 * 86400 * 1000;
    else return null;
  }
  return totalMs > 0 ? totalMs : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rendre muet un utilisateur temporairement (timeout)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Utilisateur à mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Durée du mute (ex: 5m, 1h, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Raison du mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const durationInput = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'Aucune raison fournie';

    const durationMs = parseDuration(durationInput);
    const maxMs = 28 * 24 * 60 * 60 * 1000;

    if (!durationMs || durationMs <= 0 || durationMs > maxMs) {
      const invalid = '❌ Durée invalide (ex: 5m, 1h, 1d, max 28 jours).';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: invalid, ephemeral: true });
      }
      return await interaction.reply({ content: invalid, ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        const notFound = '❌ Utilisateur introuvable sur le serveur.';
        if (interaction.replied || interaction.deferred) {
          return await interaction.followUp({ content: notFound, ephemeral: true });
        }
        return await interaction.reply({ content: notFound, ephemeral: true });
      }

      await member.timeout(durationMs, reason);

      if (typeof logAction === 'function') {
        await logAction(interaction.guild, 'MUTE', interaction.user, targetUser, `Durée: ${durationInput} | Raison: ${reason}`);
      }

      const responseContent = `🔇 <@${targetUser.id}> mute ${durationInput}. Raison: ${reason}`;
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: responseContent });
      }
      return await interaction.reply({ content: responseContent });
    } catch (error) {
      console.error('Erreur lors du mute:', error);
      const errorContent = '❌ Impossible de mute cet utilisateur.';
      if (interaction.replied || interaction.deferred) {
        return await interaction.followUp({ content: errorContent, ephemeral: true });
      }
      return await interaction.reply({ content: errorContent, ephemeral: true });
    }
  }
};
