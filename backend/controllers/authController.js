const supabase = require('../utils/supabaseClient');
const jwt = require('jsonwebtoken');

const authController = {
    register: async (req, res) => {
        try {
            const {
                email,
                password,
                role = 'institution',
                instituteName,
                registrationNumber,
                establishedYear,
                address,
                contactPhone,
                website,
                accreditation,
                university,
            } = req.body;

            // Log all required fields for matching
            console.log('Registration match check fields:', {
                email,
                instituteName,
                registrationNumber,
                establishedYear,
                address,
                contactPhone,
                website,
                accreditation,
                university
            });

            // Check if user already exists
            const { data: existingUser, error: findError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            if (findError) throw findError;
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    reasons: ['User with this email already exists'],
                });
            }

            // Create user (password should be hashed in production)
            const { data: user, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        email,
                        password, // TODO: hash password in production
                        role,
                        instituteName,
                        registrationNumber,
                        establishedYear,
                        address,
                        contactPhone,
                        website,
                        accreditation,
                        university,
                        verificationStatus: role === 'institution' ? 'pending' : 'verified',
                    },
                ])
                .select()
                .single();
            if (insertError) throw insertError;

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                status: 'success',
                message: role === 'institution'
                    ? 'Institute registered successfully. Verification pending.'
                    : 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        instituteName: user.instituteName,
                        instituteId: user.instituteId,
                        verificationStatus: user.verificationStatus,
                    },
                    token,
                },
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to register user'],
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

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

            // Check password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    reasons: ['Invalid email or password'],
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        instituteName: user.instituteName,
                        instituteId: user.instituteId,
                        verificationStatus: user.verificationStatus,
                    },
                    token,
                },
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Login failed'],
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
            });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    reasons: ['User not found'],
                });
            }

            res.json({
                status: 'success',
                data: { user },
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to fetch profile'],
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const {
                instituteName,
                registrationNumber,
                establishedYear,
                address,
                contactPhone,
                website,
                accreditation,
                university,
            } = req.body;

            const updateData = {};

            // Only add fields that are provided
            if (instituteName !== undefined) updateData.instituteName = instituteName;
            if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
            if (establishedYear !== undefined) updateData.establishedYear = establishedYear;
            if (address !== undefined) updateData.address = address;
            if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
            if (website !== undefined) updateData.website = website;
            if (accreditation !== undefined) updateData.accreditation = accreditation;
            if (university !== undefined) updateData.university = university;

            await User.update(updateData, {
                where: { id: req.user.id }
            });

            const updatedUser = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
            });

            res.json({
                status: 'success',
                message: 'Profile updated successfully',
                data: { user: updatedUser },
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                status: 'error',
                reasons: ['Failed to update profile'],
            });
        }
    },
};

module.exports = authController;