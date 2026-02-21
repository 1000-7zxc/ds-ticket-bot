const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (message.author?.bot) return;
        
        const channel = client.channels.cache.get(config.chatLogChannel);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ Сообщение удалено')
            .addFields(
                { name: 'Автор', value: message.author ? `${message.author.tag}` : 'Неизвестно', inline: true },
                { name: 'Канал', value: `<#${message.channelId}>`, inline: true },
                { name: 'Содержание', value: message.content || '*Нет текста*' }
            )
            .setTimestamp();
        
        if (message.author) {
            embed.setThumbnail(message.author.displayAvatarURL());
        }
        
        if (message.attachments.size > 0) {
            embed.addFields({ name: 'Вложения', value: `${message.attachments.size} файл(ов)` });
        }

        await channel.send({ embeds: [embed] });
    }
};
