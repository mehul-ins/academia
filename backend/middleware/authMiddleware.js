const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Try Supabase JWT first, then fallback to dev JWT secret
    let payload = null;
    let verified = false;
    try {
        payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
        verified = true;
    } catch (err) {
        // Try dev/test JWT secret if Supabase fails
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
            verified = true;
        } catch (err2) {
            // Both failed
        }
    }
    if (!verified) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = payload;
    next();
}

module.exports = authMiddleware;