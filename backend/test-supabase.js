const supabase = require('./utils/supabaseClient');

async function testSupabaseConnection() {
    console.log('🧪 Testing Supabase connection...\n');

    try {
        // Test 1: Check if we can connect to Supabase
        console.log('1. Testing Supabase connection...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        if (healthError) {
            console.error('❌ Connection failed:', healthError.message);
            return;
        }
        console.log('✅ Connected to Supabase successfully!');

        // Test 2: Check if profiles table exists
        console.log('\n2. Testing profiles table...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (profilesError) {
            console.error('❌ Profiles table error:', profilesError.message);
            console.log('\n📝 You need to run the SQL setup script in Supabase SQL Editor:');
            console.log('   File: backend/supabase_setup.sql');
            return;
        }
        console.log('✅ Profiles table exists and is accessible!');

        // Test 3: Test JWT verification (mock token)
        console.log('\n3. Testing JWT secret configuration...');
        const jwt = require('jsonwebtoken');

        if (!process.env.SUPABASE_JWT_SECRET) {
            console.error('❌ SUPABASE_JWT_SECRET not configured in .env file');
            console.log('📝 Get your JWT secret from Supabase Dashboard → Settings → API');
            return;
        }

        try {
            // This will fail but shows JWT secret is configured
            jwt.verify('dummy-token', process.env.SUPABASE_JWT_SECRET);
        } catch (err) {
            if (err.message === 'jwt malformed') {
                console.log('✅ JWT secret is configured (invalid token test passed)');
            } else {
                console.error('❌ JWT secret configuration issue:', err.message);
                return;
            }
        }

        console.log('\n🎉 Supabase integration setup is complete!');
        console.log('\n📋 Next steps:');
        console.log('1. Get your actual API keys from Supabase Dashboard → Settings → API');
        console.log('2. Update the keys in both backend/.env and frontend/.env');
        console.log('3. Run the SQL setup script in Supabase SQL Editor');
        console.log('4. Test the authentication flow with your frontend');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

// Run the test
testSupabaseConnection().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});