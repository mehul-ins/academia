const { sequelize, User, Certificate, Log } = require('../models');

async function seedSampleData() {
    try {
        // Create a regular user
        const user = await User.create({
            email: 'user@test.com',
            password: 'password123',
            role: 'institution',
        });

        // Create sample certificates
        const certificates = [
            {
                certificateId: 'CERT001',
                studentName: 'John Doe',
                rollNumber: 'CS2021001',
                course: 'Computer Science',
                institution: 'Tech University',
                grade: 'A+',
                status: 'active',
                blacklisted: false
            },
            {
                certificateId: 'CERT002',
                studentName: 'Jane Smith',
                rollNumber: 'EE2021002',
                course: 'Electrical Engineering',
                institution: 'Engineering College',
                grade: 'A',
                status: 'active',
                blacklisted: false
            },
            {
                certificateId: 'CERT003',
                studentName: 'Bob Wilson',
                rollNumber: 'ME2021003',
                course: 'Mechanical Engineering',
                institution: 'Tech University',
                grade: 'B+',
                status: 'active',
                blacklisted: true
            }
        ];

        await Certificate.bulkCreate(certificates);

        // Create sample verification logs
        const logs = [
            {
                userId: user.id,
                certificateId: 'CERT001',
                result: 'verified',
                reasons: JSON.stringify(['Certificate is valid'])
            },
            {
                userId: user.id,
                certificateId: 'CERT002',
                result: 'verified',
                reasons: JSON.stringify(['Certificate is valid'])
            },
            {
                userId: null,
                certificateId: 'CERT999',
                result: 'failed',
                reasons: JSON.stringify(['Certificate not found in database'])
            }
        ];

        await Log.bulkCreate(logs);

        console.log('✅ Sample data seeded successfully');
        console.log('📊 Created:');
        console.log('  - 1 regular user');
        console.log('  - 3 certificates');
        console.log('  - 3 verification logs');

    } catch (error) {
        console.error('❌ Error seeding sample data:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

seedSampleData();