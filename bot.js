const { Client, GatewayIntentBits, EmbedBuilder, AuditLogEvent, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
  ],
});

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN || 'TON_TOKEN_ICI';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || 'ID_DU_SALON_LOG';

// Tu peux séparer les logs par catégorie en définissant des channels différents
const CHANNELS = {
  messages:  process.env.LOG_MESSAGES_CHANNEL  || LOG_CHANNEL_ID,
  members:   process.env.LOG_MEMBERS_CHANNEL   || LOG_CHANNEL_ID,
  moderation:process.env.LOG_MODERATION_CHANNEL|| LOG_CHANNEL_ID,
  server:    process.env.LOG_SERVER_CHANNEL    || LOG_CHANNEL_ID,
  voice:     process.env.LOG_VOICE_CHANNEL     || LOG_CHANNEL_ID,
  roles:     process.env.LOG_ROLES_CHANNEL     || LOG_CHANNEL_ID,
  channels:  process.env.LOG_CHANNELS_CHANNEL  || LOG_CHANNEL_ID,
  invites:   process.env.LOG_INVITES_CHANNEL   || LOG_CHANNEL_ID,
  reactions: process.env.LOG_REACTIONS_CHANNEL || LOG_CHANNEL_ID,
  threads:   process.env.LOG_THREADS_CHANNEL   || LOG_CHANNEL_ID,
  emojis:    process.env.LOG_EMOJIS_CHANNEL    || LOG_CHANNEL_ID,
  automod:   process.env.LOG_AUTOMOD_CHANNEL   || LOG_CHANNEL_ID,
  webhooks:  process.env.LOG_WEBHOOKS_CHANNEL  || LOG_CHANNEL_ID,
  events:    process.env.LOG_EVENTS_CHANNEL    || LOG_CHANNEL_ID,
  stage:     process.env.LOG_STAGE_CHANNEL     || LOG_CHANNEL_ID,
};

// ─── COULEURS PAR CATÉGORIE ───────────────────────────────────────────────────
const COLORS = {
  green:  0x2ECC71,
  red:    0xE74C3C,
  orange: 0xE67E22,
  blue:   0x3498DB,
  purple: 0x9B59B6,
  yellow: 0xF1C40F,
  gray:   0x95A5A6,
  pink:   0xFF6B9D,
  teal:   0x1ABC9C,
  dark:   0x2C3E50,
};

// ─── HELPER : envoyer un embed dans le bon channel ────────────────────────────
async function sendLog(categoryKey, embed) {
  try {
    const channelId = CHANNELS[categoryKey] || LOG_CHANNEL_ID;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[Logger] Erreur envoi log (${categoryKey}):`, err.message);
  }
}

function ts(date = new Date()) {
  return `<t:${Math.floor((date instanceof Date ? date : new Date(date)).getTime() / 1000)}:F>`;
}

function safe(text, max = 1024) {
  if (!text) return '*Aucun*';
  const str = String(text);
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function diff(before, after, keys) {
  const fields = [];
  for (const key of keys) {
    const b = before[key], a = after[key];
    if (b !== a) fields.push({ name: key, value: `\`${b ?? 'aucun'}\` → \`${a ?? 'aucun'}\``, inline: true });
  }
  return fields;
}

// ─── READY ────────────────────────────────────────────────────────────────────
client.on('ready', () => {
  console.log(`✅ Logger connecté en tant que ${client.user.tag}`);
  console.log(`📋 Surveillance de ${client.guilds.cache.size} serveur(s)`);
});

// ══════════════════════════════════════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════════════════════════════════════

client.on('messageDelete', async (message) => {
  if (message.partial || message.author?.bot) return;
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message supprimé')
    .setColor(COLORS.red)
    .addFields(
      { name: '👤 Auteur',  value: `${message.author} (${message.author.tag})`, inline: true },
      { name: '📌 Salon',   value: `${message.channel}`, inline: true },
      { name: '🆔 ID Msg',  value: message.id, inline: true },
      { name: '📝 Contenu', value: safe(message.content || '*Aucun texte (embed/fichier)*') },
    )
    .setTimestamp()
    .setFooter({ text: `ID auteur: ${message.author.id}` });

  if (message.attachments.size > 0) {
    embed.addFields({ name: '📎 Pièces jointes', value: message.attachments.map(a => a.url).join('\n').slice(0, 1024) });
  }
  await sendLog('messages', embed);
});

