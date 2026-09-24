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
import rawProducts from '../products.js';

// Real Categories
const categories = [
  {
    name: 'Fruits',
    description: 'Fresh citrus, orchard and daily farm fruits',
    image: '/assets/images/products/fruits/apple-red.jpg',
    isVisible: true,
    featured: true
  },
  {
    name: 'Seasonal Fruits',
    description: 'Crisp summer melons, fresh picked cherries, figs, and seasonal harvest',
    image: '/assets/images/products/fruits/cherry.jpg',
    isVisible: true,
    featured: true
  },
  {
    name: 'Vegetables',
    description: 'Farm-fresh organic vegetables and crisp greens',
    image: '/assets/images/products/vegetables/tomato.jpg',
    isVisible: true,
    featured: true
  },
  {
    name: 'Herbs',
    description: 'Fresh aromatic culinary herbs and seasoning greens',
    image: '/assets/images/products/herbs/parsley.jpg',
    isVisible: true,
    featured: false
  },
  {
    name: 'Raw Nuts',
    description: 'Natural unroasted raw whole nuts and nutritious seeds',
    image: '/assets/images/products/nuts/almond-raw.jpg',
    isVisible: true,
    featured: true
  },
  {
    name: 'Cooked Nuts',
    description: 'Crunchy oven-roasted, salted and gourmet flavored nuts',
    image: '/assets/images/products/nuts/cashew-roasted.jpg',
    isVisible: true,
    featured: false
  },
  {
    name: 'Dates',
    description: 'Premium Medjool, Ajwa, Sukkari and stuffed gourmet dates',
    image: '/assets/images/products/dates/medjool-dates.jpg',
    isVisible: true,
    featured: true
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@chocair.com',
    phone: '+96170516382',
    password: 'admin123',
    role: 'admin',
    isAdmin: true,
    isActive: true
  },
  {
    name: 'Admin Secondary',
    email: 'admin2@chocair.com',
    phone: '+9618199999',
    password: 'admin123',
    role: 'admin',
    isAdmin: true,
    isActive: true
  },
  {
    name: 'Ahmad Khalil',
    email: 'ahmad@example.com',
    phone: '+96170000001',
    password: 'user123',
    role: 'user',
    isAdmin: false,
    isActive: true
  },
  {
    name: 'Rana Haddad',
    email: 'rana@example.com',
    phone: '+96170000002',
    password: 'user123',
    role: 'user',
    isAdmin: false,
    isActive: true
  },
  {
    name: 'Lina Mansour',
    email: 'lina@example.com',
    phone: '+96170000004',
    password: 'user123',
    role: 'user',
    isAdmin: false,
    isActive: true
  },
  {
    name: 'Omar Saleh',
    email: 'omar@example.com',
    phone: '+96170000005',
    password: 'user123',
    role: 'user',
    isAdmin: false,
    isActive: true
  }
];

// Function to create sample orders (for recommendation and analytics testing)
const createSampleOrders = async (createdUsers, createdProducts) => {
  const orders = [];
  const regularUsers = createdUsers.filter(u => !u.isAdmin && u.role !== 'admin');

  for (let i = 0; i < 25; i++) {
    const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)] || createdUsers[0];
    const numItems = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...createdProducts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numItems);

    let itemsPrice = 0;
    const orderItems = selected.map(p => {
      const qty = Math.floor(Math.random() * 2) + 1;
      itemsPrice += p.price * qty;
      return {
        name: p.name,
        qty,
        image: p.image || '/assets/images/products/fruits/apple-red.jpg',
        price: p.price,
        product: p._id
      };
    });

    const shippingPrice = itemsPrice >= 30 ? 0 : 5.0;
    const totalPrice = Number((itemsPrice + shippingPrice).toFixed(2));

    orders.push({
      user: randomUser._id,
      orderItems,
      customerInfo: {
        name: randomUser.name,
        email: randomUser.email || `${randomUser.phone}@example.com`,
        phone: randomUser.phone,
        address: 'Main Street, Block B',
        city: 'Beirut',
        postalCode: '1100',
        country: 'Lebanon'
      },
      paymentMethod: i % 2 === 0 ? 'Cash on Delivery' : 'Credit Card',
      itemsPrice: Number(itemsPrice.toFixed(2)),
      shippingPrice,
      totalPrice,
      status: i % 3 === 0 ? 'Delivered' : i % 3 === 1 ? 'Preparing' : 'Pending',
      isPaid: i % 2 === 0,
      isDelivered: i % 3 === 0
    });
  }

  return orders;
};

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data (products, categories, users, orders)...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Hash passwords
    console.log('🔐 Hashing user passwords...');
    const hashedUsers = [];
    for (let user of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      hashedUsers.push({
        ...user,
        password: hashedPassword
      });
    }

    // Insert users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Insert categories
    console.log('📦 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories:`);
    createdCategories.forEach(c => console.log(`   - ${c.name}`));
    console.log('');

    // Insert products (keeping category string clean and matching)
    console.log('🛍️  Creating products...');
    const createdProducts = await Product.insertMany(rawProducts);
    console.log(`✅ Created ${createdProducts.length} products\n`);

    // Create sample orders
    console.log('📝 Creating sample orders...');
    const orderData = await createSampleOrders(createdUsers, createdProducts);
    const createdOrders = await Order.insertMany(orderData);
    console.log(`✅ Created ${createdOrders.length} orders\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('✅ CHOCAIR FRESH DATABASE SEEDED WITH REAL DATA!');
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Categories: ${createdCategories.length}`);
    console.log(`   • Products: ${createdProducts.length}`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Orders: ${createdOrders.length}`);
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('🔑 Admin Credentials:');
    console.log('   Email: admin@chocair.com');
    console.log('   Phone: +9618199999');
    console.log('   Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
