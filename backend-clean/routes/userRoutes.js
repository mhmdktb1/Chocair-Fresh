import express from 'express';
const router = express.Router();
import {
  sendOTP,
  verifyOTP,
  registerUser,
  getUserProfile,
  updateUserProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// Auth routes
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/register', registerUser);

// User profile routes
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

export default router;
