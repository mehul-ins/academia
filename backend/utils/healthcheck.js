const express = require('express');
const { sequelize } = require('../models');
const blockchainClient = require('../utils/blockchainClient');
const axios = require('axios');

const healthcheck = {
    async checkDatabase() {
        try {
            await sequelize.authenticate();
            return { status: 'healthy', message: 'Database connection successful' };
        } catch (error) {
            return { status: 'unhealthy', message: `Database error: ${error.message}` };
        }
    },

    async checkBlockchain() {
        try {
            if (!process.env.BLOCKCHAIN_RPC_URL) {
                return { status: 'disabled', message: 'Blockchain RPC URL not configured' };
            }

            // Try to get the latest block number
            const provider = blockchainClient.getProvider();
            await provider.getBlockNumber();
            return { status: 'healthy', message: 'Blockchain connection successful' };
        } catch (error) {
            return { status: 'unhealthy', message: `Blockchain error: ${error.message}` };
        }
    },

    async checkAIService() {
        try {
            if (!process.env.AI_SERVICE_URL) {
                return { status: 'disabled', message: 'AI service URL not configured' };
            }

            const response = await axios.get(`${process.env.AI_SERVICE_URL}/health`, {
                timeout: 5000
            });

            if (response.status === 200) {
                return { status: 'healthy', message: 'AI service connection successful' };
            } else {
                return { status: 'unhealthy', message: `AI service returned status: ${response.status}` };
            }
        } catch (error) {
            return { status: 'unhealthy', message: `AI service error: ${error.message}` };
        }
    },

    async checkFileSystem() {
        try {
            const fs = require('fs').promises;
            const uploadsDir = process.env.UPLOAD_DIR || './uploads';

            // Check if uploads directory exists, create if not
            try {
                await fs.access(uploadsDir);
            } catch {
                await fs.mkdir(uploadsDir, { recursive: true });
            }

            return { status: 'healthy', message: 'File system access successful' };
        } catch (error) {
            return { status: 'unhealthy', message: `File system error: ${error.message}` };
        }
    },

    async performFullHealthCheck() {
        const checks = {
            database: await this.checkDatabase(),
            blockchain: await this.checkBlockchain(),
            aiService: await this.checkAIService(),
            fileSystem: await this.checkFileSystem()
        };

        const overallStatus = Object.values(checks).every(check =>
            check.status === 'healthy' || check.status === 'disabled'
        ) ? 'healthy' : 'unhealthy';

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };
    }
};

module.exports = healthcheck;