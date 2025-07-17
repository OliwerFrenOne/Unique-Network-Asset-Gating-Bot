const { MongoClient } = require('mongodb');

class MongoDB {
    constructor() {
        this.client = null;
        this.db = null;
        this.collections = {};
    }

    async init() {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            const dbName = process.env.MONGODB_DB_NAME || 'unique_bot';
            
            console.log('Connecting to MongoDB:', uri);
            console.log('Database name:', dbName);
            
            this.client = new MongoClient(uri);
            await this.client.connect();
            
            this.db = this.client.db(dbName);
            
            // Initialize collections
            this.collections.users = this.db.collection('users');
            this.collections.nftVerifications = this.db.collection('nft_verifications');
            this.collections.verificationAttempts = this.db.collection('verification_attempts');
            
            console.log('Collections initialized:', Object.keys(this.collections));
            
            // Create indexes
            await this.collections.users.createIndex({ discord_id: 1 }, { unique: true });
            await this.collections.verificationAttempts.createIndex({ discord_id: 1 });
            await this.collections.verificationAttempts.createIndex({ expires_at: 1 });
            
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    async createVerificationAttempt(discordId, uniqueAddress, amount, expiresAt) {
        const doc = {
            discord_id: discordId,
            unique_address: uniqueAddress,
            amount: amount,
            expires_at: expiresAt,
            created_at: new Date()
        };
        
        const result = await this.collections.verificationAttempts.insertOne(doc);
        return { id: result.insertedId, changes: 1 };
    }

    async getUser(discordId) {
        return await this.collections.users.findOne({ discord_id: discordId });
    }

    async createUser(discordId, uniqueAddress, amount) {
        const expiresAt = new Date(Date.now() + process.env.VERIFICATION_TIMEOUT_MINUTES * 60 * 1000);
        const doc = {
            discord_id: discordId,
            unique_address: uniqueAddress,
            verification_amount: amount,
            verification_expires_at: expiresAt,
            verification_status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await this.collections.users.insertOne(doc);
        return { id: result.insertedId, changes: 1 };
    }

    async updateUserVerification(discordId, status) {
        const result = await this.collections.users.updateOne(
            { discord_id: discordId },
            { 
                $set: { 
                    verification_status: status, 
                    updated_at: new Date() 
                } 
            }
        );
        return { changes: result.modifiedCount };
    }

    async getPendingVerifications() {
        return await this.collections.users.find({
            verification_status: 'pending',
            verification_expires_at: { $gt: new Date() }
        }).toArray();
    }

    async addNFTVerification(userId, collectionId, tokenId) {
        const doc = {
            user_id: userId,
            collection_id: collectionId,
            token_id: tokenId,
            verified_at: new Date()
        };
        
        const result = await this.collections.nftVerifications.insertOne(doc);
        return { id: result.insertedId, changes: 1 };
    }

    async getUserNFTs(userId) {
        return await this.collections.nftVerifications.find({ user_id: userId }).toArray();
    }

    async get(sql, params = []) {
        // MongoDB doesn't use SQL, but keeping interface consistent
        if (sql.includes('verification_attempts') && sql.includes('discord_id')) {
            return await this.collections.verificationAttempts.findOne({
                discord_id: params[0],
                expires_at: { $gt: new Date() }
            });
        }
        return null;
    }

    async all(sql, params = []) {
        // MongoDB doesn't use SQL, but keeping interface consistent
        if (sql.includes('verification_attempts') && sql.includes('expires_at')) {
            return await this.collections.verificationAttempts.find({
                expires_at: { $lte: new Date() }
            }).toArray();
        }
        return [];
    }

    async run(sql, params = []) {
        // MongoDB doesn't use SQL, but keeping interface consistent
        if (sql.includes('DELETE FROM verification_attempts')) {
            const result = await this.collections.verificationAttempts.deleteOne({ _id: params[0] });
            return { changes: result.deletedCount };
        }
        return { changes: 0 };
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = new MongoDB(); 