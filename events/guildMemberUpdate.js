const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        // Check for role changes
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        
        if (addedRoles.size === 0 && removedRoles.size === 0) {
            // Check for timeout changes
            if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
                await logTimeout(oldMember, newMember, client);
            }
            return;
        }

        const channel = client.channels.cache.get(config.roleLogChannel);
        if (!channel) return;

        try {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 1
            });
            
            const roleLog = auditLogs.entries.first();
            const executor = roleLog?.executor;

            // Log added roles
            if (addedRoles.size > 0) {
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('➕ Роль выдана')
                    .addFields(
                        { name: 'Пользователь', value: `${newMember.user.tag}`, inline: true },
                        { name: 'ID', value: newMember.id, inline: true },
                        { name: 'Модератор', value: executor ? `${executor.tag}` : 'Неизвестно', inline: true },
                        { name: 'Роли', value: addedRoles.map(r => `<@&${r.id}>`).join(', ') }
                    )
                    .setThumbnail(newMember.user.displayAvatarURL())
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            }

            // Log removed roles
            if (removedRoles.size > 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('➖ Роль снята')
                    .addFields(
                        { name: 'Пользователь', value: `${newMember.user.tag}`, inline: true },
                        { name: 'ID', value: newMember.id, inline: true },
                        { name: 'Модератор', value: executor ? `${executor.tag}` : 'Неизвестно', inline: true },
                        { name: 'Роли', value: removedRoles.map(r => `<@&${r.id}>`).join(', ') }
                    )
                    .setThumbnail(newMember.user.displayAvatarURL())
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error logging role change:', error);
        }
    }
};

async function logTimeout(oldMember, newMember, client) {
    const channel = client.channels.cache.get(config.moderationLogChannel);
    if (!channel) return;

    try {
        const auditLogs = await newMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberUpdate,
            limit: 1
        });
        
        const timeoutLog = auditLogs.entries.first();
        const executor = timeoutLog?.executor;

        if (newMember.communicationDisabledUntilTimestamp > Date.now()) {
            // User was timed out
            const embed = new EmbedBuilder()
                .setColor('#ff6600')
                .setTitle('⏰ Тайм-аут выдан')
                .addFields(
                    { name: 'Пользователь', value: `${newMember.user.tag}`, inline: true },
                    { name: 'ID', value: newMember.id, inline: true },
                    { name: 'Модератор', value: executor ? `${executor.tag}` : 'Неизвестно', inline: true },
                    { name: 'До', value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>` }
                )
                .setThumbnail(newMember.user.displayAvatarURL())
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } else if (oldMember.communicationDisabledUntilTimestamp > Date.now()) {
            // Timeout was removed
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Тайм-аут снят')
                .addFields(
                    { name: 'Пользователь', value: `${newMember.user.tag}`, inline: true },
                    { name: 'ID', value: newMember.id, inline: true },
                    { name: 'Модератор', value: executor ? `${executor.tag}` : 'Неизвестно', inline: true }
                )
                .setThumbnail(newMember.user.displayAvatarURL())
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error logging timeout:', error);
    }
}
