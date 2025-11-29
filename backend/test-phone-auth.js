/**
 * ==========================================
 * PHONE VERIFICATION TEST SCRIPT
 * ==========================================
 * 
 * Tests the new multi-step phone authentication:
 * 1. Send OTP to phone
 * 2. Verify OTP
 * 3. Auto-register if new user
 * 4. Resend OTP functionality
 */

const API_BASE = 'http://localhost:5000/api';

// Test phone number
const testPhone = '+961 70 999 888';
let receivedOTP = '';

// Helper function
async function request(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

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

// Test 1: Send OTP
async function testSendOTP() {
  console.log('\n📱 TEST 1: Send OTP to Phone');
  console.log('━'.repeat(50));
  console.log('Phone:', testPhone);
  
  const result = await request('/users/verify-phone', 'POST', { phone: testPhone });
  
  if (result.ok && result.data.success) {
    console.log('✅ OTP sent successfully');
    console.log('   Phone:', result.data.data.phone);
    console.log('   Expires in:', result.data.data.expiresIn, 'seconds');
    console.log('   User exists:', result.data.data.userExists);
    
    if (result.data.data.otp) {
      receivedOTP = result.data.data.otp;
      console.log('   🔑 OTP Code:', receivedOTP);
    }
    
    return true;
  } else {
    console.log('❌ Failed to send OTP');
    console.log('   Error:', result.data.message || result.error);
    return false;
  }
}

// Test 2: Verify OTP (with wrong code)
async function testInvalidOTP() {
  console.log('\n🚫 TEST 2: Verify with Invalid OTP (Should Fail)');
  console.log('━'.repeat(50));
  
  const result = await request('/users/login-phone', 'POST', {
    phone: testPhone,
    otp: '000000'
  });
  
  if (!result.ok) {
    console.log('✅ Invalid OTP correctly rejected');
    console.log('   Error:', result.data.message);
    return true;
  } else {
    console.log('❌ SECURITY ISSUE: Invalid OTP was accepted!');
    return false;
  }
}

// Test 3: Verify OTP (with correct code)
async function testValidOTP() {
  console.log('\n✅ TEST 3: Verify with Correct OTP');
  console.log('━'.repeat(50));
  console.log('Using OTP:', receivedOTP);
  
  const result = await request('/users/login-phone', 'POST', {
    phone: testPhone,
    otp: receivedOTP,
    name: 'Phone Test User'
  });
  
  if (result.ok && result.data.success) {
    console.log('✅ OTP verification successful');
    console.log('   User ID:', result.data.data._id);
    console.log('   Name:', result.data.data.name);
    console.log('   Phone:', result.data.data.phone);
    console.log('   Role:', result.data.data.role);
    console.log('   Token:', result.data.data.token.substring(0, 20) + '...');
    console.log('   Is New User:', result.data.data.isNewUser);
    return true;
  } else {
    console.log('❌ OTP verification failed');
    console.log('   Error:', result.data.message || result.error);
    return false;
  }
}

// Test 4: Resend OTP
async function testResendOTP() {
  console.log('\n🔄 TEST 4: Resend OTP');
  console.log('━'.repeat(50));
  
  // Wait a moment to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await request('/users/resend-otp', 'POST', { phone: testPhone });
  
  if (result.ok && result.data.success) {
    console.log('✅ OTP resent successfully');
    console.log('   Phone:', result.data.data.phone);
    
    if (result.data.data.otp) {
      console.log('   🔑 New OTP:', result.data.data.otp);
    }
    
    return true;
  } else {
    console.log('❌ Failed to resend OTP');
    console.log('   Error:', result.data.message || result.error);
    return false;
  }
}

// Test 5: Login existing user
async function testExistingUserLogin() {
  console.log('\n🔐 TEST 5: Login Existing User with Phone');
  console.log('━'.repeat(50));
  
  // Send new OTP
  const sendResult = await request('/users/verify-phone', 'POST', { phone: testPhone });
  
  if (!sendResult.ok) {
    console.log('❌ Failed to send OTP');
    return false;
  }
  
  const newOTP = sendResult.data.data.otp;
  console.log('   OTP sent:', newOTP);
  
  // Verify OTP
  const verifyResult = await request('/users/login-phone', 'POST', {
    phone: testPhone,
    otp: newOTP
  });
  
  if (verifyResult.ok && verifyResult.data.success) {
    console.log('✅ Existing user logged in successfully');
    console.log('   User:', verifyResult.data.data.name);
    console.log('   Is New User:', verifyResult.data.data.isNewUser);
    return true;
  } else {
    console.log('❌ Login failed');
    console.log('   Error:', verifyResult.data.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🧪 PHONE VERIFICATION TESTS                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test sending OTP
    if (await testSendOTP()) {
      passed++;
    } else {
      failed++;
    }
    
    // Test invalid OTP
    if (await testInvalidOTP()) {
      passed++;
    } else {
      failed++;
    }
    
    // Test valid OTP
    if (await testValidOTP()) {
      passed++;
    } else {
      failed++;
    }
    
    // Test resend OTP
    if (await testResendOTP()) {
      passed++;
    } else {
      failed++;
    }
    
    // Test existing user login
    if (await testExistingUserLogin()) {
      passed++;
    } else {
      failed++;
    }
    
    console.log('\n╔════════════════════════════════════════════════╗');
    
    if (failed === 0) {
      console.log('║  ✅ ALL TESTS PASSED! (' + passed + '/5)                    ║');
      console.log('║                                                ║');
      console.log('║  Phone verification system is working! 🎉     ║');
    } else {
      console.log('║  ⚠️  SOME TESTS FAILED                        ║');
      console.log('║                                                ║');
      console.log('║  Passed: ' + passed + '/' + (passed + failed) + '                                   ║');
    }
    
    console.log('╚════════════════════════════════════════════════╝');
    
    console.log('\n✨ Try the Frontend:');
    console.log('   1. Open http://localhost:5174/login-phone');
    console.log('   2. Enter phone: +961 70 123 456');
    console.log('   3. Click "Continue"');
    console.log('   4. See OTP code displayed (development mode)');
    console.log('   5. Enter OTP and verify');
    console.log('   6. Auto-redirects to /account');
    console.log('');
    
  } catch (error) {
    console.log('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