client.on('messageDeleteBulk', async (messages, channel) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Suppression en masse de messages')
    .setColor(COLORS.red)
    .addFields(
      { name: '📌 Salon',   value: `${channel}`, inline: true },
      { name: '🔢 Nombre',  value: `${messages.size} messages`, inline: true },
    )
    .setTimestamp();
  await sendLog('messages', embed);
});

client.on('messageUpdate', async (before, after) => {
  if (before.partial || after.partial || after.author?.bot) return;
  if (before.content === after.content) return;
  const embed = new EmbedBuilder()
    .setTitle('✏️ Message modifié')
    .setColor(COLORS.orange)
    .addFields(
      { name: '👤 Auteur',  value: `${after.author} (${after.author.tag})`, inline: true },
      { name: '📌 Salon',   value: `${after.channel}`, inline: true },
      { name: '🔗 Lien',    value: `[Voir le message](${after.url})`, inline: true },
      { name: '📝 Avant',   value: safe(before.content || '*Vide*') },
      { name: '📝 Après',   value: safe(after.content  || '*Vide*') },
    )
    .setTimestamp()
    .setFooter({ text: `ID: ${after.id}` });
  await sendLog('messages', embed);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  const embed = new EmbedBuilder()
    .setTitle('😀 Réaction ajoutée')
    .setColor(COLORS.yellow)
    .addFields(
      { name: '👤 Par',       value: `${user} (${user.tag})`, inline: true },
      { name: '😀 Emoji',     value: reaction.emoji.toString(), inline: true },
      { name: '📌 Salon',     value: `${reaction.message.channel}`, inline: true },
      { name: '🔗 Message',   value: `[Voir le message](${reaction.message.url})`, inline: true },
    )
    .setTimestamp();
  await sendLog('reactions', embed);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  const embed = new EmbedBuilder()
    .setTitle('😶 Réaction retirée')
    .setColor(COLORS.gray)
    .addFields(
      { name: '👤 Par',     value: `${user} (${user.tag})`, inline: true },
      { name: '😀 Emoji',   value: reaction.emoji.toString(), inline: true },
      { name: '📌 Salon',   value: `${reaction.message.channel}`, inline: true },
    )
    .setTimestamp();
  await sendLog('reactions', embed);
});

client.on('messageReactionRemoveAll', async (message) => {
  const embed = new EmbedBuilder()
    .setTitle('🧹 Toutes les réactions retirées')
    .setColor(COLORS.gray)
    .addFields({ name: '🔗 Message', value: `[Voir le message](${message.url})` })
    .setTimestamp();
  await sendLog('reactions', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  MEMBRES
// ══════════════════════════════════════════════════════════════════════════════

client.on('guildMemberAdd', async (member) => {
  const accountAge = Math.floor((Date.now() - member.user.createdAt) / 86400000);
  const embed = new EmbedBuilder()
    .setTitle('✅ Membre rejoint')
    .setColor(COLORS.green)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '👤 Membre',           value: `${member} (${member.user.tag})`, inline: true },
      { name: '🆔 ID',               value: member.id, inline: true },
      { name: '📅 Compte créé',      value: ts(member.user.createdAt), inline: false },
      { name: '📊 Âge du compte',    value: `${accountAge} jours`, inline: true },
      { name: '🔢 Membre #',         value: `${member.guild.memberCount}`, inline: true },
    )
    .setTimestamp();
  await sendLog('members', embed);
});

client.on('guildMemberRemove', async (member) => {
  const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(', ') || '*Aucun*';
  const embed = new EmbedBuilder()
    .setTitle('👋 Membre parti')
    .setColor(COLORS.red)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '👤 Membre',  value: `${member.user.tag}`, inline: true },
      { name: '🆔 ID',      value: member.id, inline: true },
      { name: '📅 Rejoint', value: ts(member.joinedAt), inline: false },
      { name: '🎖️ Rôles',  value: safe(roles) },
    )
    .setTimestamp();
  await sendLog('members', embed);
});

