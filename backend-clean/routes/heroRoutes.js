import express from 'express';
import {
  getHeroes,
  createHero,
  updateHero,
  deleteHero,
} from '../controllers/heroController.js';

const router = express.Router();

router.route('/').get(getHeroes).post(createHero);
router.route('/:id').put(updateHero).delete(deleteHero);

export default router;
