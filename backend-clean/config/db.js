import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('⚠️  WARNING: MongoDB connection failed. Server is running but DB features will not work.');
    console.log('👉 Ensure MongoDB is running locally on port 27017 OR update .env with a valid MONGO_URI.');
    // process.exit(1); // Do not crash the server
  }
};

export default connectDB;
