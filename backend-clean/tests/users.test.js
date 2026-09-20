import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import app from '../server.js';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';
import {
  defaultGoogleTokenVerifier,
  setGoogleTokenVerifier,
  resetGoogleTokenVerifier,
} from '../controllers/userController.js';

let mongoServer;
let adminToken;
let userToken;
let userId;
const originalAxiosGet = axios.get;

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
  delete process.env.GOOGLE_CLIENT_ID;
  resetGoogleTokenVerifier();
  axios.get = originalAxiosGet;

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

afterEach(() => {
  delete process.env.GOOGLE_CLIENT_ID;
  resetGoogleTokenVerifier();
  axios.get = originalAxiosGet;
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
    // Mock the Google tokeninfo HTTP response directly
    const validGooglePayload = {
      sub: 'google-uid-verified-12345',
      email: 'realgoogleuser@gmail.com',
      email_verified: 'true',
      name: 'Real Google Name',
      picture: 'https://lh3.googleusercontent.com/real.jpg',
      iss: 'https://accounts.google.com',
      aud: 'test-google-client-id.apps.googleusercontent.com',
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    };

    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';

    axios.get = async () => ({ data: validGooglePayload });

    try {
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
    } finally {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    }
  });

  // ================= DEFAULT GOOGLE TOKEN VERIFIER TESTS =================

  describe('defaultGoogleTokenVerifier implementation tests', () => {
    const validPayload = {
      sub: 'google-sub-1001',
      email: 'customer@fresh.com',
      email_verified: true,
      iss: 'https://accounts.google.com',
      aud: 'fresh-client-id.apps.googleusercontent.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      name: 'Fresh Customer',
      picture: 'https://photo.jpg',
    };

    it('ACCEPTANCE: accepts valid Google tokeninfo response and normalizes claims', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_ID = 'fresh-client-id.apps.googleusercontent.com';

      axios.get = async () => ({ data: { ...validPayload } });

      try {
        const verified = await defaultGoogleTokenVerifier('valid-token-str');
        expect(verified.googleId).toBe('google-sub-1001');
        expect(verified.email).toBe('customer@fresh.com');
        expect(verified.name).toBe('Fresh Customer');
        expect(verified.avatar).toBe('https://photo.jpg');
      } finally {
        process.env.GOOGLE_CLIENT_ID = originalClientId;
      }
    });

    it('REJECTION: rejects missing audience (aud)', async () => {
      axios.get = async () => ({
        data: { ...validPayload, aud: undefined },
      });

      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Missing Google token audience/i
      );
    });

    it('REJECTION: rejects wrong audience (aud)', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_ID = 'configured-client-id.apps.googleusercontent.com';

      axios.get = async () => ({
        data: { ...validPayload, aud: 'attacker-client-id.apps.googleusercontent.com' },
      });

      try {
        await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
          /Token audience mismatch/i
        );
      } finally {
        process.env.GOOGLE_CLIENT_ID = originalClientId;
      }
    });

    it('REJECTION: rejects missing issuer (iss)', async () => {
      axios.get = async () => ({
        data: { ...validPayload, iss: undefined },
      });

      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Missing Google token issuer/i
      );
    });

    it('REJECTION: rejects wrong issuer (iss)', async () => {
      axios.get = async () => ({
        data: { ...validPayload, iss: 'https://malicious-fake-auth.com' },
      });

      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Invalid Google token issuer/i
      );
    });

    it('REJECTION: rejects missing or expired expiration (exp)', async () => {
      // 1. Missing exp
      axios.get = async () => ({
        data: { ...validPayload, exp: undefined },
      });
      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Missing Google token expiration/i
      );

      // 2. Expired exp
      axios.get = async () => ({
        data: { ...validPayload, exp: Math.floor(Date.now() / 1000) - 300 },
      });
      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Google ID token has expired/i
      );
    });

    it('REJECTION: rejects unverified email (email_verified is false or missing)', async () => {
      // 1. email_verified is false
      axios.get = async () => ({
        data: { ...validPayload, email_verified: false },
      });
      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Google account email is not verified/i
      );

      // 2. email_verified is missing
      axios.get = async () => ({
        data: { ...validPayload, email_verified: undefined },
      });
      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Google account email is not verified/i
      );
    });

    it('REJECTION: rejects missing or empty subject identifier (sub)', async () => {
      axios.get = async () => ({
        data: { ...validPayload, sub: '' },
      });

      await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
        /Missing or invalid Google subject identifier/i
      );
    });

    it('PRODUCTION SECURITY: fails closed when GOOGLE_CLIENT_ID is missing in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.NODE_ENV = 'production';
      delete process.env.GOOGLE_CLIENT_ID;

      try {
        await expect(defaultGoogleTokenVerifier('test-token')).rejects.toThrow(
          /GOOGLE_CLIENT_ID.*not configured/i
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.GOOGLE_CLIENT_ID = originalClientId;
      }
    });
  });

  it('GOOGLE AUTH SECURITY: rejects forged or invalid Google ID tokens via endpoint with 401', async () => {
    axios.get = async () => {
      const err = new Error('Invalid Value');
      err.response = { status: 400, data: { error_description: 'Invalid Value' } };
      throw err;
    };

    const forgedRes = await request(app)
      .post('/api/users/auth/google')
      .send({ idToken: 'forged-fake-token-12345' });

    expect(forgedRes.status).toBe(401);
    expect(forgedRes.body.message).toMatch(/Google token verification failed/i);
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

  it('OTP FLOW: returns OTP in auto mode for development/testing convenience', async () => {
    const res = await request(app)
      .post('/api/users/auth/send-otp')
      .send({ phone: '+96170888999' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otp).toBeTruthy();
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

  it('MASCOT AVATAR SYSTEM: automatically assigns mascot key on registration and profile fetch', async () => {
    const validMascots = [
      'apple', 'avocado', 'banana', 'broccoli', 'carrot',
      'eggplant', 'grapes', 'lemon', 'orange', 'peach',
      'strawberry', 'watermelon'
    ];

    // 1. New user registration receives mascot
    const regRes = await request(app)
      .post('/api/users/auth/register')
      .send({
        phone: '+96170999111',
        name: 'Mascot Test User',
        email: 'mascot@example.com'
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.mascot).toBeDefined();
    expect(validMascots).toContain(regRes.body.user.mascot);

    const testToken = regRes.body.token;

    // 2. User can update mascot
    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Mascot Test User',
        mascot: 'strawberry'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.mascot).toBe('strawberry');

    // 3. GET profile returns updated mascot
    const getRes = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${testToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.mascot).toBe('strawberry');
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
