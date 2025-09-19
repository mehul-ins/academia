const express = require('express');
const supabase = require('../utils/supabaseClient');

const router = express.Router();

// GET /api/institutes - Get all registered institutes (Supabase)
router.get('/', async (req, res) => {
    try {
        const { data: institutes, error } = await supabase
            .from('users')
            .select('id, email, instituteName, createdAt')
            .eq('role', 'institution')
            .order('createdAt', { ascending: false });
        if (error) throw error;
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