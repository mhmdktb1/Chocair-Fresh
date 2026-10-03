/**
 * ==========================================
 * RECOMMENDATION CONTROLLER
 * ==========================================
 * 
 * Handles recommendation API requests
 * Connects the recommendation engine to the REST API
 */

import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import {
  getProductRecommendations,
  getCartRecommendations,
  getTrendingProducts,
  refreshKnowledge
} from '../engine/recommendationEngine.js';
import Product from '../../models/productModel.js';
import Order from '../../models/orderModel.js';
import User from '../../models/userModel.js';
import { getProductCatalog } from '../../services/catalogService.js';
import { applyDiscountToProductDoc } from '../../utils/discountHelper.js';

// All product lookups go through the in-memory catalog (discounts applied) instead of
// one findById round-trip per recommended item.

const toLimit = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 100);
};

const byRating = (a, b) =>
  (b.rating || 0) - (a.rating || 0) || (b.numReviews || 0) - (a.numReviews || 0);

const resolveUserPhone = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  try {
    const user = await User.findById(userId).select('phone').lean();
    return user?.phone || null;
  } catch {
    return null;
  }
};

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

  if (!mongoose.isValidObjectId(productId)) {
    res.status(404);
    throw new Error('Product not found');
  }

  const max = toLimit(limit, 10);
  const [userPhone, { list, byId }] = await Promise.all([resolveUserPhone(userId), getProductCatalog()]);

  let product = byId.get(String(productId));
  if (!product) {
    const doc = await Product.findById(productId).lean();
    product = doc ? applyDiscountToProductDoc(doc) : null;
  }
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const sourceId = String(product._id);
  const sameCategory = () =>
    list
      .filter((p) => p.category === product.category && String(p._id) !== sourceId)
      .sort(byRating)
      .slice(0, max);

  let recommendations = [];

  if (type === 'similar') {
    recommendations = sameCategory().map((doc) => ({
      productId: doc._id,
      score: doc.rating || 0,
      product: doc,
    }));
  } else {
    recommendations = await getProductRecommendations(productId, {
      limit: max,
      excludeIds,
      userId: userPhone, // Pass phone as userId for clustering
    });

    // Engine returned a generic popularity fallback (or nothing): prefer same-category items.
    const isFallback = recommendations.length === 0 || recommendations[0].isFallback;
    if (isFallback) {
      const categoryFallback = sameCategory();
      if (categoryFallback.length > 0) {
        recommendations = categoryFallback.map((doc) => ({
          productId: doc._id,
          score: doc.rating || 0,
          product: doc,
          isFallback: true,
        }));
      }
    }
  }

  const validRecommendations = recommendations
    .map((rec) => ({
      product: byId.get(String(rec.product?._id || rec.productId)) || null,
      score: rec.score,
      associationCount: rec.associationCount || 0,
      popularity: rec.popularity || 0,
      isFallback: rec.isFallback || false,
    }))
    .filter((rec) => rec.product !== null);

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

  if (!cartItems || !Array.isArray(cartItems)) {
    res.status(400);
    throw new Error('cartItems array is required');
  }

  if (cartItems.length === 0) {
    return res.json({
      success: true,
      count: 0,
      data: []
    });
  }

  const max = toLimit(limit, 10);
  const [userPhone, { list, byId }] = await Promise.all([resolveUserPhone(userId), getProductCatalog()]);

  let recommendations = [];
  try {
    recommendations = await getCartRecommendations(cartItems, {
      limit: max,
      userId: userPhone
    });
  } catch (err) {
    // Knowledge maps not built yet: fall back to top rated products not already in the cart
    const excludedIds = new Set(
      cartItems
        .map((i) => (i && (i.productId || i._id || i.id) ? String(i.productId || i._id || i.id) : null))
        .filter(Boolean)
    );
    const fallbackProducts = list
      .filter((p) => !excludedIds.has(String(p._id)))
      .sort(byRating)
      .slice(0, max);

    return res.json({
      success: true,
      count: fallbackProducts.length,
      data: fallbackProducts.map((p) => ({ product: p, score: p.rating || 0, isFallback: true }))
    });
  }

  const validRecommendations = recommendations
    .map((rec) => ({
      product: byId.get(String(rec.productId)) || null,
      score: rec.score,
      matches: rec.matches, // Helpful for UI: "Because you bought X and Y"
      isFallback: false
    }))
    .filter((rec) => rec.product !== null);

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
  const max = toLimit(req.query.limit, 10);
  const { list, byId } = await getProductCatalog();

  try {
    const trending = await getTrendingProducts(max);
    const validTrending = trending
      .map((item) => ({ product: byId.get(String(item.productId)) || null, popularity: item.popularity }))
      .filter((item) => item.product !== null);

    if (validTrending.length > 0) {
      return res.json({
        success: true,
        count: validTrending.length,
        data: validTrending
      });
    }
  } catch (error) {
    // Fallback to catalog if knowledge files are not built yet
  }

  const fallbackProducts = [...list].sort(byRating).slice(0, max);

  res.json({
    success: true,
    count: fallbackProducts.length,
    data: fallbackProducts.map((p) => ({ product: p, popularity: p.rating || 0 }))
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
  const max = toLimit(req.query.limit, 10);
  const { list } = await getProductCatalog();
  const products = list.slice(0, max); // catalog is already newest-first

  res.json({
    success: true,
    count: products.length,
    data: products.map((p) => ({ product: p }))
  });
});

