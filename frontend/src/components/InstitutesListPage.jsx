import { useState, useEffect } from 'react';
import { FiHome, FiMail, FiCalendar, FiArrowLeft } from 'react-icons/fi';

const InstitutesListPage = ({ onBack }) => {
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        try {
            const response = await fetch('/api/institutes');
            if (!response.ok) throw new Error('Failed to fetch institutes');
            const data = await response.json();
            setInstitutes(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading institutes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Verification
                    </button>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
                        Verified Institutes
                    </h1>
                    <p className="text-lg text-gray-600">
                        List of all registered and verified educational institutions
                    </p>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">Error loading institutes: {error}</p>
                    </div>
                ) : institutes.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                        <FiHome className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Institutes Found</h3>
                        <p className="text-gray-600">No educational institutions have been registered yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {institutes.map((institute, index) => (
                            <div key={institute.id || index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-primary-100 p-3 rounded-lg">
                                        <FiHome className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                        Verified
                                    </span>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {institute.name || institute.email}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FiMail className="w-4 h-4" />
                                        <span>{institute.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>Registered {new Date(institute.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                                        <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                                        Active Institute
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutesListPage;