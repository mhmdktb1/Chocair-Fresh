import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

let mongoServer;
let adminToken;

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

  const adminUser = await User.create({
    name: 'Admin Test',
    phone: '+96170000001',
    isAdmin: true,
  });
  adminToken = generateToken(adminUser._id);
});

describe('Product API', () => {
  const productData = {
    name: 'Test Apple',
    price: 1.99,
    category: 'fruits',
    countInStock: 10,
    description: 'Fresh apple',
    image: 'apple.jpg',
    brand: 'Chocair',
    unit: 'kg'
  };

  it('GET /api/products - should return empty array initially', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/products - should reject unauthorized requests with 401', async () => {
    const res = await request(app).post('/api/products').send(productData);
    expect(res.status).toBe(401);
  });

  it('POST /api/products - should create a product when authenticated as admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(productData.name);
  });

  it('GET /api/products/:id - should return product details publicly', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);
    const productId = createRes.body._id;

    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(productData.name);
  });

  it('PUT /api/products/:id - should update a product when authenticated as admin', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);
    const productId = createRes.body._id;

    const updateData = { ...productData, name: 'Updated Apple', price: 2.99 };
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Apple');
    expect(res.body.price).toBe(2.99);
  });

  it('DELETE /api/products/:id - should delete the product when authenticated as admin', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);
    const productId = createRes.body._id;

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const checkRes = await request(app).get(`/api/products/${productId}`);
    expect(checkRes.status).toBe(404);
  });

  // ================= ADVERSARIAL PRODUCT & SEARCH TESTS =================

  it('SEARCH & FILTERING: accurately filters by category, keyword, and limit', async () => {
    // Seed test products
    await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Organic Red Apple', price: 2.00, category: 'fruits', brand: 'Chocair', countInStock: 20, description: 'Crisp red apple'
    });
    await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Organic Green Apple', price: 2.50, category: 'fruits', brand: 'Local Farm', countInStock: 15, description: 'Tart green apple'
    });
    await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Fresh Carrots', price: 1.20, category: 'vegetables', brand: 'Bekaa Roots', countInStock: 40, description: 'Sweet carrots'
    });

    // 1. Category Filter: 'vegetables' -> 1 item
    const vegRes = await request(app).get('/api/products?category=vegetables');
    expect(vegRes.status).toBe(200);
    expect(vegRes.body).toHaveLength(1);
    expect(vegRes.body[0].name).toBe('Fresh Carrots');

    // 2. Keyword Search: 'apple' -> 2 items
    const appleRes = await request(app).get('/api/products?keyword=apple');
    expect(appleRes.status).toBe(200);
    expect(appleRes.body).toHaveLength(2);

    // 3. Limit / Pagination: limit=1
    const limitRes = await request(app).get('/api/products?limit=1');
    expect(limitRes.status).toBe(200);
    expect(limitRes.body).toHaveLength(1);
  });

  it('MALFORMED IDS: returns 404 for invalid product IDs', async () => {
    const res = await request(app).get('/api/products/non-existent-product-id');
    expect(res.status).toBe(404);
  });
});
