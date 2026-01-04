import express from 'express';
import { getHomeConfig, updateHomeConfig } from '../controllers/homeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getHomeConfig)
  .put(protect, admin, updateHomeConfig);

export default router;
