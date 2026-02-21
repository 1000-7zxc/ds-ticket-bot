const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Выдать роль всем участникам сервера')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        try {
            const autoRoleId = process.env.AUTO_ROLE_ID;
            if (!autoRoleId) {
                return interaction.editReply({
                    content: '❌ AUTO_ROLE_ID не установлен в переменных окружения!'
                });
            }

            const role = interaction.guild.roles.cache.get(autoRoleId);
            if (!role) {
                return interaction.editReply({
                    content: '❌ Роль не найдена! Проверьте AUTO_ROLE_ID.'
                });
            }

            await interaction.editReply({
                content: `⏳ Начинаю выдачу роли ${role.name} всем участникам...`
            });

            const members = await interaction.guild.members.fetch();
            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;

            for (const [, member] of members) {
                if (member.user.bot) {
                    skipCount++;
                    continue;
                }

                if (member.roles.cache.has(autoRoleId)) {
                    skipCount++;
                    continue;
                }

                try {
                    await member.roles.add(role);
                    successCount++;
                    
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error adding role to ${member.user.tag}:`, error);
                    errorCount++;
                }
            }

            await interaction.editReply({
                content: `✅ Готово!\n` +
                         `Выдано: ${successCount}\n` +
                         `Пропущено: ${skipCount}\n` +
                         `Ошибок: ${errorCount}`
            });
        } catch (error) {
            console.error('Error in autorole command:', error);
            await interaction.editReply({
                content: '❌ Произошла ошибка при выдаче ролей!'
            });
        }
    }
};
