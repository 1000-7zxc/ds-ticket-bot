const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const channel = client.channels.cache.get(config.moderationLogChannel);
        if (!channel) return;

        try {
            const auditLogs = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 1
            });
            
            const kickLog = auditLogs.entries.first();
            
            // Check if this was a kick (audit log entry exists and is recent)
            if (kickLog && kickLog.target.id === member.id && Date.now() - kickLog.createdTimestamp < 5000) {
                const executor = kickLog.executor;
                const reason = kickLog.reason || 'Причина не указана';

                const embed = new EmbedBuilder()
                    .setColor('#ff6600')
                    .setTitle('👢 Пользователь кикнут')
                    .addFields(
                        { name: 'Пользователь', value: `<@${member.id}>`, inline: true },
                        { name: 'ID', value: member.id, inline: true },
                        { name: 'Модератор', value: `<@${executor.id}>`, inline: true },
                        { name: 'Причина', value: reason }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error logging kick:', error);
        }
    }
};
