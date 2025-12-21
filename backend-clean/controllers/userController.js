import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';

// ==========================================
// GENERATE OTP CODE
// ==========================================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==========================================
// SEND OTP TO PHONE
// @route   POST /api/users/auth/send-otp
// @access  Public
// ==========================================
const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  // Generate 6-digit OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Ensure we have a DB connection before attempting DB ops
  if (mongoose.connection.readyState !== 1) {
    console.error('📛 MongoDB not connected - cannot send OTP');
    res.status(503).json({ success: false, message: 'Database not connected. Try again later.' });
    return;
  }

  // Delete any existing OTPs for this phone (guard against failures)
  try {
    await OTP.deleteMany({ phone });
  } catch (err) {
    console.warn('⚠️ Failed to clear existing OTPs:', err.message || err);
    // Do not block the flow for non-fatal DB errors; continue to create new OTP
  }

  // Save new OTP
  await OTP.create({
    phone,
    code,
    expiresAt,
  });

  // TODO: Send SMS via Twilio/SNS/etc.
  // For now, log it to console for development
  console.log(`📱 OTP for ${phone}: ${code}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    // Send OTP in response ONLY in development
    ...(process.env.NODE_ENV === 'development' && { otp: code }),
  });
});

// ==========================================
// VERIFY OTP AND CHECK USER STATUS
// @route   POST /api/users/auth/verify-otp
// @access  Public
// ==========================================
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and OTP code are required');
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({
    phone,
    code,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as verified
  otpRecord.verified = true;
  await otpRecord.save();

  // Check if user exists
  const user = await User.findOne({ phone });

  if (user) {
    // Existing user - return user data (they're now logged in)
    res.status(200).json({
      success: true,
      isNewUser: false,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        age: user.age,
        gender: user.gender,
        isAdmin: user.isAdmin,
      },
    });
  } else {
    // New user - they need to complete registration
    res.status(200).json({
      success: true,
      isNewUser: true,
      phone,
    });
  }
});

// ==========================================
// REGISTER NEW USER
// @route   POST /api/users/auth/register
// @access  Public
// ==========================================
const registerUser = asyncHandler(async (req, res) => {
  const { phone, name, email, age, gender, location } = req.body;

  if (!phone || !name) {
    res.status(400);
    throw new Error('Phone number and name are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists with this phone number');
  }

  // Create user
  const user = await User.create({
    phone,
    name,
    email: email || undefined,
    age: age || undefined,
    gender: gender || undefined,
    location: location || undefined,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      location: user.location,
      age: user.age,
      gender: user.gender,
      isAdmin: user.isAdmin,
    },
  });
});

// ==========================================
// GET USER PROFILE
// @route   GET /api/users/profile
// @access  Private
// ==========================================
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      age: user.age,
      gender: user.gender,
      isAdmin: user.isAdmin,
      addresses: user.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ==========================================
// UPDATE USER PROFILE
// @route   PUT /api/users/profile
// @access  Private
// ==========================================
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.age = req.body.age || user.age;
    user.gender = req.body.gender || user.gender;

    if (req.body.addresses) {
      user.addresses = req.body.addresses;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      isAdmin: updatedUser.isAdmin,
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { sendOTP, verifyOTP, registerUser, getUserProfile, updateUserProfile };
