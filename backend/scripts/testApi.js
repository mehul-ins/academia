#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

class APITester {
    constructor() {
        this.authToken = null;
    }

    async testEndpoint(method, endpoint, data = null, headers = {}) {
        try {
            const config = {
                method,
                url: `${BASE_URL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            console.log(`✅ ${method.toUpperCase()} ${endpoint} - Status: ${response.status}`);
            return response.data;
        } catch (error) {
            const status = error.response?.status || 'Network Error';
            const message = error.response?.data?.message || error.message;
            console.log(`❌ ${method.toUpperCase()} ${endpoint} - Status: ${status} - ${message}`);
            return null;
        }
    }

    async testHealthChecks() {
        console.log('\n🏥 Testing Health Checks...');
        await this.testEndpoint('GET', '/health');
        await this.testEndpoint('GET', '/api/health');
    }

    async testAuthentication() {
        console.log('\n🔐 Testing Authentication...');

        // Test registration
        const testUser = {
            email: 'test@example.com',
            password: 'test123',
            role: 'institution'
        };

        await this.testEndpoint('POST', '/api/auth/register', testUser);

        // Test login with admin credentials
        const adminLogin = {
            email: 'admin@academia.com',
            password: 'admin123'
        };

        const loginResponse = await this.testEndpoint('POST', '/api/auth/login', adminLogin);

        if (loginResponse && loginResponse.data.token) {
            this.authToken = loginResponse.data.token;
            console.log('🔑 Admin token acquired');

            // Test profile endpoint
            await this.testEndpoint('GET', '/api/auth/profile', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
        }
    }

    async testAdminEndpoints() {
        if (!this.authToken) {
            console.log('\n⚠️ Skipping admin tests - no auth token');
            return;
        }

        console.log('\n👑 Testing Admin Endpoints...');

        const authHeaders = { 'Authorization': `Bearer ${this.authToken}` };

        await this.testEndpoint('GET', '/api/admin/stats', null, authHeaders);
        await this.testEndpoint('GET', '/api/admin/logs', null, authHeaders);
        await this.testEndpoint('GET', '/api/admin/blacklist', null, authHeaders);
        await this.testEndpoint('GET', '/api/admin/users', null, authHeaders);

        // Test adding to blacklist
        const blacklistEntry = {
            type: 'institution',
            value: 'Fake University',
            reason: 'Test entry'
        };

        await this.testEndpoint('POST', '/api/admin/blacklist', blacklistEntry, authHeaders);
    }

    async testCertificateEndpoints() {
        if (!this.authToken) {
            console.log('\n⚠️ Skipping certificate tests - no auth token');
            return;
        }

        console.log('\n📜 Testing Certificate Endpoints...');

        const authHeaders = { 'Authorization': `Bearer ${this.authToken}` };

        await this.testEndpoint('GET', '/api/certificates', null, authHeaders);
    }

    async testVerificationEndpoints() {
        console.log('\n🔍 Testing Verification Endpoints...');

        // Test hash verification
        const hashData = {
            hash: 'sample_hash_1234567890abcdef'
        };

        await this.testEndpoint('POST', '/api/verify/hash', hashData);
    }

    async runAllTests() {
        console.log('🚀 Starting Academia Backend API Tests...\n');

        await this.testHealthChecks();
        await this.testAuthentication();
        await this.testAdminEndpoints();
        await this.testCertificateEndpoints();
        await this.testVerificationEndpoints();

        console.log('\n✨ Test suite completed!');
        console.log('\n💡 Tips:');
        console.log('   - Ensure the server is running on port 5002');
        console.log('   - Initialize database with: npm run init-db');
        console.log('   - Check detailed responses at /health endpoint');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests().catch(console.error);
}

module.exports = APITester;