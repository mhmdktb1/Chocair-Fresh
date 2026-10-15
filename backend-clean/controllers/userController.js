import asyncHandler from '../middleware/asyncHandler.js';
import crypto from 'crypto';
import process from 'node:process';
import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import { hashOtp, otpHashMatches } from '../utils/otpSecurity.js';
import { createVerificationGrant, consumeVerificationGrant } from '../utils/verificationGrant.js';
import generateToken from '../utils/generateToken.js';
import { normalizePhoneForWhatsApp, sendWhatsAppOtp } from '../utils/whatsappService.js';
import { getRandomMascot } from '../utils/mascotAvatars.js';

// ==========================================
// KNOWN ADMIN PHONE NUMBERS & CHECK HELPER
// ==========================================
export const ADMIN_PHONE_NUMBERS = [
  '+96170516382',
  '70516382',
  '070516382',
  '+9618199999',
  '8199999',
];

export const checkIsAdminPhone = (phone) => {
  if (!phone) return false;
  const clean = String(phone).replace(/[\s\-()]+/g, '').replace(/^00/, '+');
  const digitsOnly = clean.replace(/\D/g, '');
  return ADMIN_PHONE_NUMBERS.some((adminNum) => {
    const cleanAdmin = adminNum.replace(/[\s\-()]+/g, '').replace(/^00/, '+');
    const adminDigits = cleanAdmin.replace(/\D/g, '');
    if (clean === cleanAdmin) return true;
    if (digitsOnly === adminDigits) return true;
    if (digitsOnly.length >= 7 && adminDigits.length >= 7) {
      if (digitsOnly.endsWith(adminDigits) || adminDigits.endsWith(digitsOnly)) return true;
    }
    return false;
  });
};

// ==========================================
// OTP AUTH HELPERS
// ==========================================
const OTP_DEFAULT_PURPOSE = 'login';
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_REQUESTS_PER_PHONE = 5;
const OTP_MAX_REQUESTS_PER_IP = 50;
const otpRateLimitStore = new Map();

const normalizeOtpPhone = (phone) => {
  if (typeof phone !== 'string') {
    return null;
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const digits = normalizePhoneForWhatsApp(trimmed);
    return `+${digits}`;
  } catch {
    return null;
  }
};

const getOtpPurpose = (purpose, fallback = OTP_DEFAULT_PURPOSE) => {
  if (purpose === undefined || purpose === null || purpose === '') return fallback;
  if (typeof purpose !== 'string') return null;
  const value = purpose.trim().toLowerCase();
  if (value === 'checkout' || value === 'login' || value === 'profile') {
    return value;
  }
  return null;
};

