const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Отправить сообщение с кнопкой создания тикета')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎫 Система тикетов')
            .setDescription(
                '**Добро пожаловать в систему тикетов!**\n\n' +
                'Нажмите на кнопку ниже, чтобы создать тикет.\n' +
                'Наша команда поддержки ответит вам как можно скорее.'
            )
            .setFooter({ text: 'DeadMine Support System' })
            .setTimestamp();
        
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Создать тикет')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.channel.send({
            embeds: [embed],
            components: [button]
        });
        
        await interaction.reply({
            content: '✅ Сообщение с кнопкой создания тикета отправлено!',
            ephemeral: true
        });
    }
};
