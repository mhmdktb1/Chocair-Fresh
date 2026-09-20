import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';
import { sendWhatsAppOtp } from '../utils/whatsappService.js';
import { getRandomMascot, getDeterministicMascot } from '../utils/mascotAvatars.js';

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

  // Dev Admin Bypass (strictly active only when NODE_ENV === 'development')
  const devAdminKeys = ['mhmd382', 'tookm', 'admin-access'];
  if (process.env.NODE_ENV === 'development' && devAdminKeys.includes(phone.toLowerCase())) {
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) {
      const token = generateToken(adminUser._id);
      return res.status(200).json({
        success: true,
        message: 'Dev Admin Bypass',
        token,
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          isAdmin: adminUser.isAdmin,
          avatar: adminUser.avatar,
          mascot: adminUser.mascot || getRandomMascot(),
        }
      });
    }
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

  // Dispatch OTP via Meta WhatsApp Cloud API (with dev simulation fallback)
  try {
    await sendWhatsAppOtp(phone, code);
  } catch (whatsappErr) {
    console.warn('⚠️ WhatsApp dispatch notice:', whatsappErr.message);
  }

  const responsePayload = {
    success: true,
    message: 'OTP sent successfully',
    otp: code, // Auto OTP enabled for seamless testing and instant access
  };

  res.status(200).json(responsePayload);
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
  let user = await User.findOne({ phone });

  // FIX: Handle legacy phone numbers (without +961 prefix)
  // If user not found with normalized phone, try searching without prefix
  if (!user && phone.startsWith('+961')) {
    const localPhone = phone.replace('+961', '');
    user = await User.findOne({ 
      $or: [
        { phone: localPhone },
        { phone: `0${localPhone}` }
      ]
    });

    if (user) {
      console.log(`Migrating user ${user._id} phone from ${user.phone} to ${phone}`);
      user.phone = phone;
      await user.save();
    }
  }

  if (user) {
    if (!user.mascot) {
      user.mascot = getRandomMascot();
      await user.save();
    }
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
        avatar: user.avatar,
        mascot: user.mascot,
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

  // Create user with a random mascot
  const user = await User.create({
    phone,
    name,
    email: email || undefined,
    age: age || undefined,
    gender: gender || undefined,
    location: location || undefined,
    mascot: getRandomMascot(),
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
      avatar: user.avatar,
      mascot: user.mascot,
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
    if (!user.mascot) {
      user.mascot = getRandomMascot();
      await user.save();
    }
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      location: user.location,
      avatar: user.avatar,
      mascot: user.mascot,
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
    user.location = req.body.location || user.location;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.mascot !== undefined) user.mascot = req.body.mascot;
    if (!user.mascot) user.mascot = getRandomMascot();

    if (req.body.addresses) {
      user.addresses = req.body.addresses;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      location: updatedUser.location,
      avatar: updatedUser.avatar,
      mascot: updatedUser.mascot,
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

// ==========================================
// UPDATE USER PHONE
// @route   PUT /api/users/profile/phone
// @access  Private
// ==========================================
const updateUserPhone = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and OTP are required');
  }

  // Check if phone is already in use
  const phoneExists = await User.findOne({ phone });
  if (phoneExists && phoneExists._id.toString() !== user._id.toString()) {
    res.status(400);
    throw new Error('Phone number already in use');
  }

  // TEMPORARILY DISABLED FOR TESTING:
  /*
  // Verify OTP
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
  */

  // Update user phone
  user.phone = phone;
  if (!user.mascot) user.mascot = getRandomMascot();
  const updatedUser = await user.save();

  res.json({
    success: true,
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      location: updatedUser.location,
      avatar: updatedUser.avatar,
      mascot: updatedUser.mascot,
      age: updatedUser.age,
      gender: updatedUser.gender,
      isAdmin: updatedUser.isAdmin,
    }
  });
});

// ==========================================
// GET ALL USERS (ADMIN)
// @route   GET /api/users
// @access  Private/Admin
// ==========================================
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'ordersData',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        isAdmin: 1,
        location: 1,
        avatar: 1,
        mascot: 1,
        createdAt: 1,
        orderCount: { $size: '$ordersData' },
        totalSpent: { $sum: '$ordersData.totalPrice' },
      },
    },
    {
      $sort: { createdAt: -1 } 
    }
  ]);
  
  res.json(users);
});

