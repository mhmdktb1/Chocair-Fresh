import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable is missing.');
      }

      const decoded = jwt.verify(token, secret || 'test_jwt_secret_fallback');

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.error(`Auth Failed: User not found for ID ${decoded.id}`);
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    console.error(`Admin Auth Failed: User ${req.user?._id} is not admin`);
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

// Optional authentication - attaches req.user if a valid token is present, but allows guest requests through
const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret || 'test_jwt_secret_fallback');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // In optional auth, invalid token simply means user remains guest
      req.user = null;
    }
  }

  next();
});

export { protect, admin, optionalProtect };
