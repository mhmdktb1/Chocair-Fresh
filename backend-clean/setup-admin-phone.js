import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const setupAdmin = async () => {
  await connectDB();

  try {
    const phone = '+96170999888'; // Admin Phone Number
    
    // Check if user exists
    let user = await User.findOne({ phone });

    if (user) {
      console.log('Updating existing user to Admin...');
      user.isAdmin = true;
      user.name = 'Admin User';
      user.email = 'admin@chocair.com';
      await user.save();
    } else {
      console.log('Creating new Admin user...');
      user = await User.create({
        name: 'Admin User',
        phone: phone,
        email: 'admin@chocair.com',
        isAdmin: true,
        location: 'Headquarters'
      });
    }

    console.log(`\n✅ Admin Setup Complete!`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`📱 Phone: ${user.phone}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🛡️ Role: Admin`);
    console.log(`\n👉 Login using phone number: 70 999 888`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

setupAdmin();