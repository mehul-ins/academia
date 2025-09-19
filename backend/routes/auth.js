const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register (for institutions)
router.post('/register', authController.register);

module.exports = router;