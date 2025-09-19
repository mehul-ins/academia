const { User, Certificate, Log, Blacklist } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

const adminController = {
    getStats: async (req, res) => {
        try {
            // Get verification statistics
            const totalLogs = await Log.count();
            const validCount = await Log.count({ where: { result: 'valid' } });
            const invalidCount = await Log.count({ where: { result: 'invalid' } });
            const suspiciousCount = await Log.count({ where: { result: 'suspicious' } });

            // Get statistics over time (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const verificationsOverTime = await Log.findAll({
                where: {
                    createdAt: {
                        [Op.gte]: sevenDaysAgo
                    }
                },
                attributes: [
                    [Log.sequelize.fn('DATE', Log.sequelize.col('createdAt')), 'date'],
                    [Log.sequelize.fn('COUNT', Log.sequelize.col('id')), 'count'],
                    'result'
                ],
                group: ['date', 'result'],
                order: [['date', 'ASC']]
            });

            // Get top institutions by verification count
            const topInstitutions = await Certificate.findAll({
                attributes: [
                    'institution',
                    [Certificate.sequelize.fn('COUNT', Certificate.sequelize.col('certId')), 'count']
                ],
                group: ['institution'],
                order: [[Certificate.sequelize.fn('COUNT', Certificate.sequelize.col('certId')), 'DESC']],
                limit: 5
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    overview: {
                        total: totalLogs,
                        valid: validCount,
                        invalid: invalidCount,
                        suspicious: suspiciousCount
                    },
                    verificationsOverTime,
                    topInstitutions
                }
            });

        } catch (error) {
            console.error('Get stats error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    getLogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { status, search, startDate, endDate } = req.query;

            // Build where clause
            const whereClause = {};

            if (status && ['valid', 'invalid', 'suspicious'].includes(status)) {
                whereClause.result = status;
            }

            if (search) {
                whereClause.certId = { [Op.like]: `%${search}%` };
            }

            if (startDate && endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const { count, rows } = await Log.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email'],
                        required: false
                    },
                    {
                        model: Certificate,
                        as: 'certificate',
                        attributes: ['certId', 'name', 'institution'],
                        required: false
                    }
                ],
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    logs: rows.map(log => ({
                        id: log.id,
                        certId: log.certId,
                        result: log.result,
                        reasons: log.reasons,
                        createdAt: log.createdAt,
                        user: log.user,
                        certificate: log.certificate,
                        ipAddress: log.ipAddress
                    })),
                    pagination: {
                        total: count,
                        page,
                        limit,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get logs error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    getBlacklist: async (req, res) => {
        try {
            const blacklistEntries = await Blacklist.findAll({
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    blacklist: blacklistEntries
                }
            });

        } catch (error) {
            console.error('Get blacklist error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    addToBlacklist: async (req, res) => {
        try {
            const schema = Joi.object({
                type: Joi.string().valid('certificate', 'institution').required(),
                value: Joi.string().required(),
                reason: Joi.string().optional()
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: error.details[0].message
                });
            }

            // Check if entry already exists
            const existingEntry = await Blacklist.findOne({
                where: {
                    type: value.type,
                    value: value.value
                }
            });

            if (existingEntry) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Entry already exists in blacklist'
                });
            }

            const blacklistEntry = await Blacklist.create(value);

            return res.status(201).json({
                status: 'success',
                data: {
                    blacklistEntry
                }
            });

        } catch (error) {
            console.error('Add to blacklist error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    removeFromBlacklist: async (req, res) => {
        try {
            const { id } = req.params;

            const blacklistEntry = await Blacklist.findByPk(id);
            if (!blacklistEntry) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Blacklist entry not found'
                });
            }

            await blacklistEntry.destroy();

            return res.status(200).json({
                status: 'success',
                message: 'Entry removed from blacklist'
            });

        } catch (error) {
            console.error('Remove from blacklist error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    getUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { search, role } = req.query;

            // Build where clause
            const whereClause = {};
            if (search) {
                whereClause.email = { [Op.like]: `%${search}%` };
            }
            if (role) {
                whereClause.role = role;
            }

            const { count, rows } = await User.findAndCountAll({
                where: whereClause,
                attributes: ['id', 'email', 'role', 'createdAt'],
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    users: rows,
                    pagination: {
                        total: count,
                        page,
                        limit,
                        pages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            // Prevent admin from deleting themselves
            if (req.user.id == id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot delete your own account'
                });
            }

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            await user.destroy();

            return res.status(200).json({
                status: 'success',
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }
};

module.exports = adminController;