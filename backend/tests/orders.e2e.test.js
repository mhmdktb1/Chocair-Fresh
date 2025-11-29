import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

let mongoServer;
let productId;
// Mock user ID for testing
const mockUserId = new mongoose.Types.ObjectId();

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
  await Order.deleteMany({});
  await Product.deleteMany({});

  // Create product
  const product = await Product.create({
    name: 'Test Product',
    price: 100,
    category: 'fruits',
    stock: 10
  });
  productId = product._id;
});

describe('Order Endpoints', () => {
  it('should create an order', async () => {
    const orderData = {
      user: mockUserId,
      items: [
        {
          product: productId,
          name: 'Test Product',
          quantity: 1,
          price: 100,
          total: 100
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        phone: '1234567890',
        street: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      paymentMethod: 'cash',
      subtotal: 100,
      taxAmount: 10,
      shippingCost: 0,
      total: 110
    };

    const res = await request(app)
      .post('/api/orders')
      .send(orderData);

    if (res.statusCode !== 201) {
      console.log('Create Order Failed:', JSON.stringify(res.body, null, 2));
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('_id');
  });

  it('should get user orders', async () => {
    // Create an order first
    await Order.create({
      user: mockUserId,
      items: [
        {
          product: productId,
          name: 'Test Product',
          quantity: 1,
          price: 100,
          total: 100
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        phone: '1234567890',
        street: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      paymentMethod: 'cash',
      subtotal: 100,
      taxAmount: 10,
      shippingCost: 0,
      total: 110
    });

    const res = await request(app)
      .get(`/api/orders/myorders?userId=${mockUserId}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
