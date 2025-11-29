/**
 * ==========================================
 * ERROR HANDLING MIDDLEWARE
 * ==========================================
 * 
 * Global error handlers for the application.
 * Catches 404 errors and all other errors.
 */

/**
 * 404 Not Found Handler
 * Catches all requests to undefined routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler
 * Catches all errors and sends formatted response
 */
export const errorHandler = (err, req, res, _next) => {
  // Set status code (use existing status or default to 500)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found - Invalid ID format';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    details: err.errors || null
  });
};

/**
 * Async Handler - Wraps async functions to catch errors
 * Usage: wrap async route handlers to avoid try-catch blocks
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
