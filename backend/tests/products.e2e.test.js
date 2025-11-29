import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import Product from '../models/productModel.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
});

describe('Product Endpoints', () => {
  const productData = {
    name: 'Test Product',
    price: 100,
    category: 'fruits',
    stock: 10,
    description: 'Test Description'
  };

  it('should get all products', async () => {
    await Product.create(productData);
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should create a product (public)', async () => {
    const res = await request(app)
      .post('/api/products')
      .send(productData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.name).toBe(productData.name);
  });

  it('should update a product (public)', async () => {
    const product = await Product.create(productData);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({ ...productData, name: 'Updated Name' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('should delete a product (public)', async () => {
    const product = await Product.create(productData);
    const res = await request(app)
      .delete(`/api/products/${product._id}`);

    expect(res.statusCode).toEqual(200); // Or 204 depending on implementation
    const check = await Product.findById(product._id);
    expect(check).toBeNull();
  });
});