/**
 * @desc    Get top rated products
 * @route   GET /api/recommend/top-rated
 * @access  Public
 */
export const getTopRated = asyncHandler(async (req, res) => {
  const max = toLimit(req.query.limit, 10);
  const { list } = await getProductCatalog();
  const products = [...list].sort(byRating).slice(0, max);

  res.json({
    success: true,
    count: products.length,
    data: products.map((p) => ({ product: p }))
  });
});

/**
 * @desc    Get personalized recommendations (Just For You / For You)
 * @route   GET /api/recommend/personalized
 * @access  Public (Optional auth for tailored user profile & order history)
 */
export const getPersonalized = asyncHandler(async (req, res) => {
  const max = toLimit(req.query.limit, 8);
  const user = req.user;
  const { list, byId } = await getProductCatalog();

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
      .select('orderItems.product orderItems.qty')
      .lean();

    const purchasedProductIds = new Set();
    const categoryFrequency = {};

    orders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        if (!item.product) return;
        const pId = String(item.product);
        const purchased = byId.get(pId);
        if (!purchased) return; // product no longer exists
        purchasedProductIds.add(pId);
        if (purchased.category) {
          categoryFrequency[purchased.category] = (categoryFrequency[purchased.category] || 0) + (item.qty || 1);
        }
      });
    });

    if (purchasedProductIds.size > 0) {
      const candidateMap = new Map();
      const excludeIds = Array.from(purchasedProductIds);

      const recLists = await Promise.all(
        excludeIds.map((productId) =>
          getProductRecommendations(productId, {
            limit: 6,
            excludeIds,
            userId: userPhone || userId.toString(),
          }).catch(() => [])
        )
      );

      recLists.flat().forEach((rec) => {
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

      const favoriteCategories = Object.entries(categoryFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);

      const candidates = Array.from(candidateMap.values());

      // Fill remaining slots with top-rated in-stock products from favorite categories
      if (candidates.length < max && favoriteCategories.length > 0) {
        const excluded = new Set([...excludeIds, ...candidates.map((c) => c.productId)]);
        const favSet = new Set(favoriteCategories);
        list
          .filter((p) => favSet.has(p.category) && !excluded.has(String(p._id)) && p.countInStock > 0)
          .sort(byRating)
          .slice(0, max - candidates.length)
          .forEach((doc) => {
            candidates.push({
              productId: String(doc._id),
              score: (doc.rating || 4.5) * 5,
              associationCount: 0,
              popularity: doc.numReviews || 0,
            });
          });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);

        const valid = candidates
          .slice(0, max)
          .map((rec) => ({
            product: byId.get(rec.productId) || null,
            score: rec.score,
            associationCount: rec.associationCount || 0,
            popularity: rec.popularity || 0,
            isPersonalized: true,
          }))
          .filter((r) => r.product !== null);

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
  // diverse recommendations across high-rated categories (catalog is newest-first, sort is stable)
  const topProducts = list
    .filter((p) => p.countInStock > 0)
    .sort(byRating)
    .slice(0, max * 2);

  const categoryBuckets = {};
  topProducts.forEach((p) => {
    const cat = p.category || 'General';
    if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
    categoryBuckets[cat].push(p);
  });

  const balancedList = [];
  const categories = Object.keys(categoryBuckets);
  let round = 0;
  while (balancedList.length < max && balancedList.length < topProducts.length) {
    let addedInRound = false;
    for (const cat of categories) {
      if (categoryBuckets[cat][round]) {
        balancedList.push({
          product: categoryBuckets[cat][round],
          score: categoryBuckets[cat][round].rating || 5,
          isPersonalized: false,
        });
        addedInRound = true;
        if (balancedList.length >= max) break;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  res.json({
    success: true,
    count: balancedList.length,
    data: balancedList,
    isPersonalized: false,
  });
});
