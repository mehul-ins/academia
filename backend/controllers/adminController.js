const supabase = require('../utils/supabaseClient');

const adminController = {
    // Get dashboard statistics
    getStats: async (req, res) => {
        try {
            // Get counts for dashboard
            const { data: certs, error: certsErr } = await supabase.from('certificates').select('id, institution, blacklisted, issue_date');
            if (certsErr) {
                console.error('Error fetching certificates:', certsErr);
                // Return empty stats if certificates table doesn't exist yet
                return res.json({
                    status: 'success',
                    data: {
                        overview: {
                            totalUsers: 0,
                            totalCertificates: 0,
                            totalVerifications: 0,
                            blacklistedCertificates: 0,
                            recentVerifications: 0,
                            successRate: 0
                        },
                        trends: [],
                        topInstitutions: []
                    }
                });
            }

            const { data: logs, error: logsErr } = await supabase.from('logs').select('id, result, created_at');
            if (logsErr) {
                console.error('Error fetching logs:', logsErr);
                // Return empty logs if logs table doesn't exist yet
                const totalCertificates = certs?.length || 0;
                const blacklistedCertificates = certs?.filter(c => c.blacklisted).length || 0;

                return res.json({
                    status: 'success',
                    data: {
                        overview: {
                            totalUsers: 0,
                            totalCertificates,
                            totalVerifications: 0,
                            blacklistedCertificates,
                            recentVerifications: 0,
                            successRate: 0
                        },
                        trends: [],
                        topInstitutions: []
                    }
                });
            }

            // Get user count from profiles table
            const { data: profiles, error: profilesErr } = await supabase.from('profiles').select('id');
            const totalUsers = profiles?.length || 0;

            const totalCertificates = certs?.length || 0;
            const totalVerifications = logs?.length || 0;
            const blacklistedCertificates = certs?.filter(c => c.blacklisted).length || 0;

            // Last 30 days
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const recentVerifications = logs?.filter(l => new Date(l.created_at) >= thirtyDaysAgo).length || 0;
            const successfulVerifications = logs?.filter(l => l.result === 'verified' && new Date(l.created_at) >= thirtyDaysAgo).length || 0;
            const successRate = recentVerifications > 0 ? ((successfulVerifications / recentVerifications) * 100).toFixed(2) : 0;

            // Trends (last 7 days)
            const verificationTrends = [];
            for (let i = 6; i >= 0; i--) {
                const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStr = day.toISOString().split('T')[0];
                const count = logs?.filter(l => l.created_at.startsWith(dayStr)).length || 0;
                verificationTrends.push({ date: dayStr, count });
            }

            // Top institutions by certificate count
            const institutionCounts = {};
            certs?.forEach(c => {
                if (!institutionCounts[c.institution]) institutionCounts[c.institution] = 0;
                institutionCounts[c.institution]++;
            });
            const topInstitutions = Object.entries(institutionCounts)
                .map(([name, count]) => ({ name: name || 'Unknown', count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            res.json({
                status: 'success',
                data: {
                    overview: {
                        totalUsers,
                        totalCertificates,
                        totalVerifications,
                        blacklistedCertificates,
                        recentVerifications,
                        successRate: parseFloat(successRate)
                    },
                    trends: verificationTrends,
                    topInstitutions
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
            let { data: logs, error } = await supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching logs:', error);
                // Return empty logs if logs table doesn't exist yet
                return res.json({
                    status: 'success',
                    data: {
                        logs: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalItems: 0,
                            hasNext: false,
                            hasPrev: false
                        }
                    }
                });
            }

            // Filtering
            if (req.query.result) logs = logs.filter(l => l.result === req.query.result);
            if (req.query.certificateId) logs = logs.filter(l => l.certificate_id && l.certificate_id.includes(req.query.certificateId));
            if (req.query.startDate && req.query.endDate) {
                const start = new Date(req.query.startDate);
                const end = new Date(req.query.endDate);
                logs = logs.filter(l => new Date(l.created_at) >= start && new Date(l.created_at) <= end);
            }
            const count = logs.length;
            const pagedLogs = logs.slice(offset, offset + limit);
            const totalPages = Math.ceil(count / limit);
            res.json({
                status: 'success',
                data: {
                    logs: pagedLogs.map(log => ({
                        id: log.id,
                        certificateId: log.certificate_id,
                        result: log.result,
                        reasons: log.reasons ? (typeof log.reasons === 'string' ? JSON.parse(log.reasons) : log.reasons) : [],
                        createdAt: log.created_at,
                        ocrData: log.ocr_data
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
            let { data: certificates, error } = await supabase
                .from('certificates')
                .select('*')
                .order('issue_date', { ascending: false });

            if (error) {
                console.error('Error fetching certificates:', error);
                // Return empty certificates if certificates table doesn't exist yet
                return res.json({
                    status: 'success',
                    data: {
                        certificates: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalItems: 0,
                            hasNext: false,
                            hasPrev: false
                        }
                    }
                });
            }

            // Filtering
            if (search) {
                certificates = certificates.filter(c =>
                    (c.certificate_id && c.certificate_id.includes(search)) ||
                    (c.student_name && c.student_name.includes(search)) ||
                    (c.institution && c.institution.includes(search))
                );
            }
            if (req.query.institution) certificates = certificates.filter(c => c.institution === req.query.institution);
            if (req.query.status) certificates = certificates.filter(c => c.status === req.query.status);
            if (req.query.blacklisted !== undefined) certificates = certificates.filter(c => c.blacklisted === (req.query.blacklisted === 'true'));
            const count = certificates.length;
            const pagedCertificates = certificates.slice(offset, offset + limit);
            const totalPages = Math.ceil(count / limit);
            res.json({
                status: 'success',
                data: {
                    certificates: pagedCertificates,
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
            const { rollNumber } = req.params;
            const { blacklisted, reason } = req.body;
            // Update certificate by roll_number
            const { data: cert, error } = await supabase
                .from('certificates')
                .update({ blacklisted })
                .eq('roll_number', rollNumber)
                .select()
                .single();
            if (error || !cert) {
                return res.status(404).json({
                    status: 'error',
                    reasons: ['Certificate not found']
                });
            }
            // Log the blacklist action
            await supabase.from('logs').insert([
                {
                    roll_number: rollNumber,
                    result: blacklisted ? 'blacklisted' : 'unblacklisted',
                    reasons: JSON.stringify([reason || `Certificate ${blacklisted ? 'blacklisted' : 'unblacklisted'} by admin`]),
                    created_at: new Date().toISOString()
                }
            ]);
            res.json({
                status: 'success',
                data: {
                    rollNumber,
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