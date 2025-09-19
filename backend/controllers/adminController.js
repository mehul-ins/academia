const { Certificate, Log } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

const adminController = {
    // Get dashboard statistics
    getStats: async (req, res) => {
        try {
            // Get counts for dashboard
            const totalCertificates = await Certificate.count();
            const totalVerifications = await Log.count();
            const blacklistedCertificates = await Certificate.count({
                where: { blacklisted: true }
            });

            // Get verification stats for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentVerifications = await Log.count({
                where: {
                    createdAt: {
                        [Op.gte]: thirtyDaysAgo
                    }
                }
            });

            // Get success rate (assuming 'verified' result means success)
            const successfulVerifications = await Log.count({
                where: {
                    result: 'verified',
                    createdAt: {
                        [Op.gte]: thirtyDaysAgo
                    }
                }
            });

            const successRate = recentVerifications > 0
                ? ((successfulVerifications / recentVerifications) * 100).toFixed(2)
                : 0;

            // Get verification trends (last 7 days)
            const verificationTrends = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                const endOfDay = new Date(date.setHours(23, 59, 59, 999));

                const count = await Log.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                verificationTrends.push({
                    date: startOfDay.toISOString().split('T')[0],
                    count
                });
            }

            // Get top institutions (by certificate count)
            const topInstitutions = await Certificate.findAll({
                attributes: [
                    'institution',
                    [sequelize.fn('COUNT', sequelize.col('institution')), 'count']
                ],
                group: ['institution'],
                order: [[sequelize.fn('COUNT', sequelize.col('institution')), 'DESC']],
                limit: 5,
                raw: true
            });

            res.json({
                status: 'success',
                data: {
                    overview: {
                        totalCertificates,
                        totalVerifications,
                        blacklistedCertificates,
                        recentVerifications,
                        successRate: parseFloat(successRate)
                    },
                    trends: verificationTrends,
                    topInstitutions: topInstitutions.map(inst => ({
                        name: inst.institution || 'Unknown',
                        count: parseInt(inst.count)
                    }))
                }
            });

        } catch (error) {
            console.error('Admin stats error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to fetch dashboard statistics']
            });
        }
    },

    // Get verification logs with pagination and filters
    getLogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            // Build filter conditions
            const whereConditions = {};

            if (req.query.result) {
                whereConditions.result = req.query.result;
            }

            if (req.query.certificateId) {
                whereConditions.certificateId = {
                    [Op.like]: `%${req.query.certificateId}%`
                };
            }

            if (req.query.startDate && req.query.endDate) {
                whereConditions.createdAt = {
                    [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
                };
            }

            const { count, rows: logs } = await Log.findAndCountAll({
                where: whereConditions,
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            res.json({
                status: 'success',
                data: {
                    logs: logs.map(log => ({
                        id: log.id,
                        certificateId: log.certificateId,
                        result: log.result,
                        reasons: log.reasons ? JSON.parse(log.reasons) : [],
                        createdAt: log.createdAt,
                        ocrData: log.ocrData
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: count,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('Admin logs error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to fetch verification logs']
            });
        }
    },

    // Get certificates with pagination and search
    getCertificates: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';

            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { certificateId: { [Op.like]: `%${search}%` } },
                    { studentName: { [Op.like]: `%${search}%` } },
                    { institution: { [Op.like]: `%${search}%` } }
                ];
            }

            if (req.query.institution) {
                whereConditions.institution = req.query.institution;
            }

            if (req.query.status) {
                whereConditions.status = req.query.status;
            }

            if (req.query.blacklisted !== undefined) {
                whereConditions.blacklisted = req.query.blacklisted === 'true';
            }

            const { count, rows: certificates } = await Certificate.findAndCountAll({
                where: whereConditions,
                order: [['issueDate', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            res.json({
                status: 'success',
                data: {
                    certificates,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: count,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('Admin certificates error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to fetch certificates']
            });
        }
    },

    // Toggle certificate blacklist status
    toggleBlacklist: async (req, res) => {
        try {
            const { certificateId } = req.params;
            const { blacklisted, reason } = req.body;

            const certificate = await Certificate.findByPk(certificateId);
            if (!certificate) {
                return res.status(404).json({
                    status: 'error',
                    reasons: ['Certificate not found']
                });
            }

            await certificate.update({ blacklisted });

            // Log the blacklist action
            await Log.create({
                certificateId,
                result: blacklisted ? 'blacklisted' : 'unblacklisted',
                reasons: JSON.stringify([reason || `Certificate ${blacklisted ? 'blacklisted' : 'unblacklisted'} by admin`])
            });

            res.json({
                status: 'success',
                data: {
                    certificateId,
                    blacklisted,
                    message: `Certificate ${blacklisted ? 'blacklisted' : 'unblacklisted'} successfully`
                }
            });

        } catch (error) {
            console.error('Toggle blacklist error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to update blacklist status']
            });
        }
    }
};

module.exports = adminController;