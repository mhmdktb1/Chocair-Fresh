/**
 * ==========================================
 * RECOMMENDATION CONTROLLER
 * ==========================================
 * 
 * Handles recommendation API requests
 * Connects the recommendation engine to the REST API
 */

import { asyncHandler } from '../../middleware/errorMiddleware.js';
import {
  getProductRecommendations,
  getTrendingProducts,
  refreshKnowledge
} from '../engine/recommendationEngine.js';
import Product from '../../models/productModel.js';

/**
 * @desc    Get product recommendations based on a product
 * @route   POST /api/recommend/product
 * @access  Public
 */
export const recommendByProduct = asyncHandler(async (req, res) => {
  const { productId, limit = 10, excludeIds = [] } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
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
    excludeIds
  });

  // Enrich with full product data
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      const productData = await Product.findById(rec.productId).select(
        'name price image category stock'
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
        'name price image category stock'
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
