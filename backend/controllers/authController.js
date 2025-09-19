const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authController = {
    // POST /api/auth/login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    reasons: ['Email and password are required'],
                });
            }

            // Find user by email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    reasons: ['Invalid email or password'],
                });
            }

            // Verify password using the model's comparePassword method
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    reasons: ['Invalid email or password'],
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                },
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Internal server error'],
            });
        }
    },

    // POST /api/auth/register (for institutions)
    register: async (req, res) => {
        try {
            const { email, password, role = 'institution' } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    reasons: ['Email and password are required'],
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    status: 'error',
                    reasons: ['Password must be at least 6 characters long'],
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    reasons: ['User with this email already exists'],
                });
            }

            // Create new user (password will be hashed automatically by the model hook)
            const user = await User.create({
                email,
                password,
                role,
            });

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                },
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Internal server error'],
            });
        }
    },
};

module.exports = authController;