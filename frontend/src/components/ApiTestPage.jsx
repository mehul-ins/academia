import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { FiWifi, FiWifiOff, FiUser, FiLogIn } from 'react-icons/fi';

const ApiTestPage = () => {
    const [apiStatus, setApiStatus] = useState('checking');
    const [loginTest, setLoginTest] = useState(null);
    const [healthData, setHealthData] = useState(null);

    // Test API connectivity
    useEffect(() => {
        testApiConnection();
    }, []);

    const testApiConnection = async () => {
        try {
            setApiStatus('checking');
            const response = await apiService.health.simple();
            setHealthData(response.data);
            setApiStatus('connected');
        } catch (error) {
            console.error('API connection failed:', error);
            setApiStatus('disconnected');
        }
    };

    const testLogin = async () => {
        try {
            setLoginTest('testing');
            const response = await apiService.auth.login({
                email: 'admin@academia.com',
                password: 'admin123'
            });

            if (response.data.status === 'success') {
                setLoginTest('success');
                // Store token for future requests
                localStorage.setItem('authToken', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            } else {
                setLoginTest('failed');
            }
        } catch (error) {
            console.error('Login test failed:', error);
            setLoginTest('failed');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">API Integration Test</h1>

            {/* API Connection Status */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    {apiStatus === 'connected' ? (
                        <FiWifi className="text-green-500 mr-2" />
                    ) : (
                        <FiWifiOff className="text-red-500 mr-2" />
                    )}
                    Backend API Connection
                </h2>

                <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${apiStatus === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : apiStatus === 'checking'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                        {apiStatus === 'connected' && 'Connected'}
                        {apiStatus === 'checking' && 'Checking...'}
                        {apiStatus === 'disconnected' && 'Disconnected'}
                    </div>

                    <button
                        onClick={testApiConnection}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                        Test Connection
                    </button>
                </div>

                {healthData && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Health Response:</h3>
                        <pre className="text-sm text-gray-600 overflow-x-auto">
                            {JSON.stringify(healthData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* Authentication Test */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiUser className="text-blue-500 mr-2" />
                    Authentication Test
                </h2>

                <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${loginTest === 'success'
                            ? 'bg-green-100 text-green-800'
                            : loginTest === 'testing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : loginTest === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                        }`}>
                        {loginTest === 'success' && 'Login Successful'}
                        {loginTest === 'testing' && 'Testing Login...'}
                        {loginTest === 'failed' && 'Login Failed'}
                        {!loginTest && 'Not Tested'}
                    </div>

                    <button
                        onClick={testLogin}
                        disabled={apiStatus !== 'connected'}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm flex items-center"
                    >
                        <FiLogIn className="mr-2" />
                        Test Admin Login
                    </button>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    This will test login with admin@academia.com / admin123
                </div>
            </div>
        </div>
    );
};

export default ApiTestPage;