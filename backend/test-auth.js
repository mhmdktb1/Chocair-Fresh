/**
 * ==========================================
 * AUTHENTICATION FLOW TEST SCRIPT
 * ==========================================
 * 
 * Tests the complete authentication system:
 * 1. Register new user
 * 2. Login with credentials
 * 3. Access protected route with token
 * 4. Verify token works
 */

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@chocair.com`, // Unique email
  password: 'password123',
  phone: '+961 70 123 456'
};

let authToken = '';

// Helper function to make requests
async function request(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test functions
async function testAPIHealth() {
  console.log('\n📡 TEST 1: API Health Check');
  console.log('━'.repeat(50));
  
  const result = await request('/test');
  
  if (result.ok) {
    console.log('✅ API is running');
    console.log('   Response:', result.data);
  } else {
    console.log('❌ API is not responding');
    process.exit(1);
  }
}

async function testRegister() {
  console.log('\n📝 TEST 2: User Registration');
  console.log('━'.repeat(50));
  console.log('Registering user:', testUser.email);
  
  const result = await request('/users/register', 'POST', testUser);
  
  if (result.ok && result.data.success) {
    console.log('✅ Registration successful');
    console.log('   User ID:', result.data.data._id);
    console.log('   Name:', result.data.data.name);
    console.log('   Email:', result.data.data.email);
    console.log('   Role:', result.data.data.role);
    console.log('   Token:', result.data.data.token.substring(0, 20) + '...');
    
    authToken = result.data.data.token;
  } else {
    console.log('❌ Registration failed');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.message || result.error);
    process.exit(1);
  }
}

async function testLogin() {
  console.log('\n🔐 TEST 3: User Login');
  console.log('━'.repeat(50));
  console.log('Logging in with:', testUser.email);
  
  const result = await request('/users/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.ok && result.data.success) {
    console.log('✅ Login successful');
    console.log('   User ID:', result.data.data._id);
    console.log('   Name:', result.data.data.name);
    console.log('   Token:', result.data.data.token.substring(0, 20) + '...');
    
    authToken = result.data.data.token;
  } else {
    console.log('❌ Login failed');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.message || result.error);
    process.exit(1);
  }
}

async function testInvalidLogin() {
  console.log('\n🚫 TEST 4: Invalid Login (Should Fail)');
  console.log('━'.repeat(50));
  
  const result = await request('/users/login', 'POST', {
    email: testUser.email,
    password: 'wrongpassword'
  });
  
  if (!result.ok) {
    console.log('✅ Invalid login correctly rejected');
    console.log('   Error:', result.data.message);
  } else {
    console.log('❌ SECURITY ISSUE: Invalid login was accepted!');
    process.exit(1);
  }
}

async function testProtectedRoute() {
  console.log('\n🔒 TEST 5: Protected Route (Get Profile)');
  console.log('━'.repeat(50));
  console.log('Accessing profile with token...');
  
  const result = await request('/users/profile', 'GET', null, authToken);
  
  if (result.ok && result.data.success) {
    console.log('✅ Protected route access successful');
    console.log('   User ID:', result.data.data._id);
    console.log('   Name:', result.data.data.name);
    console.log('   Email:', result.data.data.email);
    console.log('   Role:', result.data.data.role);
  } else {
    console.log('❌ Protected route access failed');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.message || result.error);
    process.exit(1);
  }
}

async function testProtectedRouteNoToken() {
  console.log('\n🚫 TEST 6: Protected Route Without Token (Should Fail)');
  console.log('━'.repeat(50));
  
  const result = await request('/users/profile', 'GET');
  
  if (!result.ok) {
    console.log('✅ Access correctly denied without token');
    console.log('   Error:', result.data.message);
  } else {
    console.log('❌ SECURITY ISSUE: Protected route accessible without token!');
    process.exit(1);
  }
}

async function testTokenExpiry() {
  console.log('\n⏰ TEST 7: Invalid Token (Should Fail)');
  console.log('━'.repeat(50));
  
  const fakeToken = 'invalid.token.here';
  const result = await request('/users/profile', 'GET', null, fakeToken);
  
  if (!result.ok) {
    console.log('✅ Invalid token correctly rejected');
    console.log('   Error:', result.data.message);
  } else {
    console.log('❌ SECURITY ISSUE: Invalid token was accepted!');
    process.exit(1);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🧪 CHOCAIR FRESH AUTHENTICATION TESTS        ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    await testAPIHealth();
    await testRegister();
    await testLogin();
    await testInvalidLogin();
    await testProtectedRoute();
    await testProtectedRouteNoToken();
    await testTokenExpiry();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED!                         ║');
    console.log('║                                                ║');
    console.log('║  Your authentication system is working! 🎉    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n✨ Next Steps:');
    console.log('   1. Open http://localhost:5173/register');
    console.log('   2. Create a real account');
    console.log('   3. Login at http://localhost:5173/login');
    console.log('   4. Access protected pages like /account');
    console.log('');
    
  } catch (error) {
    console.log('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
