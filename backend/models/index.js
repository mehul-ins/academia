const sequelize = require('../utils/db');

// Import model functions
const CertificateModel = require('./Certificate');
const LogModel = require('./Log');

// Initialize models
const Certificate = CertificateModel(sequelize);
const Log = LogModel(sequelize);

// Define associations
Certificate.hasMany(Log, { foreignKey: 'certificateId', sourceKey: 'certificateId', as: 'logs' });
Log.belongsTo(Certificate, { foreignKey: 'certificateId', targetKey: 'certificateId', as: 'certificate' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    Certificate,
    Log,
};