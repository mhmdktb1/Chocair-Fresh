import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';
import { sendWhatsAppOtp } from '../utils/whatsappService.js';

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
  await sendWhatsAppOtp(phone, code);

  const responsePayload = {
    success: true,
    message: 'OTP sent successfully',
  };

  // Only expose OTP in local development/test environments for development convenience.
  // In production, OTP is NEVER returned in the API response.
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    responsePayload.otp = code;
  }

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
    // Try exact match with local number (e.g. "70123456")
    // Or with leading zero if it was an 03 number (e.g. "03123456" -> "3123456" in normalized, but maybe "03123456" in DB?)
    // Actually, normalized 03 is +9613xxxxxx. Local is 3xxxxxx.
    // DB might have 03xxxxxx.
    
    // Search for both local variants
    user = await User.findOne({ 
      $or: [
        { phone: localPhone }, // e.g. "70123456"
        { phone: `0${localPhone}` } // e.g. "070123456" (unlikely) or "03xxxxxx"
      ]
    });

    // If found, update their phone number to the new normalized format
    if (user) {
      console.log(`Migrating user ${user._id} phone from ${user.phone} to ${phone}`);
      user.phone = phone;
      await user.save();
    }
  }

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
      location: user.location,
      avatar: user.avatar,
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
    user.avatar = req.body.avatar || user.avatar;

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

  // Update user phone
  user.phone = phone;
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
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Invalid or missing Google ID token');
  }

  const response = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { timeout: 8000 }
  );

  const payload = response.data;
  if (!payload || (!payload.sub && !payload.user_id && !payload.email)) {
    throw new Error('Invalid Google token verification response');
  }

  // 1. Expiry Check
  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    throw new Error('Google ID token has expired');
  }

  // 2. Issuer Validation
  if (payload.iss) {
    const isGoogleIssuer =
      payload.iss === 'accounts.google.com' ||
      payload.iss === 'https://accounts.google.com' ||
      payload.iss.startsWith('https://securetoken.google.com/');

    if (!isGoogleIssuer) {
      throw new Error(`Invalid Google token issuer: ${payload.iss}`);
    }
  }

  // 3. Audience Validation
  const expectedAudience = process.env.GOOGLE_CLIENT_ID;
  if (expectedAudience) {
    const audArray = expectedAudience.split(',').map((s) => s.trim()).filter(Boolean);
    const tokenAud = payload.aud || payload.azp;
    if (!tokenAud || !audArray.includes(tokenAud)) {
      throw new Error(`Token audience mismatch: expected ${expectedAudience}, got ${tokenAud}`);
    }
  }

  // 4. Require email_verified === true when email is present
  if (payload.email) {
    const isEmailVerified =
      payload.email_verified === 'true' ||
      payload.email_verified === true ||
      payload.verified_email === true;
    if (payload.email_verified !== undefined && !isEmailVerified) {
      throw new Error('Google account email is not verified');
    }
  }

  return {
    googleId: payload.sub || payload.user_id,
    email: payload.email,
    name: payload.name || (payload.email ? payload.email.split('@')[0] : 'Google User'),
    avatar: payload.picture || '',
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
    });
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
