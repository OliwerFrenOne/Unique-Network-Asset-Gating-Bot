# Unique Network Asset Gating Bot

A Discord bot that verifies Unique Network wallet ownership and provides NFT-based perks and roles.

## Features

- 🔐 **Wallet Verification**: Verify Unique Network wallet ownership through micro-transactions
- 🖼️ **NFT Detection**: Automatically detect and verify NFT holdings
- 🎭 **Role Management**: Assign Discord roles based on verification status and NFT ownership
- ⏰ **Time-based Verification**: 60-minute verification windows with automatic cleanup
- 🛡️ **Admin Controls**: Admin-only commands for role configuration
- 📊 **Status Tracking**: Check verification status and NFT holdings

## How It Works

1. **Wallet Verification Process**:
   - User runs `/verifyunq <address>` command
   - Bot validates the Unique Network address format
   - Bot requests a micro-transaction (0.001 UNQ) to the same address
   - User transfers the exact amount to themselves
   - Bot verifies the transaction on-chain
   - Upon successful verification, user receives verification role

2. **NFT-based Perks**:
   - Verified users can run `/checknfts` to scan their NFT holdings
   - Bot detects all NFTs owned by the verified address
   - Additional roles/perks can be assigned based on specific collections or token IDs

## Commands

### User Commands
- `/verifyunq <address>` - Start wallet verification process
- `/checknfts [address]` - Check NFT holdings (address optional if already verified)
- `/status` - Check your verification status and perks

### Admin Commands
- `/admin-setrole <role>` - Set the verification role (Admin only)

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Discord Bot Token
- Unique Network RPC endpoint access

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Unique-Network-Asset-Gating-Bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables**:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   DISCORD_GUILD_ID=your_discord_guild_id_here

   # Unique Network Configuration
   UNIQUE_NETWORK_ENDPOINT=wss://ws.unique.network
   UNIQUE_NETWORK_CHAIN_ID=unique

   # Bot Configuration
   VERIFICATION_AMOUNT=0.001
   VERIFICATION_TIMEOUT_MINUTES=60
   ADMIN_USER_ID=your_admin_user_id_here

   # Database Configuration
   DATABASE_PATH=./data/bot.db
   ```

5. **Create data directory**:
   ```bash
   mkdir -p data
   ```

6. **Start the bot**:
   ```bash
   npm start
   ```

## Discord Bot Setup

1. **Create a Discord Application**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the bot token

2. **Invite the Bot**:
   - Go to OAuth2 > URL Generator
   - Select "bot" scope
   - Select required permissions:
     - Send Messages
     - Use Slash Commands
     - Manage Roles
     - Read Message History
   - Use the generated URL to invite the bot

3. **Configure Bot Permissions**:
   - Ensure the bot has permission to manage roles
   - The bot role should be higher than the roles it needs to assign

## Architecture

### Core Components

- **Discord Bot Service** (`src/services/discordBot.js`): Handles Discord interactions and commands
- **Unique Network Service** (`src/services/uniqueNetwork.js`): Manages blockchain interactions
- **Database Service** (`src/config/database.js`): SQLite database for user data and verification tracking

### Database Schema

- **users**: Stores user verification status and wallet addresses
- **nft_verifications**: Tracks verified NFT holdings
- **verification_attempts**: Manages active verification sessions

## Configuration

### Verification Amount
Set the verification amount in the `.env` file:
```env
VERIFICATION_AMOUNT=0.001
```

### Timeout Duration
Configure verification timeout:
```env
VERIFICATION_TIMEOUT_MINUTES=60
```

### NFT-based Role Logic
Customize NFT role assignment in `src/services/discordBot.js`:
```javascript
async applyNFTRoles(guild, discordId, nfts) {
    // Implement your custom logic here
    // Example: Assign roles based on collection IDs
    for (const nft of nfts) {
        if (nft.collectionId === 123) {
            // Assign special role for collection 123
        }
    }
}
```

## Security Considerations

- **Micro-transaction Verification**: Uses small amounts to prevent abuse
- **Time-limited Sessions**: Verification attempts expire automatically
- **Address Validation**: Validates Unique Network address format
- **Transaction Verification**: Confirms transactions on-chain
- **Admin-only Commands**: Sensitive operations require admin privileges

## Troubleshooting

### Common Issues

1. **Bot not responding to commands**:
   - Check bot permissions in Discord
   - Verify bot token is correct
   - Ensure bot is online

2. **Verification failing**:
   - Check Unique Network connection
   - Verify transaction amount matches exactly
   - Ensure transaction is to the same address

3. **Database errors**:
   - Check data directory permissions
   - Verify database path in environment

### Logs
The bot provides detailed console logs for debugging:
- Connection status
- Command processing
- Verification attempts
- Error details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review Discord.js and Unique Network documentation

## Roadmap

- [ ] Webhook notifications for verification events
- [ ] Advanced NFT filtering and role assignment
- [ ] Multi-chain support
- [ ] Analytics dashboard
- [ ] Automated role cleanup
- [ ] Integration with other blockchain networks