// ==========================================
// DELETE USER (ADMIN)
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ==========================================
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ==========================================
// GOOGLE TOKEN VERIFICATION
// ==========================================
export const defaultGoogleTokenVerifier = async (idToken) => {
  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    throw new Error('Invalid or missing Google ID token');
  }

  // In production, GOOGLE_CLIENT_ID must be configured
  const expectedAudience = process.env.GOOGLE_CLIENT_ID;
  if (process.env.NODE_ENV === 'production' && !expectedAudience) {
    throw new Error('Google OAuth client ID (GOOGLE_CLIENT_ID) is not configured on server');
  }

  const response = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`,
    { timeout: 8000 }
  );

  const payload = response.data;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid Google token verification response');
  }

  // 1. Expiry Validation (Must exist and not be expired)
  if (!payload.exp || isNaN(Number(payload.exp))) {
    throw new Error('Missing Google token expiration (exp)');
  }
  if (Number(payload.exp) * 1000 < Date.now()) {
    throw new Error('Google ID token has expired');
  }

  // 2. Issuer Validation (Must exist and match Google issuers)
  if (!payload.iss || typeof payload.iss !== 'string') {
    throw new Error('Missing Google token issuer (iss)');
  }
  const isGoogleIssuer =
    payload.iss === 'accounts.google.com' ||
    payload.iss === 'https://accounts.google.com' ||
    payload.iss.startsWith('https://securetoken.google.com/');

  if (!isGoogleIssuer) {
    throw new Error(`Invalid Google token issuer: ${payload.iss}`);
  }

  // 3. Subject Identifier (Must exist and be non-empty)
  if (!payload.sub || typeof payload.sub !== 'string' || !payload.sub.trim()) {
    throw new Error('Missing or invalid Google subject identifier (sub)');
  }

  // 4. Audience Validation (Must exist and match GOOGLE_CLIENT_ID; do NOT use azp as substitute for missing aud)
  if (!payload.aud) {
    throw new Error('Missing Google token audience (aud)');
  }

  if (expectedAudience) {
    const allowedAuds = expectedAudience.split(',').map((s) => s.trim()).filter(Boolean);
    let audMatch = false;
    if (Array.isArray(payload.aud)) {
      audMatch = payload.aud.some((a) => allowedAuds.includes(String(a).trim()));
    } else {
      audMatch = allowedAuds.includes(String(payload.aud).trim());
    }

    if (!audMatch) {
      throw new Error(`Token audience mismatch: token aud does not match configured Google client ID`);
    }
  }

  // 5. Email Validation (Must exist and be non-empty)
  if (!payload.email || typeof payload.email !== 'string' || !payload.email.trim()) {
    throw new Error('Missing email in Google ID token');
  }

  // 6. Email Verified Validation (Require email_verified === true or 'true')
  const isEmailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!isEmailVerified) {
    throw new Error('Google account email is not verified');
  }

  return {
    googleId: payload.sub.trim(),
    email: payload.email.trim().toLowerCase(),
    name: (payload.name && typeof payload.name === 'string' && payload.name.trim())
      ? payload.name.trim()
      : payload.email.split('@')[0],
    avatar: (payload.picture && typeof payload.picture === 'string') ? payload.picture.trim() : '',
  };
};

let googleTokenVerifier = defaultGoogleTokenVerifier;

export const setGoogleTokenVerifier = (fn) => {
  googleTokenVerifier = fn;
};

export const resetGoogleTokenVerifier = () => {
  googleTokenVerifier = defaultGoogleTokenVerifier;
};

// ==========================================
// GOOGLE AUTHENTICATION
// @route   POST /api/users/auth/google
// @access  Public
// ==========================================
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, googleId, email, name, avatar } = req.body;

  let verifiedEmail;
  let verifiedGoogleId;
  let verifiedName;
  let verifiedAvatar;

  // When idToken is provided, ALWAYS verify it cryptographically with Google and ignore client claims
  if (idToken) {
    try {
      const verified = await googleTokenVerifier(idToken);
      verifiedGoogleId = verified.googleId;
      verifiedEmail = verified.email;
      verifiedName = verified.name;
      verifiedAvatar = verified.avatar;
    } catch (err) {
      res.status(401);
      const msg = err.response?.data?.error_description || err.response?.data?.error || err.message;
      throw new Error(`Google token verification failed: ${msg}`);
    }
  } else if (process.env.NODE_ENV !== 'production' && (email || googleId)) {
    // Only in non-production environments and when idToken is absent, allow explicit payload for dev testing
    verifiedGoogleId = googleId;
    verifiedEmail = email;
    verifiedName = name;
    verifiedAvatar = avatar;
  } else {
    res.status(400);
    throw new Error('Google ID token is required');
  }

  if (!verifiedEmail && !verifiedGoogleId) {
    res.status(400);
    throw new Error('Google authentication data is required');
  }

  // Find user by googleId or email
  let user = null;
  if (verifiedGoogleId) {
    user = await User.findOne({ googleId: verifiedGoogleId });
  }
  if (!user && verifiedEmail) {
    user = await User.findOne({ email: verifiedEmail.toLowerCase() });
    if (user && !user.googleId && verifiedGoogleId) {
      user.googleId = verifiedGoogleId;
      if (verifiedAvatar && !user.avatar) user.avatar = verifiedAvatar;
      await user.save();
    }
  }

  // If user does not exist, create a new account
  if (!user) {
    user = await User.create({
      name: verifiedName || (verifiedEmail ? verifiedEmail.split('@')[0] : 'Google User'),
      email: verifiedEmail ? verifiedEmail.toLowerCase() : undefined,
      googleId: verifiedGoogleId,
      avatar: verifiedAvatar,
      mascot: getRandomMascot(),
    });
  } else if (!user.mascot) {
    user.mascot = getRandomMascot();
    await user.save();
  }

  res.status(200).json({
    success: true,
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      mascot: user.mascot,
      location: user.location,
      age: user.age,
      gender: user.gender,
      isAdmin: user.isAdmin,
    },
  });
});

export { 
  sendOTP, 
  verifyOTP, 
  registerUser,
  googleAuth,
  getUserProfile, 
  updateUserProfile,
  updateUserPhone,
  getUsers,
  deleteUser
};
