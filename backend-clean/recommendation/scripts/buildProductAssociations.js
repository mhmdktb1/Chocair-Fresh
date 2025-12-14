/**
 * ==========================================
 * PRODUCT ASSOCIATION BUILDER
 * ==========================================
 * 
 * Extracts product relationships from historical orders.
 * Uses Market Basket Analysis to find which products are bought together.
 * 
 * Output: Product Association Map
 * Format: { "productId": { "relatedProductId": count, ... }, ... }
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
 * Build Product Association Map from Orders
 * Analyzes which products appear together in the same order
 */
async function buildProductAssociations() {
  try {
    console.log('🔍 Starting Product Association Analysis...\n');

    // Connect to database
    await connectDB();

    // Fetch all completed orders with their items
    const orders = await Order.find({
      status: { $in: ['Delivered', 'Preparing', 'Out for Delivery'] }
    }).select('items');

    console.log(`📦 Analyzing ${orders.length} orders...\n`);

    if (orders.length === 0) {
      console.log('⚠️  No orders found. Cannot build associations.');
      return;
    }

    // Association map: { productId: { relatedProductId: count } }
    const associationMap = {};

    // Also build a product name map for readable output
    const productNames = {};

    // Process each order
    for (const order of orders) {
      const items = order.items;

      // Skip orders with single item (no associations possible)
      if (items.length < 2) continue;

      // For each pair of products in the order
      for (let i = 0; i < items.length; i++) {
        const productA = items[i].product.toString();
        const nameA = items[i].name;

        // Store product name
        if (!productNames[productA]) {
          productNames[productA] = nameA;
        }

        // Initialize association map for this product
        if (!associationMap[productA]) {
          associationMap[productA] = {};
        }

        // Compare with all other products in the same order
        for (let j = 0; j < items.length; j++) {
          if (i === j) continue; // Skip self

          const productB = items[j].product.toString();
          const nameB = items[j].name;

          // Store product name
          if (!productNames[productB]) {
            productNames[productB] = nameB;
          }

          // Increment association count
          if (!associationMap[productA][productB]) {
            associationMap[productA][productB] = 0;
          }
          associationMap[productA][productB]++;
        }
      }
    }

    // Sort associations by count (highest first)
    const sortedAssociations = {};
    for (const [productId, associations] of Object.entries(associationMap)) {
      const sorted = Object.entries(associations)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      sortedAssociations[productId] = sorted;
    }

    // Save to file
    const dataDir = path.join(__dirname, '../data');
    const outputPath = path.join(dataDir, 'product-associations.json');

    await fs.writeFile(
      outputPath,
      JSON.stringify(sortedAssociations, null, 2),
      'utf-8'
    );

    // Also save product names map for reference
    const namesPath = path.join(dataDir, 'product-names.json');
    await fs.writeFile(
      namesPath,
      JSON.stringify(productNames, null, 2),
      'utf-8'
    );

    console.log('✅ Product Association Map built successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Total products with associations: ${Object.keys(sortedAssociations).length}\n`);

    // Show sample
    console.log('📋 Sample associations:');
    let count = 0;
    for (const [productId, associations] of Object.entries(sortedAssociations)) {
      if (count >= 3) break;
      const productName = productNames[productId];
      console.log(`\n   ${productName} (${productId}):`);
      const topAssociations = Object.entries(associations).slice(0, 3);
      topAssociations.forEach(([relatedId, freq]) => {
        console.log(`     → ${productNames[relatedId]}: ${freq} times`);
      });
      count++;
    }

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('❌ Error building product associations:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
buildProductAssociations();
