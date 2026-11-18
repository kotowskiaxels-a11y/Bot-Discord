const fs = require('fs');
const path = require('path');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');

const db = require('../database/db.js');
const { generateBanner } = require('../templates/banner.js');
const { generateTranscript } = require('../templates/transcript.js');
const { getAverageRating } = require('./reviews.js');

/**
 * Envoie le panneau de commande dans un salon avec un menu déroulant.
 * @param {TextChannel} channel - Le salon où envoyer le panel
 * @param {Array} [services] - Liste optionnelle des services
 */
async function sendTicketPanel(channel, services) {
  const serviceList = services && services.length > 0 ? services : await db.getServices();
  const activeServices = serviceList.filter(s => s.active !== false);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-service-select')
    .setPlaceholder('Sélectionnez un service...');

  for (const s of activeServices) {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(s.name.slice(0, 100))
      .setValue(s.id)
      .setDescription(`${s.price} • ${s.description || 'Service professionnel'}`.slice(0, 100));

    if (s.emoji) {
      option.setEmoji(s.emoji);
    }
    selectMenu.addOptions(option);
  }

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setTitle('Virtual Vision - Commandes')
    .setColor('#7c3aed')
    .setDescription(
      'Bienvenue chez **Virtual Vision**.\n' +
      'Sélectionnez une prestation ci-dessous pour ouvrir votre ticket de commande.'
    )
    .setFooter({ text: 'Virtual Vision • Service de Montage Vidéo' });

  return await channel.send({ embeds: [embed], components: [row] });
}

/**
 * Gère la sélection d'un service dans le menu déroulant : création du ticket privé.
 * @param {StringSelectMenuInteraction} interaction
 */
async function handleServiceSelect(interaction) {
  try {
    const serviceId = interaction.values[0];
    const service = (await db.getServiceById(serviceId)) || {
      id: serviceId,
      name: 'Service personnalisé',
      price: 'Sur devis',
      emoji: '🎬'
    };

    const guild = interaction.guild;
    if (!guild) {
      return await interaction.reply({ content: 'Action impossible en DM.', ephemeral: true });
    }

    const config = await db.getConfig(guild.id);

    // 1. Catégorie des tickets
    let category = config.ticketCategoryId ? guild.channels.cache.get(config.ticketCategoryId) : null;
    if (!category) {
      category = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildCategory &&
        (c.name.toLowerCase().includes('ticket') || c.name.toLowerCase().includes('commande'))
      );
    }

    // 2. Rôle staff
    let staffRole = config.staffRoleId ? guild.roles.cache.get(config.staffRoleId) : null;
    if (!staffRole) {
      staffRole = guild.roles.cache.find(r =>
        r.name.toLowerCase() === 'staff' ||
        r.name.toLowerCase().includes('staff') ||
        r.name.toLowerCase().includes('équipe')
      );
    }

    // 3. Nom du salon : ticket-username-XXXX (4 chiffres aléatoires)
    const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'client';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const channelName = `ticket-${cleanUsername}-${randomDigits}`;

    // Permissions : uniquement staff et utilisateur
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    if (staffRole) {
      permissionOverwrites.push({
        id: staffRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      });
    }

    // Création du salon
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      permissionOverwrites
    });

    // Enregistrement du ticket en base
    await db.saveTicket({
      id: channel.id,
      channelId: channel.id,
      guildId: guild.id,
      userId: interaction.user.id,
      username: interaction.user.tag || interaction.user.username,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      status: 'open',
      createdAt: new Date().toISOString()
    });

    // Embed d'accueil du ticket
    const embed = new EmbedBuilder()
      .setTitle('Virtual Vision - Commande')
      .setColor('#7c3aed')
      .setDescription(
        `**Service :** ${service.name}\n` +
        `**Prix :** ${service.price}\n\n` +
        'Un staff va vous prendre en charge.'
      )
      .setTimestamp();

    // Boutons Fermer et Claim
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket-close')
        .setLabel('Fermer')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket-claim')
        .setLabel('Claim')
        .setEmoji('📌')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    // Réponse courte à l'interaction
    await interaction.reply({
      content: `Ticket créé : ${channel}`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur handleServiceSelect:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Erreur création ticket.', ephemeral: true });
    }
  }
}

/**
 * Gère le clic sur le bouton Claim par un membre du staff.
 * @param {ButtonInteraction} interaction
 */
