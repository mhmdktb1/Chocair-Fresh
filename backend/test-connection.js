/**
 * Quick MongoDB Connection Test
 * Run: node test-connection.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log('🔍 Testing MongoDB Connection...\n');
console.log('URI (masked password):', MONGO_URI.replace(/:[^@]+@/, ':****@'));
console.log('');

mongoose.connect(MONGO_URI)
  .then((conn) => {
    console.log('✅ SUCCESS! MongoDB Connected');
    console.log('   Host:', conn.connection.host);
    console.log('   Database:', conn.connection.name);
    console.log('   Port:', conn.connection.port);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CONNECTION FAILED');
    console.error('   Error Type:', error.name);
    console.error('   Message:', error.message);
    console.error('');
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS lookup failed. Possible fixes:');
      console.log('   1. Check your internet connection');
      console.log('   2. Try using standard connection string (not SRV)');
      console.log('   3. Check if firewall is blocking MongoDB Atlas');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed. Possible fixes:');
      console.log('   1. Verify username: kotob149_db_user');
      console.log('   2. Verify password: xxvKLrGFegnxuPSw');
      console.log('   3. Check Database Access in Atlas');
      console.log('   4. Password may need URL encoding if it has special chars');
    } else if (error.message.includes('IP')) {
      console.log('💡 IP not whitelisted. Fix:');
      console.log('   1. Go to Atlas > Network Access');
      console.log('   2. Add IP 0.0.0.0/0 (Allow from Anywhere)');
    }
    
    process.exit(1);
  });
