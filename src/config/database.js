const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || './data/bot.db';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discord_id TEXT UNIQUE NOT NULL,
                unique_address TEXT,
                verification_status TEXT DEFAULT 'pending',
                verification_amount REAL,
                verification_expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS nft_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                collection_id INTEGER,
                token_id INTEGER,
                verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            `CREATE TABLE IF NOT EXISTS verification_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discord_id TEXT NOT NULL,
                unique_address TEXT NOT NULL,
                amount REAL NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of queries) {
            await this.run(query);
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async createVerificationAttempt(discordId, uniqueAddress, amount, expiresAt) {
        const sql = `INSERT INTO verification_attempts (discord_id, unique_address, amount, expires_at) 
                     VALUES (?, ?, ?, ?)`;
        return this.run(sql, [discordId, uniqueAddress, amount, expiresAt]);
    }

    async getUser(discordId) {
        return this.get('SELECT * FROM users WHERE discord_id = ?', [discordId]);
    }

    async createUser(discordId, uniqueAddress, amount) {
        const expiresAt = new Date(Date.now() + process.env.VERIFICATION_TIMEOUT_MINUTES * 60 * 1000);
        const sql = `INSERT INTO users (discord_id, unique_address, verification_amount, verification_expires_at) 
                     VALUES (?, ?, ?, ?)`;
        return this.run(sql, [discordId, uniqueAddress, amount, expiresAt]);
    }

    async updateUserVerification(discordId, status) {
        const sql = `UPDATE users SET verification_status = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE discord_id = ?`;
        return this.run(sql, [status, discordId]);
    }

    async getPendingVerifications() {
        return this.all(`SELECT * FROM users WHERE verification_status = 'pending' 
                        AND verification_expires_at > datetime('now')`);
    }

    async addNFTVerification(userId, collectionId, tokenId) {
        const sql = `INSERT INTO nft_verifications (user_id, collection_id, token_id) 
                     VALUES (?, ?, ?)`;
        return this.run(sql, [userId, collectionId, tokenId]);
    }

    async getUserNFTs(userId) {
        return this.all(`SELECT * FROM nft_verifications WHERE user_id = ?`, [userId]);
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = new Database(); 