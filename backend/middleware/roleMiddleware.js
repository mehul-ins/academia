const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated (authMiddleware should run first)
            if (!req.user) {
                return res.status(401).json({
                    status: 'error',
                    reasons: ['Authentication required'],
                });
            }

            // Check if user has the required role
            if (req.user.role !== requiredRole) {
                return res.status(403).json({
                    status: 'error',
                    reasons: [`Access denied. ${requiredRole} role required`],
                });
            }

            next();

        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Internal server error'],
            });
        }
    };
};

// Helper function for admin-only routes
const adminOnly = roleMiddleware('admin');

// Helper function for institution-only routes
const institutionOnly = roleMiddleware('institution');

module.exports = {
    roleMiddleware,
    adminOnly,
    institutionOnly,
};