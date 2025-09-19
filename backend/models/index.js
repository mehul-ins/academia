const sequelize = require('../utils/db');

// Import model functions
const UserModel = require('./User');
const CertificateModel = require('./Certificate');
const LogModel = require('./Log');
const BlacklistModel = require('./Blacklist');

// Initialize models
const User = UserModel(sequelize);
const Certificate = CertificateModel(sequelize);
const Log = LogModel(sequelize);
const Blacklist = BlacklistModel(sequelize);

// Define associations
User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });
Log.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Certificate.hasMany(Log, { foreignKey: 'certificateId', sourceKey: 'certificateId', as: 'logs' });
Log.belongsTo(Certificate, { foreignKey: 'certificateId', targetKey: 'certificateId', as: 'certificate' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    User,
    Certificate,
    Log,
    Blacklist,
};