/**
 * ==========================================
 * USER MODEL
 * ==========================================
 * 
 * Defines the User schema for customers and admins.
 * Includes authentication methods and password hashing.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: function() {
        // Email is required only if phone is not provided
        return !this.phone;
      },
      unique: true,
      sparse: true, // Allow multiple null values for phone-only users
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: function() {
        // Password is required only for email-based accounts
        // Phone-only users don't need a password
        return this.email && !this.phone;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    phone: {
      type: String,
      required: function() {
        // Phone is required only if email is not provided
        return !this.email;
      },
      unique: true,
      sparse: true, // Allow multiple null values for email-only users
      trim: true
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'Lebanon' }
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// ==========================================
// MIDDLEWARE - Hash password before saving
// ==========================================
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ==========================================
// METHODS - Compare passwords
// ==========================================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ==========================================
// METHODS - Get user data without sensitive info
// ==========================================
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
