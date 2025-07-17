const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const database = require('../config/databaseMongo');
const uniqueNetwork = require('./uniqueNetwork');
const cron = require('node-cron');

class DiscordBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`Bot logged in as ${this.client.user.tag}`);
            this.registerCommands();
            this.startVerificationChecker();
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                await this.handleCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
        });
    }

    async registerCommands() {
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

        try {
            await this.client.application.commands.set(commands);
            console.log('Slash commands registered');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    async handleCommand(interaction) {
        const { commandName } = interaction;

        try {
            switch (commandName) {
                case 'verifyunq':
                    await this.handleVerifyCommand(interaction);
                    break;
                case 'checknfts':
                    await this.handleCheckNFTsCommand(interaction);
                    break;
                case 'status':
                    await this.handleStatusCommand(interaction);
                    break;
                case 'admin-setrole':
                    await this.handleAdminSetRoleCommand(interaction);
                    break;
                case 'sync-role':
                    await this.handleSyncRoleCommand(interaction);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown command', flags: 64 }); // ephemeral flag
            }
        } catch (error) {
            console.error('Command handling error:', error);
            await interaction.reply({ 
                content: 'An error occurred while processing your command.', 
                flags: 64 // ephemeral flag
            });
        }
    }

    async handleVerifyCommand(interaction) {
        const address = interaction.options.getString('address');
        const discordId = interaction.user.id;
        
        const existingUser = await database.getUser(discordId);
        if (existingUser && existingUser.verification_status === 'verified') {
            await interaction.reply({
                content: '✅ You are already verified!',
                flags: 64 // ephemeral flag
            });
            return;
        }

        // Validate address
        const isValidAddress = await uniqueNetwork.verifyAddress(address);
        if (!isValidAddress) {
            await interaction.reply({
                content: '❌ Invalid Unique Network address format. Please provide a valid address.',
                flags: 64 // ephemeral flag
            });
            return;
        }

        // Generate verification amount
        const verificationAmount = parseFloat(process.env.VERIFICATION_AMOUNT || '0.001');
        const expiresAt = new Date(Date.now() + (process.env.VERIFICATION_TIMEOUT_MINUTES || 60) * 60 * 1000);

        // Create verification attempt
        await database.createVerificationAttempt(discordId, address, verificationAmount, expiresAt);

        const embed = new EmbedBuilder()
            .setTitle('🔐 Unique Network Wallet Verification')
            .setDescription(`To verify your wallet ownership, please transfer **${verificationAmount} UNQ** to yourself.`)
            .addFields(
                { name: 'Your Address', value: address, inline: true },
                { name: 'Amount to Transfer', value: `${verificationAmount} UNQ`, inline: true },
                { name: 'Time Limit', value: `${process.env.VERIFICATION_TIMEOUT_MINUTES || 60} minutes`, inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_check')
                    .setLabel('I\'ve Made the Transfer')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [button],
            flags: 64 // ephemeral flag
        });
    }

    async handleCheckNFTsCommand(interaction) {
        const address = interaction.options.getString('address');
        const discordId = interaction.user.id;

        let userAddress = address;
        
        if (!userAddress) {
            // Get address from database if user is verified
            const user = await database.getUser(discordId);
            if (!user || user.verification_status !== 'verified') {
                await interaction.reply({
                    content: '❌ You need to be verified first or provide an address. Use `/verifyunq` to verify your wallet.',
                    flags: 64 // ephemeral flag
                });
                return;
            }
            userAddress = user.unique_address;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const nfts = await uniqueNetwork.getNFTsByOwner(userAddress);
            
            if (nfts.length === 0) {
                await interaction.editReply({
                    content: '📭 No NFTs found for this address.'
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🖼️ Your NFT Collection')
                .setDescription(`Found **${nfts.length}** NFTs for address: ${userAddress}`)
                .setColor('#ff6b6b');

            // Add first few NFTs to embed
            for (let i = 0; i < Math.min(nfts.length, 5); i++) {
                const nft = nfts[i];
                embed.addFields({
                    name: `NFT #${i + 1}`,
                    value: `Collection: ${nft.collectionId}\nToken ID: ${nft.tokenId}`,
                    inline: true
                });
            }

            if (nfts.length > 5) {
                embed.setFooter({ text: `And ${nfts.length - 5} more NFTs...` });
            }

            await interaction.editReply({ embeds: [embed] });

            // Apply NFT-based roles if user is verified
            if (await this.shouldApplyNFTRoles(discordId)) {
                await this.applyNFTRoles(interaction.guild, discordId, nfts);
                
                // Store NFT verifications in database
                const user = await database.collections.users.findOne({ discord_id: discordId });
                if (user) {
                    for (const nft of nfts) {
                        await database.collections.nftVerifications.insertOne({
                            user_id: user._id,
                            collection_id: nft.collectionId,
                            token_id: nft.tokenId,
                            verified_at: new Date()
                        });
                    }
                }
            }

        } catch (error) {
            console.error('NFT check error:', error);
            await interaction.editReply({
                content: '❌ Error checking NFTs. Please try again later.'
            });
        }
    }

    async handleStatusCommand(interaction) {
        const discordId = interaction.user.id;
        const user = await database.getUser(discordId);

        if (!user) {
            await interaction.reply({
                content: '❌ You haven\'t started verification yet. Use `/verifyunq` to begin.',
                flags: 64 // ephemeral flag
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Verification Status')
            .setColor(user.verification_status === 'verified' ? '#00ff00' : '#ffaa00')
            .addFields(
                { name: 'Status', value: user.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending', inline: true },
                { name: 'Address', value: user.unique_address, inline: true },
                { name: 'Verified At', value: user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Not verified yet', inline: true }
            );

        if (user.verification_status === 'verified') {
            const nfts = await database.getUserNFTs(user._id);
            embed.addFields({
                name: 'NFTs Verified',
                value: nfts.length.toString(),
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed], flags: 64 }); // ephemeral flag
    }

    async handleAdminSetRoleCommand(interaction) {
        // Check if user is admin
        if (interaction.user.id !== process.env.ADMIN_USER_ID) {
            await interaction.reply({
                content: '❌ You don\'t have permission to use this command.',
                flags: 64 // ephemeral flag
            });
            return;
        }

        const role = interaction.options.getRole('role');
        
        // Store the role ID in environment or database
        process.env.VERIFICATION_ROLE_ID = role.id;
        
        await interaction.reply({
            content: `✅ Verification role set to ${role.name}`,
            flags: 64 // ephemeral flag
        });
    }

    async handleSyncRoleCommand(interaction) {
        // Check if user is admin
        if (interaction.user.id !== process.env.ADMIN_USER_ID) {
            await interaction.reply({
                content: '❌ You don\'t have permission to use this command.',
                flags: 64 // ephemeral flag
            });
            return;
        }

        const roleId = process.env.VERIFICATION_ROLE_ID;
        if (!roleId) {
            await interaction.reply({
                content: '❌ No verification role configured. Please use `/admin-setrole` first.',
                flags: 64 // ephemeral flag
            });
            return;
        }

        await interaction.deferReply({ flags: 64 }); // ephemeral flag

        try {
            const role = await interaction.guild.roles.fetch(roleId);
            if (!role) {
                await interaction.editReply({
                    content: `❌ Role with ID ${roleId} not found in this guild.`
                });
                return;
            }

            // Get all verified users from database
            const verifiedUsers = await database.collections.users.find({
                verification_status: 'verified'
            }).toArray();

            console.log('Verified user Discord IDs:', verifiedUsers.map(u => u.discord_id));
            console.log(`Found ${verifiedUsers.length} verified users to sync roles for`);

            let successCount = 0;
            let alreadyHasRoleCount = 0;
            let errorCount = 0;

            for (const user of verifiedUsers) {
                try {
                    const member = await interaction.guild.members.fetch(user.discord_id).catch(() => undefined);
                    if (member === null || member === undefined || !member.roles) {
                        errorCount++;
                        console.error(`User with Discord ID ${user.discord_id} not found in guild or has no roles, skipping. member=`, member);
                        continue;
                    }
                    if (member.roles.cache.has(roleId)) {
                        alreadyHasRoleCount++;
                        console.log(`User ${member.user.tag} already has the verification role`);
                    } else {
                        await member.roles.add(role);
                        successCount++;
                        console.log(`✅ Assigned verification role to ${member.user.tag}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Error syncing role for user ${user.discord_id}:`, error.message);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🔄 Role Sync Complete')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Total Verified Users', value: verifiedUsers.length.toString(), inline: true },
                    { name: 'Roles Assigned', value: successCount.toString(), inline: true },
                    { name: 'Already Had Role', value: alreadyHasRoleCount.toString(), inline: true },
                    { name: 'Errors', value: errorCount.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('Error in sync role command:', error);
            await interaction.editReply({
                content: '❌ Error syncing roles. Please check the console for details.'
            });
        }
    }

    async handleButton(interaction) {
        if (interaction.customId === 'verify_check') {
            await this.handleVerificationCheck(interaction);
        }
    }

    async handleVerificationCheck(interaction) {
        const discordId = interaction.user.id;
        
        await interaction.deferUpdate();

        try {
            // Get the verification attempt
            const verificationAttempt = await database.get('SELECT * FROM verification_attempts WHERE discord_id = ? AND expires_at > ?', [discordId, new Date()]);

            if (!verificationAttempt) {
                await interaction.followUp({
                    content: '❌ No active verification found or verification expired. Please start a new verification.',
                    flags: 64 // ephemeral flag
                });
                return;
            }

            // Check for the transaction
            const transaction = await uniqueNetwork.checkTransaction(
                verificationAttempt.unique_address,
                verificationAttempt.unique_address,
                verificationAttempt.amount
            );

            if (transaction.found) {
                // Create or update user
                const existingUser = await database.getUser(discordId);
                if (existingUser) {
                    await database.updateUserVerification(discordId, 'verified');
                } else {
                    await database.createUser(discordId, verificationAttempt.unique_address, verificationAttempt.amount);
                    await database.updateUserVerification(discordId, 'verified');
                }

                // Apply verification role
                await this.applyVerificationRole(interaction.guild, discordId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Verification Successful!')
                    .setDescription('Your wallet has been verified successfully.')
                    .addFields(
                        { name: 'Transaction Hash', value: transaction.txHash, inline: true },
                        { name: 'Block Number', value: transaction.blockNumber.toString(), inline: true }
                    )
                    .setColor('#00ff00');

                await interaction.followUp({
                    embeds: [embed],
                    flags: 64 // ephemeral flag
                });
            } else {
                await interaction.followUp({
                    content: '❌ Transaction not found. Please make sure you transferred the exact amount to yourself and try again.',
                    flags: 64 // ephemeral flag
                });
            }
        } catch (error) {
            console.error('Verification check error:', error);
            await interaction.followUp({
                content: '❌ Error checking verification. Please try again later.',
                flags: 64 // ephemeral flag
            });
        }
    }

    async applyVerificationRole(guild, discordId) {
        const roleId = process.env.VERIFICATION_ROLE_ID;
        console.log(`Attempting to apply verification role. Role ID: ${roleId}, User ID: ${discordId}`);
        
        if (!roleId) {
            console.log('❌ No verification role ID configured. Please use /admin-setrole to set a verification role.');
            return;
        }

        try {
            const member = await guild.members.fetch(discordId);
            const role = await guild.roles.fetch(roleId);
            
            console.log(`Member found: ${member.user.tag}, Role found: ${role ? role.name : 'Not found'}`);
            
            if (!role) {
                console.log(`❌ Role with ID ${roleId} not found in guild`);
                return;
            }
            
            if (member.roles.cache.has(roleId)) {
                console.log(`✅ User ${member.user.tag} already has the verification role`);
                return;
            }
            
            await member.roles.add(role);
            console.log(`✅ Successfully assigned verification role "${role.name}" to ${member.user.tag}`);
        } catch (error) {
            console.error('❌ Error applying verification role:', error);
        }
    }

    async shouldApplyNFTRoles(discordId) {
        const user = await database.getUser(discordId);
        return user && user.verification_status === 'verified';
    }

    async applyNFTRoles(guild, discordId, nfts) {
        // This is a placeholder for NFT-specific role logic
        // You can implement custom logic based on collection IDs, token IDs, etc.
        console.log(`Applying NFT roles for user ${discordId} with ${nfts.length} NFTs`);
    }

    startVerificationChecker() {
        // Check for expired verifications every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                const expiredVerifications = await database.all('SELECT * FROM verification_attempts WHERE expires_at <= ?', [new Date()]);

                for (const verification of expiredVerifications) {
                    // Clean up expired verifications
                    await database.run('DELETE FROM verification_attempts WHERE id = ?', [verification.id]);
                }
            } catch (error) {
                console.error('Verification checker error:', error);
            }
        });
    }

    async login() {
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}

module.exports = new DiscordBot(); 