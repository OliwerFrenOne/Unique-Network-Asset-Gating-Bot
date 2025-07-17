require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'verifyunq',
        description: 'Verify your Unique Network wallet ownership',
        options: [
            {
                name: 'address',
                description: 'Your Unique Network wallet address',
                type: 3, // STRING
                required: true
            }
        ]
    },
    {
        name: 'checknfts',
        description: 'Check your NFT holdings and get additional perks',
        options: [
            {
                name: 'address',
                description: 'Your Unique Network wallet address (optional if already verified)',
                type: 3, // STRING
                required: false
            }
        ]
    },
    {
        name: 'status',
        description: 'Check your verification status and perks'
    },
    {
        name: 'admin-setrole',
        description: 'Set verification role (Admin only)',
        options: [
            {
                name: 'role',
                description: 'Role to assign to verified users',
                type: 8, // ROLE
                required: true
            }
        ]
    },
    {
        name: 'sync-role',
        description: 'Sync verification role to all verified users (Admin only)'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands for the specific guild
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
        console.log('Registered commands:');
        commands.forEach(cmd => {
            console.log(`- /${cmd.name}: ${cmd.description}`);
        });
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})(); 