async function handleClaim(interaction) {
  try {
    const guild = interaction.guild;
    const channel = interaction.channel;
    if (!guild || !channel) return;

    const config = await db.getConfig(guild.id);
    const isStaff =
      (config.staffRoleId && interaction.member?.roles?.cache?.has(config.staffRoleId)) ||
      interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
      interaction.member?.roles?.cache?.some(r => r.name.toLowerCase().includes('staff'));

    if (!isStaff) {
      return await interaction.reply({ content: 'Action réservée au staff.', ephemeral: true });
    }

    const ticket = await db.getTicket(channel.id);
    if (!ticket) {
      return await interaction.reply({ content: 'Ticket introuvable.', ephemeral: true });
    }

    if (ticket.status === 'claimed') {
      return await interaction.reply({ content: 'Déjà pris en charge.', ephemeral: true });
    }

    // Mise à jour des permissions : claimer + user + admins uniquement
    let staffRole = config.staffRoleId ? guild.roles.cache.get(config.staffRoleId) : null;
    if (!staffRole) {
      staffRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('staff'));
    }

    if (staffRole) {
      await channel.permissionOverwrites.edit(staffRole.id, {
        ViewChannel: false
      }).catch(() => {});
    }

    // Permission claimer
    await channel.permissionOverwrites.edit(interaction.user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    }).catch(() => {});

    // Permission utilisateur
    if (ticket.userId) {
      await channel.permissionOverwrites.edit(ticket.userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      }).catch(() => {});
    }

    // Note moyenne du staff depuis les avis
    const staffRating = await getAverageRating(interaction.user.id);
    const staffName = interaction.member?.displayName || interaction.user.username;

    // Génération de la bannière
    const bannerBuffer = await generateBanner(ticket.serviceName, ticket.price, staffRating, staffName);
    const attachment = new AttachmentBuilder(bannerBuffer, { name: 'banner.png' });

    // Message court avec la bannière
    await channel.send({
      content: `Pris en charge par <@${interaction.user.id}>`,
      files: [attachment]
    });

    // Mise à jour du statut dans la base
    await db.updateTicket(channel.id, {
      status: 'claimed',
      staffId: interaction.user.id,
      staffTag: interaction.user.tag || interaction.user.username,
      claimedAt: new Date().toISOString()
    });

    // Mise à jour des boutons : on désactive ou retire le bouton Claim
    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket-close')
        .setLabel('Fermer')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

    if (interaction.message && interaction.message.editable) {
      await interaction.message.edit({ components: [updatedRow] }).catch(() => {});
    }

    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  } catch (error) {
    console.error('Erreur handleClaim:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Erreur lors du claim.', ephemeral: true });
    }
  }
}

/**
 * Gère le clic sur le bouton Fermer (demande confirmation).
 * @param {ButtonInteraction} interaction
 */
async function handleClose(interaction) {
  try {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket-confirm-close')
        .setLabel('Confirmer')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket-cancel-close')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: 'Confirmer la fermeture ?',
      components: [row]
    });
  } catch (error) {
    console.error('Erreur handleClose:', error);
  }
}

/**
 * Exécute la clôture effective du ticket après confirmation.
 * @param {ButtonInteraction} interaction
 */
async function handleConfirmClose(interaction) {
  try {
    const channel = interaction.channel;
    const guild = interaction.guild;
    if (!channel || !guild) return;

    await interaction.reply({ content: 'Fermeture dans 5 secondes...' });

    const ticket = (await db.getTicket(channel.id)) || {
      channelId: channel.id,
      id: channel.id,
      serviceName: 'Service',
      price: 'N/A'
    };

    // Collecte de tous les messages du salon
    const collectedMessages = [];
    let lastId;
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      const msgs = await channel.messages.fetch(options);
      if (msgs.size === 0) break;
      collectedMessages.push(...msgs.values());
      lastId = msgs.last().id;
      if (msgs.size < 100 || collectedMessages.length >= 500) break;
    }
    collectedMessages.reverse();

    // Génération du transcript HTML
    const closeTime = new Date().toISOString();
    const ticketDataForTranscript = {
      ...ticket,
      closedAt: closeTime
    };
    const htmlTranscript = generateTranscript(ticketDataForTranscript, collectedMessages);

    // Sauvegarde dans le dossier ./transcripts/
    const transcriptsDir = path.resolve(process.cwd(), 'transcripts');
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    const transcriptFileName = `transcript-${channel.id}.html`;
    const transcriptPath = path.join(transcriptsDir, transcriptFileName);
    fs.writeFileSync(transcriptPath, htmlTranscript, 'utf-8');

    // Envoi du fichier transcript dans le salon de logs
    const config = await db.getConfig(guild.id);
    let logChannel = config.logChannelId ? guild.channels.cache.get(config.logChannelId) : null;
    if (!logChannel) {
      logChannel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        (c.name.includes('log') || c.name.includes('transcript'))
      );
    }

    if (logChannel) {
      const fileAttachment = new AttachmentBuilder(transcriptPath, { name: transcriptFileName });
      const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Fermé - Transcript')
        .setColor('#7c3aed')
        .addFields(
          { name: 'Salon', value: `${channel.name}`, inline: true },
          { name: 'Service', value: `${ticket.serviceName || 'N/A'}`, inline: true },
          { name: 'Prix', value: `${ticket.price || 'N/A'}`, inline: true },
          { name: 'Client', value: ticket.userId ? `<@${ticket.userId}>` : 'Inconnu', inline: true },
          { name: 'Staff', value: ticket.staffId ? `<@${ticket.staffId}>` : 'Non assigné', inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed], files: [fileAttachment] }).catch(() => {});
    }

    // Demande d'avis par MP à l'utilisateur (boutons 1 à 5 étoiles)
    if (ticket.userId) {
      try {
        const user = await interaction.client.users.fetch(ticket.userId);
        if (user) {
          const starRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`review-star-1_${ticket.id}_${ticket.staffId || ''}`).setLabel('⭐ 1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`review-star-2_${ticket.id}_${ticket.staffId || ''}`).setLabel('⭐ 2').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`review-star-3_${ticket.id}_${ticket.staffId || ''}`).setLabel('⭐ 3').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`review-star-4_${ticket.id}_${ticket.staffId || ''}`).setLabel('⭐ 4').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`review-star-5_${ticket.id}_${ticket.staffId || ''}`).setLabel('⭐ 5').setStyle(ButtonStyle.Success)
          );

          const dmEmbed = new EmbedBuilder()
            .setTitle('Virtual Vision - Votre avis')
            .setColor('#7c3aed')
            .setDescription(`Votre ticket pour **${ticket.serviceName || 'la commande'}** est clos.\nNotez votre expérience :`);

          await user.send({ embeds: [dmEmbed], components: [starRow] });
        }
      } catch (dmErr) {
        // MP bloqués ou fermés, ignoré
      }
    }

    // Mise à jour du statut en base de données
    await db.updateTicket(channel.id, {
      status: 'closed',
      closedAt: closeTime,
      transcriptFile: transcriptPath
    });

    // Suppression du salon après 5 secondes
    setTimeout(async () => {
      try {
        await channel.delete('Ticket fermé');
      } catch (err) {
        console.error('Erreur suppression salon ticket:', err);
      }
    }, 5000);
  } catch (error) {
    console.error('Erreur handleConfirmClose:', error);
  }
}

