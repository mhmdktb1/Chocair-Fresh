import express from 'express';
import {
  getHeroes,
  createHero,
  updateHero,
  deleteHero,
} from '../controllers/heroController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getHeroes).post(protect, admin, createHero);
router.route('/:id').put(protect, admin, updateHero).delete(protect, admin, deleteHero);

export default router;
