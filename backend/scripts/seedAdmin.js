const { sequelize, User } = require('../models');

async function seedAdmin() {
    try {
        await sequelize.sync({ force: true }); // This will drop and recreate tables

        const existingAdmin = await User.findOne({ where: { email: 'admin@academia.com' } });
        if (!existingAdmin) {
            await User.create({
                email: 'admin@academia.com',
                password: 'admin123',
                role: 'admin',
            });
            console.log('✅ Admin user seeded successfully');
        } else {
            console.log('ℹ️ Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

seedAdmin();
