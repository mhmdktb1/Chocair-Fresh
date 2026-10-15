import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import app from '../server.js';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import { hashOtp } from '../utils/otpSecurity.js';
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
const originalAxiosPost = axios.post;

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
  axios.post = originalAxiosPost;

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
  axios.post = originalAxiosPost;
});

describe('User and Auth API', () => {
  it('POST /api/users/auth/send-otp - generates OTP record and hides it in production', async () => {
    const res = await request(app)
      .post('/api/users/auth/send-otp')
      .send({ phone: '+96170555666' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).not.toHaveProperty('otp');

    const otpDoc = await OTP.findOne({ phone: '+96170555666' });
    expect(otpDoc).toBeTruthy();
    expect(otpDoc.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(otpDoc.toObject()).not.toHaveProperty('code');
    expect(otpDoc.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(otpDoc.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000);
  });

  it('POST /api/users/auth/verify-otp - logs in existing user', async () => {
    await OTP.create({
      phone: '+96170333444',
      codeHash: hashOtp('123456'),
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

  it('OTP purpose is isolated and checkout verification returns a phone-bound grant', async () => {
    await OTP.create({
      phone: '+96170555667',
      purpose: 'checkout',
      codeHash: hashOtp('123456'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const wrongPurpose = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '70 555 667', code: '123456', purpose: 'login' });
    expect(wrongPurpose.status).toBe(400);

    const checkout = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '70 555 667', code: '123456', purpose: 'checkout' });
    expect(checkout.status).toBe(200);
    expect(checkout.body.checkoutVerificationToken).toBeTruthy();
    expect(checkout.body.registrationToken).toBeTruthy();
    expect(checkout.body.isNewUser).toBe(true);
    expect(checkout.body).not.toHaveProperty('token');
    expect(checkout.body).not.toHaveProperty('user');

    const registration = await request(app)
      .post('/api/users/auth/register')
      .send({
        phone: checkout.body.phone,
        name: 'Checkout Customer',
        location: 'Beirut, Building 1, Floor 2',
        registrationToken: checkout.body.registrationToken,
      });

    expect(registration.status).toBe(201);
    expect(registration.body.token).toBeTruthy();
    expect(registration.body.user.name).toBe('Checkout Customer');
    expect(registration.body.user.phone).toBe('+96170555667');
    expect(registration.body.user.location).toBe('Beirut, Building 1, Floor 2');
  });

  it('checkout verification logs in an existing account and still returns an order grant', async () => {
    await OTP.create({
      phone: '+96170333444',
      purpose: 'checkout',
      codeHash: hashOtp('654321'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const response = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '654321', purpose: 'checkout' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.isNewUser).toBe(false);
    expect(response.body.checkoutVerificationToken).toBeTruthy();
    expect(response.body.token).toBeTruthy();
    expect(response.body.user._id).toBe(String(userId));
    expect(response.body.user.phone).toBe('+96170333444');
    expect(response.body).not.toHaveProperty('registrationToken');
  });

  it('counts wrong OTP attempts and invalidates the code after five failures', async () => {
    const otpRecord = await OTP.create({
      phone: '+96170555668',
      purpose: 'login',
      codeHash: hashOtp('123456'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app)
        .post('/api/users/auth/verify-otp')
        .send({ phone: '+96170555668', code: '000000', purpose: 'login' });
      expect(response.status).toBe(400);
    }

    const exhaustedOtp = await OTP.findById(otpRecord._id);
    expect(exhaustedOtp.attemptsUsed).toBe(5);
    expect(exhaustedOtp.status).toBe('invalidated');

    const correctAfterExhaustion = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170555668', code: '123456', purpose: 'login' });
    expect(correctAfterExhaustion.status).toBe(400);
  });

  it('atomically allows only one concurrent verification of an OTP', async () => {
    await OTP.create({
      phone: '+96170555669',
      purpose: 'login',
      codeHash: hashOtp('321654'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const responses = await Promise.all([
      request(app)
        .post('/api/users/auth/verify-otp')
        .send({ phone: '+96170555669', code: '321654', purpose: 'login' }),
      request(app)
        .post('/api/users/auth/verify-otp')
        .send({ phone: '+96170555669', code: '321654', purpose: 'login' }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
  });

  it('rejects registration without a phone-verification grant', async () => {
    const response = await request(app)
      .post('/api/users/auth/register')
      .send({ phone: '+96170999112', name: 'Unverified Registration' });

    expect(response.status).toBe(403);
    expect(await User.findOne({ phone: '+96170999112' })).toBeNull();
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

  it('PUT /api/users/profile - seamlessly adds and manages saved addresses without casting errors', async () => {
    // 1. Add new address (even with client-side temporary timestamps or string IDs)
    const addRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addresses: [
          {
            label: 'Home',
            address: 'Beirut, Hamra, Bliss Street, Bldg 42, 3rd Floor',
            notes: 'Ring the bell twice',
            isDefault: true,
          },
        ],
      });

    expect(addRes.status).toBe(200);
    expect(addRes.body.addresses).toHaveLength(1);
    expect(addRes.body.addresses[0].label).toBe('Home');
    expect(addRes.body.addresses[0].address).toBe('Beirut, Hamra, Bliss Street, Bldg 42, 3rd Floor');
    expect(addRes.body.addresses[0].notes).toBe('Ring the bell twice');
    expect(addRes.body.addresses[0].isDefault).toBe(true);
    expect(addRes.body.addresses[0]._id).toBeTruthy();

    const savedId = addRes.body.addresses[0]._id;

    // 2. Add second address and update first
    const secondRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addresses: [
          {
            _id: savedId,
            label: 'Home',
            address: 'Beirut, Hamra, Bliss Street, Bldg 42, 3rd Floor',
            notes: 'Leave with concierge',
            isDefault: false,
          },
          {
            label: 'Work',
            address: 'Beirut, Downtown, Weygand St',
            notes: '',
            isDefault: true,
          },
        ],
      });

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.addresses).toHaveLength(2);
    expect(secondRes.body.addresses[0].notes).toBe('Leave with concierge');
    expect(secondRes.body.addresses[1].label).toBe('Work');
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

  it('OTP FLOW: never returns the OTP in an API response', async () => {
    const res = await request(app)
      .post('/api/users/auth/send-otp')
      .send({ phone: '+96170888999' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).not.toHaveProperty('otp');

    const otpDoc = await OTP.findOne({ phone: '+96170888999' });
    expect(otpDoc).toBeTruthy();
    expect(otpDoc.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(otpDoc.toObject()).not.toHaveProperty('code');
  });

  it('OTP FLOW: production delivery does not expose OTP or recipient in logs or response', async () => {
    const originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_TEMPLATE_LANG: process.env.WHATSAPP_TEMPLATE_LANG,
      WHATSAPP_OTP_TEMPLATE: process.env.WHATSAPP_OTP_TEMPLATE,
      WHATSAPP_GRAPH_API_VERSION: process.env.WHATSAPP_GRAPH_API_VERSION,
    };
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const logOutput = [];
    let dispatchedCode;

    process.env.NODE_ENV = 'production';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.WHATSAPP_TEMPLATE_LANG = 'en_US';
    delete process.env.WHATSAPP_OTP_TEMPLATE;
    delete process.env.WHATSAPP_GRAPH_API_VERSION;
    axios.post = async (_url, payload) => {
      dispatchedCode = payload.template.components[0].parameters[0].text;
      return { data: { messages: [{ id: 'wamid.test' }] } };
    };
    console.log = (...args) => logOutput.push(args.join(' '));
    console.warn = (...args) => logOutput.push(args.join(' '));
    console.error = (...args) => logOutput.push(args.join(' '));

    try {
      const res = await request(app)
        .post('/api/users/auth/send-otp')
        .send({ phone: '+96170555991' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).not.toHaveProperty('otp');

      const otpDoc = await OTP.findOne({ phone: '+96170555991' });
      expect(otpDoc).toBeTruthy();
      const allLogs = logOutput.join('\n');
      expect(otpDoc.codeHash).toMatch(/^[a-f0-9]{64}$/);
      expect(otpDoc.toObject()).not.toHaveProperty('code');
      expect(allLogs).not.toContain(dispatchedCode);
      expect(allLogs).not.toContain('96170555991');
      expect(allLogs).not.toContain('+96170555991');
    } finally {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
      for (const [key, value] of Object.entries(originalEnv)) {
        if (key !== 'NODE_ENV') {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }
      axios.post = originalAxiosPost;
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  });

  it('OTP FLOW: failed delivery leaves no usable new OTP and preserves the prior code', async () => {
    const previousOtp = await OTP.create({
      phone: '+96170555992',
      purpose: 'login',
      codeHash: hashOtp('112233'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_TEMPLATE_LANG: process.env.WHATSAPP_TEMPLATE_LANG,
    };

    process.env.NODE_ENV = 'production';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-access-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.WHATSAPP_TEMPLATE_LANG = 'en_US';
    axios.post = async () => {
      const error = new Error('Meta rejected the request');
      error.response = {
        status: 400,
        data: { error: { message: 'Invalid template', code: 132001, error_subcode: 2388001 } },
      };
      throw error;
    };

    try {
      const res = await request(app)
        .post('/api/users/auth/send-otp')
        .send({ phone: '+96170555992' });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body).not.toHaveProperty('otp');
      const storedOtpRecords = await OTP.find({ phone: '+96170555992' });
      expect(storedOtpRecords).toHaveLength(1);
      expect(storedOtpRecords[0]._id.toString()).toBe(previousOtp._id.toString());
      expect(storedOtpRecords[0].status).toBe('active');
    } finally {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      axios.post = originalAxiosPost;
    }
  });

  it('EXPIRED & WRONG OTP: rejects invalid, expired, or already-used OTP codes', async () => {
    // 1. Expired OTP
    const expiredOtp = await OTP.create({
      phone: '+96170333444',
      codeHash: hashOtp('888888'),
      expiresAt: new Date(Date.now() - 10000), // Expired in past
      verified: false,
    });

    const expiredRes = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '888888' });
    expect(expiredRes.status).toBe(400);
    await OTP.updateOne({ _id: expiredOtp._id }, { $set: { status: 'invalidated' } });

    // 2. Wrong OTP code
    const wrongRes = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170333444', code: '000000' });
    expect(wrongRes.status).toBe(400);

    // 3. Re-using already verified OTP
    const validOtp = await OTP.create({
      phone: '+96170333444',
      codeHash: hashOtp('777777'),
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

  it('PHONE UPDATE: requires a valid, unused OTP', async () => {
    const res = await request(app)
      .put('/api/users/profile/phone')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        phone: '+96170987654',
        code: '123456',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired otp/i);
    const unchangedUser = await User.findById(userId);
    expect(unchangedUser.phone).toBe('+96170333444');
  });

  it('PHONE UPDATE: consumes a valid OTP before changing the phone number', async () => {
    const otpRecord = await OTP.create({
      phone: '+96170987654',
      codeHash: hashOtp('123456'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const res = await request(app)
      .put('/api/users/profile/phone')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        phone: '+96170987654',
        code: '123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe('+96170987654');
    const consumedOTP = await OTP.findById(otpRecord._id);
    expect(consumedOTP.verified).toBe(true);
  });

  it('MASCOT AVATAR SYSTEM: automatically assigns mascot key on registration and profile fetch', async () => {
    const validMascots = [
      'apple', 'avocado', 'banana', 'broccoli', 'carrot',
      'eggplant', 'grapes', 'lemon', 'orange', 'peach',
      'strawberry', 'watermelon'
    ];

    // 1. New user registration receives mascot
    await OTP.create({
      phone: '+96170999111',
      purpose: 'login',
      codeHash: hashOtp('654321'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const verificationRes = await request(app)
      .post('/api/users/auth/verify-otp')
      .send({ phone: '+96170999111', code: '654321', purpose: 'login' });

    const regRes = await request(app)
      .post('/api/users/auth/register')
      .send({
        phone: '+96170999111',
        name: 'Mascot Test User',
        email: 'mascot@example.com',
        registrationToken: verificationRes.body.registrationToken,
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
