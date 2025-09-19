// Simple test to verify admin API
const testAdminAPI = async () => {
    try {
        // Test health endpoint first
        const healthResponse = await fetch('http://localhost:5002/api/health');
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);

        // Test login with admin credentials
        const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@academia.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);

        if (loginData.status === 'success') {
            const token = loginData.data.token;

            // Test admin stats endpoint
            const statsResponse = await fetch('http://localhost:5002/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const statsData = await statsResponse.json();
            console.log('Admin stats:', statsData);
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
};

testAdminAPI();