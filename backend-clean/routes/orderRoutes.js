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

router.route('/').post(optionalProtect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelMyOrder);

export default router;