const consumeOtpCode = async (phone, purposes, code) => {
  const otpRecord = await OTP.findOne({
    phone,
    purpose: { $in: purposes },
    status: 'active',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) return null;

  if (!otpHashMatches(otpRecord.codeHash, code)) {
    const failedAttempt = await OTP.findOneAndUpdate(
      {
        _id: otpRecord._id,
        status: 'active',
        expiresAt: { $gt: new Date() },
        attemptsUsed: { $lt: OTP_MAX_ATTEMPTS },
      },
      { $inc: { attemptsUsed: 1 } },
      { new: true }
    );

    if (!failedAttempt || failedAttempt.attemptsUsed >= OTP_MAX_ATTEMPTS) {
      await OTP.updateOne(
        { _id: otpRecord._id, status: 'active', attemptsUsed: { $gte: OTP_MAX_ATTEMPTS } },
        { $set: { status: 'invalidated', verified: true, invalidatedAt: new Date() } }
      );
    }
    return null;
  }

  return OTP.findOneAndUpdate(
    {
      _id: otpRecord._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
      attemptsUsed: { $lt: OTP_MAX_ATTEMPTS },
      codeHash: otpRecord.codeHash,
    },
    {
      $inc: { attemptsUsed: 1 },
      $set: {
        verified: true,
        status: 'used',
        usedAt: new Date(),
        expiresAt: new Date(),
      },
    },
    { new: true }
  );
};

const invalidatePreviousOtpRecords = async (phone, purpose) => {
  if (!phone || !purpose) return;

  await OTP.updateMany(
    {
      phone,
      purpose,
      status: 'active',
    },
    {
      $set: {
        status: 'invalidated',
        invalidatedAt: new Date(),
        verified: true,
      },
    }
  );
};

const enforceOtpRateLimit = (phone, ipAddress) => {
  const normalizedPhone = normalizeOtpPhone(phone);
  const now = Date.now();
  const phoneKey = `phone:${normalizedPhone || 'unknown'}`;
  const ipKey = `ip:${ipAddress || 'unknown'}`;
  const phoneEntry = otpRateLimitStore.get(phoneKey) || { timestamps: [] };
  const ipEntry = otpRateLimitStore.get(ipKey) || { timestamps: [] };

  phoneEntry.timestamps = phoneEntry.timestamps.filter((ts) => now - ts < OTP_RATE_LIMIT_WINDOW_MS);
  ipEntry.timestamps = ipEntry.timestamps.filter((ts) => now - ts < OTP_RATE_LIMIT_WINDOW_MS);
  if (phoneEntry.timestamps.some((ts) => now - ts < OTP_RESEND_COOLDOWN_MS)) {
    throw new Error('Please wait 30 seconds before requesting another verification code.');
  }
  if (phoneEntry.timestamps.length >= OTP_MAX_REQUESTS_PER_PHONE) {
    throw new Error('Too many verification codes requested for this phone number. Try again later.');
  }
  if (ipEntry.timestamps.length >= OTP_MAX_REQUESTS_PER_IP) {
    throw new Error('Too many OTP requests from this network. Try again later.');
  }

  phoneEntry.timestamps.push(now);
  ipEntry.timestamps.push(now);
  otpRateLimitStore.set(phoneKey, phoneEntry);
  otpRateLimitStore.set(ipKey, ipEntry);
};

const findUserByPhone = async (phone) => {
  const normalizedPhone = normalizeOtpPhone(phone);
  if (!normalizedPhone) {
    return null;
  }

  let user = await User.findOne({ phone: normalizedPhone });
  if (user) {
    return user;
  }

  const barePhone = normalizedPhone.replace('+961', '');
  const legacyCandidates = [barePhone, `0${barePhone}`];

  user = await User.findOne({
    $or: legacyCandidates.map((candidate) => ({ phone: candidate })),
  });

  if (user) {
    user.phone = normalizedPhone;
    await user.save();
  }

  return user;
};

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ==========================================
// SEND OTP TO PHONE
// @route   POST /api/users/auth/send-otp
// @access  Public
// ==========================================
const sendOTP = asyncHandler(async (req, res) => {
  const { phone, purpose } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const normalizedPhone = normalizeOtpPhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error('Please enter a valid phone number.');
  }

  const activePurpose = getOtpPurpose(purpose);
  if (!activePurpose) {
    res.status(400);
    throw new Error('Invalid OTP purpose');
  }

  try {
    enforceOtpRateLimit(normalizedPhone, req.ip);
  } catch (error) {
    return res.status(429).json({
      success: false,
      message: error.message || 'Too many OTP requests. Please try again later.',
    });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (mongoose.connection.readyState !== 1) {
    console.error('📛 MongoDB not connected - cannot send OTP');
    res.status(503).json({ success: false, message: 'Database not connected. Try again later.' });
    return;
  }

  const codeHash = hashOtp(code);
  let otpRecord;
  try {
    otpRecord = await OTP.create({
      phone: normalizedPhone,
      purpose: activePurpose,
      codeHash,
      expiresAt,
      attemptsUsed: 0,
      status: 'pending',
      verified: false,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(429).json({
        success: false,
        message: 'A verification code is already being issued. Please wait and try again.',
      });
    }
    throw error;
  }

  let whatsappResult = { success: false };
  try {
    whatsappResult = await sendWhatsAppOtp(normalizedPhone, code);
  } catch {
    console.error('WhatsApp OTP dispatch failed unexpectedly');
    whatsappResult = { success: false };
  }

  if (!whatsappResult?.success) {
    await OTP.deleteOne({ _id: otpRecord._id }).catch(() => {
      console.error('Could not remove pending OTP after WhatsApp delivery failure');
    });

    return res.status(502).json({
      success: false,
      message: 'Failed to deliver OTP via WhatsApp. Please check your phone number and try again.',
    });
  }

  try {
    await invalidatePreviousOtpRecords(normalizedPhone, activePurpose);
    const activatedOtp = await OTP.findOneAndUpdate(
      { _id: otpRecord._id, status: 'pending', expiresAt: { $gt: new Date() } },
      { $set: { status: 'active' } },
      { new: true }
    );
    if (!activatedOtp) {
      throw new Error('The OTP expired before it could be activated.');
    }
  } catch (error) {
    await OTP.updateOne(
      { _id: otpRecord._id, status: 'pending' },
      { $set: { status: 'invalidated', verified: true, invalidatedAt: new Date() } }
    ).catch(() => {
      console.error('Could not invalidate pending OTP after activation failure');
    });
    if (error.code === 11000) {
      return res.status(429).json({
        success: false,
        message: 'Another verification code was issued. Please use the most recently received code.',
      });
    }
    console.error('Could not activate OTP after WhatsApp accepted the message');
    return res.status(503).json({
      success: false,
      message: 'The verification code could not be activated. Please request a new code.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your WhatsApp',
  });
});

// ==========================================
// VERIFY OTP AND CHECK USER STATUS
// @route   POST /api/users/auth/verify-otp
// @access  Public
// ==========================================
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, code, purpose } = req.body;

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and OTP code are required');
  }

  const normalizedPhone = normalizeOtpPhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error('Please enter a valid phone number.');
  }

  const activePurpose = getOtpPurpose(purpose);
  if (!activePurpose) {
    res.status(400);
    throw new Error('Invalid OTP purpose');
  }
  const otpCandidate = String(code).trim();

  const updatedOtpRecord = await consumeOtpCode(normalizedPhone, [activePurpose], otpCandidate);
  if (!updatedOtpRecord) {
    return res.status(400).json({
      success: false,
      message: 'Invalid, expired, or exhausted OTP',
    });
  }

  await OTP.updateMany(
    {
      phone: normalizedPhone,
      purpose: activePurpose,
      _id: { $ne: updatedOtpRecord._id },
      status: 'active',
    },
    {
      $set: {
        status: 'invalidated',
        invalidatedAt: new Date(),
        verified: true,
      },
    }
  );

  if (activePurpose === 'checkout') {
    const checkoutVerificationToken = await createVerificationGrant(normalizedPhone, 'checkout');
    const user = await findUserByPhone(normalizedPhone);

    if (!user) {
      return res.status(200).json({
        success: true,
        purpose: 'checkout',
        isNewUser: true,
        phone: normalizedPhone,
        checkoutVerificationToken,
        registrationToken: await createVerificationGrant(normalizedPhone, 'registration'),
      });
    }

    if (checkIsAdminPhone(normalizedPhone) || checkIsAdminPhone(user.phone)) {
      if (!user.isAdmin) {
        user.isAdmin = true;
        await user.save();
      }
    }
    if (!user.mascot) {
      user.mascot = getRandomMascot();
      await user.save();
    }

    return res.status(200).json({
      success: true,
      purpose: 'checkout',
      isNewUser: false,
      checkoutVerificationToken,
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
  }

  const user = await findUserByPhone(normalizedPhone);

  if (user) {
    if (checkIsAdminPhone(normalizedPhone) || checkIsAdminPhone(user.phone)) {
      if (!user.isAdmin) {
        user.isAdmin = true;
        await user.save();
      }
    }
    if (!user.mascot) {
      user.mascot = getRandomMascot();
      await user.save();
    }

    return res.status(200).json({
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
  }

  return res.status(200).json({
    success: true,
    isNewUser: true,
    phone: normalizedPhone,
    registrationToken: await createVerificationGrant(normalizedPhone, 'registration'),
  });
});

// ==========================================
// REGISTER NEW USER
// @route   POST /api/users/auth/register
// @access  Public
// ==========================================
const registerUser = asyncHandler(async (req, res) => {
  const { phone, name, email, age, gender, location, registrationToken } = req.body;

  if (!phone || !name) {
    res.status(400);
    throw new Error('Phone number and name are required');
  }

  const normalizedPhone = normalizeOtpPhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error('Please enter a valid phone number.');
  }

  const existingUser = await findUserByPhone(normalizedPhone);
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists with this phone number');
  }

  const verifiedRegistration = await consumeVerificationGrant(
    registrationToken,
    normalizedPhone,
    'registration'
  );
  if (!verifiedRegistration) {
    res.status(403);
    throw new Error('Verify this phone number before registering.');
  }

  const isAdmin = checkIsAdminPhone(normalizedPhone);

  const user = await User.create({
    phone: normalizedPhone,
    name,
    email: email || undefined,
    age: age || undefined,
    gender: gender || undefined,
    location: location || undefined,
    isAdmin,
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
    if (checkIsAdminPhone(user.phone) && !user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }
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

    if (req.body.addresses !== undefined && Array.isArray(req.body.addresses)) {
      user.addresses = req.body.addresses
        .filter((addr) => addr && typeof addr === 'object' && typeof addr.address === 'string' && addr.address.trim())
        .map((addr) => {
          const cleanAddr = {
            label: addr.label || 'Home',
            address: addr.address.trim(),
            city: addr.city || 'Beirut',
            notes: addr.notes || '',
            postalCode: addr.postalCode || '',
            country: addr.country || 'Lebanon',
            isDefault: Boolean(addr.isDefault),
          };
          if (addr._id && mongoose.Types.ObjectId.isValid(String(addr._id)) && String(addr._id).length === 24) {
            cleanAddr._id = addr._id;
          }
          return cleanAddr;
        });
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
  const { phone, code, purpose } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and OTP are required');
  }

  const normalizedPhone = normalizeOtpPhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error('Please enter a valid phone number.');
  }

  const phoneExists = await User.findOne({ phone: normalizedPhone });
  if (phoneExists && phoneExists._id.toString() !== user._id.toString()) {
    res.status(400);
    throw new Error('Phone number already in use');
  }

  const activeOtpPurpose = getOtpPurpose(purpose, 'profile');
  if (!activeOtpPurpose || activeOtpPurpose === 'checkout') {
    res.status(400);
    throw new Error('Invalid OTP purpose');
  }

  const otpRecord = await consumeOtpCode(
    normalizedPhone,
    activeOtpPurpose === 'profile' ? ['profile', 'login'] : [activeOtpPurpose],
    code
  );
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.phone = normalizedPhone;
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
