



import { useState } from 'react';
import { FiArrowLeft, FiLogIn, FiShield } from 'react-icons/fi';

const InstituteRegisterPage = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        registrationNumber: '',
        establishedYear: '',
        address: '',
        contactPhone: '',
        website: '',
        accreditation: '',
        university: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                {/* Navigation Buttons */}
                <div className="flex justify-between mb-2">
                    <button
                        type="button"
                        onClick={() => (window.location.href = '/login')}
                        className="flex items-center text-gray-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <FiLogIn className="w-4 h-4 mr-2" />
                        Back to Login
                    </button>
                    <button
                        type="button"
                        onClick={() => (window.location.href = '/')}
                        className="flex items-center text-gray-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back to Verification
                    </button>
                </div>
                <div className="text-center">
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
                <form className="bg-white p-8 rounded-xl shadow-soft w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Institute Name</label>
                            <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field w-full" placeholder="e.g. BML Munjal University" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Admin Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field w-full" placeholder="e.g. admin@bmu.edu.in" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Admin Password</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field w-full" placeholder="Choose a password" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Registration Number</label>
                            <input type="text" name="registrationNumber" value={form.registrationNumber} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Established Year</label>
                            <input type="number" name="establishedYear" value={form.establishedYear} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Address</label>
                            <input type="text" name="address" value={form.address} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Contact Phone</label>
                            <input type="text" name="contactPhone" value={form.contactPhone} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Website</label>
                            <input type="text" name="website" value={form.website} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Accreditation</label>
                            <input type="text" name="accreditation" value={form.accreditation} onChange={handleChange} className="input-field w-full" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">University (if affiliated)</label>
                            <input type="text" name="university" value={form.university} onChange={handleChange} className="input-field w-full" />
                        </div>
                    </div>
                    <button
                        type="button"
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg mt-6"
                    >
                        Register Institute
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InstituteRegisterPage;
