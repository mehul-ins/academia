const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Apply authentication middleware to all admin routes
router.use(authMiddleware);
router.use(adminAuth);

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Verification logs management
router.get('/logs', adminController.getLogs);

// User management
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);

// Certificate management
router.get('/certificates', adminController.getCertificates);
router.put('/certificates/:certificateId/blacklist', adminController.toggleBlacklist);

module.exports = router;