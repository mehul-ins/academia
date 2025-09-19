const { sequelize, User } = require('../models');

async function setupCleanDatabase() {
    try {
        console.log('🔄 Setting up clean database...');

        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync all models (create tables) - force: true will drop existing tables
        await sequelize.sync({ force: true });
        console.log('✅ Database tables created (all previous data cleared)');

        // Only create admin user (no sample data)
        await User.create({
            email: 'admin@academia.com',
            password: 'admin123',
            role: 'admin',
        });
        console.log('✅ Admin user created: admin@academia.com / admin123');

        console.log('\n🎉 Clean database setup complete!');
        console.log('📝 Database is ready for production use:');
        console.log('  • No dummy/sample data');
        console.log('  • Only admin user exists');
        console.log('  • Ready for real certificate data');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

setupCleanDatabase();