const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

class UniqueNetworkService {
    constructor() {
        this.api = null;
        this.provider = null;
        this.keyring = new Keyring({ type: 'sr25519' });
    }

    async init() {
        try {
            this.provider = new WsProvider(process.env.UNIQUE_NETWORK_ENDPOINT || 'wss://ws.unique.network');
            this.api = await ApiPromise.create({ provider: this.provider });
            
            // Handle disconnection
            this.api.on('disconnected', async () => {
                console.log('Unique Network connection lost, attempting to reconnect...');
                setTimeout(() => this.init(), 5000);
            });
            
            console.log('Connected to Unique Network');
        } catch (error) {
            console.error('Failed to connect to Unique Network:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.init(), 5000);
        }
    }

    async verifyAddress(address) {
        try {
            // Validate address format
            const isValid = this.keyring.addFromAddress(address);
            return isValid !== null;
        } catch (error) {
            console.error('Address validation error:', error);
            return false;
        }
    }

    async checkTransaction(fromAddress, toAddress, amount, blockRange = 50) {
        try {
            // Ensure API is connected
            if (!this.api || !this.api.isConnected) {
                console.log('Reconnecting to Unique Network...');
                await this.init();
            }

            const currentBlock = await this.api.rpc.chain.getHeader();
            const currentBlockNumber = currentBlock.number.toNumber();
            
            // Convert human-readable amount to raw amount (UNQ has 18 decimals)
            const UNQ_DECIMALS = 18;
            const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, UNQ_DECIMALS)).toString();
            
            console.log(`Checking blocks ${currentBlockNumber - blockRange} to ${currentBlockNumber} for transaction from ${fromAddress} to ${toAddress}`);
            console.log(`Looking for amount: ${amount} UNQ (raw: ${rawAmount})`);
            
            // Check recent blocks for the transaction
            for (let i = 0; i < blockRange; i++) {
                const blockNumber = currentBlockNumber - i;
                
                try {
                    const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
                    const block = await this.api.rpc.chain.getBlock(blockHash);
                    
                    if (!block || !block.block || !block.block.extrinsics) {
                        console.log(`Skipping block ${blockNumber} - no extrinsics found`);
                        continue;
                    }
                    
                    console.log(`Processing block ${blockNumber} with ${block.block.extrinsics.length} extrinsics`);
                    
                    for (let j = 0; j < block.block.extrinsics.length; j++) {
                        const extrinsic = block.block.extrinsics[j];
                        const extrinsicId = `${blockNumber}-${j}`;
                        
                        try {
                            const { method } = extrinsic;
                            
                            console.log(`Extrinsic ${extrinsicId}: ${method.section}.${method.method}`);
                            
                            // Check for balance transfer
                            if (method.section === 'balances' && method.method === 'transfer') {
                                const [dest, value] = method.args;
                                const destAddress = dest.toString();
                                const transferAmount = value.toString();
                                const signerAddress = extrinsic.signer ? extrinsic.signer.toString() : null;
                                
                                console.log(`Found transfer in ${extrinsicId}: ${signerAddress} -> ${destAddress} = ${transferAmount}`);
                                
                                // Check if this is the transaction we're looking for
                                if (destAddress === toAddress && 
                                    transferAmount === rawAmount &&
                                    signerAddress === fromAddress) {
                                    console.log(`✅ Transaction found in ${extrinsicId}`);
                                    return {
                                        found: true,
                                        blockNumber,
                                        extrinsicId,
                                        txHash: extrinsic.hash.toString(),
                                        amount: amount
                                    };
                                }
                            }
                            
                            // Also check for transferKeepAlive which is commonly used
                            if (method.section === 'balances' && method.method === 'transferKeepAlive') {
                                const [dest, value] = method.args;
                                const destAddress = dest.toString();
                                const transferAmount = value.toString();
                                const signerAddress = extrinsic.signer ? extrinsic.signer.toString() : null;
                                
                                console.log(`Found transferKeepAlive in ${extrinsicId}: ${signerAddress} -> ${destAddress} = ${transferAmount}`);
                                
                                // Check if this is the transaction we're looking for
                                if (destAddress === toAddress && 
                                    transferAmount === rawAmount &&
                                    signerAddress === fromAddress) {
                                    console.log(`✅ Transaction found in ${extrinsicId}`);
                                    return {
                                        found: true,
                                        blockNumber,
                                        extrinsicId,
                                        txHash: extrinsic.hash.toString(),
                                        amount: amount
                                    };
                                }
                            }
                            
                            // Also check for transferAllowDeath (newer method)
                            if (method.section === 'balances' && method.method === 'transferAllowDeath') {
                                const [dest, value] = method.args;
                                const destAddress = dest.toString();
                                const transferAmount = value.toString();
                                const signerAddress = extrinsic.signer ? extrinsic.signer.toString() : null;
                                
                                console.log(`Found transferAllowDeath in ${extrinsicId}: ${signerAddress} -> ${destAddress} = ${transferAmount}`);
                                
                                // Check if this is the transaction we're looking for
                                if (destAddress === toAddress && 
                                    transferAmount === rawAmount &&
                                    signerAddress === fromAddress) {
                                    console.log(`✅ Transaction found in ${extrinsicId}`);
                                    return {
                                        found: true,
                                        blockNumber,
                                        extrinsicId,
                                        txHash: extrinsic.hash.toString(),
                                        amount: amount
                                    };
                                }
                            }
                        } catch (extrinsicError) {
                            console.log(`Error processing extrinsic ${extrinsicId}:`, extrinsicError.message);
                            continue;
                        }
                    }
                } catch (blockError) {
                    console.log(`Error processing block ${blockNumber}:`, blockError.message);
                    continue;
                }
            }
            
            console.log(`❌ Transaction not found in the last ${blockRange} blocks`);
            return { found: false };
        } catch (error) {
            console.error('Transaction check error:', error);
            return { found: false, error: error.message };
        }
    }

    async getAccountBalance(address) {
        try {
            const account = await this.api.query.system.account(address);
            return account.data.free.toString();
        } catch (error) {
            console.error('Balance check error:', error);
            return '0';
        }
    }

    async getNFTsByOwner(address) {
        try {
            const nfts = [];
            
            // Check if API is connected
            if (!this.api || !this.api.isConnected) {
                console.log('Reconnecting to Unique Network...');
                await this.init();
            }
            
            // Query for NFT ownership
            const ownershipEntries = await this.api.query.nonfungible.ownerEntries.entries();
            
            for (const [key, owner] of ownershipEntries) {
                const ownerAddress = owner.toString();
                if (ownerAddress === address) {
                    const [collectionId, tokenId] = key.args;
                    nfts.push({
                        collectionId: collectionId.toNumber(),
                        tokenId: tokenId.toNumber(),
                        owner: ownerAddress
                    });
                }
            }
            
            return nfts;
        } catch (error) {
            console.error('NFT ownership check error:', error);
            return [];
        }
    }

    async getNFTMetadata(collectionId, tokenId) {
        try {
            const metadata = await this.api.query.nonfungible.tokenData(collectionId, tokenId);
            return metadata.toHuman();
        } catch (error) {
            console.error('NFT metadata error:', error);
            return null;
        }
    }

    async getCollectionInfo(collectionId) {
        try {
            const collection = await this.api.query.nonfungible.collection(collectionId);
            return collection.toHuman();
        } catch (error) {
            console.error('Collection info error:', error);
            return null;
        }
    }

    async disconnect() {
        if (this.api) {
            await this.api.disconnect();
        }
        if (this.provider) {
            this.provider.disconnect();
        }
    }
}

module.exports = new UniqueNetworkService(); 