const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban, client) {
        const channel = client.channels.cache.get(config.moderationLogChannel);
        if (!channel) return;

        try {
            const auditLogs = await ban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            });
            
            const banLog = auditLogs.entries.first();
            const executor = banLog?.executor;
            const reason = ban.reason || 'Причина не указана';

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Пользователь забанен')
                .addFields(
                    { name: 'Пользователь', value: `<@${ban.user.id}>`, inline: true },
                    { name: 'ID', value: ban.user.id, inline: true },
                    { name: 'Модератор', value: executor ? `<@${executor.id}>` : 'Неизвестно', inline: true },
                    { name: 'Причина', value: reason }
                )
                .setThumbnail(ban.user.displayAvatarURL())
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging ban:', error);
        }
    }
};
