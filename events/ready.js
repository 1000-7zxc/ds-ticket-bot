const { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Send ticket message
async function sendTicketMessage(client) {
    const ticketChannelId = process.env.TICKET_CHANNEL_ID;
    
    if (!ticketChannelId) {
        console.log('⚠️ TICKET_CHANNEL_ID not set, skipping ticket message');
        return;
    }
    
    for (const [, guild] of client.guilds.cache) {
        try {
            const ticketChannel = guild.channels.cache.get(ticketChannelId);
            
            if (!ticketChannel) {
                console.log(`⚠️ Ticket channel not found in guild ${guild.name}`);
                continue;
            }
            
            // Check if ticket message already exists
            const messages = await ticketChannel.messages.fetch({ limit: 10 });
            const existingMessage = messages.find(msg => 
                msg.author.id === client.user.id && 
                msg.embeds.length > 0 && 
                msg.embeds[0].title === '🎫 Система тикетов'
            );
            
            if (existingMessage) {
                console.log(`✅ Ticket message already exists in ${guild.name}`);
                continue;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎫 Система тикетов')
                .setDescription(
                    '**Добро пожаловать в систему тикетов!**\n\n' +
                    'Нажмите на кнопку ниже, чтобы создать тикет.'
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
            
            await ticketChannel.send({
                embeds: [embed],
                components: [button]
            });
            
            console.log(`✅ Ticket message sent to ${guild.name}`);
            
        } catch (error) {
            console.error('Error sending ticket message:', error);
        }
    }
}

// Helper function to get next Sunday at 00:00
function getNextSunday() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
}

// Helper function to format date range
function getWeekRange() {
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    
    const thisSunday = new Date(lastSunday);
    thisSunday.setDate(lastSunday.getDate() + 7);
    
    const format = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };
    
    return `${format(lastSunday)} - ${format(thisSunday)}`;
}

// Send weekly report
async function sendWeeklyReport(client) {
    const reportChannelId = process.env.REPORT_CHANNEL_ID || '1474896083971739874';
    const deputyRoleId = '1474448804064264489'; // Заместитель
    const curatorRoleId = '1474448804064264490'; // Куратор КП
    
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const reportChannel = guild.channels.cache.get(reportChannelId);
            
            if (!reportChannel) {
                console.log(`⚠️ Report channel not found in guild ${guild.name}`);
                continue;
            }
            
            const tracking = client.inviteTracking.get(guildId) || new Map();
            const members = await guild.members.fetch();
            
            // Get members with target roles
            const targetMembers = members.filter(m => 
                m.roles.cache.has(deputyRoleId) || m.roles.cache.has(curatorRoleId)
            );
            
            if (targetMembers.size === 0) {
                console.log(`⚠️ No members with target roles found in ${guild.name}`);
                continue;
            }
            
            // Build report
            let reportText = `📊 **Еженедельный отчёт по приглашениям**\n`;
            reportText += `Период: ${getWeekRange()}\n\n`;
            
            const sortedMembers = Array.from(targetMembers.values())
                .map(member => ({
                    member,
                    count: tracking.get(member.id) || 0
                }))
                .sort((a, b) => b.count - a.count);
            
            for (const { member, count } of sortedMembers) {
                reportText += `� <@${member.id}>, Принял: **${count}** кандидатов\n`;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📊 Еженедельный отчёт')
                .setDescription(reportText)
                .setTimestamp();
            
            await reportChannel.send({ embeds: [embed] });
            console.log(`✅ Weekly report sent to ${guild.name}`);
            
            // Reset tracking
            client.inviteTracking.set(guildId, new Map());
            
        } catch (error) {
            console.error(`❌ Error sending weekly report for guild ${guildId}:`, error);
        }
    }
}

// Schedule weekly reports
function scheduleWeeklyReport(client) {
    const checkAndSend = () => {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0) {
            sendWeeklyReport(client);
        }
    };
    
    // Check every minute
    setInterval(checkAndSend, 60000);
    
    console.log('✅ Weekly report scheduler started');
    console.log(`📅 Next report: ${getNextSunday().toLocaleString('ru-RU')}`);
}

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`✅ Bot logged in as ${client.user.tag}`);
        console.log(`📊 Servers: ${client.guilds.cache.size}`);
        console.log(`👥 Users: ${client.users.cache.size}`);
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Log channel configuration
        console.log('📋 Channel Configuration:');
        console.log(`Voice Log: ${config.voiceLogChannel}`);
        console.log(`Chat Log: ${config.chatLogChannel}`);
        console.log(`Moderation Log: ${config.moderationLogChannel}`);
        console.log(`Role Log: ${config.roleLogChannel}`);
        
        // Verify channels exist
        const voiceChannel = client.channels.cache.get(config.voiceLogChannel);
        const chatChannel = client.channels.cache.get(config.chatLogChannel);
        const modChannel = client.channels.cache.get(config.moderationLogChannel);
        const roleChannel = client.channels.cache.get(config.roleLogChannel);
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📍 Channel Status:');
        console.log(`Voice Log: ${voiceChannel ? '✅ Found' : '❌ Not Found'}`);
        console.log(`Chat Log: ${chatChannel ? '✅ Found' : '❌ Not Found'}`);
        console.log(`Moderation Log: ${modChannel ? '✅ Found' : '❌ Not Found'}`);
        console.log(`Role Log: ${roleChannel ? '✅ Found' : '❌ Not Found'}`);
        console.log('═══════════════════════════════════════════════════════════════');
        
        client.user.setPresence({
            activities: [{ 
                name: 'как происходят хакинги. По ошибкам бота писать сюда: ТГ - @bxdsun', 
                type: ActivityType.Watching 
            }],
            status: 'online'
        });
        
        // Cache invites for all guilds
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const invites = await guild.invites.fetch();
                client.invites.set(guildId, new Map(invites.map(inv => [inv.code, inv])));
                console.log(`✅ Cached ${invites.size} invites for ${guild.name}`);
            } catch (error) {
                console.error(`Error caching invites for ${guild.name}:`, error);
            }
        }
        
        // Schedule weekly reports
        scheduleWeeklyReport(client);
        
        // Send ticket message
        await sendTicketMessage(client);
        
        console.log('✅ Bot is ready!');
        
        // Send rules to channel
        const rulesChannelId = process.env.RULES_CHANNEL_ID || '1474762147589390337';
        const rulesChannel = client.channels.cache.get(rulesChannelId);
        
        if (rulesChannel) {
            try {
                // Delete old rules messages from bot
                console.log('🗑️ Deleting old rules messages...');
                const oldMessages = await rulesChannel.messages.fetch({ limit: 100 });
                const botMessages = oldMessages.filter(msg => msg.author.id === client.user.id);
                
                if (botMessages.size > 0) {
                    await rulesChannel.bulkDelete(botMessages);
                    console.log(`✅ Deleted ${botMessages.size} old messages`);
                }
                
                // Read rules from file
                const rulesPath = path.join(__dirname, '..', 'правила.txt');
                let rulesText = '';
                
                if (fs.existsSync(rulesPath)) {
                    rulesText = fs.readFileSync(rulesPath, 'utf-8');
                } else {
                    console.log('⚠️ Rules file not found, skipping rules posting');
                }
                
                if (rulesText) {
                    // Split rules into chunks (Discord embed limit is 4096 chars per field)
                    const chunks = [];
                    const lines = rulesText.split('\n');
                    let currentChunk = '';
                    
                    for (const line of lines) {
                        if ((currentChunk + line + '\n').length > 4000) {
                            chunks.push(currentChunk);
                            currentChunk = line + '\n';
                        } else {
                            currentChunk += line + '\n';
                        }
                    }
                    if (currentChunk) chunks.push(currentChunk);
                    
                    // Send embeds
                    for (let i = 0; i < chunks.length; i++) {
                        const embed = new EmbedBuilder()
                            .setColor('#FFA500') // Orange
                            .setDescription(chunks[i]);
                        
                        if (i === 0) {
                            embed.setTitle('📜 Правила сервера DeadMine');
                        }
                        
                        await rulesChannel.send({ embeds: [embed] });
                        
                        // Small delay between messages
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                    console.log('✅ Rules sent to channel');
                }
            } catch (error) {
                console.error('❌ Error sending rules:', error);
            }
        }
        
        // Auto-assign role to all members
        const autoRoleId = process.env.AUTO_ROLE_ID;
        if (autoRoleId) {
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('🎭 Starting auto-role assignment...');
            
            for (const [, guild] of client.guilds.cache) {
                try {
                    const role = guild.roles.cache.get(autoRoleId);
                    if (!role) {
                        console.log(`❌ Role ${autoRoleId} not found in guild ${guild.name}`);
                        continue;
                    }
                    
                    const members = await guild.members.fetch();
                    let assigned = 0;
                    let skipped = 0;
                    
                    for (const [, member] of members) {
                        if (member.user.bot) {
                            skipped++;
                            continue;
                        }
                        
                        if (member.roles.cache.has(autoRoleId)) {
                            skipped++;
                            continue;
                        }
                        
                        try {
                            await member.roles.add(role);
                            assigned++;
                            console.log(`✅ Assigned role to ${member.user.tag}`);
                            
                            // Small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (error) {
                            console.error(`❌ Error assigning role to ${member.user.tag}:`, error.message);
                        }
                    }
                    
                    console.log(`✅ Auto-role complete: ${assigned} assigned, ${skipped} skipped`);
                } catch (error) {
                    console.error('❌ Error in auto-role assignment:', error);
                }
            }
            
            console.log('═══════════════════════════════════════════════════════════════');
        }
    }
};
