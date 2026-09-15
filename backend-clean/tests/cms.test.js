import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../server.js';
import Category from '../models/categoryModel.js';
import Comment from '../models/commentModel.js';
import Hero from '../models/heroModel.js';
import HomeConfig from '../models/homeModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import generateToken from '../utils/generateToken.js';

let mongoServer;
let adminToken;
let userToken;
let regularUser;

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
    isAdmin: true,
  });
  adminToken = generateToken(admin._id);

  regularUser = await User.create({
    name: 'Reviewer User',
    phone: '+96170333444',
    isAdmin: false,
  });
  userToken = generateToken(regularUser._id);
});

describe('Category API', () => {
  it('GET /api/categories - fetches category list publicly', async () => {
    await Category.create({ name: 'Organic Fruits', isVisible: true, featured: true });
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Organic Fruits');
  });

  it('POST /api/categories - admin can create category with isVisible and featured', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Fresh Greens',
        description: 'Leafy vegetables',
        isVisible: true,
        featured: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Fresh Greens');
    expect(res.body.isVisible).toBe(true);
    expect(res.body.featured).toBe(true);
  });
});

describe('Comment and Review API', () => {
  it('POST /api/comments & GET /api/comments - creates and retrieves comments', async () => {
    const createRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Amazing organic apples!',
        rating: 5,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.content).toBe('Amazing organic apples!');

    const getRes = await request(app).get('/api/comments');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveLength(1);
    expect(getRes.body[0].content).toBe('Amazing organic apples!');
  });
});

describe('Home Config & Hero CMS API', () => {
  it('GET /api/home-config & PUT /api/home-config - manages dynamic home configuration', async () => {
    const getRes = await request(app).get('/api/home-config');
    expect(getRes.status).toBe(200);
    expect(getRes.body.hero).toBeTruthy();

    const putRes = await request(app)
      .put('/api/home-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hero: {
          title: 'Farm Fresh to Beirut',
          subtitle: 'Pure goodness daily',
        },
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.hero.title).toBe('Farm Fresh to Beirut');
  });

  it('POST /api/hero & GET /api/hero - manages hero carousel slides', async () => {
    const createRes = await request(app)
      .post('/api/hero')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Spring Harvest Sale',
        subtitle: 'Up to 30% off citrus',
        backgroundImage: 'https://example.com/banner.jpg',
        page: 'home',
        order: 1,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe('Spring Harvest Sale');

    const listRes = await request(app).get('/api/hero');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });
});
