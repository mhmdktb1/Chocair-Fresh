import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import colors from 'colors';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';
import orders from '../data/orders_300.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    console.log('Starting data import...');

    // 1. Get all products to map names to IDs and Images
    const dbProducts = await Product.find({});
    const productMap = new Map();
    dbProducts.forEach(p => {
      productMap.set(p.name, { _id: p._id, image: p.image });
    });

    console.log(`Found ${dbProducts.length} products in DB.`);

    // 2. Get all users to assign orders to
    const dbUsers = await User.find({});
    if (dbUsers.length === 0) {
        console.error('No users found in DB. Please seed users first.');
        process.exit(1);
    }
    console.log(`Found ${dbUsers.length} users in DB.`);

    // 3. Transform orders
    let skippedItems = 0;
    const ordersToInsert = orders.map((order, index) => {
        // Assign to a random user from DB (or round robin)
        const user = dbUsers[index % dbUsers.length];

        // Map order items
        const orderItems = order.orderItems.map(item => {
            const productData = productMap.get(item.name);
            if (!productData) {
                // console.warn(`Product not found: ${item.name}`);
                skippedItems++;
                return null;
            }
            return {
                ...item,
                product: productData._id,
                image: productData.image || '/images/placeholder.jpg', // Fallback image
                _id: undefined // Let Mongo generate new ID for item
            };
        }).filter(item => item !== null);

        if (orderItems.length === 0) return null;

        // Construct customerInfo
        const customerInfo = {
            name: user.name || 'Unknown User',
            email: user.email || `user${index}@example.com`,
            phone: user.phone || '12345678',
            address: order.shippingAddress?.address || 'Beirut',
            city: order.shippingAddress?.city || 'Beirut',
            country: order.shippingAddress?.country || 'Lebanon',
            postalCode: '0000'
        };

        // Determine status
        let status = 'Pending';
        if (order.isDelivered) status = 'Delivered';
        else if (order.isPaid) status = 'Preparing';

        return {
            ...order,
            user: user._id, // Although schema doesn't seem to have 'user' field in the snippet I read?
            // Wait, let me check schema again. It didn't show 'user' field in the snippet!
            // But usually orders have a user reference.
            // I'll check the schema again.
            
            customerInfo,
            orderItems,
            status,
            _id: undefined, // Let Mongo generate new ID for order
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
            paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
            deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined
        };
    }).filter(o => o !== null);

    console.log(`Prepared ${ordersToInsert.length} orders to insert. (Skipped ${skippedItems} invalid items)`);

    // 4. Insert
    if (ordersToInsert.length > 0) {
        await Order.insertMany(ordersToInsert);
        console.log('Data Imported!');
    } else {
        console.log('No orders to import.');
    }

    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
