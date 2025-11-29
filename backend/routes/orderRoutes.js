/**
 * ==========================================
 * ORDER ROUTES
 * ==========================================
 * 
 * Defines all order-related API endpoints.
 * Includes order creation, retrieval, and management.
 */

import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  deleteOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { validate } from '../middleware/validate.js';
import { orderSchema } from '../validators/orderValidator.js';

const router = express.Router();

// Public routes
router.post('/', validate(orderSchema), createOrder);
router.get('/myorders', getMyOrders);

// Admin routes (now public)
router.get('/admin/all', getAllOrders);
router.get('/admin/stats', getOrderStats);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/pay', updateOrderToPaid);
router.delete('/:id', deleteOrder);

// Routes with dynamic params should come last
router.get('/:id', getOrderById);

export default router;
