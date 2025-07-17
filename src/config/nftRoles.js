// NFT-based role configuration
// This file defines which Discord roles should be assigned based on NFT holdings

const NFT_ROLE_CONFIG = {
    // Collection-based roles
    collections: {
        // Example: Collection ID 123 gets "Rare NFT Holder" role
        123: {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'Rare NFT Holder',
            description: 'Holders of NFTs from collection 123'
        },
        // Example: Collection ID 456 gets "Legendary Holder" role
        456: {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'Legendary Holder',
            description: 'Holders of NFTs from collection 456'
        }
    },

    // Token ID specific roles (for special NFTs)
    specialTokens: {
        // Example: Token ID 1 from collection 123 gets "Genesis Holder" role
        '123:1': {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'Genesis Holder',
            description: 'Holder of the genesis NFT'
        }
    },

    // Quantity-based roles
    quantityTiers: {
        // Users with 5+ NFTs get "NFT Collector" role
        5: {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'NFT Collector',
            description: 'Holders of 5 or more NFTs'
        },
        // Users with 10+ NFTs get "NFT Enthusiast" role
        10: {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'NFT Enthusiast',
            description: 'Holders of 10 or more NFTs'
        },
        // Users with 20+ NFTs get "NFT Master" role
        20: {
            roleId: 'YOUR_ROLE_ID_HERE',
            roleName: 'NFT Master',
            description: 'Holders of 20 or more NFTs'
        }
    }
};

// Helper functions for role assignment
class NFTRoleManager {
    static getCollectionRole(collectionId) {
        return NFT_ROLE_CONFIG.collections[collectionId];
    }

    static getSpecialTokenRole(collectionId, tokenId) {
        const key = `${collectionId}:${tokenId}`;
        return NFT_ROLE_CONFIG.specialTokens[key];
    }

    static getQuantityTierRole(nftCount) {
        const tiers = Object.keys(NFT_ROLE_CONFIG.quantityTiers)
            .map(Number)
            .sort((a, b) => b - a); // Sort descending

        for (const tier of tiers) {
            if (nftCount >= tier) {
                return NFT_ROLE_CONFIG.quantityTiers[tier];
            }
        }
        return null;
    }

    static getAllRolesForNFTs(nfts) {
        const roles = new Set();
        const nftCount = nfts.length;

        // Check collection-based roles
        for (const nft of nfts) {
            const collectionRole = this.getCollectionRole(nft.collectionId);
            if (collectionRole) {
                roles.add(collectionRole.roleId);
            }

            // Check special token roles
            const specialRole = this.getSpecialTokenRole(nft.collectionId, nft.tokenId);
            if (specialRole) {
                roles.add(specialRole.roleId);
            }
        }

        // Check quantity-based roles
        const quantityRole = this.getQuantityTierRole(nftCount);
        if (quantityRole) {
            roles.add(quantityRole.roleId);
        }

        return Array.from(roles);
    }

    static getRoleDescriptions(nfts) {
        const descriptions = [];
        const nftCount = nfts.length;

        // Collection-based descriptions
        const collections = new Set(nfts.map(nft => nft.collectionId));
        for (const collectionId of collections) {
            const role = this.getCollectionRole(collectionId);
            if (role) {
                descriptions.push(role.description);
            }
        }

        // Special token descriptions
        for (const nft of nfts) {
            const role = this.getSpecialTokenRole(nft.collectionId, nft.tokenId);
            if (role) {
                descriptions.push(role.description);
            }
        }

        // Quantity-based descriptions
        const quantityRole = this.getQuantityTierRole(nftCount);
        if (quantityRole) {
            descriptions.push(quantityRole.description);
        }

        return descriptions;
    }
}

module.exports = {
    NFT_ROLE_CONFIG,
    NFTRoleManager
}; 