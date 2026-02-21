const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            // Auto-assign role
            const autoRoleId = process.env.AUTO_ROLE_ID;
            if (autoRoleId) {
                const role = member.guild.roles.cache.get(autoRoleId);
                if (role) {
                    await member.roles.add(role);
                    console.log(`✅ Auto-assigned role ${role.name} to ${member.user.tag}`);
                }
            }
        } catch (error) {
            console.error('Error auto-assigning role:', error);
        }
    }
};
