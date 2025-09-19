const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Verification logs management
router.get('/logs', adminController.getLogs);

// Certificate management
router.get('/certificates', adminController.getCertificates);
router.put('/certificates/:rollNumber/blacklist', adminController.toggleBlacklist);

module.exports = router;