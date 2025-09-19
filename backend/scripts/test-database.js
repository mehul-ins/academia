const supabase = require('../utils/supabaseClient');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection and schema...');

        // Test basic connection
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (testError) {
            console.log('❌ Profiles table not found:', testError.message);
            console.log('\n📋 Please run the SQL setup manually:');
            console.log('1. Go to your Supabase Dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy and paste the content from backend/supabase_setup.sql');
            console.log('4. Click "Run" to execute');
            return false;
        } else {
            console.log('✅ Profiles table exists and is accessible!');
            console.log('✅ Database is ready for demo admin creation');
            return true;
        }

    } catch (error) {
        console.error('Connection error:', error);
        return false;
    }
}

// Export for use in other scripts
module.exports = testDatabaseConnection;

// Run if called directly
if (require.main === module) {
    testDatabaseConnection();
}