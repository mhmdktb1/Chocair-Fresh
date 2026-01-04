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
  { name: 'Chocolate', description: 'Premium chocolate products', slug: 'chocolate' },
  { name: 'Beverages', description: 'Hot and cold beverages', slug: 'beverages' },
  { name: 'Snacks', description: 'Delicious snacks and treats', slug: 'snacks' },
  { name: 'Dairy', description: 'Fresh dairy products', slug: 'dairy' },
  { name: 'Bakery', description: 'Fresh baked goods', slug: 'bakery' }
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
  // Chocolate Category
  { name: 'Dark Chocolate Bar', price: 4.99, category: 'Chocolate', countInStock: 100, description: 'Rich 70% dark chocolate', brand: 'Chocair', unit: 'piece', image: 'https://via.placeholder.com/300x300?text=Dark+Chocolate', rating: 4.5, numReviews: 10 },
  { name: 'Milk Chocolate Bar', price: 3.99, category: 'Chocolate', countInStock: 150, description: 'Creamy milk chocolate', brand: 'Chocair', unit: 'piece', image: 'https://via.placeholder.com/300x300?text=Milk+Chocolate', rating: 4.8, numReviews: 25 },
  { name: 'White Chocolate Bar', price: 3.99, category: 'Chocolate', countInStock: 120, description: 'Smooth white chocolate', brand: 'Chocair', unit: 'piece', image: 'https://via.placeholder.com/300x300?text=White+Chocolate', rating: 4.3, numReviews: 15 },
  { name: 'Chocolate Truffles', price: 8.99, category: 'Chocolate', countInStock: 80, description: 'Assorted chocolate truffles', brand: 'Chocair', unit: 'box', image: 'https://via.placeholder.com/300x300?text=Truffles', rating: 4.9, numReviews: 30 },
  
  // Beverages
  { name: 'Fresh Milk', price: 2.99, category: 'Beverages', countInStock: 200, description: 'Fresh whole milk', brand: 'Dairy Fresh', unit: 'liter', image: 'https://via.placeholder.com/300x300?text=Milk', rating: 4.7, numReviews: 50 },
  { name: 'Hot Chocolate Mix', price: 5.99, category: 'Beverages', countInStock: 90, description: 'Premium hot chocolate mix', brand: 'Chocair', unit: 'box', image: 'https://via.placeholder.com/300x300?text=Hot+Chocolate', rating: 4.6, numReviews: 22 },
  { name: 'Coffee Beans', price: 12.99, category: 'Beverages', countInStock: 70, description: 'Premium Arabica coffee beans', brand: 'Coffee Co', unit: 'kg', image: 'https://via.placeholder.com/300x300?text=Coffee', rating: 4.8, numReviews: 40 },
  { name: 'Green Tea', price: 6.99, category: 'Beverages', countInStock: 110, description: 'Organic green tea', brand: 'Tea Leaf', unit: 'box', image: 'https://via.placeholder.com/300x300?text=Green+Tea', rating: 4.4, numReviews: 18 },
  
  // Snacks
  { name: 'Chocolate Cookies', price: 4.49, category: 'Snacks', countInStock: 130, description: 'Crunchy chocolate chip cookies', brand: 'Chocair', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Cookies', rating: 4.7, numReviews: 35 },
  { name: 'Brownie Mix', price: 5.49, category: 'Snacks', countInStock: 85, description: 'Easy brownie baking mix', brand: 'Chocair', unit: 'box', image: 'https://via.placeholder.com/300x300?text=Brownie', rating: 4.5, numReviews: 20 },
  { name: 'Chocolate Wafers', price: 3.49, category: 'Snacks', countInStock: 140, description: 'Crispy chocolate wafers', brand: 'Chocair', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Wafers', rating: 4.2, numReviews: 12 },
  { name: 'Energy Bars', price: 2.99, category: 'Snacks', countInStock: 160, description: 'Chocolate-covered energy bars', brand: 'Energy Plus', unit: 'piece', image: 'https://via.placeholder.com/300x300?text=Energy+Bar', rating: 4.6, numReviews: 28 },
  
  // Dairy
  { name: 'Greek Yogurt', price: 3.49, category: 'Dairy', countInStock: 95, description: 'Creamy Greek yogurt', brand: 'Dairy Fresh', unit: 'cup', image: 'https://via.placeholder.com/300x300?text=Yogurt', rating: 4.5, numReviews: 16 },
  { name: 'Cream Cheese', price: 4.99, category: 'Dairy', countInStock: 75, description: 'Rich cream cheese', brand: 'Dairy Fresh', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Cream+Cheese', rating: 4.3, numReviews: 14 },
  { name: 'Butter', price: 5.49, category: 'Dairy', countInStock: 100, description: 'Premium butter', brand: 'Dairy Fresh', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Butter', rating: 4.8, numReviews: 32 },
  
  // Bakery
  { name: 'Chocolate Croissant', price: 2.99, category: 'Bakery', countInStock: 60, description: 'Freshly baked chocolate croissant', brand: 'Bakery Fresh', unit: 'piece', image: 'https://via.placeholder.com/300x300?text=Croissant', rating: 4.9, numReviews: 45 },
  { name: 'Chocolate Cake', price: 15.99, category: 'Bakery', countInStock: 40, description: 'Decadent chocolate cake', brand: 'Bakery Fresh', unit: 'cake', image: 'https://via.placeholder.com/300x300?text=Cake', rating: 5.0, numReviews: 60 },
  { name: 'Brownies', price: 7.99, category: 'Bakery', countInStock: 55, description: 'Fudgy chocolate brownies', brand: 'Bakery Fresh', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Brownies', rating: 4.8, numReviews: 38 },
  { name: 'Chocolate Muffins', price: 4.99, category: 'Bakery', countInStock: 70, description: 'Soft chocolate muffins', brand: 'Bakery Fresh', unit: 'pack', image: 'https://via.placeholder.com/300x300?text=Muffins', rating: 4.6, numReviews: 24 },
  { name: 'Bread', price: 2.49, category: 'Bakery', countInStock: 120, description: 'Fresh whole wheat bread', brand: 'Bakery Fresh', unit: 'loaf', image: 'https://via.placeholder.com/300x300?text=Bread', rating: 4.4, numReviews: 19 }
];

// Function to create sample orders (for recommendation testing)
const createSampleOrders = async (users, products) => {
  const orders = [];
  
  // Helper to create order items
  const createOrderItem = (product, quantity) => ({
    name: product.name,
    qty: quantity,
    image: product.image || 'https://via.placeholder.com/150',
    price: product.price,
    product: product._id
  });

  // Helper to create customer info
  const getCustomerInfo = (user) => ({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: '123 Main Street',
    city: 'Beirut',
    postalCode: '12345',
    country: 'Lebanon'
  });
  
  // Order patterns for recommendation testing
  // Pattern 1: Dark Chocolate + Milk + Cookies (common combination)
  orders.push({
    orderItems: [
      createOrderItem(products[0], 2),
      createOrderItem(products[4], 1),
      createOrderItem(products[8], 1)
    ],
    customerInfo: getCustomerInfo(users[1]),
    itemsPrice: (products[0].price * 2) + products[4].price + products[8].price,
    shippingPrice: 5.0,
    totalPrice: (products[0].price * 2) + products[4].price + products[8].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 2: Milk Chocolate + Hot Chocolate + Marshmallows
  orders.push({
    orderItems: [
      createOrderItem(products[1], 1),
      createOrderItem(products[5], 1),
      createOrderItem(products[4], 2)
    ],
    customerInfo: getCustomerInfo(users[2]),
    itemsPrice: products[1].price + products[5].price + (products[4].price * 2),
    shippingPrice: 5.0,
    totalPrice: products[1].price + products[5].price + (products[4].price * 2) + 5.0,
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 3: Coffee + Chocolate Cookies + Brownies
  orders.push({
    orderItems: [
      createOrderItem(products[6], 1),
      createOrderItem(products[8], 2),
      createOrderItem(products[17], 1)
    ],
    customerInfo: getCustomerInfo(users[3]),
    itemsPrice: products[6].price + (products[8].price * 2) + products[17].price,
    shippingPrice: 5.0,
    totalPrice: products[6].price + (products[8].price * 2) + products[17].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 4: Dark Chocolate + Milk (repeat)
  orders.push({
    orderItems: [
      createOrderItem(products[0], 1),
      createOrderItem(products[4], 2)
    ],
    customerInfo: getCustomerInfo(users[1]),
    itemsPrice: products[0].price + (products[4].price * 2),
    shippingPrice: 5.0,
    totalPrice: products[0].price + (products[4].price * 2) + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 5: Chocolate Cake + Milk + Butter
  orders.push({
    orderItems: [
      createOrderItem(products[16], 1),
      createOrderItem(products[4], 1),
      createOrderItem(products[14], 1)
    ],
    customerInfo: getCustomerInfo(users[4]),
    itemsPrice: products[16].price + products[4].price + products[14].price,
    shippingPrice: 5.0,
    totalPrice: products[16].price + products[4].price + products[14].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 6: Cookies + Milk (classic combination - repeat)
  orders.push({
    orderItems: [
      createOrderItem(products[8], 3),
      createOrderItem(products[4], 2)
    ],
    customerInfo: getCustomerInfo(users[2]),
    itemsPrice: (products[8].price * 3) + (products[4].price * 2),
    shippingPrice: 5.0,
    totalPrice: (products[8].price * 3) + (products[4].price * 2) + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 7: Coffee + Chocolate Croissant + Butter
  orders.push({
    orderItems: [
      createOrderItem(products[6], 1),
      createOrderItem(products[15], 2),
      createOrderItem(products[14], 1)
    ],
    customerInfo: getCustomerInfo(users[3]),
    itemsPrice: products[6].price + (products[15].price * 2) + products[14].price,
    shippingPrice: 5.0,
    totalPrice: products[6].price + (products[15].price * 2) + products[14].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 8: Truffles + Milk Chocolate (gift combo)
  orders.push({
    orderItems: [
      createOrderItem(products[3], 1),
      createOrderItem(products[1], 2)
    ],
    customerInfo: getCustomerInfo(users[4]),
    itemsPrice: products[3].price + (products[1].price * 2),
    shippingPrice: 5.0,
    totalPrice: products[3].price + (products[1].price * 2) + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 9: Dark Chocolate + Coffee (repeat for popularity)
  orders.push({
    orderItems: [
      createOrderItem(products[0], 1),
      createOrderItem(products[6], 1)
    ],
    customerInfo: getCustomerInfo(users[1]),
    itemsPrice: products[0].price + products[6].price,
    shippingPrice: 5.0,
    totalPrice: products[0].price + products[6].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery',
    isPaid: true,
    isDelivered: true
  });

  // Pattern 10: Brownie Mix + Butter + Milk
  orders.push({
    orderItems: [
      createOrderItem(products[9], 1),
      createOrderItem(products[14], 1),
      createOrderItem(products[4], 1)
    ],
    customerInfo: getCustomerInfo(users[2]),
    itemsPrice: products[9].price + products[14].price + products[4].price,
    shippingPrice: 5.0,
    totalPrice: products[9].price + products[14].price + products[4].price + 5.0,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    isPaid: true,
    isDelivered: true
  });

  return orders;
};

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Hash passwords
    console.log('🔐 Hashing user passwords...');
    for (let user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
    console.log('✅ Passwords hashed\n');

    // Insert categories
    console.log('📦 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories\n`);

    // Map category names to IDs
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Update products with category IDs
    products.forEach(product => {
      product.category = categoryMap[product.category];
    });

    // Insert products
    console.log('🛍️  Creating products...');
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products\n`);

    // Insert users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Create sample orders
    console.log('📝 Creating sample orders...');
    const orderData = await createSampleOrders(createdUsers, createdProducts);
    const createdOrders = await Order.insertMany(orderData);
    console.log(`✅ Created ${createdOrders.length} orders\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   • Categories: ${createdCategories.length}`);
    console.log(`   • Products: ${createdProducts.length}`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Orders: ${createdOrders.length}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔑 Admin Login Credentials:');
    console.log('   Email: admin@chocair.com');
    console.log('   Password: admin123\n');
    
    console.log('👤 Test User Credentials:');
    console.log('   Email: john@example.com');
    console.log('   Password: user123\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Run: npm run recommend:build');
    console.log('   2. Test recommendations in your app');
    console.log('   3. Check admin panel\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
