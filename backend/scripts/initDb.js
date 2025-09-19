const { sequelize, Certificate, Log } = require('../models');

async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');

        // Sync database (create tables)
        console.log('📊 Syncing database tables...');
        await sequelize.sync({ force: true }); // Warning: This will drop existing tables
        console.log('✅ Database tables created successfully');

        // Create sample data (optional)
        console.log('📝 Creating sample data...');

        // Sample certificate
        const sampleCert = await Certificate.create({
            certId: 'SAMPLE001',
            name: 'John Doe',
            roll: 'SAMP2023001',
            course: 'Computer Science',
            institution: 'Sample University',
            hash: 'sample_hash_1234567890abcdef',
            onChain: false,
            status: 'active'
        });

        // Sample log entry
        await Log.create({
            certId: 'SAMPLE001',
            result: 'valid',
            reasons: JSON.stringify(['Certificate found in database']),
            certificateId: sampleCert.id
        });

        console.log('✅ Sample data created successfully');

        console.log('\n🎉 Database initialization completed!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };