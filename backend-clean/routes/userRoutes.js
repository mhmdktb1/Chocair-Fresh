import express from 'express';
const router = express.Router();
import {
  sendOTP,
  verifyOTP,
  registerUser,
  googleAuth,
  getUserProfile,
  updateUserProfile,
  updateUserPhone,
  getUsers,
  deleteUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Auth routes
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/register', registerUser);
router.post('/auth/google', googleAuth);

// User profile routes
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/profile/phone').put(protect, updateUserPhone);

// Admin routes (temporarily accessible)
router.route('/').get(getUsers);
router.route('/:id').delete(deleteUser);

export default router;
