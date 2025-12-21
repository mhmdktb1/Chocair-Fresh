/**
 * ==========================================
 * RECOMMENDATION ROUTES
 * ==========================================
 * 
 * API endpoints for the recommendation system
 */

import express from 'express';
import {
  recommendByProduct,
  recommendByCart,
  getTrending,
  getNewArrivals,
  getPersonalized,
  refreshRecommendations,
  getRecommendationStatus
} from '../controllers/recommendationController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Get recommendations based on a product
router.post('/product', recommendByProduct);

// Get recommendations based on cart (Whole Cart Recommendation)
router.post('/cart', recommendByCart);

// Get trending products (Best Sellers)
router.get('/trending', getTrending);

// Get new arrivals (Trending Now)
router.get('/new', getNewArrivals);

// Get personalized recommendations (Just For You)
router.get('/personalized', protect, getPersonalized);

// Refresh knowledge maps
router.post('/refresh', refreshRecommendations);

// Get system status
router.get('/status', getRecommendationStatus);

export default router;
