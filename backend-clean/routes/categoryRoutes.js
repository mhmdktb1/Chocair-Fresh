import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, admin, createCategory);
router
  .route('/:id')
  .delete(protect, admin, deleteCategory)
  .put(protect, admin, updateCategory);

export default router;