/**
 * Gère le clic sur une note en étoile : ouvre la modal pour commentaire optionnel.
 * @param {ButtonInteraction} interaction
 */
async function handleReviewStars(interaction) {
  try {
    const match = interaction.customId.match(/^review-star-(\d)(?:_(.*?)_(.*?))?$/);
    const rating = match ? parseInt(match[1], 10) : 5;
    const ticketId = match ? (match[2] || '') : '';
    const staffId = match ? (match[3] || '') : '';

    const modal = new ModalBuilder()
      .setCustomId(`review-comment-modal_${rating}_${staffId}_${ticketId}`)
      .setTitle('Avis - Virtual Vision');

    const commentInput = new TextInputBuilder()
      .setCustomId('review-comment-input')
      .setLabel('Votre avis (optionnel)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Votre retour sur le montage...')
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Erreur handleReviewStars:', error);
  }
}

/**
 * Enregistre l'avis en base et le poste dans le salon d'avis.
 * @param {ModalSubmitInteraction} interaction
 */
async function handleReviewSubmit(interaction) {
  try {
    const customIdParts = interaction.customId.replace('review-comment-modal_', '').split('_');
    const rating = parseInt(customIdParts[0], 10) || 5;
    const staffId = customIdParts[1] || null;
    const ticketId = customIdParts[2] || null;

    const comment = interaction.fields.getTextInputValue('review-comment-input')?.trim() || '';

    // Enregistrement de l'avis en base
    await db.saveReview({
      ticketId,
      userId: interaction.user.id,
      username: interaction.user.tag || interaction.user.username,
      staffId,
      rating,
      comment,
      visible: true,
      createdAt: new Date().toISOString()
    });

    // Recherche du salon d'avis
    let reviewChannel = null;
    if (interaction.guild) {
      const config = await db.getConfig(interaction.guild.id);
      if (config.reviewChannelId) {
        reviewChannel = interaction.guild.channels.cache.get(config.reviewChannelId);
      }
      if (!reviewChannel) {
        reviewChannel = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText &&
          (c.name.includes('avis') || c.name.includes('review') || c.name.includes('feedback'))
        );
      }
    } else {
      for (const g of interaction.client.guilds.cache.values()) {
        const found = g.channels.cache.find(c =>
          c.type === ChannelType.GuildText &&
          (c.name.includes('avis') || c.name.includes('review') || c.name.includes('feedback'))
        );
        if (found) {
          reviewChannel = found;
          break;
        }
      }
    }

    if (reviewChannel) {
      const starString = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const embed = new EmbedBuilder()
        .setTitle(`Nouvel avis (${starString})`)
        .setColor('#8b5cf6')
        .setDescription(comment ? `"${comment}"` : 'Aucun commentaire.')
        .addFields(
          { name: 'Client', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Note', value: `${rating}/5 ⭐`, inline: true },
          { name: 'Staff', value: staffId ? `<@${staffId}>` : 'Équipe Virtual Vision', inline: true }
        )
        .setFooter({ text: 'Virtual Vision' })
        .setTimestamp();

      await reviewChannel.send({ embeds: [embed] }).catch(() => {});
    }

    await interaction.reply({
      content: 'Merci pour votre avis !',
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur handleReviewSubmit:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Erreur enregistrement avis.', ephemeral: true });
    }
  }
}

module.exports = {
  sendTicketPanel,
  handleServiceSelect,
  handleClaim,
  handleClose,
  handleConfirmClose,
  handleReviewStars,
  handleReviewSubmit
};
