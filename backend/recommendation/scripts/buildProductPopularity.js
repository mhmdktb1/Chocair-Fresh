/**
 * ==========================================
 * PRODUCT POPULARITY BUILDER
 * ==========================================
 * 
 * Calculates product popularity from historical orders.
 * Tracks how many times each product has been sold.
 * 
 * Output: Product Popularity Map
 * Format: { "productId": soldCount, ... }
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Order from '../../models/orderModel.js';
import Product from '../../models/productModel.js';
import connectDB from '../../config/db.js';

/**
 * Build Product Popularity Map from Orders
 * Counts how many times each product has been sold
 */
async function buildProductPopularity() {
  try {
    console.log('📊 Starting Product Popularity Analysis...\n');

    // Connect to database
    await connectDB();

    // Fetch all completed orders
    const orders = await Order.find({
      status: { $in: ['Delivered', 'Preparing', 'Out for Delivery'] }
    }).select('items');

    console.log(`📦 Analyzing ${orders.length} orders...\n`);

    if (orders.length === 0) {
      console.log('⚠️  No orders found. Cannot build popularity map.');
      return;
    }

    // Popularity map: { productId: totalSoldCount }
    const popularityMap = {};

    // Product names for reference
    const productNames = {};

    // Process each order
    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.product.toString();
        const productName = item.name;
        const quantity = item.quantity;

        // Store product name
        if (!productNames[productId]) {
          productNames[productId] = productName;
        }

        // Increment sold count
        if (!popularityMap[productId]) {
          popularityMap[productId] = 0;
        }
        popularityMap[productId] += quantity;
      }
    }

    // Sort by popularity (highest first)
    const sortedPopularity = Object.entries(popularityMap)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    // Save to file
    const dataDir = path.join(__dirname, '../data');
    const outputPath = path.join(dataDir, 'product-popularity.json');

    await fs.writeFile(
      outputPath,
      JSON.stringify(sortedPopularity, null, 2),
      'utf-8'
    );

    console.log('✅ Product Popularity Map built successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Total products tracked: ${Object.keys(sortedPopularity).length}\n`);

    // Show top 10
    console.log('🏆 Top 10 Most Popular Products:');
    const top10 = Object.entries(sortedPopularity).slice(0, 10);
    top10.forEach(([productId, count], index) => {
      const name = productNames[productId];
      console.log(`   ${index + 1}. ${name}: ${count} units sold`);
    });

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('❌ Error building product popularity:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
buildProductPopularity();
