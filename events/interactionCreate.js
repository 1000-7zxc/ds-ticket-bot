module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // Handle button interactions
            if (interaction.isButton()) {
                const buttonHandlers = require('../handlers/buttonHandler');
                await buttonHandlers.handleButton(interaction, client);
            }
        } catch (error) {
            console.error('Error in interactionCreate:', error);
            
            try {
                const errorMessage = {
                    content: '❌ Ошибка взаимодействия! Попробуйте позже.',
                    ephemeral: true
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => {});
                } else {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }
};
