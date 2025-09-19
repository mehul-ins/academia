const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Verification logs management
router.get('/logs', adminController.getLogs);

// Certificate management
router.get('/certificates', adminController.getCertificates);
router.put('/certificates/:certificateId/blacklist', adminController.toggleBlacklist);

module.exports = router;