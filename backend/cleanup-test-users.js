/**
 * ==========================================
 * CLEANUP TEST DATA
 * ==========================================
 * 
 * Removes test users from the database
 * Run: node backend/cleanup-test-users.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const cleanupTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete test users (phone numbers starting with +96170999)
    const result = await User.deleteMany({
      $or: [
        { phone: { $regex: /^\+96170999/ } },
        { name: /Phone Test User/ },
        { email: null } // Remove phone-only users for testing
      ]
    });

    console.log(`\n🗑️  Deleted ${result.deletedCount} test users`);
    
    // List remaining users
    const remainingUsers = await User.find({}).select('name email phone');
    console.log(`\n📋 Remaining users: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email || user.phone || 'no contact'})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanupTestUsers();
