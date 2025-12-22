/**
 * ==========================================
 * RECOMMENDATION CONTROLLER
 * ==========================================
 * 
 * Handles recommendation API requests
 * Connects the recommendation engine to the REST API
 */

import asyncHandler from 'express-async-handler';
import {
  getProductRecommendations,
  getCartRecommendations,
  getTrendingProducts,
  refreshKnowledge
} from '../engine/recommendationEngine.js';
import Product from '../../models/productModel.js';
import Order from '../../models/orderModel.js';
import User from '../../models/userModel.js';

/**
 * @desc    Get product recommendations based on a product
 * @route   POST /api/recommend/product
 * @access  Public
 */
export const recommendByProduct = asyncHandler(async (req, res) => {
  const { productId, limit = 10, excludeIds = [], userId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  // Resolve user phone if userId is provided
  let userPhone = null;
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        userPhone = user.phone;
      }
    } catch (e) {
      // Ignore invalid user ID
    }
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Get recommendations
  const recommendations = await getProductRecommendations(productId, {
    limit: Number(limit),
    excludeIds,
    userId: userPhone // Pass phone as userId for clustering
  });

  // Enrich with full product data
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      const productData = await Product.findById(rec.productId).select(
        'name price image category stock unit'
      );

      return {
        product: productData,
        score: rec.score,
        associationCount: rec.associationCount,
        popularity: rec.popularity,
        isFallback: rec.isFallback || false
      };
    })
  );

  // Filter out products that no longer exist
  const validRecommendations = enrichedRecommendations.filter(
    (rec) => rec.product !== null
  );

  res.json({
    success: true,
    count: validRecommendations.length,
    data: validRecommendations,
    sourceProduct: {
      id: product._id,
      name: product.name
    }
  });
});

/**
 * @desc    Get product recommendations based on cart contents
 * @route   POST /api/recommend/cart
 * @access  Public
 */
export const recommendByCart = asyncHandler(async (req, res) => {
  const { cartItems, limit = 10, userId } = req.body;

  // Validate input
  if (!cartItems || !Array.isArray(cartItems)) {
    res.status(400);
    throw new Error('cartItems array is required');
  }

  // If cart is empty, return empty array
  if (cartItems.length === 0) {
    return res.json({
      success: true,
      count: 0,
      data: []
    });
  }

  // Resolve user phone if userId is provided
  let userPhone = null;
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        userPhone = user.phone;
      }
    } catch (e) {
      // Ignore invalid user ID
    }
  }

  // Get recommendations
  const recommendations = await getCartRecommendations(cartItems, {
    limit: Number(limit),
    userId: userPhone
  });

  // Enrich with full product data
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      const productData = await Product.findById(rec.productId).select(
        'name price image category stock unit'
      );

      return {
        product: productData,
        score: rec.score,
        matches: rec.matches, // Helpful for UI: "Because you bought X and Y"
        isFallback: false
      };
    })
  );

  // Filter out products that no longer exist in DB
  const validRecommendations = enrichedRecommendations.filter(
    (rec) => rec.product !== null
  );

  res.json({
    success: true,
    count: validRecommendations.length,
    data: validRecommendations
  });
});

/**
 * @desc    Get trending products
 * @route   GET /api/recommend/trending
 * @access  Public
 */
export const getTrending = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get trending products
  const trending = await getTrendingProducts(Number(limit));

  // Enrich with full product data
  const enrichedTrending = await Promise.all(
    trending.map(async (item) => {
      const productData = await Product.findById(item.productId).select(
        'name price image category stock unit'
      );

      return {
        product: productData,
        popularity: item.popularity
      };
    })
  );

  // Filter out products that no longer exist
  const validTrending = enrichedTrending.filter(
    (item) => item.product !== null
  );

  res.json({
    success: true,
    count: validTrending.length,
    data: validTrending
  });
});

/**
 * @desc    Refresh recommendation knowledge (rebuild from latest data)
 * @route   POST /api/recommend/refresh
 * @access  Admin only (you can add auth later)
 */
export const refreshRecommendations = asyncHandler(async (req, res) => {
  await refreshKnowledge();

  res.json({
    success: true,
    message: 'Recommendation knowledge refreshed successfully'
  });
});

/**
 * @desc    Get recommendation system status
 * @route   GET /api/recommend/status
 * @access  Public
 */
export const getRecommendationStatus = asyncHandler(async (req, res) => {
  try {
    // Try to load knowledge to check if it exists
    await refreshKnowledge();

    res.json({
      success: true,
      status: 'ready',
      message: 'Recommendation system is operational'
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'not-ready',
      message: 'Knowledge maps not found. Please run data extraction scripts.',
      error: error.message
    });
  }
});

/**
 * @desc    Get new arrivals (Trending Now)
 * @route   GET /api/recommend/new
 * @access  Public
 */
export const getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Fetch most recently created products
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .select('name price image category stock unit');

  res.json({
    success: true,
    count: products.length,
    data: products.map(p => ({ product: p }))
  });
});

/**
 * @desc    Get personalized recommendations (Just For You)
 * @route   GET /api/recommend/personalized
 * @access  Private
 */
export const getPersonalized = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user._id; // Assumes auth middleware adds user to req

  // 1. Get user's last 5 orders
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('orderItems.product');

  // 2. Extract product IDs from orders
  const purchasedProductIds = new Set();
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (item.product) purchasedProductIds.add(item.product.toString());
    });
  });

  // 3. If no orders, return trending as fallback
  if (purchasedProductIds.size === 0) {
    return getTrending(req, res);
  }

  // 4. Get recommendations for each purchased product
  const recommendations = new Map(); // Use map to deduplicate and sum scores
  
  for (const productId of purchasedProductIds) {
    const recs = await getProductRecommendations(productId, { limit: 5 });
    recs.forEach(rec => {
      if (purchasedProductIds.has(rec.productId)) return; // Don't recommend what they already bought
      
      const currentScore = recommendations.get(rec.productId) || 0;
      recommendations.set(rec.productId, currentScore + rec.score);
    });
  }

  // 5. Sort by score
  const sortedRecs = Array.from(recommendations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(limit));

  // 6. Fetch full product details
  const enrichedRecs = await Promise.all(
    sortedRecs.map(async ([productId, score]) => {
      const product = await Product.findById(productId).select('name price image category stock unit');
      return { product, score };
    })
  );

  res.json({
    success: true,
    count: enrichedRecs.length,
    data: enrichedRecs.filter(r => r.product)
  });
});
