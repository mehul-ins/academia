const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Blacklist = sequelize.define('Blacklist', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM('certificate', 'institution'),
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });
    return Blacklist;
};
