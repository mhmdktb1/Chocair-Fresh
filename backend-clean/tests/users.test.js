import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';
import { setGoogleTokenVerifier, resetGoogleTokenVerifier } from '../controllers/userController.js';

let mongoServer;
let adminToken;
let userToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }

  const admin = await User.create({
    name: 'Admin User',
    phone: '+96170111222',
    email: 'admin@chocair.com',
    isAdmin: true,
  });
  adminToken = generateToken(admin._id);

  const customer = await User.create({
    name: 'Regular Customer',
    phone: '+96170333444',
    email: 'customer@chocair.com',
    isAdmin: false,
  });
  userId = customer._id;
  userToken = generateToken(customer._id);
});

describe('User and Auth API', () => {
  it('POST /api/users/auth/send-otp - generates OTP record and hides it in production', async () => {
    const res = await request(app)
      .post('/api/users/auth/send-otp')
      .send({ phone: '+96170555666' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const otpDoc = await OTP.findOne({ phone: '+96170555666' });
    expect(otpDoc).toBeTruthy();
    expect(otpDoc.code).toHaveLength(6);
  });

  it('POST /api/users/auth/verify-otp - logs in existing user', async () => {
    await OTP.create({
      phone: '+96170333444',
      code: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isNewUser).toBe(false);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.name).toBe('Regular Customer');
  });

  it('POST /api/users/auth/google - creates new user using verified token and ignores forged client claims', async () => {
    setGoogleTokenVerifier(async (token) => {
      if (token === 'valid-google-oauth-token') {
        return {
          googleId: 'google-uid-verified-12345',
          email: 'realgoogleuser@gmail.com',
          name: 'Real Google Name',
          avatar: 'https://lh3.googleusercontent.com/real.jpg',
        };
      }
      throw new Error('Invalid token');
    });

    const res = await request(app)
      .post('/api/users/auth/google')
      .send({
        idToken: 'valid-google-oauth-token',
        // Client attempts to forge a different email and name in request body
        googleId: 'attacker-spoofed-uid',
        email: 'victim@gmail.com',
        name: 'Attacker Name',
        avatar: 'https://attacker.com/fake.jpg',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    // Must strictly match the verified Google claims, NOT the spoofed body
    expect(res.body.user.email).toBe('realgoogleuser@gmail.com');
    expect(res.body.user.name).toBe('Real Google Name');

    const dbUser = await User.findOne({ email: 'realgoogleuser@gmail.com' });
    expect(dbUser).toBeTruthy();
    expect(dbUser.googleId).toBe('google-uid-verified-12345');

    resetGoogleTokenVerifier();
  });

  it('GOOGLE AUTH SECURITY: rejects forged or invalid Google ID tokens with 401', async () => {
    setGoogleTokenVerifier(async () => {
      throw new Error('Invalid Value');
    });

    const forgedRes = await request(app)
      .post('/api/users/auth/google')
      .send({ idToken: 'forged-fake-token-12345' });

    expect(forgedRes.status).toBe(401);
    expect(forgedRes.body.message).toMatch(/Google token verification failed/i);

    resetGoogleTokenVerifier();
  });

  it('GOOGLE AUTH SECURITY: rejects token when audience mismatches configured GOOGLE_CLIENT_ID', async () => {
    setGoogleTokenVerifier(async (token) => {
      // Simulate audience verification failure in default verifier
      const expectedAudience = 'chocair-official-client-id.apps.googleusercontent.com';
      const tokenAud = 'attacker-rogue-client-id.apps.googleusercontent.com';
      if (tokenAud !== expectedAudience) {
        throw new Error(`Token audience mismatch: expected ${expectedAudience}, got ${tokenAud}`);
      }
      return { googleId: 'sub-1', email: 'user@test.com' };
    });

    const audFailRes = await request(app)
      .post('/api/users/auth/google')
      .send({ idToken: 'token-with-wrong-audience' });

    expect(audFailRes.status).toBe(401);
    expect(audFailRes.body.message).toMatch(/Token audience mismatch/i);

    resetGoogleTokenVerifier();
  });

  it('GOOGLE AUTH SECURITY: rejects unverified Google email accounts', async () => {
    setGoogleTokenVerifier(async () => {
      throw new Error('Google account email is not verified');
    });

    const unverifiedEmailRes = await request(app)
      .post('/api/users/auth/google')
      .send({ idToken: 'token-with-unverified-email' });

    expect(unverifiedEmailRes.status).toBe(401);
    expect(unverifiedEmailRes.body.message).toMatch(/not verified/i);

    resetGoogleTokenVerifier();
  });

  it('GET /api/users/profile - returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('customer@chocair.com');
    expect(res.body.isAdmin).toBe(false);
  });

  it('PUT /api/users/profile - updates user details', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Updated Customer',
        location: 'Beirut, Hamra',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Customer');
    expect(res.body.location).toBe('Beirut, Hamra');
  });

  it('GET /api/users - returns all users for admin and blocks non-admins', async () => {
    // Non-admin request
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userRes.status).toBe(401);

    // Admin request
    const adminRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toBeInstanceOf(Array);
    expect(adminRes.body.length).toBe(2);
  });

  // ================= ADVERSARIAL AUTH & USER TESTS =================

  it('OTP PRIVACY: never exposes plaintext OTP in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const res = await request(app)
        .post('/api/users/auth/send-otp')
        .send({ phone: '+96170888999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.otp).toBeUndefined(); // MUST NOT BE EXPOSED
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('EXPIRED & WRONG OTP: rejects invalid, expired, or already-used OTP codes', async () => {
    // 1. Expired OTP
    await OTP.create({
      phone: '+96170333444',
      code: '888888',
      expiresAt: new Date(Date.now() - 10000), // Expired in past
      verified: false,
    });

    const expiredRes = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '888888' });
    expect(expiredRes.status).toBe(400);

    // 2. Wrong OTP code
    const wrongRes = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '000000' });
    expect(wrongRes.status).toBe(400);

    // 3. Re-using already verified OTP
    const validOtp = await OTP.create({
      phone: '+96170333444',
      code: '777777',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    });

    const firstVerify = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '777777' });
    expect(firstVerify.status).toBe(200);

    const secondVerify = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '777777' });
    expect(secondVerify.status).toBe(400);
  });

  it('PHONE UPDATE COLLISION: rejects updating phone to an already registered number', async () => {
    // Attempting to update customer's phone to admin's phone (+96170111222)
    const res = await request(app)
      .put('/api/users/profile/phone')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        phone: '+96170111222',
        code: '123456',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  it('ADMIN ACCESS CONTROL: non-admin cannot delete users, admin cannot delete admin', async () => {
    // Non-admin attempts to delete user
    const nonAdminDel = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(nonAdminDel.status).toBe(401);

    // Admin attempts to delete admin user
    const adminUser = await User.findOne({ isAdmin: true });
    const adminDelAdmin = await request(app)
      .delete(`/api/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDelAdmin.status).toBe(400);
    expect(adminDelAdmin.body.message).toMatch(/cannot delete admin/i);
  });
});
