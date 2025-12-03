import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import Product from '../models/productModel.js';

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

describe('Order API', () => {
  let productId;

  beforeEach(async () => {
    const product = await Product.create({
      name: 'Test Orange',
      price: 2.00,
      category: 'fruits',
      countInStock: 100,
      image: 'orange.jpg',
      brand: 'Chocair',
      description: 'Fresh orange',
      unit: 'kg'
    });
    productId = product._id;
  });

  const createOrderData = () => ({
    orderItems: [{
      product: productId,
      name: 'Test Orange',
      qty: 2,
      price: 2.00,
      image: 'orange.jpg'
    }],
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Beirut',
      postalCode: '12345',
      country: 'Lebanon'
    },
    paymentMethod: 'Cash on Delivery',
    itemsPrice: 4.00,
    shippingPrice: 5.00,
    totalPrice: 9.00
  });

  it('POST /api/orders - should create an order', async () => {
    const res = await request(app).post('/api/orders').send(createOrderData());
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(9.00);
    expect(res.body.orderItems).toHaveLength(1);
  });

  it('GET /api/orders/admin/all - should list all orders', async () => {
    await request(app).post('/api/orders').send(createOrderData());
    
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(1);
  });

  it('GET /api/orders/:id - should return single order', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(orderId);
  });

  it('PUT /api/orders/:id/status - should update status', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    const res = await request(app).put(`/api/orders/${orderId}/status`).send({ status: 'Preparing' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Preparing');
  });

  it('DELETE /api/orders/:id - should delete order', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    const res = await request(app).delete(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order removed');

    const checkRes = await request(app).get(`/api/orders/${orderId}`);
    expect(checkRes.status).toBe(404);
  });
  
  it('GET /api/orders/myorders - should return empty if no email provided', async () => {
    const res = await request(app).get('/api/orders?email=nonexistent@example.com');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
