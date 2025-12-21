// Quick script to create an admin user
import http from 'http';

const data = JSON.stringify({
  name: 'Admin User',
  email: 'admin@chocair.com',
  password: 'admin123',
  phone: '+961 70 999 888',
  role: 'admin'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/users/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ Admin User Created!\n');
    console.log(JSON.parse(responseData));
    console.log('\n📧 Email: admin@chocair.com');
    console.log('🔑 Password: admin123\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
