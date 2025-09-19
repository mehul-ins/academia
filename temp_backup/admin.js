const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validation = require('../middleware/validation');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * @route   GET /api/admin/stats
 * @desc    Get verification statistics for analytics dashboard
 * @access  Admin only
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/logs
 * @desc    Get verification logs with pagination and filtering
 * @access  Admin only
 */
router.get('/logs',
    validation.validateQuery(validation.schemas.logQuery),
    adminController.getLogs
);

/**
 * @route   GET /api/admin/blacklist
 * @desc    Get all blacklist entries
 * @access  Admin only
 */
router.get('/blacklist', adminController.getBlacklist);

/**
 * @route   POST /api/admin/blacklist
 * @desc    Add entry to blacklist
 * @access  Admin only
 */
router.post('/blacklist',
    validation.validateBody(validation.schemas.blacklist),
    adminController.addToBlacklist
);

/**
 * @route   DELETE /api/admin/blacklist/:id
 * @desc    Remove entry from blacklist
 * @access  Admin only
 */
router.delete('/blacklist/:id',
    validation.validateParams(validation.schemas.idParam),
    adminController.removeFromBlacklist
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get('/users',
    validation.validateQuery(validation.schemas.search),
    adminController.getUsers
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user
 * @access  Admin only
 */
router.delete('/users/:id',
    validation.validateParams(validation.schemas.idParam),
    adminController.deleteUser
);

module.exports = router;