/**
 * ==========================================
 * RECOMMENDATION SYSTEM - EXAMPLE USAGE
 * ==========================================
 * 
 * This file demonstrates how to use the recommendation system
 * both programmatically and via API calls.
 */

// ============================================
// 1. PROGRAMMATIC USAGE (from another module)
// ============================================

import {
  getProductRecommendations,
  getTrendingProducts
} from './engine/recommendationEngine.js';

// Example 1: Get recommendations for a product
async function exampleGetRecommendations() {
  try {
    const productId = '507f1f77bcf86cd799439011'; // Replace with real ID
    
    const recommendations = await getProductRecommendations(productId, {
      limit: 5,
      excludeIds: [] // Optionally exclude some products
    });

    console.log('Recommendations:', recommendations);
    /*
    Output:
    [
      {
        productId: '507f1f77bcf86cd799439012',
        score: 156.3,
        associationCount: 14,
        popularity: 87,
        name: 'Fresh Onions'
      },
      ...
    ]
    */
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Get trending products
async function exampleGetTrending() {
  try {
    const trending = await getTrendingProducts(10);
    console.log('Trending Products:', trending);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// 2. API USAGE (HTTP requests)
// ============================================

// Example 3: API call using fetch (for frontend)
async function frontendExample() {
  // Get recommendations
  const response = await fetch('http://localhost:5000/api/recommend/product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: '507f1f77bcf86cd799439011',
      limit: 6
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Recommended products:', data.data);
    // Display in UI
  }
}

// Example 4: API call using axios (for frontend)
async function frontendExampleAxios() {
  try {
    const response = await axios.post('http://localhost:5000/api/recommend/product', {
      productId: '507f1f77bcf86cd799439011',
      limit: 6
    });

    const recommendations = response.data.data;
    console.log('Recommendations:', recommendations);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// 3. CURL EXAMPLES (for testing)
// ============================================

/*

# Get system status
curl http://localhost:5000/api/recommend/status

# Get recommendations for a product
curl -X POST http://localhost:5000/api/recommend/product \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "limit": 5,
    "excludeIds": []
  }'

# Get trending products
curl http://localhost:5000/api/recommend/trending?limit=10

# Refresh knowledge (after rebuilding data)
curl -X POST http://localhost:5000/api/recommend/refresh

*/

// ============================================
// 4. REACT COMPONENT EXAMPLE
// ============================================

/*
import React, { useEffect, useState } from 'react';

function ProductRecommendations({ productId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await fetch('http://localhost:5000/api/recommend/product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, limit: 6 })
        });

        const data = await response.json();
        
        if (data.success) {
          setRecommendations(data.data);
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [productId]);

  if (loading) return <div>Loading recommendations...</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="recommendations">
      <h3>You might also like</h3>
      <div className="products-grid">
        {recommendations.map((rec) => (
          <ProductCard key={rec.product._id} product={rec.product} />
        ))}
      </div>
    </div>
  );
}
*/

// ============================================
// 5. EXPRESS ROUTE INTEGRATION EXAMPLE
// ============================================

/*
import express from 'express';
import { getProductRecommendations } from './recommendation/engine/recommendationEngine.js';

const router = express.Router();

// Custom endpoint that combines product details with recommendations
router.get('/products/:id/with-recommendations', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Get product details
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get recommendations
    const recommendations = await getProductRecommendations(productId, {
      limit: 6
    });
    
    res.json({
      product: product,
      recommendations: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// ============================================
// 6. SCHEDULED REBUILD EXAMPLE (Node-Cron)
// ============================================

/*
import cron from 'node-cron';
import { exec } from 'child_process';
import { refreshKnowledge } from './recommendation/engine/recommendationEngine.js';

// Rebuild knowledge maps every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Rebuilding recommendation knowledge...');
  
  exec('npm run recommend:build', (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to rebuild:', error);
      return;
    }
    
    console.log('Knowledge rebuilt successfully');
    
    // Refresh in-memory knowledge
    refreshKnowledge();
  });
});
*/

// ============================================
// 7. TESTING EXAMPLE (Jest)
// ============================================

/*
import { getProductRecommendations } from '../recommendation/engine/recommendationEngine.js';

describe('Recommendation Engine', () => {
  it('should return recommendations for a product', async () => {
    const productId = 'test-product-id';
    const recommendations = await getProductRecommendations(productId, {
      limit: 5
    });
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeLessThanOrEqual(5);
    
    if (recommendations.length > 0) {
      expect(recommendations[0]).toHaveProperty('productId');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('popularity');
    }
  });
  
  it('should return trending products', async () => {
    const trending = await getTrendingProducts(10);
    
    expect(Array.isArray(trending)).toBe(true);
    expect(trending.length).toBeLessThanOrEqual(10);
  });
});
*/

// ============================================
// 8. ERROR HANDLING EXAMPLE
// ============================================

async function robustRecommendationFetch(productId) {
  try {
    const response = await fetch('http://localhost:5000/api/recommend/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, limit: 6 })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.warn('Recommendations unavailable:', data.message);
      return [];
    }

    return data.data;

  } catch (error) {
    console.error('Failed to load recommendations:', error);
    // Return empty array or fallback data
    return [];
  }
}

// ============================================
// EXPORT EXAMPLES (if needed in other files)
// ============================================

export {
  exampleGetRecommendations,
  exampleGetTrending,
  frontendExample,
  robustRecommendationFetch
};
