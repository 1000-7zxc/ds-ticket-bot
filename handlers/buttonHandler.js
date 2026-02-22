const { PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Store active tickets
const activeTickets = new Map();

// Store cooldowns per server (guildId -> Map(userId -> timestamp))
const ticketCooldowns = new Map();

module.exports = {
    async handleButton(interaction, client) {
        const { customId, user, guild, member } = interaction;
        
        // Create ticket
        if (customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });
            
            // Check cooldown per server
            const now = Date.now();
            const cooldownAmount = 30 * 1000; // 30 seconds
            
            // Get or create cooldown map for this guild
            if (!ticketCooldowns.has(guild.id)) {
                ticketCooldowns.set(guild.id, new Map());
            }
            const guildCooldowns = ticketCooldowns.get(guild.id);
            
            if (guildCooldowns.has(user.id)) {
                const expirationTime = guildCooldowns.get(user.id) + cooldownAmount;
                
                if (now < expirationTime) {
                    const timeLeft = Math.round((expirationTime - now) / 1000);
                    return interaction.editReply({
                        content: `⏱️ Подождите ${timeLeft} секунд перед созданием нового тикета!`
                    });
                }
            }
            
            // Check if user already has a ticket
            const existingTicket = guild.channels.cache.find(
                ch => ch.name.toLowerCase().includes(`тикет`) && ch.name.toLowerCase().includes(user.username.toLowerCase())
            );
            
            if (existingTicket) {
                return interaction.editReply({
                    content: `❌ У вас уже есть открытый тикет: ${existingTicket}`
                });
            }
            
            // Set cooldown for this guild
            guildCooldowns.set(user.id, now);
            
            try {
                // Get category from environment
                const categoryId = process.env.TICKET_CATEGORY_ID;
                
                if (!categoryId) {
                    return interaction.editReply({
                        content: '❌ Категория для тикетов не настроена! Установите TICKET_CATEGORY_ID'
                    });
                }
                
                let category = guild.channels.cache.get(categoryId);
                
                if (!category) {
                    console.error('❌ Категория для тикетов не найдена!');
                    return interaction.editReply({
                        content: '❌ Ошибка: категория для тикетов не найдена!'
                    });
                }
                
                // Create ticket channel
                const ticketChannel = await guild.channels.create({
                    name: `тикет-${user.username}`,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        },
                        {
                            id: client.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ManageChannels
                            ]
                        }
                    ]
                });
                
                // Add support role if exists
                if (process.env.SUPPORT_ROLE_ID) {
                    await ticketChannel.permissionOverwrites.create(process.env.SUPPORT_ROLE_ID, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });
                }
                
                // Store ticket info
                activeTickets.set(ticketChannel.id, {
                    userId: user.id,
                    createdAt: Date.now()
                });
                
                // Create ticket embed
                const ticketEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎫 Тикет создан')
                    .setDescription(
                        `Привет, <@${user.id}>!\n\n` +
                        'Добро пожаловать, в Команду Проекта!\n\n' +
                        'Заполнять строго по форме:\n' +
                        'Никнейм:\n' +
                        'Должность:'
                    )
                    .setFooter({ text: `Тикет создан ${user.tag}`, iconURL: user.displayAvatarURL() })
                    .setTimestamp();
                
                const closeButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('🔒 Закрыть тикет')
                            .setStyle(ButtonStyle.Danger)
                    );
                
                await ticketChannel.send({
                    content: process.env.SUPPORT_ROLE_ID ? `<@&${process.env.SUPPORT_ROLE_ID}>` : '',
                    embeds: [ticketEmbed],
                    components: [closeButton]
                });
                
                await interaction.editReply({
                    content: `✅ Тикет создан: ${ticketChannel}`
                });
                
            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.editReply({
                    content: '❌ Ошибка при создании тикета!'
                });
            }
        }
        
        // Close ticket
        if (customId === 'close_ticket') {
            const channel = interaction.channel;
            
            // Check if this is a ticket channel
            const isTicketChannel = channel.name.toLowerCase().includes('тикет');
            
            if (!isTicketChannel) {
                return interaction.reply({
                    content: '❌ Эта команда работает только в тикетах!',
                    ephemeral: true
                });
            }
            
            await interaction.reply({
                content: '🔒 Закрываю тикет...'
            });
            
            // Log ticket closure
            const logChannelId = process.env.MODERATION_LOG_CHANNEL;
            if (logChannelId) {
                const logChannel = guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const ticketInfo = activeTickets.get(channel.id);
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🔒 Тикет закрыт')
                        .addFields(
                            { name: 'Канал', value: channel.name, inline: true },
                            { name: 'Закрыл', value: `<@${user.id}>`, inline: true },
                            { name: 'Создатель', value: ticketInfo ? `<@${ticketInfo.userId}>` : 'Неизвестно', inline: true }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            
            // Delete ticket info
            activeTickets.delete(channel.id);
            
            // Delete channel after 5 seconds
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 5000);
        }
    }
};
