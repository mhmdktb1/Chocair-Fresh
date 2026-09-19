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
  getSimilarProducts,
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
  const { productId, limit = 10, excludeIds = [], userId, type = 'associations' } = req.body;

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
  let recommendations = [];
  
  if (type === 'similar') {
    // Use direct DB query for similar products (same category)
    // This avoids issues with stale category data in the engine
    const similarDocs = await Product.find({
      category: product.category,
      _id: { $ne: productId }
    })
    .sort({ rating: -1, numReviews: -1 })
    .limit(Number(limit));

    recommendations = similarDocs.map(doc => ({
      productId: doc._id,
      score: doc.rating || 0,
      product: doc // Pass full doc to avoid re-fetching
    }));

  } else {
    // Use Engine for Associations
    recommendations = await getProductRecommendations(productId, {
      limit: Number(limit),
      excludeIds,
      userId: userPhone // Pass phone as userId for clustering
    });

    // Check if engine returned fallback (Popular) or empty
    // If so, try to use Category-based fallback instead
    const isFallback = recommendations.length === 0 || (recommendations.length > 0 && recommendations[0].isFallback);

    if (isFallback) {
       const categoryFallback = await Product.find({
          category: product.category,
          _id: { $ne: productId }
       })
       .sort({ rating: -1, numReviews: -1 })
       .limit(Number(limit));

       if (categoryFallback.length > 0) {
         recommendations = categoryFallback.map(doc => ({
            productId: doc._id,
            score: doc.rating || 0,
            product: doc,
            isFallback: true
         }));
       }
    }
  }

  // Enrich with full product data (if not already present)
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      if (rec.product) {
        // Ensure we select the same fields as the standard enrichment
        // (Mongoose doc to object if needed, but usually fine)
        return {
            product: rec.product,
            score: rec.score,
            associationCount: rec.associationCount || 0,
            popularity: rec.popularity || 0,
            isFallback: rec.isFallback || false
        };
      }

      const productData = await Product.findById(rec.productId).select(
        'name price image category countInStock unit rating numReviews'
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
  let recommendations = [];
  try {
    recommendations = await getCartRecommendations(cartItems, {
      limit: Number(limit),
      userId: userPhone
    });
  } catch (err) {
    // If knowledge maps are not built yet, fallback to top rated products
    const excludedIds = cartItems.map(i => (i && (i.productId || i._id || i.id)) ? String(i.productId || i._id || i.id) : null).filter(Boolean);
    const fallbackProducts = await Product.find({ _id: { $nin: excludedIds } })
      .sort({ rating: -1, numReviews: -1 })
      .limit(Number(limit))
      .select('name price image category countInStock unit rating numReviews');

    return res.json({
      success: true,
      count: fallbackProducts.length,
      data: fallbackProducts.map(p => ({ product: p, score: p.rating || 0, isFallback: true }))
    });
  }

  // Enrich with full product data
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (rec) => {
      const productData = await Product.findById(rec.productId).select(
        'name price image category countInStock unit rating numReviews'
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

  try {
    // Get trending products from engine
    const trending = await getTrendingProducts(Number(limit));

    // Enrich with full product data
    const enrichedTrending = await Promise.all(
      trending.map(async (item) => {
        const productData = await Product.findById(item.productId).select(
          'name price image category countInStock unit rating numReviews'
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

    if (validTrending.length > 0) {
      return res.json({
        success: true,
        count: validTrending.length,
        data: validTrending
      });
    }
  } catch (error) {
    // Fallback to database query if knowledge files are not built yet
  }

  // DB Fallback: top rated products
  const fallbackProducts = await Product.find({})
    .sort({ rating: -1, numReviews: -1 })
    .limit(Number(limit))
    .select('name price image category countInStock unit rating numReviews');

  res.json({
    success: true,
    count: fallbackProducts.length,
    data: fallbackProducts.map(p => ({ product: p, popularity: p.rating || 0 }))
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
    .select('name price image category countInStock unit rating numReviews');

  res.json({
    success: true,
    count: products.length,
    data: products.map(p => ({ product: p }))
  });
});

/**
 * @desc    Get top rated products
 * @route   GET /api/recommend/top-rated
 * @access  Public
 */
export const getTopRated = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({})
    .sort({ rating: -1, numReviews: -1 })
    .limit(Number(limit))
    .select('name price image category countInStock unit rating numReviews');

  res.json({
    success: true,
    count: products.length,
    data: products.map(p => ({ product: p }))
  });
});

/**
 * @desc    Get personalized recommendations (Just For You / For You)
 * @route   GET /api/recommend/personalized
 * @access  Public (Optional auth for tailored user profile & order history)
 */
export const getPersonalized = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const user = req.user;

  // 1. If user is logged in, extract their past purchase history and category preferences
  if (user) {
    const userId = user._id;
    const userPhone = user.phone;

    const orderConditions = [{ user: userId }];
    if (userPhone) {
      orderConditions.push({ 'customerInfo.phone': userPhone });
    }

    const orders = await Order.find({ $or: orderConditions })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('orderItems.product');

    const purchasedProductIds = new Set();
    const categoryFrequency = {};

    orders.forEach((order) => {
      const items = order.orderItems || order.items || [];
      items.forEach((item) => {
        if (item.product) {
          const pId = item.product._id ? item.product._id.toString() : item.product.toString();
          purchasedProductIds.add(pId);
          const cat = item.product.category;
          if (cat) {
            categoryFrequency[cat] = (categoryFrequency[cat] || 0) + (item.qty || item.quantity || 1);
          }
        }
      });
    });

    // If user has past purchases, compute recommendation engine candidates
    if (purchasedProductIds.size > 0) {
      const candidateMap = new Map();

      for (const productId of purchasedProductIds) {
        try {
          const recs = await getProductRecommendations(productId, {
            limit: 6,
            excludeIds: Array.from(purchasedProductIds),
            userId: userPhone || userId.toString(),
          });

          recs.forEach((rec) => {
            const pId = String(rec.productId);
            if (purchasedProductIds.has(pId)) return;

            const existing = candidateMap.get(pId);
            if (existing) {
              existing.score += rec.score;
              existing.associationCount = (existing.associationCount || 0) + (rec.associationCount || 0);
            } else {
              candidateMap.set(pId, {
                productId: pId,
                score: rec.score,
                associationCount: rec.associationCount || 0,
                popularity: rec.popularity || 0,
              });
            }
          });
        } catch (err) {
          // Continue if any single product association lookup fails
        }
      }

      // Identify top categories user likes
      const favoriteCategories = Object.entries(categoryFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);

      let candidates = Array.from(candidateMap.values());

      // If we need more items to fill the limit, find top-rated products from favorite categories
      if (candidates.length < Number(limit) && favoriteCategories.length > 0) {
        const excludedIds = [...Array.from(purchasedProductIds), ...candidates.map((c) => c.productId)];
        const categoryFillers = await Product.find({
          category: { $in: favoriteCategories },
          _id: { $nin: excludedIds },
          countInStock: { $gt: 0 },
        })
          .sort({ rating: -1, numReviews: -1 })
          .limit(Number(limit) - candidates.length);

        categoryFillers.forEach((doc) => {
          candidates.push({
            productId: doc._id.toString(),
            score: (doc.rating || 4.5) * 5,
            associationCount: 0,
            popularity: doc.numReviews || 0,
            product: doc,
          });
        });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);

        const enriched = await Promise.all(
          candidates.slice(0, Number(limit)).map(async (rec) => {
            if (rec.product) {
              return {
                product: rec.product,
                score: rec.score,
                associationCount: rec.associationCount || 0,
                popularity: rec.popularity || 0,
                isPersonalized: true,
              };
            }
            const productDoc = await Product.findById(rec.productId).select(
              'name price image category countInStock unit rating numReviews'
            );
            return {
              product: productDoc,
              score: rec.score,
              associationCount: rec.associationCount || 0,
              popularity: rec.popularity || 0,
              isPersonalized: true,
            };
          })
        );

        const valid = enriched.filter((r) => r.product !== null);
        if (valid.length > 0) {
          return res.json({
            success: true,
            count: valid.length,
            data: valid,
            isPersonalized: true,
          });
        }
      }
    }
  }

  // Fallback for guests, new users, or accounts without order history:
  // Intelligent diverse recommendations across high-rated categories
  const topProducts = await Product.find({ countInStock: { $gt: 0 } })
    .sort({ rating: -1, numReviews: -1, createdAt: -1 })
    .limit(Number(limit) * 2)
    .select('name price image category countInStock unit rating numReviews');

  // Distribute evenly across distinct categories for variety
  const categoryBuckets = {};
  topProducts.forEach((p) => {
    const cat = p.category || 'General';
    if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
    categoryBuckets[cat].push(p);
  });

  const balancedList = [];
  const categories = Object.keys(categoryBuckets);
  let round = 0;
  while (balancedList.length < Number(limit) && balancedList.length < topProducts.length) {
    let addedInRound = false;
    for (const cat of categories) {
      if (categoryBuckets[cat][round]) {
        balancedList.push({
          product: categoryBuckets[cat][round],
          score: categoryBuckets[cat][round].rating || 5,
          isPersonalized: false,
        });
        addedInRound = true;
        if (balancedList.length >= Number(limit)) break;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  if (balancedList.length === 0 && topProducts.length > 0) {
    topProducts.slice(0, Number(limit)).forEach((p) => {
      balancedList.push({ product: p, score: p.rating || 5, isPersonalized: false });
    });
  }

  res.json({
    success: true,
    count: balancedList.length,
    data: balancedList,
    isPersonalized: false,
  });
});
