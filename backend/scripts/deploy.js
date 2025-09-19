#!/usr/bin/env node

/**
 * Comprehensive deployment and testing script for Academia Backend
 * This script helps with database setup, dependency installation, and system validation
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class DeploymentManager {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            progress: '🔄'
        };

        console.log(`${icons[type]} [${timestamp}] ${message}`);
    }

    async checkPrerequisites() {
        this.log('Checking prerequisites...', 'progress');

        try {
            // Check Node.js version
            const { stdout: nodeVersion } = await execAsync('node --version');
            this.log(`Node.js version: ${nodeVersion.trim()}`, 'info');

            // Check npm version
            const { stdout: npmVersion } = await execAsync('npm --version');
            this.log(`npm version: ${npmVersion.trim()}`, 'info');

            // Check if PostgreSQL is available
            try {
                await execAsync('psql --version');
                this.log('PostgreSQL is available', 'success');
            } catch {
                this.log('PostgreSQL not found. Please install PostgreSQL', 'warning');
            }

            // Check if .env file exists
            try {
                await fs.access('.env');
                this.log('.env file found', 'success');
            } catch {
                this.log('.env file not found. Please create one based on .env.example', 'warning');
            }

            this.log('Prerequisites check completed', 'success');

        } catch (error) {
            this.log(`Prerequisites check failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async installDependencies() {
        this.log('Installing dependencies...', 'progress');

        try {
            const { stdout } = await execAsync('npm install');
            this.log('Dependencies installed successfully', 'success');
            return stdout;
        } catch (error) {
            this.log(`Dependency installation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async setupDatabase() {
        this.log('Setting up database...', 'progress');

        try {
            const { stdout } = await execAsync('npm run init-db');
            this.log('Database initialized successfully', 'success');
            return stdout;
        } catch (error) {
            this.log(`Database setup failed: ${error.message}`, 'error');
            this.log('Please ensure PostgreSQL is running and DATABASE_URL is correctly configured', 'warning');
            throw error;
        }
    }

    async runTests() {
        this.log('Running API tests...', 'progress');

        try {
            // Start server in background for testing
            this.log('Starting server for testing...', 'progress');
            const serverProcess = exec('npm start');

            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));

            try {
                const { stdout } = await execAsync('npm run test-api');
                this.log('API tests completed successfully', 'success');
                return stdout;
            } finally {
                // Kill the server process
                serverProcess.kill();
                this.log('Test server stopped', 'info');
            }

        } catch (error) {
            this.log(`API tests failed: ${error.message}`, 'warning');
            // Don't throw error for tests, just warn
            return null;
        }
    }

    async validateConfiguration() {
        this.log('Validating configuration...', 'progress');

        try {
            // Load environment variables
            require('dotenv').config();

            // Check required environment variables
            const requiredEnvVars = [
                'DATABASE_URL',
                'JWT_SECRET',
                'PORT'
            ];

            const missingVars = [];

            for (const envVar of requiredEnvVars) {
                if (!process.env[envVar]) {
                    missingVars.push(envVar);
                }
            }

            if (missingVars.length > 0) {
                this.log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
                throw new Error('Configuration validation failed');
            }

            // Check optional but recommended variables
            const optionalVars = [
                'AI_SERVICE_URL',
                'RPC_URL',
                'PRIVATE_KEY',
                'CONTRACT_ADDRESS'
            ];

            const missingOptional = [];
            for (const envVar of optionalVars) {
                if (!process.env[envVar]) {
                    missingOptional.push(envVar);
                }
            }

            if (missingOptional.length > 0) {
                this.log(`Optional environment variables not set: ${missingOptional.join(', ')}`, 'warning');
                this.log('Some features may not work without these variables', 'warning');
            }

            this.log('Configuration validation completed', 'success');

        } catch (error) {
            this.log(`Configuration validation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateReport() {
        this.log('Generating deployment report...', 'progress');

        const report = {
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            workingDirectory: process.cwd(),
            environment: process.env.NODE_ENV || 'development',
            port: process.env.PORT || '5002',
            database: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
            aiService: process.env.AI_SERVICE_URL ? 'Configured' : 'Not configured',
            blockchain: process.env.RPC_URL ? 'Configured' : 'Not configured',
            recommendations: []
        };

        // Add recommendations based on configuration
        if (!process.env.AI_SERVICE_URL) {
            report.recommendations.push('Configure AI_SERVICE_URL for certificate OCR analysis');
        }

        if (!process.env.RPC_URL) {
            report.recommendations.push('Configure blockchain settings for certificate hash verification');
        }

        if (process.env.JWT_SECRET === 'supersecret' || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
            report.recommendations.push('Change default JWT_SECRET for production');
        }

        if (process.env.NODE_ENV !== 'production') {
            report.recommendations.push('Set NODE_ENV=production for production deployment');
        }

        const reportPath = path.join(process.cwd(), 'deployment-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        this.log(`Deployment report saved to: ${reportPath}`, 'success');
        return report;
    }

    async deploy() {
        try {
            this.log('🚀 Starting Academia Backend deployment...', 'info');

            await this.checkPrerequisites();
            await this.validateConfiguration();
            await this.installDependencies();
            await this.setupDatabase();

            const report = await this.generateReport();

            // Try to run tests (non-blocking)
            const testResults = await this.runTests();

            this.log('\n📊 Deployment Summary:', 'success');
            this.log('✅ Prerequisites checked', 'success');
            this.log('✅ Dependencies installed', 'success');
            this.log('✅ Database initialized', 'success');
            this.log('✅ Configuration validated', 'success');

            if (testResults) {
                this.log('✅ API tests passed', 'success');
            } else {
                this.log('⚠️ API tests skipped or failed', 'warning');
            }

            this.log('\n🎉 Deployment completed successfully!', 'success');
            this.log('\n📋 Next steps:', 'info');
            this.log('1. Start the server: npm start', 'info');
            this.log('2. Access health check: http://localhost:5002/health', 'info');

            if (report.recommendations.length > 0) {
                this.log('\n💡 Recommendations:', 'warning');
                report.recommendations.forEach(rec => this.log(`• ${rec}`, 'warning'));
            }

        } catch (error) {
            this.log(`❌ Deployment failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Quick setup command
async function quickSetup() {
    const deployer = new DeploymentManager();

    try {
        deployer.log('🏃‍♂️ Running quick setup...', 'info');
        await deployer.installDependencies();
        await deployer.setupDatabase();
        deployer.log('✅ Quick setup completed!', 'success');
        deployer.log('Run "npm start" to start the server', 'info');
    } catch (error) {
        deployer.log(`❌ Quick setup failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Health check command
async function healthCheck() {
    const deployer = new DeploymentManager();

    try {
        deployer.log('🏥 Running health check...', 'info');
        await deployer.checkPrerequisites();
        await deployer.validateConfiguration();
        deployer.log('✅ System is healthy!', 'success');
    } catch (error) {
        deployer.log(`❌ Health check failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'quick':
            quickSetup();
            break;
        case 'health':
            healthCheck();
            break;
        case 'deploy':
        default:
            const deployer = new DeploymentManager();
            deployer.deploy();
            break;
    }
}

module.exports = { DeploymentManager };