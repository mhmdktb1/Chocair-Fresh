import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import Product from '../models/productModel.js';
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
    phone: '+96170000002',
    isAdmin: true,
  });
  adminToken = generateToken(adminUser._id);
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

  it('POST /api/orders - should create an order and atomically decrement stock', async () => {
    const res = await request(app).post('/api/orders').send(createOrderData());
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(9.00);
    expect(res.body.orderItems).toHaveLength(1);

    const updatedProduct = await Product.findById(productId);
    expect(updatedProduct.countInStock).toBe(98);
  });

  it('POST /api/orders - should reject order when quantity exceeds stock', async () => {
    const orderData = createOrderData();
    orderData.orderItems[0].qty = 999;

    const res = await request(app).post('/api/orders').send(orderData);
    expect(res.status).toBe(400);

    const untouchedProduct = await Product.findById(productId);
    expect(untouchedProduct.countInStock).toBe(100);
  });

  it('POST /api/orders - should allow missing item image and use fallback', async () => {
    const payload = createOrderData();
    payload.orderItems[0].image = '';

    const res = await request(app).post('/api/orders').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.orderItems[0].image).toBe('/assets/images/placeholder-product.jpg');
  });

  it('GET /api/orders - should list all orders when authenticated as admin', async () => {
    await request(app).post('/api/orders').send(createOrderData());
    
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`);
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

  it('PUT /api/orders/:id/status - should update status when authenticated as admin', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Preparing' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Preparing');
  });

  it('DELETE /api/orders/:id - should delete order when authenticated as admin', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    const res = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order removed');

    const checkRes = await request(app).get(`/api/orders/${orderId}`);
    expect(checkRes.status).toBe(404);
  });
  
  it('GET /api/orders/myorders - should return empty if no user orders exist', async () => {
    const user = await User.create({
      name: 'Customer Test',
      phone: '+96170999999',
      email: 'customer@test.com',
    });
    const userToken = generateToken(user._id);

    const res = await request(app)
      .get('/api/orders/myorders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
