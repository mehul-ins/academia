const supabase = require('../utils/supabaseClient');

async function createDemoAdmin() {
    try {
        console.log('Creating demo admin account...');

        // First, create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'admin@academia.com',
            password: 'admin123',
            email_confirm: true
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return;
        }

        console.log('Auth user created:', authData.user.id);

        // Create profile entry
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: 'admin@academia.com',
                    role: 'admin',
                    institution_name: 'Academia Admin',
                    verification_status: 'verified'
                }
            ]);

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return;
        }

        console.log('✅ Demo admin account created successfully!');
        console.log('Email: admin@academia.com');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (error) {
        console.error('Error creating demo admin:', error);
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    createDemoAdmin();
}

module.exports = createDemoAdmin;