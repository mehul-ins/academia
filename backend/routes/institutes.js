const express = require('express');
const { User } = require('../models');

const router = express.Router();

// GET /api/institutes - Get all registered institutes
router.get('/', async (req, res) => {
    try {
        const institutes = await User.findAll({
            where: { role: 'institution' },
            attributes: ['id', 'email', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            status: 'success',
            data: institutes
        });
    } catch (error) {
        console.error('Get institutes error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch institutes'
        });
    }
});

module.exports = router;