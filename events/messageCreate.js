const { PermissionFlagsBits, ChannelType } = require('discord.js');
const ticketConfig = require('../ticket-config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Check if message is in a ticket channel
        const channel = message.channel;
        if (!channel.name.toLowerCase().includes('тикет')) return;
        
        // Parse the message for nickname and position
        const content = message.content;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) return;
        
        // Extract nickname and position
        let nickname = null;
        let position = null;
        
        for (const line of lines) {
            if (line.toLowerCase().includes('никнейм:') || line.toLowerCase().includes('ник:')) {
                nickname = line.split(':')[1]?.trim();
            }
            if (line.toLowerCase().includes('должность:')) {
                position = line.split(':')[1]?.trim();
            }
        }
        
        if (!nickname || !position) return;
        
        // Only allow Helper role through tickets
        if (position !== 'Хелпер') {
            await message.reply('❌ Через тикеты можно получить только должность **Хелпер**!\nДля получения других должностей обратитесь к администрации.');
            return;
        }
        
        // Find role config
        const roleConfig = ticketConfig.roles[position];
        if (!roleConfig) {
            await message.reply('❌ Неизвестная должность! Доступные: ' + Object.keys(ticketConfig.roles).join(', '));
            return;
        }
        
        try {
            const member = message.member;
            const guild = message.guild;
            
            // Get role and category
            const role = guild.roles.cache.get(roleConfig.roleId);
            const category = guild.channels.cache.get(roleConfig.categoryId);
            
            if (!role) {
                await message.reply('❌ Роль не найдена на сервере!');
                return;
            }
            
            if (!category) {
                await message.reply('❌ Категория не найдена на сервере!');
                return;
            }
            
            // Change nickname
            try {
                await member.setNickname(`${nickname} | ${position}`);
            } catch (error) {
                console.error('Error changing nickname:', error);
                await message.reply('⚠️ Не удалось изменить никнейм (возможно, у пользователя выше роль бота)');
            }
            
            // Add role
            await member.roles.add(role);
            
            // Add additional role (Staff role)
            const additionalRoleId = ticketConfig.additionalRoleId;
            const additionalRole = guild.roles.cache.get(additionalRoleId);
            if (additionalRole) {
                await member.roles.add(additionalRole);
            }
            
            // Create personal channel
            const personalChannel = await guild.channels.create({
                name: `🏡・${nickname}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: member.id,
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
            
            // Send success message
            await message.reply(
                `✅ Заявка обработана!\n\n` +
                `👤 Никнейм изменен на: **${nickname} | ${position}**\n` +
                `🎭 Роль выдана: ${role}\n` +
                `📁 Личный канал создан: ${personalChannel}\n\n` +
                `Тикет будет закрыт через 10 секунд...`
            );
            
            // Close ticket after 10 seconds
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 10000);
            
        } catch (error) {
            console.error('Error processing ticket:', error);
            await message.reply('❌ Произошла ошибка при обработке заявки!');
        }
    }
};
