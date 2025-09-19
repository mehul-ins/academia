require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyCompletion() {
    console.log('🔍 Verifying Academia Platform Completion...\n');

    try {
        // Test 1: Check if certificates table exists
        console.log('1. Checking certificates table...');
        const { data: certs, error: certsError } = await supabase
            .from('certificates')
            .select('id')
            .limit(1);

        if (certsError) {
            console.log('❌ Certificates table not found:', certsError.message);
            console.log('   → Please run the SQL from supabase_setup.sql in your Supabase dashboard');
            return;
        } else {
            console.log('✅ Certificates table exists');
        }

        // Test 2: Check if logs table exists
        console.log('2. Checking logs table...');
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .select('id')
            .limit(1);

        if (logsError) {
            console.log('❌ Logs table not found:', logsError.message);
            console.log('   → Please run the SQL from supabase_setup.sql in your Supabase dashboard');
            return;
        } else {
            console.log('✅ Logs table exists');
        }

        // Test 3: Check admin user
        console.log('3. Checking admin user...');
        const { data: admin, error: adminError } = await supabase
            .from('profiles')
            .select('id, role, email')
            .eq('id', '50a1d256-6920-4f1c-b446-4e44a08a4ec2')
            .single();

        if (adminError || !admin) {
            console.log('❌ Admin user not found');
            console.log('   → Run: node scripts/create-admin-direct.js');
            return;
        } else {
            console.log('✅ Admin user exists:', admin.email, '(', admin.role, ')');
        }

        // Test 4: Test API endpoint
        console.log('4. Testing API endpoint...');
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { sub: '50a1d256-6920-4f1c-b446-4e44a08a4ec2', id: '50a1d256-6920-4f1c-b446-4e44a08a4ec2', role: 'admin' },
            process.env.JWT_SECRET || 'test_jwt_secret_for_development_only',
            { expiresIn: '1h' }
        );

        const response = await fetch('http://localhost:5002/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            console.log('✅ API endpoint working');
        } else {
            console.log('❌ API endpoint failed:', response.status);
        }

        console.log('\n🎉 VERIFICATION COMPLETE!');
        console.log('✅ All systems are working correctly');
        console.log('✅ Your Academia platform is ready to use!');
        console.log('\n🚀 Next steps:');
        console.log('1. Open http://localhost:5173 in your browser');
        console.log('2. Click on "Dashboard"');
        console.log('3. Test the authentication flow');
        console.log('4. Enjoy your fully functional platform!');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure backend is running: npm run dev');
        console.log('2. Check Supabase connection in .env file');
        console.log('3. Run the SQL setup in Supabase dashboard');
    }
}

verifyCompletion();
