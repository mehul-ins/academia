// Test admin API endpoints with authentication
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminEndpoints() {
    try {
        console.log('🔐 Testing admin authentication...');

        // Login as admin
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@academia.com',
            password: 'admin123'
        });

        if (loginError) {
            console.log('❌ Login failed:', loginError.message);
            return;
        }

        console.log('✅ Admin login successful');

        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            console.log('❌ No session token found');
            return;
        }

        console.log('✅ Got session token');

        // Test admin stats endpoint
        console.log('📊 Testing admin stats endpoint...');
        const http = require('http');

        const options = {
            hostname: 'localhost',
            port: 5002,
            path: '/api/admin/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Response:', data);

                if (res.statusCode === 200) {
                    console.log('✅ Admin stats endpoint working!');
                } else {
                    console.log('❌ Admin stats endpoint failed');
                }
            });
        });

        req.on('error', (err) => {
            console.log('❌ Request failed:', err.message);
        });

        req.end();

        // Sign out
        await supabase.auth.signOut();

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAdminEndpoints();