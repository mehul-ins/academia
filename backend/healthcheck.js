const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  timeout: 2000,
};

const healthCheck = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

healthCheck.end();