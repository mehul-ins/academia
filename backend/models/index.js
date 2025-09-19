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
User.hasMany(Log, { foreignKey: 'userId' });
Log.belongsTo(User, { foreignKey: 'userId' });

Certificate.hasMany(Log, { foreignKey: 'certId', sourceKey: 'certId' });
Log.belongsTo(Certificate, { foreignKey: 'certId', targetKey: 'certId' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    User,
    Certificate,
    Log,
    Blacklist,
};