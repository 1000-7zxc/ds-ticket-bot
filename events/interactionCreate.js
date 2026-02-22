module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                
                if (!command) {
                    console.error(`Command ${interaction.commandName} not found`);
                    return;
                }
                
                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error(`Error executing ${interaction.commandName}:`, error);
                    
                    const errorMessage = {
                        content: '❌ Произошла ошибка при выполнении команды!',
                        ephemeral: true
                    };
                    
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage);
                    } else {
                        await interaction.reply(errorMessage);
                    }
                }
            }
            
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
