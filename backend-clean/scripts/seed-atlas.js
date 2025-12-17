import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';

// Sample data
const categories = [
  { name: 'Fruits', description: 'Fresh and organic fruits', slug: 'fruits' },
  { name: 'Vegetables', description: 'Farm fresh vegetables', slug: 'vegetables' },
  { name: 'Herbs', description: 'Aromatic fresh herbs', slug: 'herbs' }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@chocair.com',
    phone: '+1234567890',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567891',
    password: 'user123',
    role: 'user',
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567892',
    password: 'user123',
    role: 'user',
    isActive: true
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+1234567893',
    password: 'user123',
    role: 'user',
    isActive: true
  },
  {
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '+1234567894',
    password: 'user123',
    role: 'user',
    isActive: true
  }
];

const products = [
  // Fruits
  { name: 'Red Apple', price: 1.99, category: 'Fruits', countInStock: 100, description: 'Crisp and sweet red apples', brand: 'Fresh Farm', unit: 'kg', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80', rating: 4.8, numReviews: 15 },
  { name: 'Banana', price: 0.99, category: 'Fruits', countInStock: 150, description: 'Ripe yellow bananas', brand: 'Tropical', unit: 'kg', image: 'https://images.unsplash.com/photo-1571771896612-616780ecc734?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 20 },
  { name: 'Orange', price: 2.49, category: 'Fruits', countInStock: 120, description: 'Juicy citrus oranges', brand: 'Citrus Co', unit: 'kg', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=300&q=80', rating: 4.6, numReviews: 18 },
  { name: 'Strawberry', price: 4.99, category: 'Fruits', countInStock: 80, description: 'Sweet red strawberries', brand: 'Berry Best', unit: 'pack', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80', rating: 4.9, numReviews: 25 },
  { name: 'Grapes', price: 3.99, category: 'Fruits', countInStock: 90, description: 'Seedless green grapes', brand: 'Vineyard', unit: 'kg', image: 'https://images.unsplash.com/photo-1537640538965-1756deb636ce?auto=format&fit=crop&w=300&q=80', rating: 4.5, numReviews: 12 },
  { name: 'Mango', price: 2.99, category: 'Fruits', countInStock: 60, description: 'Sweet tropical mango', brand: 'Tropical', unit: 'piece', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&q=80', rating: 4.8, numReviews: 30 },
  { name: 'Pineapple', price: 3.49, category: 'Fruits', countInStock: 50, description: 'Fresh whole pineapple', brand: 'Tropical', unit: 'piece', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 22 },
  { name: 'Watermelon', price: 5.99, category: 'Fruits', countInStock: 40, description: 'Large seedless watermelon', brand: 'Fresh Farm', unit: 'piece', image: 'https://images.unsplash.com/photo-1563288431-b441430baa14?auto=format&fit=crop&w=300&q=80', rating: 4.6, numReviews: 16 },

  // Vegetables
  { name: 'Carrot', price: 1.49, category: 'Vegetables', countInStock: 200, description: 'Crunchy orange carrots', brand: 'Root Farm', unit: 'kg', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=300&q=80', rating: 4.5, numReviews: 28 },
  { name: 'Broccoli', price: 2.99, category: 'Vegetables', countInStock: 100, description: 'Fresh green broccoli', brand: 'Green Earth', unit: 'head', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 35 },
  { name: 'Spinach', price: 1.99, category: 'Vegetables', countInStock: 150, description: 'Organic baby spinach', brand: 'Green Earth', unit: 'bunch', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80', rating: 4.6, numReviews: 20 },
  { name: 'Potato', price: 0.99, category: 'Vegetables', countInStock: 300, description: 'Russet potatoes', brand: 'Root Farm', unit: 'kg', image: 'https://images.unsplash.com/photo-1518977676605-dcad023188ee?auto=format&fit=crop&w=300&q=80', rating: 4.4, numReviews: 40 },
  { name: 'Tomato', price: 2.49, category: 'Vegetables', countInStock: 180, description: 'Red ripe tomatoes', brand: 'Vine Fresh', unit: 'kg', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=300&q=80', rating: 4.5, numReviews: 32 },
  { name: 'Onion', price: 1.29, category: 'Vegetables', countInStock: 250, description: 'Yellow onions', brand: 'Root Farm', unit: 'kg', image: 'https://images.unsplash.com/photo-1508747703703-c3bc0d1f204f?auto=format&fit=crop&w=300&q=80', rating: 4.3, numReviews: 25 },
  { name: 'Cucumber', price: 1.49, category: 'Vegetables', countInStock: 120, description: 'Crisp cucumbers', brand: 'Green Earth', unit: 'piece', image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=300&q=80', rating: 4.6, numReviews: 18 },
  { name: 'Bell Pepper', price: 1.99, category: 'Vegetables', countInStock: 140, description: 'Red and yellow bell peppers', brand: 'Vine Fresh', unit: 'piece', image: 'https://images.unsplash.com/photo-1563565375-f3fdf5ec2e97?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 22 },

  // Herbs
  { name: 'Fresh Basil', price: 2.99, category: 'Herbs', countInStock: 50, description: 'Aromatic fresh basil leaves', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=300&q=80', rating: 4.8, numReviews: 15 },
  { name: 'Mint', price: 2.49, category: 'Herbs', countInStock: 60, description: 'Fresh mint leaves', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 12 },
  { name: 'Parsley', price: 1.99, category: 'Herbs', countInStock: 70, description: 'Flat leaf parsley', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1550411294-b3b15d5bc188?auto=format&fit=crop&w=300&q=80', rating: 4.5, numReviews: 10 },
  { name: 'Cilantro', price: 1.99, category: 'Herbs', countInStock: 65, description: 'Fresh cilantro', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1588879460618-925d8326716b?auto=format&fit=crop&w=300&q=80', rating: 4.4, numReviews: 14 },
  { name: 'Rosemary', price: 2.99, category: 'Herbs', countInStock: 40, description: 'Woody rosemary sprigs', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1596199050105-6d5d32ca0bd9?auto=format&fit=crop&w=300&q=80', rating: 4.8, numReviews: 8 },
  { name: 'Thyme', price: 2.99, category: 'Herbs', countInStock: 45, description: 'Fresh thyme sprigs', brand: 'Herb Garden', unit: 'bunch', image: 'https://images.unsplash.com/photo-1596199050105-6d5d32ca0bd9?auto=format&fit=crop&w=300&q=80', rating: 4.7, numReviews: 9 }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    try {
      await mongoose.connection.db.dropCollection('orders');
    } catch (e) {
      console.log('Orders collection not found or already empty');
    }
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('👤 Creating users...');
    const createdUsers = await User.insertMany(users.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 10)
    })));
    const adminUser = createdUsers[0]._id;
    const regularUsers = createdUsers.slice(1);

    console.log('🏷️  Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    
    // Map category names to IDs
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('🍎 Creating products...');
    const sampleProducts = products.map(product => {
      return { ...product, user: adminUser, category: categoryMap[product.category] || createdCategories[0]._id };
    });
    const createdProducts = await Product.insertMany(sampleProducts);

    console.log('📦 Creating orders (for recommendation engine)...');
    const orders = [];
    
    // Create 50 random orders
    for (let i = 0; i < 50; i++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      // Pick 2-5 random products
      const numItems = Math.floor(Math.random() * 4) + 2;
      const orderItems = [];
      let totalPrice = 0;
      
      // Shuffle products to pick random ones
      const shuffledProducts = [...createdProducts].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffledProducts.slice(0, numItems);
      
      selectedProducts.forEach(product => {
        const qty = Math.floor(Math.random() * 3) + 1;
        orderItems.push({
          name: product.name,
          qty: qty,
          image: product.image,
          price: product.price,
          product: product._id
        });
        totalPrice += product.price * qty;
      });

      orders.push({
        // user: randomUser._id, // Removed as per schema
        orderItems,
        customerInfo: {
          name: randomUser.name,
          email: randomUser.email,
          phone: randomUser.phone,
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: totalPrice,
        shippingPrice: 10,
        totalPrice: totalPrice + 10,
        status: Math.random() > 0.5 ? 'Delivered' : 'Pending',
        isPaid: true,
        isDelivered: Math.random() > 0.5
      });
    }
    
    await Order.insertMany(orders);

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
