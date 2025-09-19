const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Certificate = sequelize.define('Certificate', {
        certId: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        name: DataTypes.STRING,
        roll: DataTypes.STRING,
        course: DataTypes.STRING,
        institution: DataTypes.STRING,
        hash: DataTypes.STRING,
        onChain: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: DataTypes.STRING,
        blacklisted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });
    return Certificate;
};
