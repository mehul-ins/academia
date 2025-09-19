const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Certificate = sequelize.define('Certificate', {
        certificateId: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        studentName: DataTypes.STRING,
        rollNumber: DataTypes.STRING,
        course: DataTypes.STRING,
        institution: DataTypes.STRING,
        issueDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        grade: DataTypes.STRING,
        additionalData: DataTypes.TEXT,
        hash: DataTypes.STRING,
        onChain: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
        },
        blacklisted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });
    return Certificate;
};
