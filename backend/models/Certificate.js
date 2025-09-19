const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Certificate = sequelize.define('Certificate', {
        certificateId: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        institutionId: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'instituteId'
            }
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
        // Additional fields for enhanced certificate management
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ocrData: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        verificationCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastVerified: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    });
    return Certificate;
};
