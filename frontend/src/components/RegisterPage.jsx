import { useState } from 'react';
import { FiMail, FiLock, FiUser, FiHome, FiShield, FiPhone, FiGlobe, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const RegisterPage = ({ onRegisterSuccess, onSwitchToLogin, onBack }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        instituteName: '',
        registrationNumber: '',
        establishedYear: '',
        address: '',
        contactPhone: '',
        website: '',
        accreditation: '',
        university: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            // Sign up with Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        institution_name: formData.instituteName,
                        registration_number: formData.registrationNumber,
                        role: 'institution'
                    }
                }
            });

            if (authError) throw authError;

            if (data.user) {
                // Create profile entry
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            email: formData.email,
                            role: 'institution',
                            institution_name: formData.instituteName,
                            registration_number: formData.registrationNumber,
                            established_year: formData.establishedYear ? parseInt(formData.establishedYear) : null,
                            address: formData.address,
                            contact_phone: formData.contactPhone,
                            website: formData.website,
                            accreditation: formData.accreditation,
                            university: formData.university,
                            verification_status: 'pending'
                        }
                    ]);

                if (profileError) {
                    console.warn('Profile creation failed:', profileError);
                    // Don't fail registration if profile creation fails
                }

                onRegisterSuccess(data.user);
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back to Verification
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-primary-600 w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-4">
                        <FiShield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">
                        Register Your Institute
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join the Academia certificate verification network
                    </p>
                </div>

                {/* Registration Form */}
                <form className="space-y-6" onSubmit={handleRegister}>
                    {/* Account Information */}
                    <div className="bg-white shadow-soft rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address *
                                </label>
                                <div className="mt-1 relative">
                                    <FiMail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="institute@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password *
                                </label>
                                <div className="mt-1 relative">
                                    <FiLock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="Create a strong password"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password *
                                </label>
                                <div className="mt-1 relative">
                                    <FiLock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Institute Information */}
                    <div className="bg-white shadow-soft rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Institute Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="instituteName" className="block text-sm font-medium text-gray-700">
                                    Institute Name *
                                </label>
                                <div className="mt-1 relative">
                                    <FiHome className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="instituteName"
                                        name="instituteName"
                                        type="text"
                                        required
                                        value={formData.instituteName}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="XYZ Institute of Technology"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                                    Registration Number
                                </label>
                                <input
                                    id="registrationNumber"
                                    name="registrationNumber"
                                    type="text"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="REG12345"
                                />
                            </div>

                            <div>
                                <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700">
                                    Established Year
                                </label>
                                <input
                                    id="establishedYear"
                                    name="establishedYear"
                                    type="number"
                                    min="1800"
                                    max="2025"
                                    value={formData.establishedYear}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="1995"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <div className="mt-1 relative">
                                    <FiMapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="123 Education Street, City, State, Country"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                                    Contact Phone
                                </label>
                                <div className="mt-1 relative">
                                    <FiPhone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="contactPhone"
                                        name="contactPhone"
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                                    Website
                                </label>
                                <div className="mt-1 relative">
                                    <FiGlobe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="website"
                                        name="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="https://institute.edu"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="accreditation" className="block text-sm font-medium text-gray-700">
                                    Accreditation
                                </label>
                                <input
                                    id="accreditation"
                                    name="accreditation"
                                    type="text"
                                    value={formData.accreditation}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="NAAC A+"
                                />
                            </div>

                            <div>
                                <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                                    Affiliated University
                                </label>
                                <input
                                    id="university"
                                    name="university"
                                    type="text"
                                    value={formData.university}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="State University"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            Back to Login
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Registering...' : 'Register Institute'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;