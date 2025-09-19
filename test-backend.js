const http = require('http');
async function testBackend() {
    return new Promise((resolve) => {
        console.log('Testing backend health...');

        const req = http.request('http://localhost:5002/api/health', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('✅ Backend is healthy! Status:', res.statusCode);
                console.log('Response:', data);
                resolve();
            });
        });

        req.on('error', (err) => {
            console.log('❌ Backend test failed:', err.message);
            if (err.code === 'ECONNREFUSED') {
                console.log('🔧 Backend server is not running or not accessible on port 5002');
            }
            resolve();
        });

        req.end();
    });
}

testBackend();