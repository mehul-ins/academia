const supabase = require('../utils/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('Setting up database schema...');

        // Read the SQL setup file
        const sqlPath = path.join(__dirname, '..', 'supabase_setup.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements (basic splitting)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.includes('create table') || statement.includes('CREATE TABLE')) {
                console.log(`Executing statement ${i + 1}: Creating table...`);
            } else if (statement.includes('create policy') || statement.includes('CREATE POLICY')) {
                console.log(`Executing statement ${i + 1}: Creating policy...`);
            } else if (statement.includes('create function') || statement.includes('CREATE FUNCTION')) {
                console.log(`Executing statement ${i + 1}: Creating function...`);
            } else {
                console.log(`Executing statement ${i + 1}...`);
            }

            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                if (error) {
                    console.warn(`Warning on statement ${i + 1}:`, error.message);
                }
            } catch (err) {
                console.warn(`Warning on statement ${i + 1}:`, err.message);
            }
        }

        console.log('✅ Database setup completed!');

        // Test if profiles table exists
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            console.log('❌ Profiles table test failed:', error.message);
            console.log('\n🔧 Manual Setup Required:');
            console.log('Please run the SQL manually in Supabase Dashboard > SQL Editor');
            console.log('File location: backend/supabase_setup.sql');
            return false;
        } else {
            console.log('✅ Profiles table is accessible!');
            return true;
        }

    } catch (error) {
        console.error('Error setting up database:', error);
        console.log('\n🔧 Manual Setup Required:');
        console.log('Please run the SQL manually in Supabase Dashboard > SQL Editor');
        console.log('File location: backend/supabase_setup.sql');
        return false;
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;