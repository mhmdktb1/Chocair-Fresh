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
  getTrending,
  refreshRecommendations,
  getRecommendationStatus
} from '../controllers/recommendationController.js';

const router = express.Router();

// Get recommendations based on a product
router.post('/product', recommendByProduct);

// Get trending products
router.get('/trending', getTrending);

// Refresh knowledge maps
router.post('/refresh', refreshRecommendations);

// Get system status
router.get('/status', getRecommendationStatus);

export default router;
