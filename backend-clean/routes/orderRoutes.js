import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js';

router.route('/').post(addOrderItems).get(getOrders);
router.route('/:id').get(getOrderById).delete(deleteOrder);
router.route('/:id/status').put(updateOrderStatus);

export default router;
