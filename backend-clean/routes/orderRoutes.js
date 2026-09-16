import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
  cancelMyOrder,
} from '../controllers/orderController.js';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware.js';

// Temporarily opened for admin hub access without token gate
router.route('/').post(optionalProtect, addOrderItems).get(getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(optionalProtect, getOrderById).delete(deleteOrder);
router.route('/:id/status').put(updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelMyOrder);

export default router;
