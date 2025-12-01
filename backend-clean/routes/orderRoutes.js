import express from 'express';
const router = express.Router();
import { addOrderItems, getOrders } from '../controllers/orderController.js';

router.route('/').post(addOrderItems).get(getOrders);

export default router;
