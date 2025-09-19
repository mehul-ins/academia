const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                reasons: ['Access token required'],
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database to ensure user still exists and is active
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                reasons: ['User not found or deactivated'],
            });
        }

        // Attach user to request object
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                reasons: ['Invalid token'],
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                reasons: ['Token expired'],
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            status: 'error',
            reasons: ['Internal server error'],
        });
    }
};

module.exports = authMiddleware;