import mongoose from 'mongoose';

const verificationGrantSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['checkout', 'registration'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

verificationGrantSchema.index({ phone: 1, purpose: 1, expiresAt: 1 });

const VerificationGrant = mongoose.model('VerificationGrant', verificationGrantSchema);

export default VerificationGrant;
