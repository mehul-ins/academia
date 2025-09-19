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

async function addSampleData() {
    try {
        console.log('Adding sample data...');

        // Add sample certificates
        const { data: certs, error: certsError } = await supabase
            .from('certificates')
            .insert([
                {
                    certificate_id: 'TEST123',
                    student_name: 'John Doe',
                    institution: 'Test University',
                    course_name: 'Computer Science',
                    grade: 'A+',
                    issue_date: '2024-01-15',
                    status: 'active',
                    blacklisted: false
                },
                {
                    certificate_id: 'CERT2025001',
                    student_name: 'Jane Smith',
                    institution: 'Demo College',
                    course_name: 'Data Science',
                    grade: 'A',
                    issue_date: '2024-01-20',
                    status: 'active',
                    blacklisted: false
                }
            ]);

        if (certsError) {
            console.error('Error adding certificates:', certsError);
        } else {
            console.log('✅ Sample certificates added');
        }

        // Add sample logs
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .insert([
                {
                    certificate_id: 'TEST123',
                    result: 'verified',
                    reasons: JSON.stringify(['Certificate verified successfully']),
                    created_at: new Date().toISOString()
                },
                {
                    certificate_id: 'CERT2025001',
                    result: 'verified',
                    reasons: JSON.stringify(['Certificate verified successfully']),
                    created_at: new Date().toISOString()
                }
            ]);

        if (logsError) {
            console.error('Error adding logs:', logsError);
        } else {
            console.log('✅ Sample logs added');
        }

        console.log('\n🎯 Sample data added successfully!');
        console.log('You can now test the dashboard with real data.');

    } catch (error) {
        console.error('Error:', error);
    }
}

addSampleData();
