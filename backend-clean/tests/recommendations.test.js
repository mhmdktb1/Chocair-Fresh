import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import generateToken from '../utils/generateToken.js';

let mongoServer;
let userToken;
let user;
let p1, p2, p3;

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

  p1 = await Product.create({
    name: 'Honeycrisp Apples',
    price: 3.00,
    category: 'fruits',
    countInStock: 50,
    rating: 4.9,
    numReviews: 12,
    brand: 'Chocair',
    description: 'Crisp apples',
    unit: 'kg'
  });

  p2 = await Product.create({
    name: 'Organic Bananas',
    price: 1.50,
    category: 'fruits',
    countInStock: 80,
    rating: 4.8,
    numReviews: 20,
    brand: 'Chocair',
    description: 'Sweet bananas',
    unit: 'kg'
  });

  p3 = await Product.create({
    name: 'Fresh Strawberries',
    price: 4.50,
    category: 'berries',
    countInStock: 30,
    rating: 5.0,
    numReviews: 8,
    brand: 'Chocair',
    description: 'Juicy berries',
    unit: 'box'
  });

  user = await User.create({
    name: 'Personalized Test User',
    phone: '+96170444555',
    email: 'personalized@test.com',
  });
  userToken = generateToken(user._id);
});

describe('Recommendation API', () => {
  it('GET /api/recommend/trending - returns trending products with countInStock', async () => {
    const res = await request(app).get('/api/recommend/trending?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/recommend/new - returns new arrivals with countInStock', async () => {
    const res = await request(app).get('/api/recommend/new?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].product.countInStock).toBeDefined();
  });

  it('GET /api/recommend/top-rated - returns highest rated products with countInStock', async () => {
    const res = await request(app).get('/api/recommend/top-rated?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].product.rating).toBeGreaterThanOrEqual(res.body.data[1].product.rating);
    expect(res.body.data[0].product.countInStock).toBeDefined();
  });

  it('POST /api/recommend/product (similar) - returns same-category products', async () => {
    const res = await request(app)
      .post('/api/recommend/product')
      .send({
        productId: p1._id,
        type: 'similar',
        limit: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].product.category).toBe('fruits');
    expect(res.body.data[0].product.countInStock).toBeDefined();
  });

  it('POST /api/recommend/cart - handles empty cart gracefully', async () => {
    const res = await request(app)
      .post('/api/recommend/cart')
      .send({ cartItems: [] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  // ================= ADVERSARIAL RECOMMENDATION TESTS =================

  it('MALFORMED & EDGE INPUTS: handles invalid body formats safely', async () => {
    // 1. Missing productId -> 400
    const noProductRes = await request(app)
      .post('/api/recommend/product')
      .send({});
    expect(noProductRes.status).toBe(400);

    // 2. Non-existent product -> 404
    const fakeProductRes = await request(app)
      .post('/api/recommend/product')
      .send({ productId: new mongoose.Types.ObjectId() });
    expect(fakeProductRes.status).toBe(404);

    // 3. Invalid cart payload (not an array) -> 400
    const badCartRes = await request(app)
      .post('/api/recommend/cart')
      .send({ cartItems: 'not-an-array' });
    expect(badCartRes.status).toBe(400);

    // 4. Cart with frontend formatted objects (_id and qty)
    const frontendCartRes = await request(app)
      .post('/api/recommend/cart')
      .send({
        cartItems: [
          { _id: p1._id.toString(), qty: 2 },
          { id: p2._id.toString(), quantity: 1 }
        ],
        limit: 5
      });
    expect(frontendCartRes.status).toBe(200);
    expect(frontendCartRes.body.success).toBe(true);
  });

  it('SECURITY: POST /api/recommend/refresh requires admin authorization', async () => {
    // 1. Unauthenticated request -> 401
    const anonRes = await request(app).post('/api/recommend/refresh');
    expect(anonRes.status).toBe(401);

    // 2. Regular user request -> 401
    const userRes = await request(app)
      .post('/api/recommend/refresh')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userRes.status).toBe(401);

    // 3. Admin request -> 200
    const adminUser = await User.create({
      name: 'Admin Rec Tester',
      phone: '+96170999888',
      isAdmin: true,
    });
    const adminToken = generateToken(adminUser._id);

    const adminRes = await request(app)
      .post('/api/recommend/refresh')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
  });
});
