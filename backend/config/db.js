/**
 * ==========================================
 * DATABASE CONNECTION CONFIGURATION
 * ==========================================
 * 
 * Establishes connection to MongoDB using Mongoose.
 * Handles connection events and errors.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If testing and no URI provided, use in-memory database
    if (process.env.NODE_ENV === 'test' && !uri) {
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('🧪 Using MongoDB Memory Server for testing');
    }

    if (!uri) {
      throw new Error('MONGO_URI is not defined');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(uri);

    if (process.env.NODE_ENV !== 'test') {
      console.log(`
┌─────────────────────────────────────────┐
│ ✅ MongoDB Connected Successfully       │
│ Host: ${conn.connection.host.padEnd(28)} │
│ Database: ${conn.connection.name.padEnd(24)} │
└─────────────────────────────────────────┘
      `);
    }

    // Listen for MongoDB events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('⚠️  MongoDB disconnected');
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      try {
        await mongoose.connection.close();
        console.log(`\nMongoDB connection closed through app termination (${signal})`);
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnection', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error(`
┌─────────────────────────────────────────┐
│ ❌ MongoDB Connection Failed            │
│ Error: ${error.message.slice(0, 28).padEnd(28)} │
└─────────────────────────────────────────┘
`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
