import express from 'express';
const router = express.Router();
import { getProducts, createProduct } from '../controllers/productController.js';

router.route('/').get(getProducts).post(createProduct);

export default router;
