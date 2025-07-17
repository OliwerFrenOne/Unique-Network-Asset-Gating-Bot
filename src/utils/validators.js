const { Keyring } = require('@polkadot/keyring');

class Validators {
    static isValidUniqueAddress(address) {
        try {
            const keyring = new Keyring({ type: 'sr25519' });
            keyring.addFromAddress(address);
            return true;
        } catch (error) {
            return false;
        }
    }

    static isValidAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num <= 1; // Max 1 UNQ for verification
    }

    static formatAddress(address) {
        if (!address) return '';
        return address.length > 20 ? 
            `${address.substring(0, 10)}...${address.substring(address.length - 10)}` : 
            address;
    }

    static formatAmount(amount) {
        return parseFloat(amount).toFixed(6);
    }

    static isValidDiscordId(id) {
        return /^\d{17,19}$/.test(id);
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
    }

    static generateVerificationCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    static isExpired(timestamp) {
        return new Date(timestamp) < new Date();
    }

    static getTimeRemaining(expiresAt) {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        
        if (diff <= 0) return 0;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { minutes, seconds };
    }
}

module.exports = Validators; 