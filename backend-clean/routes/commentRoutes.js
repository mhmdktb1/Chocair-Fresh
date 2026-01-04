import express from 'express';
import {
  getComments,
  getAllComments,
  createComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getComments)
  .post(protect, createComment);

router.route('/all').get(protect, admin, getAllComments);

router.route('/:id')
  .delete(protect, deleteComment);

export default router;
