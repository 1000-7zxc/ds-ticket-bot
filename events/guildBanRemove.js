const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban, client) {
        const channel = client.channels.cache.get(config.moderationLogChannel);
        if (!channel) return;

        try {
            const auditLogs = await ban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanRemove,
                limit: 1
            });
            
            const unbanLog = auditLogs.entries.first();
            const executor = unbanLog?.executor;

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Пользователь разбанен')
                .addFields(
                    { name: 'Пользователь', value: `<@${ban.user.id}>`, inline: true },
                    { name: 'ID', value: ban.user.id, inline: true },
                    { name: 'Модератор', value: executor ? `<@${executor.id}>` : 'Неизвестно', inline: true }
                )
                .setThumbnail(ban.user.displayAvatarURL())
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging unban:', error);
        }
    }
};
