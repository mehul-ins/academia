const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Log = sequelize.define('Log', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        certificateId: DataTypes.STRING,
        ocrData: DataTypes.JSON,
        result: DataTypes.STRING,
        reasons: DataTypes.TEXT, // Store as JSON text for SQLite compatibility
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });
    return Log;
};