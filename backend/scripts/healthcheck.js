import http from 'http';

const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log('❌ Health check failed');
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('❌ Health check failed:', err.message);
  process.exit(1);
});

request.end();
