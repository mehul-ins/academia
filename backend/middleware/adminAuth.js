const adminAuth = (req, res, next) => {
    // Check if user is authenticated (this should be called after authMiddleware)
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            reasons: ['Authentication required']
        });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            reasons: ['Admin access required']
        });
    }

    next();
};

module.exports = adminAuth;