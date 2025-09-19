const supabase = require('../utils/supabaseClient');

function roleMiddleware(requiredRole) {
    return async (req, res, next) => {
        try {
            // Get user ID from JWT payload
            const userId = req.user.sub || req.user.id;

            if (!userId) {
                return res.status(401).json({ error: 'User ID not found in token' });
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return res.status(403).json({ error: 'Profile not found' });
            }

            if (profile.role !== requiredRole) {
                return res.status(403).json({ error: 'Forbidden: insufficient role' });
            }

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}

module.exports = roleMiddleware;