import crypto from 'crypto';
import VerificationGrant from '../models/verificationGrantModel.js';
import { hashVerificationToken } from './otpSecurity.js';

const GRANT_TTL_MS = 10 * 60 * 1000;

export const createVerificationGrant = async (phone, purpose) => {
  const token = crypto.randomBytes(32).toString('base64url');
  await VerificationGrant.create({
    tokenHash: hashVerificationToken(token),
    phone,
    purpose,
    expiresAt: new Date(Date.now() + GRANT_TTL_MS),
  });
  return token;
};

export const consumeVerificationGrant = async (token, phone, purpose) => {
  if (typeof token !== 'string' || !token) return null;
  return VerificationGrant.findOneAndUpdate(
    {
      tokenHash: hashVerificationToken(token),
      phone,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );
};

export const releaseVerificationGrant = async (grant) => {
  if (!grant?._id || !grant.consumedAt) return;
  await VerificationGrant.updateOne(
    { _id: grant._id, consumedAt: grant.consumedAt },
    { $set: { consumedAt: null } }
  );
};
