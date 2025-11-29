/**
 * ==========================================
 * PHONE AUTHENTICATION FLOW TEST
 * ==========================================
 * 
 * Tests the new registration flow:
 * 1. Send OTP
 * 2. Verify OTP (should return requiresRegistration for new users)
 * 3. Complete registration with name
 * 4. Login existing user (should skip registration)
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const NEW_USER_PHONE = '+961 70 999 777';
const EXISTING_USER_PHONE = '+961 70 999 888';

async function testNewUserFlow() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST: NEW USER REGISTRATION FLOW          ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Send OTP to new phone number
    console.log('📱 Step 1: Sending OTP to new user...');
    const otpResponse = await axios.post(`${API_URL}/users/verify-phone`, { 
      phone: NEW_USER_PHONE 
    });

    const otpData = otpResponse.data;
    
    if (!otpData.success) {
      console.log('❌ Failed to send OTP:', otpData.message);
      return;
    }

    console.log('✅ OTP sent successfully');
    console.log(`   Phone: ${otpData.data.phone}`);
    console.log(`   User exists: ${otpData.data.userExists}`);
    console.log(`   🔑 OTP: ${otpData.data.otp}`);

    const otp = otpData.data.otp;

    // Step 2: Verify OTP without name (should require registration)
    console.log('\n📱 Step 2: Verifying OTP without name...');
    const verifyResponse = await axios.post(`${API_URL}/users/login-phone`, {
      phone: otpData.data.phone, 
      otp
    });

    const verifyData = verifyResponse.data;

    if (verifyData.requiresRegistration) {
      console.log('✅ Registration required (as expected for new user)');
      console.log(`   Message: ${verifyData.message}`);
    } else {
      console.log('❌ Should require registration for new user');
      return;
    }

    // Step 3: Complete registration with name
    console.log('\n📱 Step 3: Completing registration with name...');
    
    // Need to resend OTP first since we consumed it
    const resendResponse = await axios.post(`${API_URL}/users/resend-otp`, {
      phone: otpData.data.phone
    });

    const resendData = resendResponse.data;
    const newOtp = resendData.data.otp;

    console.log(`   New OTP: ${newOtp}`);

    const registerResponse = await axios.post(`${API_URL}/users/login-phone`, {
      phone: otpData.data.phone, 
      otp: newOtp,
      name: 'Test New User'
    });

    const registerData = registerResponse.data;

    if (registerData.success && registerData.data) {
      console.log('✅ Registration completed successfully');
      console.log(`   User ID: ${registerData.data._id}`);
      console.log(`   Name: ${registerData.data.name}`);
      console.log(`   Phone: ${registerData.data.phone}`);
      console.log(`   Is New User: ${registerData.data.isNewUser}`);
      console.log(`   Token: ${registerData.data.token.substring(0, 20)}...`);
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testExistingUserFlow() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST: EXISTING USER LOGIN FLOW            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Send OTP to existing phone number
    console.log('📱 Step 1: Sending OTP to existing user...');
    const otpResponse = await axios.post(`${API_URL}/users/verify-phone`, {
      phone: EXISTING_USER_PHONE
    });

    const otpData = otpResponse.data;
    
    if (!otpData.success) {
      console.log('❌ Failed to send OTP:', otpData.message);
      return;
    }

    console.log('✅ OTP sent successfully');
    console.log(`   Phone: ${otpData.data.phone}`);
    console.log(`   User exists: ${otpData.data.userExists}`);
    console.log(`   🔑 OTP: ${otpData.data.otp}`);

    const otp = otpData.data.otp;

    // Step 2: Verify OTP (should login directly without registration)
    console.log('\n📱 Step 2: Verifying OTP for existing user...');
    const loginResponse = await axios.post(`${API_URL}/users/login-phone`, {
      phone: otpData.data.phone, 
      otp
    });

    const loginData = loginResponse.data;

    if (loginData.success && loginData.data && !loginData.requiresRegistration) {
      console.log('✅ Login successful (existing user)');
      console.log(`   User ID: ${loginData.data._id}`);
      console.log(`   Name: ${loginData.data.name}`);
      console.log(`   Phone: ${loginData.data.phone}`);
      console.log(`   Is New User: ${loginData.data.isNewUser}`);
      console.log(`   Token: ${loginData.data.token.substring(0, 20)}...`);
    } else if (loginData.requiresRegistration) {
      console.log('❌ Should NOT require registration for existing user');
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  await testNewUserFlow();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testExistingUserFlow();
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  ✅ ALL TESTS COMPLETED                        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
})();
