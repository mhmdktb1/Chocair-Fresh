#!/usr/bin/env node

/**
 * ==========================================
 * RECOMMENDATION SYSTEM - QUICK TEST
 * ==========================================
 * 
 * Simple test script to verify the system is working
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

console.log('🧪 Testing Recommendation System...\n');

async function testSystemStatus() {
  console.log('1️⃣ Testing system status...');
  try {
    const response = await axios.get(`${BASE_URL}/api/recommend/status`);
    console.log('✅ Status:', response.data.status);
    console.log('   Message:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
    return false;
  }
}

async function testGetProducts() {
  console.log('\n2️⃣ Getting a product ID for testing...');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?limit=1`);
    if (response.data.data && response.data.data.length > 0) {
      const product = response.data.data[0];
      console.log(`✅ Found product: ${product.name} (${product._id})`);
      return product._id;
    } else {
      console.log('❌ No products found in database');
      return null;
    }
  } catch (error) {
    console.log('❌ Failed to fetch products:', error.message);
    return null;
  }
}

async function testProductRecommendations(productId) {
  console.log('\n3️⃣ Testing product recommendations...');
  try {
    const response = await axios.post(`${BASE_URL}/api/recommend/product`, {
      productId: productId,
      limit: 5
    });
    
    if (response.data.success) {
      console.log(`✅ Got ${response.data.count} recommendations`);
      console.log('   Source:', response.data.sourceProduct.name);
      
      if (response.data.data.length > 0) {
        console.log('   Recommendations:');
        response.data.data.forEach((rec, index) => {
          console.log(`     ${index + 1}. ${rec.product.name} (score: ${rec.score.toFixed(1)})`);
        });
      }
      return true;
    } else {
      console.log('❌ Recommendation request failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Recommendation test failed:', error.message);
    if (error.response) {
      console.log('   Error:', error.response.data.message || error.response.data);
    }
    return false;
  }
}

async function testTrendingProducts() {
  console.log('\n4️⃣ Testing trending products...');
  try {
    const response = await axios.get(`${BASE_URL}/api/recommend/trending?limit=5`);
    
    if (response.data.success) {
      console.log(`✅ Got ${response.data.count} trending products`);
      
      if (response.data.data.length > 0) {
        console.log('   Trending:');
        response.data.data.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.product.name} (popularity: ${item.popularity})`);
        });
      }
      return true;
    } else {
      console.log('❌ Trending request failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Trending test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   RECOMMENDATION SYSTEM QUICK TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: System Status
  const statusOk = await testSystemStatus();
  
  if (!statusOk) {
    console.log('\n❌ System not ready. Please:');
    console.log('   1. Run: npm run recommend:build');
    console.log('   2. Ensure server is running: npm run dev');
    process.exit(1);
  }

  // Test 2: Get a product
  const productId = await testGetProducts();
  
  if (!productId) {
    console.log('\n⚠️  No products in database. Cannot test recommendations.');
    console.log('   Please add some products first.');
    process.exit(1);
  }

  // Test 3: Recommendations
  await testProductRecommendations(productId);

  // Test 4: Trending
  await testTrendingProducts();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
