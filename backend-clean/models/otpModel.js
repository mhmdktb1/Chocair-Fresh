import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'checkout', 'profile'],
      default: 'login',
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 300 },
    },
    attemptsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'used', 'invalidated'],
      default: 'active',
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    invalidatedAt: {
      type: Date,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ phone: 1, purpose: 1, createdAt: -1 });
otpSchema.index(
  { phone: 1, purpose: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
