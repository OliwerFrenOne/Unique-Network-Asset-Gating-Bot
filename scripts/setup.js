#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log('🤖 Unique Network Asset Gating Bot Setup\n');
    console.log('This script will help you configure your bot.\n');

    // Check if .env already exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled.');
            rl.close();
            return;
        }
    }

    // Create data directory
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('✅ Created data directory');
    }

    // Collect configuration
    console.log('\n📋 Discord Configuration:');
    const discordToken = await question('Discord Bot Token: ');
    const discordClientId = await question('Discord Client ID: ');
    const discordGuildId = await question('Discord Guild ID: ');
    const adminUserId = await question('Admin User ID: ');

    console.log('\n🔗 Unique Network Configuration:');
    const uniqueEndpoint = await question('Unique Network Endpoint (default: wss://ws.unique.network): ') || 'wss://ws.unique.network';
    const uniqueChainId = await question('Unique Network Chain ID (default: unique): ') || 'unique';

    console.log('\n⚙️  Bot Configuration:');
    const verificationAmount = await question('Verification Amount in UNQ (default: 0.001): ') || '0.001';
    const timeoutMinutes = await question('Verification Timeout in minutes (default: 60): ') || '60';

    // Generate .env content
    const envContent = `# Discord Bot Configuration
DISCORD_TOKEN=${discordToken}
DISCORD_CLIENT_ID=${discordClientId}
DISCORD_GUILD_ID=${discordGuildId}

# Unique Network Configuration
UNIQUE_NETWORK_ENDPOINT=${uniqueEndpoint}
UNIQUE_NETWORK_CHAIN_ID=${uniqueChainId}

# Bot Configuration
VERIFICATION_AMOUNT=${verificationAmount}
VERIFICATION_TIMEOUT_MINUTES=${timeoutMinutes}
ADMIN_USER_ID=${adminUserId}

# Database Configuration
DATABASE_PATH=./data/bot.db

# Optional: Webhook for notifications
WEBHOOK_URL=
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Configuration saved to .env');

    // Install dependencies
    console.log('\n📦 Installing dependencies...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Invite your bot to your Discord server');
    console.log('2. Set up the verification role using /admin-setrole');
    console.log('3. Start the bot with: npm start');
    console.log('\nFor more information, see the README.md file');

    rl.close();
}

setup().catch(console.error); 