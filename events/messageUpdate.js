const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        
        const channel = client.channels.cache.get(config.chatLogChannel);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('✏️ Сообщение изменено')
            .addFields(
                { name: 'Автор', value: `${newMessage.author.tag}`, inline: true },
                { name: 'Канал', value: `<#${newMessage.channelId}>`, inline: true },
                { name: 'До', value: oldMessage.content || '*Нет текста*' },
                { name: 'После', value: newMessage.content || '*Нет текста*' },
                { name: 'Ссылка', value: `[Перейти к сообщению](${newMessage.url})` }
            )
            .setThumbnail(newMessage.author.displayAvatarURL())
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
};
