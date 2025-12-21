import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/orderModel.js';
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

const checkData = async () => {
  await connectDB();

  try {
    const orderCount = await Order.countDocuments();
    console.log(`Total Orders: ${orderCount}`);

    const orders = await Order.find({}).limit(5);
    console.log('First 5 Orders:', JSON.stringify(orders, null, 2));

    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkData();