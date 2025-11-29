/**
 * ==========================================
 * PRODUCT ROUTES
 * ==========================================
 * 
 * Defines all product-related API endpoints.
 * Includes CRUD operations and product queries.
 */

import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  updateProductStock
} from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { productSchema } from '../validators/productValidator.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Admin routes (now public)
router.post('/', validate(productSchema), createProduct);
router.put('/:id', validate(productSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateProductStock);

export default router;