client.on('guildMemberUpdate', async (before, after) => {
  // Pseudo changé
  if (before.nickname !== after.nickname) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Pseudo modifié')
      .setColor(COLORS.orange)
      .addFields(
        { name: '👤 Membre',   value: `${after} (${after.user.tag})`, inline: true },
        { name: '🏷️ Avant',   value: before.nickname || '*Aucun*', inline: true },
        { name: '🏷️ Après',   value: after.nickname  || '*Aucun*', inline: true },
      )
      .setTimestamp();
    await sendLog('members', embed);
  }

  // Rôles ajoutés / retirés
  const addedRoles   = after.roles.cache.filter(r => !before.roles.cache.has(r.id));
  const removedRoles = before.roles.cache.filter(r => !after.roles.cache.has(r.id));

  if (addedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('🎖️ Rôle(s) ajouté(s)')
      .setColor(COLORS.green)
      .addFields(
        { name: '👤 Membre', value: `${after} (${after.user.tag})`, inline: true },
        { name: '➕ Rôles',  value: addedRoles.map(r => r.toString()).join(', '), inline: true },
      )
      .setTimestamp();
    await sendLog('roles', embed);
  }

  if (removedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('🎖️ Rôle(s) retiré(s)')
      .setColor(COLORS.red)
      .addFields(
        { name: '👤 Membre', value: `${after} (${after.user.tag})`, inline: true },
        { name: '➖ Rôles',  value: removedRoles.map(r => r.toString()).join(', '), inline: true },
      )
      .setTimestamp();
    await sendLog('roles', embed);
  }

  // Timeout
  if (!before.communicationDisabledUntil && after.communicationDisabledUntil) {
    const embed = new EmbedBuilder()
      .setTitle('🔇 Membre mis en timeout')
      .setColor(COLORS.red)
      .addFields(
        { name: '👤 Membre',   value: `${after} (${after.user.tag})`, inline: true },
        { name: '⏱️ Expire',  value: ts(after.communicationDisabledUntil), inline: true },
      )
      .setTimestamp();
    await sendLog('moderation', embed);
  }

  if (before.communicationDisabledUntil && !after.communicationDisabledUntil) {
    const embed = new EmbedBuilder()
      .setTitle('🔊 Timeout retiré')
      .setColor(COLORS.green)
      .addFields({ name: '👤 Membre', value: `${after} (${after.user.tag})` })
      .setTimestamp();
    await sendLog('moderation', embed);
  }

  // Avatar serveur changé
  if (before.avatar !== after.avatar) {
    const embed = new EmbedBuilder()
      .setTitle('🖼️ Avatar serveur changé')
      .setColor(COLORS.blue)
      .setThumbnail(after.displayAvatarURL())
      .addFields({ name: '👤 Membre', value: `${after} (${after.user.tag})` })
      .setTimestamp();
    await sendLog('members', embed);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  MODÉRATION
// ══════════════════════════════════════════════════════════════════════════════

client.on('guildBanAdd', async (ban) => {
  let executor = null, reason = ban.reason;
  try {
    const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBan, limit: 1 });
    const entry = audit.entries.first();
    if (entry?.target?.id === ban.user.id) {
      executor = entry.executor;
      reason = entry.reason || reason;
    }
  } catch {}
  const embed = new EmbedBuilder()
    .setTitle('🔨 Membre banni')
    .setColor(COLORS.dark)
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: '👤 Banni',     value: `${ban.user.tag}`, inline: true },
      { name: '🆔 ID',        value: ban.user.id, inline: true },
      { name: '🛡️ Modérateur', value: executor ? `${executor.tag}` : '*Inconnu*', inline: true },
      { name: '📋 Raison',    value: safe(reason || '*Aucune*') },
    )
    .setTimestamp();
  await sendLog('moderation', embed);
});

client.on('guildBanRemove', async (ban) => {
  let executor = null;
  try {
    const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUnban, limit: 1 });
    const entry = audit.entries.first();
    if (entry?.target?.id === ban.user.id) executor = entry.executor;
  } catch {}
  const embed = new EmbedBuilder()
    .setTitle('✅ Bannissement levé')
    .setColor(COLORS.green)
    .addFields(
      { name: '👤 Utilisateur', value: `${ban.user.tag}`, inline: true },
      { name: '🆔 ID',          value: ban.user.id, inline: true },
      { name: '🛡️ Modérateur', value: executor ? `${executor.tag}` : '*Inconnu*', inline: true },
    )
    .setTimestamp();
  await sendLog('moderation', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  RÔLES
// ══════════════════════════════════════════════════════════════════════════════

client.on('roleCreate', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('✨ Rôle créé')
    .setColor(role.color || COLORS.green)
    .addFields(
      { name: '🏷️ Nom',        value: role.name, inline: true },
      { name: '🆔 ID',          value: role.id, inline: true },
      { name: '🎨 Couleur',     value: role.hexColor, inline: true },
      { name: '📌 Mentionnable', value: role.mentionable ? '✅' : '❌', inline: true },
      { name: '🔍 Affiché séparément', value: role.hoist ? '✅' : '❌', inline: true },
    )
    .setTimestamp();
  await sendLog('roles', embed);
});

