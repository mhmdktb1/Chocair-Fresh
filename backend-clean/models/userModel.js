import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getRandomMascot, MASCOT_KEYS } from '../utils/mascotAvatars.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
    },
    age: {
      type: Number,
      min: 13,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    location: {
      type: String,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // For Google OAuth users - store their Google ID
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Profile picture (optional custom URL)
    avatar: {
      type: String,
    },
    // Mascot avatar key (e.g., 'apple', 'avocado', 'carrot', etc.)
    mascot: {
      type: String,
      enum: MASCOT_KEYS,
      default: getRandomMascot,
    },
    // Saved addresses for faster checkout
    addresses: [
      {
        label: String, // e.g., "Home", "Work"
        address: String,
        city: String,
        postalCode: String,
        country: { type: String, default: 'Lebanon' },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: ensure user has a mascot assigned
userSchema.pre('save', function (next) {
  if (!this.mascot) {
    this.mascot = getRandomMascot();
  }
  next();
});

// Instance method to check if user has completed profile
userSchema.methods.isProfileComplete = function () {
  return !!(this.name && this.phone && this.email);
};

const User = mongoose.model('User', userSchema);

export default User;
