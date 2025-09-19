const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'institution'),
            allowNull: false,
            defaultValue: 'institution',
        },
        // Institution-specific fields
        instituteName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        instituteId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        registrationNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        establishedYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        contactPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accreditation: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        university: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Verification status
        verificationStatus: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Additional metadata
        documents: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
    }, {
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }

                // Generate dummy institute ID if not provided
                if (user.role === 'institution' && !user.instituteId) {
                    user.instituteId = `INST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
        },
    });

    User.prototype.comparePassword = async function (password) {
        return bcrypt.compare(password, this.password);
    };

    return User;
};