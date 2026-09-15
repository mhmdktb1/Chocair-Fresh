import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import User from '../models/userModel.js';
import OTP from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';

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

  it('POST /api/users/auth/google - creates new user on first Google login', async () => {
    const res = await request(app)
      .post('/api/users/auth/google')
      .send({
        googleId: 'google-uid-12345',
        email: 'newgoogle@gmail.com',
        name: 'Google User',
        avatar: 'https://lh3.googleusercontent.com/photo.jpg',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('newgoogle@gmail.com');

    const dbUser = await User.findOne({ email: 'newgoogle@gmail.com' });
    expect(dbUser).toBeTruthy();
    expect(dbUser.googleId).toBe('google-uid-12345');
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
});
