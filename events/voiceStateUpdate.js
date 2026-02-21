const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const channel = client.channels.cache.get(config.voiceLogChannel);
        if (!channel) return;

        const member = newState.member || oldState.member;
        
        // User joined voice channel
        if (!oldState.channelId && newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔊 Подключение к голосовому каналу')
                .setDescription(`${member} подключился к <#${newState.channelId}>`)
                .addFields(
                    { name: 'Пользователь', value: `${member.user.tag}`, inline: true },
                    { name: 'ID', value: member.id, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        }
        
        // User left voice channel
        else if (oldState.channelId && !newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔇 Отключение от голосового канала')
                .setDescription(`${member} отключился от <#${oldState.channelId}>`)
                .addFields(
                    { name: 'Пользователь', value: `${member.user.tag}`, inline: true },
                    { name: 'ID', value: member.id, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        }
        
        // User switched voice channels
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('🔄 Переключение голосового канала')
                .setDescription(`${member} переключился с <#${oldState.channelId}> на <#${newState.channelId}>`)
                .addFields(
                    { name: 'Пользователь', value: `${member.user.tag}`, inline: true },
                    { name: 'ID', value: member.id, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        }
    }
};
