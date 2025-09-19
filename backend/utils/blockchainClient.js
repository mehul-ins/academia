const { ethers } = require('ethers');

class BlockchainClient {
    constructor() {
        this.rpcUrl = process.env.RPC_URL;
        this.privateKey = process.env.PRIVATE_KEY;
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.provider = null;
        this.wallet = null;
        this.contract = null;

        this.init();
    }

    init() {
        try {
            if (!this.rpcUrl || !this.privateKey || !this.contractAddress) {
                console.warn('Blockchain configuration incomplete. Some features may not work.');
                return;
            }

            this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            this.wallet = new ethers.Wallet(this.privateKey, this.provider);

            // Basic contract ABI for hash storage and verification
            const contractABI = [
                "function storeHash(string memory certId, string memory hash, string memory issuer) public",
                "function verifyHash(string memory certId, string memory hash) public view returns (bool)",
                "function getHash(string memory certId) public view returns (string memory, string memory, uint256)"
            ];

            this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
        } catch (error) {
            console.error('Failed to initialize blockchain client:', error);
        }
    }

    async storeHash(certId, hash, issuer) {
        try {
            if (!this.contract) {
                return { success: false, error: 'Blockchain client not initialized' };
            }

            const tx = await this.contract.storeHash(certId, hash, issuer);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error storing hash on blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyHash(certId, hash) {
        try {
            if (!this.contract) {
                return { success: false, error: 'Blockchain client not initialized' };
            }

            const isValid = await this.contract.verifyHash(certId, hash);
            return {
                success: true,
                isValid: isValid
            };
        } catch (error) {
            console.error('Error verifying hash on blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getHash(certId) {
        try {
            if (!this.contract) {
                return { success: false, error: 'Blockchain client not initialized' };
            }

            const [hash, issuer, timestamp] = await this.contract.getHash(certId);
            return {
                success: true,
                hash: hash,
                issuer: issuer,
                timestamp: timestamp.toString()
            };
        } catch (error) {
            console.error('Error getting hash from blockchain:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainClient();