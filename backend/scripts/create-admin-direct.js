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

async function createAdminDirectly() {
    try {
        console.log('Creating admin profile directly with SQL...');

        // Use raw SQL to bypass RLS
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                INSERT INTO public.profiles (id, email, role, institution_name, verification_status)
                VALUES ('50a1d256-6920-4f1c-b446-4e44a08a4ec2', 'admin@academia.com', 'admin', 'Academia Admin', 'verified')
                ON CONFLICT (id) DO UPDATE SET
                    role = 'admin',
                    verification_status = 'verified',
                    institution_name = 'Academia Admin'
                RETURNING *;
            `
        });

        if (error) {
            console.error('SQL execution failed:', error);

            // Try a different approach - direct SQL execution
            console.log('Trying alternative approach...');

            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .upsert({
                    id: '50a1d256-6920-4f1c-b446-4e44a08a4ec2',
                    email: 'admin@academia.com',
                    role: 'admin',
                    institution_name: 'Academia Admin',
                    verification_status: 'verified'
                }, {
                    onConflict: 'id'
                });

            if (insertError) {
                console.error('Upsert failed:', insertError);
                return;
            }

            console.log('✅ Admin profile created via upsert!');
        } else {
            console.log('✅ Admin profile created via SQL!');
        }

        console.log('\n🎯 Demo Admin Credentials:');
        console.log('📧 Email: admin@academia.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');
        console.log('✅ Status: verified');

    } catch (error) {
        console.error('Error:', error);
    }
}

createAdminDirectly();