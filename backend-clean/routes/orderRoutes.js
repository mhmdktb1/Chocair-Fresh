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
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').post(addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(getOrderById).delete(protect, admin, deleteOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelMyOrder);

export default router;
