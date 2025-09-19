const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register new user/institute
router.post('/register', authController.register);

// POST /api/auth/login - Login
router.post('/login', authController.login);

// GET /api/auth/profile - Get profile (protected, needs auth middleware in real use)
// router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
