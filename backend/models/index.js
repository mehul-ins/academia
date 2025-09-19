const sequelize = require('../utils/db');

// Import model functions
const UserModel = require('./User');
const CertificateModel = require('./Certificate');
const LogModel = require('./Log');

// Initialize models
const User = UserModel(sequelize);
const Certificate = CertificateModel(sequelize);
const Log = LogModel(sequelize);

// Define associations
User.hasMany(Certificate, { foreignKey: 'institutionId', sourceKey: 'instituteId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'institutionId', targetKey: 'instituteId', as: 'institutionUser' });

Certificate.hasMany(Log, { foreignKey: 'certificateId', sourceKey: 'certificateId', as: 'logs' });
Log.belongsTo(Certificate, { foreignKey: 'certificateId', targetKey: 'certificateId', as: 'certificate' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    User,
    Certificate,
    Log,
};