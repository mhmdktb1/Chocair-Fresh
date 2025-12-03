import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';

let mongoServer;

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

  it('POST /api/products - should create a product', async () => {
    const res = await request(app).post('/api/products').send(productData);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(productData.name);
  });

  it('GET /api/products/:id - should return product details', async () => {
    const createRes = await request(app).post('/api/products').send(productData);
    const productId = createRes.body._id;

    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(productData.name);
  });

  it('PUT /api/products/:id - should update a product', async () => {
    const createRes = await request(app).post('/api/products').send(productData);
    const productId = createRes.body._id;

    const updateData = { ...productData, name: 'Updated Apple', price: 2.99 };
    const res = await request(app).put(`/api/products/${productId}`).send(updateData);
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Apple');
    expect(res.body.price).toBe(2.99);
  });

  it('DELETE /api/products/:id - should delete the product', async () => {
    const createRes = await request(app).post('/api/products').send(productData);
    const productId = createRes.body._id;

    const res = await request(app).delete(`/api/products/${productId}`);
    expect(res.status).toBe(200);

    const checkRes = await request(app).get(`/api/products/${productId}`);
    expect(checkRes.status).toBe(404);
  });
});
