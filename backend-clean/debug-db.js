import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
console.log('Testing connection with URI from .env...');
console.log('URI (masked):', uri.replace(/:([^@]+)@/, ':****@'));

const testConnection = async (connectionUri, label) => {
  try {
    console.log(`\nAttempting connection (${label})...`);
    await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ SUCCESS! Connected with ${label}`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ FAILED (${label}): ${error.message}`);
    return false;
  }
};

const run = async () => {
  // 1. Try exact URI
  await testConnection(uri, 'Original URI');

  // 2. Try decoding %24 to $ (if the password is literally "Mhmdktb123$")
  if (uri.includes('%24')) {
    const decodedUri = uri.replace('%24', '$');
    console.log('\nTrying with decoded $ instead of %24...');
    await testConnection(decodedUri, 'Decoded URI ($)');
  }
  
  // 3. Try encoding %24 to %2524 (if the password is literally "Mhmdktb123%24")
  if (uri.includes('%24')) {
    const encodedUri = uri.replace('%24', '%2524');
    console.log('\nTrying with double encoded %2524 instead of %24...');
    await testConnection(encodedUri, 'Double Encoded URI (%2524)');
  }

  // 4. Try lowercase username
  if (uri.includes('Chocairfresh')) {
    const lowerUserUri = uri.replace('Chocairfresh', 'chocairfresh');
    console.log('\nTrying with lowercase username "chocairfresh"...');
    await testConnection(lowerUserUri, 'Lowercase Username');
  }
};

run();
