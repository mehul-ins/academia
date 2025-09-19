require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
    try {
        console.log('Testing admin login...');

        // Test login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@academia.com',
            password: 'admin123'
        });

        if (loginError) {
            console.error('❌ Login failed:', loginError.message);
            return;
        }

        console.log('✅ Login successful!');
        console.log('User ID:', loginData.user.id);
        console.log('Email:', loginData.user.email);

        // Test profile access
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', loginData.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile access failed:', profileError);
            return;
        }

        console.log('✅ Profile access successful!');
        console.log('Role:', profileData.role);
        console.log('Institution:', profileData.institution_name);
        console.log('Status:', profileData.verification_status);

        // Test admin permissions (view all profiles)
        const { data: allProfiles, error: allProfilesError } = await supabase
            .from('profiles')
            .select('email, role, verification_status');

        if (allProfilesError) {
            console.error('❌ Admin access failed:', allProfilesError);
        } else {
            console.log('✅ Admin permissions working!');
            console.log('Can view all profiles:', allProfiles.length, 'profiles found');
        }

        // Sign out
        await supabase.auth.signOut();
        console.log('✅ Sign out successful');

        console.log('\n🎉 SETUP COMPLETE!');
        console.log('\n🚀 Ready to test:');
        console.log('1. Start the frontend: npm run dev (in frontend folder)');
        console.log('2. Start the backend: npm run dev (in backend folder)');
        console.log('3. Go to http://localhost:5173');
        console.log('4. Click "Login" and use:');
        console.log('   📧 Email: admin@academia.com');
        console.log('   🔑 Password: admin123');

    } catch (error) {
        console.error('Test error:', error);
    }
}

testAdminLogin();