// generate-jwt.js
// Usage: node generate-jwt.js

const jwt = require('jsonwebtoken');

// Use the same secret as in your backend .env
const secret = process.env.JWT_SECRET || 'test_jwt_secret_for_development_only';

// Admin user UUID from your project description
const adminUserId = '50a1d256-6920-4f1c-b446-4e44a08a4ec2';

const payload = {
    sub: adminUserId, // Admin user ID
    id: adminUserId, // Also include as 'id' for compatibility
    role: 'admin',
    email: 'admin@academia.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // valid for 24h
};

const token = jwt.sign(payload, secret);
console.log('Generated JWT for admin user:', token);
console.log('Admin User ID:', adminUserId);
console.log('Token expires in 24 hours');
console.log('\nAdd this to your frontend .env file:');
console.log(`VITE_DEV_JWT_TOKEN=${token}`);
