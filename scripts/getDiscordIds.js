#!/usr/bin/env node

console.log('🔍 Discord ID Helper\n');

console.log('To get your Discord Guild ID (Server ID):');
console.log('1. Enable Developer Mode in Discord:');
console.log('   - Go to User Settings > Advanced > Developer Mode');
console.log('2. Right-click on your server name and select "Copy Server ID"');
console.log('3. Use that ID for DISCORD_GUILD_ID\n');

console.log('To get your Discord User ID (for ADMIN_USER_ID):');
console.log('1. Make sure Developer Mode is enabled (see above)');
console.log('2. Right-click on your username and select "Copy User ID"');
console.log('3. Use that ID for ADMIN_USER_ID\n');

console.log('📋 Quick Setup Steps:');
console.log('1. Copy env.example to .env: cp env.example .env');
console.log('2. Replace the placeholder values with your actual IDs');
console.log('3. Install dependencies: npm install');
console.log('4. Start the bot: npm start\n');

console.log('🔗 Your bot invite link:');
console.log('https://discord.com/oauth2/authorize?client_id=1395403201804501174&permissions=8&scope=bot%20applications.commands\n');

console.log('⚠️  Important: Make sure your bot has these permissions:');
console.log('- Send Messages');
console.log('- Use Slash Commands');
console.log('- Manage Roles');
console.log('- Read Message History'); 