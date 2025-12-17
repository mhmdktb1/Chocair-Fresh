import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
      sparse: true,
    },
    // Profile picture (optional)
    avatar: {
      type: String,
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

// Instance method to check if user has completed profile
userSchema.methods.isProfileComplete = function () {
  return !!(this.name && this.phone && this.email);
};

const User = mongoose.model('User', userSchema);

export default User;
