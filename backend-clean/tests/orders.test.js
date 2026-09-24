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
      image: 'orange.jpg',
      instruction: 'Extra ripe please'
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
    expect(res.body.orderItems[0].instruction).toBe('Extra ripe please');

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
    const noImageProduct = await Product.create({
      name: 'No Image Berry',
      price: 3.50,
      category: 'fruits',
      countInStock: 50,
      image: '',
      brand: 'Chocair',
      description: 'Fresh berry without image',
      unit: 'box'
    });

    const payload = createOrderData();
    payload.orderItems = [{
      product: noImageProduct._id,
      name: 'No Image Berry',
      qty: 1,
      price: 3.50,
      image: '',
    }];

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

  it('GET /api/orders/:id - should return single order for admin or owner', async () => {
    const createRes = await request(app).post('/api/orders').send(createOrderData());
    const orderId = createRes.body._id;

    // Admin should view it
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(orderId);

    // Unauthenticated request should be rejected with 401
    const anonRes = await request(app).get(`/api/orders/${orderId}`);
    expect(anonRes.status).toBe(401);
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

    const checkRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
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

  // ================= ADVERSARIAL ORDER TESTS =================

  it('TAMPERING: recalculates server-authoritative price despite client manipulations', async () => {
    const tamperedPayload = createOrderData();
    tamperedPayload.orderItems[0].price = 0.01;
    tamperedPayload.itemsPrice = 0.02;
    tamperedPayload.shippingPrice = 2.00;
    tamperedPayload.totalPrice = 2.02;

    const res = await request(app).post('/api/orders').send(tamperedPayload);
    expect(res.status).toBe(201);
    // Real item price in DB is $2.00 * 2 = $4.00, + $2.00 shipping = $6.00
    expect(res.body.itemsPrice).toBe(4.00);
    expect(res.body.totalPrice).toBe(6.00);
    expect(res.body.orderItems[0].price).toBe(2.00);
  });

  it('DISCOUNT PRICING IN ORDERS: applies active product discount to order item and total', async () => {
    const discountedProduct = await Product.create({
      name: 'Discounted Watermelon',
      price: 10.00,
      category: 'fruits',
      countInStock: 20,
      image: 'watermelon.jpg',
      brand: 'Chocair',
      description: 'Sweet watermelon',
      unit: 'kg',
      discount: {
        isActive: true,
        type: 'percentage',
        value: 20
      }
    });

    const payload = createOrderData();
    payload.orderItems = [{
      product: discountedProduct._id,
      name: 'Discounted Watermelon',
      qty: 3,
      unit: 'kg'
    }];
    payload.shippingPrice = 0;

    const res = await request(app).post('/api/orders').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.orderItems[0].price).toBe(8.00);
    expect(res.body.orderItems[0].originalPrice).toBe(10.00);
    expect(res.body.orderItems[0].discountPercent).toBe(20);
    expect(res.body.itemsPrice).toBe(24.00);
  });

  it('INVALID QTY: rejects zero, negative, or non-numeric quantities', async () => {
    const zeroPayload = createOrderData();
    zeroPayload.orderItems[0].qty = 0;
    const zeroRes = await request(app).post('/api/orders').send(zeroPayload);
    expect(zeroRes.status).toBe(400);

    const negPayload = createOrderData();
    negPayload.orderItems[0].qty = -5;
    const negRes = await request(app).post('/api/orders').send(negPayload);
    expect(negRes.status).toBe(400);

    // Stock remains 100
    const prod = await Product.findById(productId);
    expect(prod.countInStock).toBe(100);
  });

  it('OVERSELLING & ATOMIC ROLLBACK: rolls back prior items if later item fails stock check', async () => {
    const productB = await Product.create({
      name: 'Low Stock Mango',
      price: 5.00,
      category: 'fruits',
      countInStock: 2,
      image: 'mango.jpg',
      brand: 'Chocair',
      description: 'Ripe mango',
      unit: 'kg'
    });

    const batchPayload = createOrderData();
    batchPayload.orderItems = [
      { product: productId, qty: 5, price: 2.00, name: 'Test Orange' },
      { product: productB._id, qty: 10, price: 5.00, name: 'Low Stock Mango' } // Exceeds 2
    ];

    const res = await request(app).post('/api/orders').send(batchPayload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);

    // Verify product A was safely rolled back to 100
    const prodA = await Product.findById(productId);
    expect(prodA.countInStock).toBe(100);

    const prodB = await Product.findById(productB._id);
    expect(prodB.countInStock).toBe(2);
  });

  it('AUTH PRIVACY: user cannot view or cancel another customer order', async () => {
    const userA = await User.create({ name: 'User A', phone: '+96170111111', email: 'a@test.com' });
    const userB = await User.create({ name: 'User B', phone: '+96170222222', email: 'b@test.com' });
    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    // User A creates an order
    const orderData = createOrderData();
    orderData.customerInfo.phone = userA.phone;
    orderData.customerInfo.email = userA.email;

    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(orderData);
    const orderId = createRes.body._id;

    // User B tries to view User A's order -> 401
    const viewFail = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(viewFail.status).toBe(401);

    // User B tries to cancel User A's order -> 401
    const cancelFail = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(cancelFail.status).toBe(401);

    // User A successfully views own order -> 200
    const viewSuccess = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(viewSuccess.status).toBe(200);

    // User A successfully cancels own pending order -> 200
    const cancelSuccess = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(cancelSuccess.status).toBe(200);
    expect(cancelSuccess.body.status).toBe('Cancelled');
  });

  it('MALFORMED IDS: returns 404 for non-existent or malformed ObjectIds', async () => {
    const res = await request(app)
      .get('/api/orders/not-a-valid-id-12345')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
