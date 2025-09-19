const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
// Test with anon key first
const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function setupAndTestSupabase() {
    console.log('🔧 Setting up Supabase database and testing connection...\n');

    try {
        // Test 1: Check basic connection with anon key
        console.log('1. Testing basic Supabase connection with anon key...');

        // Try to access a simple query that should work with anon key
        const { data, error } = await supabaseAnon.auth.getSession();

        if (error && !error.message.includes('session_not_found')) {
            console.error('❌ Connection failed:', error.message);
            return;
        }
        console.log('✅ Basic connection established!');

        // Test 2: Try to create the profiles table (this will likely fail with anon key, which is expected)
        console.log('\n2. Testing database access...');

        const { data: profiles, error: profilesError } = await supabaseAnon
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        if (profilesError) {
            console.log('❌ Cannot access profiles table (expected with anon key)');
            console.log('Error:', profilesError.message);
            console.log('\n📝 NEXT STEPS REQUIRED:');
            console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/project/fqvfckxwhhvwlwmqzfkl');
            console.log('2. Go to Settings → API');
            console.log('3. Copy the following and update your .env files:');
            console.log('   - service_role key (for backend SUPABASE_SERVICE_ROLE_KEY)');
            console.log('   - JWT Secret (for backend SUPABASE_JWT_SECRET)');
            console.log('4. Go to SQL Editor and run the setup script:');
            console.log('   File: backend/supabase_setup.sql');
            console.log('\n⚠️  Make sure to run the SQL setup script to create the profiles table!');
            return;
        }

        console.log('✅ Profiles table accessible!');
        console.log('✅ Database setup is complete!');

        console.log('\n🎉 Supabase basic setup is working!');
        console.log('\n📋 To complete the setup:');
        console.log('1. Get your service_role key and JWT secret from Supabase Dashboard');
        console.log('2. Update backend/.env with the service_role key and JWT secret');
        console.log('3. Run the full test: npm run test-supabase');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.log('\n📝 Please check:');
        console.log('1. Your Supabase project is running');
        console.log('2. The SUPABASE_URL and SUPABASE_ANON_KEY are correct');
        console.log('3. Your network connection is working');
    }
}

// Run the setup and test
setupAndTestSupabase().then(() => {
    console.log('\n🔍 Connection test completed.');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});