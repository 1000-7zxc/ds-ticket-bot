const { ActivityType } = require('discord.js');
const config = require('../config');

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
                name: '📝 Логирование сервера', 
                type: ActivityType.Watching 
            }],
            status: 'online'
        });
        
        console.log('✅ Bot is ready!');
        
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
