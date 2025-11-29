import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@chocair.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@chocair.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if products exist
    const count = await Product.countDocuments();
    if (count < 5) {
      const products = [
        {
          name: 'Fresh Strawberries',
          price: 5.99,
          category: 'Fruits',
          stock: 50,
          description: 'Sweet and juicy strawberries',
          image: 'https://example.com/strawberries.jpg'
        },
        {
          name: 'Organic Bananas',
          price: 2.99,
          category: 'Fruits',
          stock: 100,
          description: 'Rich in potassium',
          image: 'https://example.com/bananas.jpg'
        },
        {
          name: 'Whole Milk',
          price: 3.49,
          category: 'Dairy',
          stock: 30,
          description: 'Fresh whole milk',
          image: 'https://example.com/milk.jpg'
        },
        {
          name: 'Sourdough Bread',
          price: 4.99,
          category: 'Bakery',
          stock: 20,
          description: 'Freshly baked sourdough',
          image: 'https://example.com/bread.jpg'
        },
        {
          name: 'Eggs (Dozen)',
          price: 4.50,
          category: 'Dairy',
          stock: 40,
          description: 'Free range eggs',
          image: 'https://example.com/eggs.jpg'
        }
      ];
      await Product.insertMany(products);
      console.log('✅ Demo products inserted');
    } else {
      console.log('ℹ️  Products already exist');
    }

    console.log('🌱 Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
