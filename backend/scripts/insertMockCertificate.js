// Script to insert a mock certificate for backend verification testing
const { sequelize, Certificate } = require('../models');

async function insertMockCertificate() {
    await sequelize.sync();
    const cert = await Certificate.findOrCreate({
        where: { certificateId: 'MOCK-CERT-001' },
        defaults: {
            studentName: 'Mock Student',
            rollNumber: 'MOCK123',
            course: 'Mock Course',
            institution: 'Mock University',
            issueDate: new Date('2024-01-01'),
            grade: 'A+',
            additionalData: 'Inserted for local AI mock testing',
            hash: '',
            onChain: false,
            status: 'active',
            blacklisted: false
        }
    });
    console.log('Inserted mock certificate:', cert[0].toJSON());
    await sequelize.close();
}

insertMockCertificate().catch(e => {
    console.error(e);
    process.exit(1);
});
