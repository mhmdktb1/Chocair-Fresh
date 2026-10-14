import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const getSecret = () => {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') return 'test-only-otp-hash-secret';
  throw new Error('OTP_HASH_SECRET or JWT_SECRET must be configured');
};

export const hashOtp = (code) =>
  crypto.createHmac('sha256', getSecret()).update(`otp:${String(code).trim()}`).digest('hex');

export const otpHashMatches = (storedHash, candidate) => {
  if (typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const candidateHash = Buffer.from(hashOtp(candidate), 'hex');
  const persistedHash = Buffer.from(storedHash, 'hex');
  return candidateHash.length === persistedHash.length && crypto.timingSafeEqual(candidateHash, persistedHash);
};

export const hashVerificationToken = (token) =>
  crypto.createHmac('sha256', getSecret()).update(`verification:${token}`).digest('hex');
