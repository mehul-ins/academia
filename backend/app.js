const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // Frontend dev servers
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting (basic global limit, adjust as needed)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Import routes
const verifyRoutes = require('./routes/verify');
const certificateRoutes = require('./routes/certificates');
const adminRoutes = require('./routes/admin');

// Mount routes
app.use('/api/verify', verifyRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);

// ...existing code...

module.exports = app;
