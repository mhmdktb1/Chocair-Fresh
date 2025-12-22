import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Order from './models/orderModel.js';

dotenv.config();

const checkData = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to: ${mongoose.connection.host}`);

    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log('-----------------------------------');
    console.log(`Users found: ${userCount}`);
    console.log(`Orders found: ${orderCount}`);
    console.log('-----------------------------------');

    if (userCount > 0) {
      const admins = await User.find({ isAdmin: true });
      console.log('-----------------------------------');
      console.log(`Admin Users found: ${admins.length}`);
      if (admins.length > 0) {
        console.log('Admins:', JSON.stringify(admins.map(u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, isAdmin: u.isAdmin })), null, 2));
      } else {
        console.log('⚠️ NO ADMIN USERS FOUND! You need to create one.');
      }
      console.log('-----------------------------------');
    }

    if (orderCount > 0) {
      const orders = await Order.find({}).limit(5);
      console.log('Sample Orders:', JSON.stringify(orders, null, 2));
    }

    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkData();