client.on('roleDelete', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Rôle supprimé')
    .setColor(COLORS.red)
    .addFields(
      { name: '🏷️ Nom', value: role.name, inline: true },
      { name: '🆔 ID',  value: role.id, inline: true },
    )
    .setTimestamp();
  await sendLog('roles', embed);
});

client.on('roleUpdate', async (before, after) => {
  const fields = diff(before, after, ['name', 'color', 'hoist', 'mentionable', 'position']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Rôle modifié')
    .setColor(COLORS.orange)
    .addFields(
      { name: '🏷️ Rôle', value: `${after} (${after.name})`, inline: true },
      { name: '🆔 ID',   value: after.id, inline: true },
      ...fields,
    )
    .setTimestamp();
  await sendLog('roles', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  SALONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  const embed = new EmbedBuilder()
    .setTitle('📢 Salon créé')
    .setColor(COLORS.green)
    .addFields(
      { name: '📌 Nom',      value: channel.name, inline: true },
      { name: '🆔 ID',       value: channel.id, inline: true },
      { name: '📂 Type',     value: channel.type.toString(), inline: true },
      { name: '📁 Catégorie', value: channel.parent?.name || '*Aucune*', inline: true },
    )
    .setTimestamp();
  await sendLog('channels', embed);
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Salon supprimé')
    .setColor(COLORS.red)
    .addFields(
      { name: '📌 Nom',      value: channel.name, inline: true },
      { name: '🆔 ID',       value: channel.id, inline: true },
      { name: '📁 Catégorie', value: channel.parent?.name || '*Aucune*', inline: true },
    )
    .setTimestamp();
  await sendLog('channels', embed);
});

client.on('channelUpdate', async (before, after) => {
  if (!after.guild) return;
  const fields = diff(before, after, ['name', 'topic', 'nsfw', 'rateLimitPerUser', 'position', 'parentId', 'userLimit', 'bitrate']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Salon modifié')
    .setColor(COLORS.orange)
    .addFields(
      { name: '📌 Salon', value: `${after}`, inline: true },
      { name: '🆔 ID',    value: after.id, inline: true },
      ...fields,
    )
    .setTimestamp();
  await sendLog('channels', embed);
});

client.on('channelPinsUpdate', async (channel, time) => {
  const embed = new EmbedBuilder()
    .setTitle('📌 Messages épinglés mis à jour')
    .setColor(COLORS.yellow)
    .addFields(
      { name: '📌 Salon', value: `${channel}`, inline: true },
      { name: '🕐 À',     value: ts(time), inline: true },
    )
    .setTimestamp();
  await sendLog('channels', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  THREADS
// ══════════════════════════════════════════════════════════════════════════════

client.on('threadCreate', async (thread, newlyCreated) => {
  const embed = new EmbedBuilder()
    .setTitle('🧵 Thread créé')
    .setColor(COLORS.teal)
    .addFields(
      { name: '🧵 Nom',         value: thread.name, inline: true },
      { name: '🆔 ID',          value: thread.id, inline: true },
      { name: '📌 Salon parent', value: `${thread.parent}`, inline: true },
      { name: '⏱️ Archive dans', value: `${thread.autoArchiveDuration} min`, inline: true },
    )
    .setTimestamp();
  await sendLog('threads', embed);
});

client.on('threadDelete', async (thread) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Thread supprimé')
    .setColor(COLORS.red)
    .addFields(
      { name: '🧵 Nom', value: thread.name, inline: true },
      { name: '🆔 ID',  value: thread.id, inline: true },
    )
    .setTimestamp();
  await sendLog('threads', embed);
});

client.on('threadUpdate', async (before, after) => {
  const fields = diff(before, after, ['name', 'archived', 'locked', 'autoArchiveDuration']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Thread modifié')
    .setColor(COLORS.orange)
    .addFields(
      { name: '🧵 Thread', value: after.name, inline: true },
      ...fields,
    )
    .setTimestamp();
  await sendLog('threads', embed);
});

client.on('threadMembersUpdate', async (addedMembers, removedMembers, thread) => {
  if (addedMembers.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➕ Membres ajoutés au thread')
      .setColor(COLORS.green)
      .addFields(
        { name: '🧵 Thread',  value: thread.name, inline: true },
        { name: '👥 Membres', value: addedMembers.map(m => `<@${m.id}>`).join(', ').slice(0, 1024) },
      )
      .setTimestamp();
    await sendLog('threads', embed);
  }
  if (removedMembers.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➖ Membres retirés du thread')
      .setColor(COLORS.red)
      .addFields(
        { name: '🧵 Thread',  value: thread.name, inline: true },
        { name: '👥 Membres', value: removedMembers.map(m => `<@${m.id}>`).join(', ').slice(0, 1024) },
      )
      .setTimestamp();
    await sendLog('threads', embed);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  VOCAL
// ══════════════════════════════════════════════════════════════════════════════

client.on('voiceStateUpdate', async (before, after) => {
  const member = after.member || before.member;
  if (!member) return;

  // Rejoint un vocal
  if (!before.channelId && after.channelId) {
    const embed = new EmbedBuilder()
      .setTitle('🔊 Rejoint le vocal')
      .setColor(COLORS.green)
      .addFields(
        { name: '👤 Membre', value: `${member} (${member.user.tag})`, inline: true },
        { name: '📢 Salon',  value: `${after.channel}`, inline: true },
      )
      .setTimestamp();
    return sendLog('voice', embed);
  }

  // Quitté le vocal
  if (before.channelId && !after.channelId) {
    // Petit délai pour laisser à Discord le temps d'écrire l'Audit Log
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let executor = null;
    try {
      const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberDisconnect,
      });
      const disconnectLog = fetchedLogs.entries.first();
      
      // On vérifie que le log correspond au membre et qu'il est récent (moins de 10 secondes)
      if (disconnectLog && disconnectLog.target.id === member.id && (Date.now() - disconnectLog.createdTimestamp) < 10000) {
        executor = disconnectLog.executor;
      }
    } catch (e) {
      console.error("Erreur fetchAuditLogs (Disconnect):", e);
    }

    const embed = new EmbedBuilder()
      .setTitle(executor ? '🚫 Expulsé du vocal' : '🔇 Quitté le vocal')
      .setColor(executor ? COLORS.red : 0x7289DA) // Bleu Discord si départ volontaire
      .addFields(
        { name: '👤 Membre', value: `${member} (${member.user.tag})`, inline: true },
        { name: '📢 Salon',  value: `${before.channel.name}`, inline: true },
      )
      .setTimestamp();

    if (executor) {
      embed.addFields({ name: '🛡️ Modérateur', value: `${executor} (${executor.tag})`, inline: true });
    }

    return sendLog('voice', embed);
  }

  // Changé de salon vocal
  if (before.channelId !== after.channelId) {
    // Petit délai pour l'Audit Log
    await new Promise(resolve => setTimeout(resolve, 1000));

    let executor = null;
    try {
      const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberMove,
      });
      const moveLog = fetchedLogs.entries.first();
      
      if (moveLog && moveLog.target.id === member.id && (Date.now() - moveLog.createdTimestamp) < 10000) {
        executor = moveLog.executor;
      }
    } catch (e) {
      console.error("Erreur fetchAuditLogs (Move):", e);
    }

    const embed = new EmbedBuilder()
      .setTitle(executor ? '🔀 Déplacé par un modérateur' : '🔀 Changé de salon vocal')
      .setColor(executor ? COLORS.purple : COLORS.orange)
      .addFields(
        { name: '👤 Membre', value: `${member} (${member.user.tag})`, inline: true },
        { name: '⬅️ Avant',  value: `${before.channel.name}`, inline: true },
        { name: '➡️ Après',  value: `${after.channel.name}`, inline: true },
      )
      .setTimestamp();

    if (executor) {
      embed.addFields({ name: '🛡️ Modérateur', value: `${executor} (${executor.tag})`, inline: true });
    }

    return sendLog('voice', embed);
  }

  // Changements d'état vocal
  const changes = [];
  if (before.mute !== after.mute)        changes.push(`Mute serveur: ${after.mute ? '🔴 ON' : '🟢 OFF'}`);
  if (before.deaf !== after.deaf)        changes.push(`Sourd serveur: ${after.deaf ? '🔴 ON' : '🟢 OFF'}`);
  if (before.selfMute !== after.selfMute) changes.push(`Mute personnel: ${after.selfMute ? '🔴 ON' : '🟢 OFF'}`);
  if (before.selfDeaf !== after.selfDeaf) changes.push(`Sourd perso: ${after.selfDeaf ? '🔴 ON' : '🟢 OFF'}`);
  if (before.selfVideo !== after.selfVideo) changes.push(`Caméra: ${after.selfVideo ? '📷 ON' : '📷 OFF'}`);
  if (before.streaming !== after.streaming) changes.push(`Streaming: ${after.streaming ? '📺 ON' : '📺 OFF'}`);

  if (changes.length > 0) {
    const embed = new EmbedBuilder()
      .setTitle('🎙️ État vocal mis à jour')
      .setColor(COLORS.blue)
      .addFields(
        { name: '👤 Membre',     value: `${member} (${member.user.tag})`, inline: true },
        { name: '📢 Salon',      value: `${after.channel}`, inline: true },
        { name: '🔄 Changements', value: changes.join('\n') },
      )
      .setTimestamp();
    await sendLog('voice', embed);
  }
});

client.on('stageInstanceCreate', async (stageInstance) => {
  const embed = new EmbedBuilder()
    .setTitle('🎭 Stage créé')
    .setColor(COLORS.purple)
    .addFields(
      { name: '🎤 Sujet', value: stageInstance.topic, inline: true },
      { name: '📢 Salon', value: `${stageInstance.channel}`, inline: true },
    )
    .setTimestamp();
  await sendLog('stage', embed);
});

client.on('stageInstanceDelete', async (stageInstance) => {
  const embed = new EmbedBuilder()
    .setTitle('🎭 Stage terminé')
    .setColor(COLORS.red)
    .addFields({ name: '🎤 Sujet', value: stageInstance.topic })
    .setTimestamp();
  await sendLog('stage', embed);
});

client.on('stageInstanceUpdate', async (before, after) => {
  if (before.topic !== after.topic) {
    const embed = new EmbedBuilder()
      .setTitle('🔄 Stage modifié')
      .setColor(COLORS.orange)
      .addFields(
        { name: '🎤 Avant', value: before.topic, inline: true },
        { name: '🎤 Après', value: after.topic,  inline: true },
      )
      .setTimestamp();
    await sendLog('stage', embed);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  SERVEUR
// ══════════════════════════════════════════════════════════════════════════════

client.on('guildUpdate', async (before, after) => {
  const fields = diff(before, after, ['name', 'description', 'icon', 'banner', 'splash', 'ownerId', 'verificationLevel', 'defaultMessageNotifications', 'explicitContentFilter', 'preferredLocale', 'nsfwLevel', 'premiumTier']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Serveur modifié')
    .setColor(COLORS.orange)
    .addFields(
      { name: '🏠 Serveur', value: after.name, inline: true },
      ...fields,
    )
    .setTimestamp();
  await sendLog('server', embed);
});

client.on('guildIntegrationsUpdate', async (guild) => {
  const embed = new EmbedBuilder()
    .setTitle('🔗 Intégrations mises à jour')
    .setColor(COLORS.blue)
    .addFields({ name: '🏠 Serveur', value: guild.name })
    .setTimestamp();
  await sendLog('server', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  EMOJIS & STICKERS
// ══════════════════════════════════════════════════════════════════════════════

client.on('emojiCreate', async (emoji) => {
  const embed = new EmbedBuilder()
    .setTitle('😀 Emoji ajouté')
    .setColor(COLORS.yellow)
    .setThumbnail(emoji.url)
    .addFields(
      { name: '😀 Nom', value: emoji.name, inline: true },
      { name: '🆔 ID',  value: emoji.id,   inline: true },
      { name: '🎭 Animé', value: emoji.animated ? '✅' : '❌', inline: true },
    )
    .setTimestamp();
  await sendLog('emojis', embed);
});

client.on('emojiDelete', async (emoji) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Emoji supprimé')
    .setColor(COLORS.red)
    .addFields(
      { name: '😀 Nom', value: emoji.name, inline: true },
      { name: '🆔 ID',  value: emoji.id,   inline: true },
    )
    .setTimestamp();
  await sendLog('emojis', embed);
});

client.on('emojiUpdate', async (before, after) => {
  if (before.name === after.name) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Emoji modifié')
    .setColor(COLORS.orange)
    .setThumbnail(after.url)
    .addFields(
      { name: '😀 Avant', value: before.name, inline: true },
      { name: '😀 Après', value: after.name,  inline: true },
    )
    .setTimestamp();
  await sendLog('emojis', embed);
});

client.on('stickerCreate', async (sticker) => {
  const embed = new EmbedBuilder()
    .setTitle('🖼️ Sticker ajouté')
    .setColor(COLORS.yellow)
    .addFields(
      { name: '🖼️ Nom',         value: sticker.name, inline: true },
      { name: '🆔 ID',          value: sticker.id, inline: true },
      { name: '📋 Description', value: sticker.description || '*Aucune*', inline: true },
    )
    .setTimestamp();
  await sendLog('emojis', embed);
});

client.on('stickerDelete', async (sticker) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Sticker supprimé')
    .setColor(COLORS.red)
    .addFields({ name: '🖼️ Nom', value: sticker.name })
    .setTimestamp();
  await sendLog('emojis', embed);
});

client.on('stickerUpdate', async (before, after) => {
  const fields = diff(before, after, ['name', 'description', 'tags']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Sticker modifié')
    .setColor(COLORS.orange)
    .addFields({ name: '🖼️ Sticker', value: after.name }, ...fields)
    .setTimestamp();
  await sendLog('emojis', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  INVITATIONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('inviteCreate', async (invite) => {
  const embed = new EmbedBuilder()
    .setTitle('📨 Invitation créée')
    .setColor(COLORS.teal)
    .addFields(
      { name: '🔗 Lien',        value: invite.url, inline: true },
      { name: '👤 Créateur',    value: invite.inviter?.tag || '*Inconnu*', inline: true },
      { name: '📌 Salon',       value: `${invite.channel}`, inline: true },
      { name: '⏱️ Expire',      value: invite.maxAge ? `${invite.maxAge}s` : 'Jamais', inline: true },
      { name: '🔢 Utilisations', value: invite.maxUses ? `${invite.maxUses}` : 'Illimité', inline: true },
    )
    .setTimestamp();
  await sendLog('invites', embed);
});

client.on('inviteDelete', async (invite) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Invitation supprimée')
    .setColor(COLORS.red)
    .addFields(
      { name: '🔗 Code',  value: invite.code, inline: true },
      { name: '📌 Salon', value: `${invite.channel}`, inline: true },
      { name: '🔢 Utilisé', value: `${invite.uses} fois`, inline: true },
    )
    .setTimestamp();
  await sendLog('invites', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  WEBHOOKS
// ══════════════════════════════════════════════════════════════════════════════

client.on('webhooksUpdate', async (channel) => {
  const embed = new EmbedBuilder()
    .setTitle('🪝 Webhooks mis à jour')
    .setColor(COLORS.purple)
    .addFields({ name: '📌 Salon', value: `${channel}` })
    .setTimestamp();
  await sendLog('webhooks', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO MODERATION
// ══════════════════════════════════════════════════════════════════════════════

client.on('autoModerationActionExecution', async (execution) => {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ AutoMod déclenché')
    .setColor(COLORS.red)
    .addFields(
      { name: '👤 Utilisateur',     value: `<@${execution.userId}>`, inline: true },
      { name: '📌 Salon',           value: `<#${execution.channelId}>`, inline: true },
      { name: '📋 Règle',           value: execution.ruleName || execution.ruleId, inline: true },
      { name: '⚡ Action',          value: execution.action?.type?.toString() || 'Inconnue', inline: true },
      { name: '📝 Contenu filtré',  value: safe(execution.content || '*Non disponible*') },
      { name: '🔑 Mot-clé trouvé',  value: execution.matchedKeyword || '*N/A*', inline: true },
    )
    .setTimestamp();
  await sendLog('automod', embed);
});

client.on('autoModerationRuleCreate', async (rule) => {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Règle AutoMod créée')
    .setColor(COLORS.green)
    .addFields(
      { name: '📋 Nom',     value: rule.name, inline: true },
      { name: '🆔 ID',      value: rule.id, inline: true },
      { name: '✅ Activée', value: rule.enabled ? '✅' : '❌', inline: true },
    )
    .setTimestamp();
  await sendLog('automod', embed);
});

client.on('autoModerationRuleDelete', async (rule) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Règle AutoMod supprimée')
    .setColor(COLORS.red)
    .addFields({ name: '📋 Nom', value: rule.name })
    .setTimestamp();
  await sendLog('automod', embed);
});

client.on('autoModerationRuleUpdate', async (before, after) => {
  const embed = new EmbedBuilder()
    .setTitle('🔄 Règle AutoMod modifiée')
    .setColor(COLORS.orange)
    .addFields({ name: '📋 Nom', value: after.name })
    .setTimestamp();
  await sendLog('automod', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  ÉVÉNEMENTS PLANIFIÉS
// ══════════════════════════════════════════════════════════════════════════════

client.on('guildScheduledEventCreate', async (event) => {
  const embed = new EmbedBuilder()
    .setTitle('📅 Événement créé')
    .setColor(COLORS.teal)
    .addFields(
      { name: '📌 Nom',         value: event.name, inline: true },
      { name: '👤 Créateur',    value: event.creator?.tag || '*Inconnu*', inline: true },
      { name: '📍 Lieu',        value: event.entityMetadata?.location || `${event.channel}` || '*N/A*', inline: true },
      { name: '🕐 Début',       value: ts(event.scheduledStartAt), inline: true },
      { name: '🕐 Fin',         value: event.scheduledEndAt ? ts(event.scheduledEndAt) : '*Non définie*', inline: true },
    )
    .setTimestamp();
  if (event.description) embed.addFields({ name: '📝 Description', value: safe(event.description) });
  await sendLog('events', embed);
});

client.on('guildScheduledEventDelete', async (event) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Événement supprimé')
    .setColor(COLORS.red)
    .addFields({ name: '📌 Nom', value: event.name })
    .setTimestamp();
  await sendLog('events', embed);
});

client.on('guildScheduledEventUpdate', async (before, after) => {
  const fields = diff(before, after, ['name', 'description', 'status']);
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🔄 Événement modifié')
    .setColor(COLORS.orange)
    .addFields({ name: '📌 Nom', value: after.name }, ...fields)
    .setTimestamp();
  await sendLog('events', embed);
});

client.on('guildScheduledEventUserAdd', async (event, user) => {
  const embed = new EmbedBuilder()
    .setTitle('✅ Intéressé par un événement')
    .setColor(COLORS.green)
    .addFields(
      { name: '📌 Événement', value: event.name, inline: true },
      { name: '👤 Membre',    value: `${user} (${user.tag})`, inline: true },
    )
    .setTimestamp();
  await sendLog('events', embed);
});

client.on('guildScheduledEventUserRemove', async (event, user) => {
  const embed = new EmbedBuilder()
    .setTitle('❌ Plus intéressé par un événement')
    .setColor(COLORS.gray)
    .addFields(
      { name: '📌 Événement', value: event.name, inline: true },
      { name: '👤 Membre',    value: `${user} (${user.tag})`, inline: true },
    )
    .setTimestamp();
  await sendLog('events', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  PRÉSENCES / USER
// ══════════════════════════════════════════════════════════════════════════════

client.on('userUpdate', async (before, after) => {
  const fields = [];
  if (before.username !== after.username) fields.push({ name: '🏷️ Pseudo global', value: `\`${before.username}\` → \`${after.username}\``, inline: true });
  if (before.discriminator !== after.discriminator) fields.push({ name: '🔢 Discriminant', value: `\`${before.discriminator}\` → \`${after.discriminator}\``, inline: true });
  if (before.avatar !== after.avatar) fields.push({ name: '🖼️ Avatar', value: '[Changé]', inline: true });
  if (fields.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('👤 Profil utilisateur modifié')
    .setColor(COLORS.blue)
    .setThumbnail(after.displayAvatarURL())
    .addFields(
      { name: '👤 Utilisateur', value: `${after.tag}`, inline: true },
      { name: '🆔 ID',          value: after.id, inline: true },
      ...fields,
    )
    .setTimestamp();
  await sendLog('members', embed);
});

// ══════════════════════════════════════════════════════════════════════════════
//  DÉMARRAGE
// ══════════════════════════════════════════════════════════════════════════════

client.login(TOKEN);
