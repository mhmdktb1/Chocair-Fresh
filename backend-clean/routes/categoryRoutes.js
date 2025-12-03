import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').delete(deleteCategory).put(updateCategory);

export default router;
