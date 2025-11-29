/**
 * ==========================================
 * CHOCAIR FRESH - MAIN SERVER FILE
 * ==========================================
 * 
 * This is the entry point for the backend API.
 * It configures Express, middleware, routes, and starts the server.
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { validateEnv } from './utils/validateEnv.js';
import mongoose from 'mongoose';

// Import Routes
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Initialize Express app
const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('dev'));

// Body parser middleware (parse JSON requests)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware (allow frontend to communicate with backend)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// ==========================================
// ROUTES
// ==========================================

// Test route to verify API is running
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API running ✅',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  res.status(200).json({ 
    ok: true,
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    db: dbStatus[dbState] || 'unknown',
    timestamp: Date.now()
  });
});

// Silence favicon 404s
app.get('/favicon.ico', (_, res) => res.status(204).end());

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Chocair Fresh API 🥬🍓',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      test: '/api/test',
      health: '/api/health'
    }
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// 404 Not Found handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

let server;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🥬 CHOCAIR FRESH API SERVER 🍓      ║
║                                        ║
║   Server running on port ${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   URL: http://localhost:${PORT}         ║
║                                        ║
║   API Docs: http://localhost:${PORT}/   ║
╚════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    console.error('❌ Server error event:', err);
  });
}

process.on('exit', (code) => {
  console.log(`⚠️  Process exiting with code ${code}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log('Name:', err.name);
  console.log('Message:', err.message);
  if (err.stack) {
    console.log('Stack:', err.stack);
  }
  // Give a short delay to flush logs
  if (server) {
    server.close(() => process.exit(1));
  } else {
    setTimeout(() => process.exit(1), 250);
  }
});

export default app;
