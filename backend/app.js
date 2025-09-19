const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rate limiting (basic global limit, adjust as needed)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Import routes
const authRoutes = require('./routes/auth');

// Mount routes
app.use('/api/auth', authRoutes);

// ...existing code...

module.exports = app;
