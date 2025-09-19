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

async function checkExistingUsers() {
    try {
        console.log('Checking existing users...');

        // Check if admin profile exists
        const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'admin@academia.com')
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking admin profile:', profileError);
            return;
        }

        if (adminProfile) {
            console.log('✅ Admin profile already exists:');
            console.log('Email:', adminProfile.email);
            console.log('Role:', adminProfile.role);
            console.log('Status:', adminProfile.verification_status);
            console.log('\n🎯 Demo Admin Credentials:');
            console.log('📧 Email: admin@academia.com');
            console.log('🔑 Password: admin123');
            console.log('👤 Role: admin');
        } else {
            console.log('❌ Admin profile not found');
            console.log('Need to create profile entry...');

            // Try to get the auth user ID for admin@academia.com
            console.log('Attempting to create profile for existing auth user...');

            // We'll need to sign in as the user to get their ID
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: 'admin@academia.com',
                password: 'admin123'
            });

            if (signInError) {
                console.error('Cannot sign in as admin user:', signInError.message);
                return;
            }

            console.log('Found admin user ID:', signInData.user.id);

            // Create the profile
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: signInData.user.id,
                        email: 'admin@academia.com',
                        role: 'admin',
                        institution_name: 'Academia Admin',
                        verification_status: 'verified'
                    }
                ]);

            if (insertError) {
                console.error('Error creating profile:', insertError);
                return;
            }

            console.log('✅ Admin profile created successfully!');
            console.log('\n🎯 Demo Admin Credentials:');
            console.log('📧 Email: admin@academia.com');
            console.log('🔑 Password: admin123');
            console.log('👤 Role: admin');

            // Sign out
            await supabase.auth.signOut();
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
checkExistingUsers();