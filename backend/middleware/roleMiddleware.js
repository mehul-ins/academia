const supabase = require('../utils/supabaseClient');

function roleMiddleware(requiredRole) {
    return async (req, res, next) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.sub) // `sub` comes from Supabase JWT
            .single();

        if (error) return res.status(403).json({ error: 'Profile not found' });

        if (profile.role !== requiredRole) {
            return res.status(403).json({ error: 'Forbidden: insufficient role' });
        }

        next();
    };
}

module.exports = roleMiddleware;