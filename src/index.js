require('dotenv').config();
const database = require('./config/databaseMongo');
const uniqueNetwork = require('./services/uniqueNetwork');
const discordBot = require('./services/discordBot');

async function startBot() {
    try {
        console.log('🚀 Starting Unique Network Asset Gating Bot...');

        // Initialize database
        console.log('📊 Initializing database...');
        await database.init();
        
        // Verify database is ready
        console.log('⏳ Verifying database initialization...');
        if (!database.collections || !database.collections.users) {
            throw new Error('Database collections not properly initialized');
        }
        console.log('✅ Database verified and ready');

        // Initialize Unique Network connection
        console.log('🔗 Connecting to Unique Network...');
        await uniqueNetwork.init();

        // Start Discord bot
        console.log('🤖 Starting Discord bot...');
        await discordBot.login();

        console.log('✅ Bot is ready!');

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down bot...');
            await uniqueNetwork.disconnect();
            database.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down bot...');
            await uniqueNetwork.disconnect();
            database.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startBot(); 