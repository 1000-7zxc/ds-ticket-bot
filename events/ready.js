const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`✅ Bot logged in as ${client.user.tag}`);
        console.log(`📊 Servers: ${client.guilds.cache.size}`);
        console.log(`👥 Users: ${client.users.cache.size}`);
        console.log('═══════════════════════════════════════════════════════════════');
        
        client.user.setPresence({
            activities: [{ 
                name: '📝 Логирование сервера', 
                type: ActivityType.Watching 
            }],
            status: 'online'
        });
        
        console.log('✅ Bot is ready!');
    }
};
