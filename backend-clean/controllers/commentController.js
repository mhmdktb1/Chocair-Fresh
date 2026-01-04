import asyncHandler from 'express-async-handler';
import Comment from '../models/commentModel.js';

// @desc    Get all top-level comments
// @route   GET /api/comments
// @access  Public
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ parentId: null })
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    })
    .sort({ createdAt: -1 });

  res.json(comments);
});

// @desc    Get all comments (Admin)
// @route   GET /api/comments/all
// @access  Private/Admin
const getAllComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({}).sort({ createdAt: -1 });
  res.json(comments);
});

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
  const { content, rating, parentId } = req.body;

  const comment = await Comment.create({
    user: req.user._id,
    content,
    rating,
    parentId: parentId || null,
  });

  if (parentId) {
    const parentComment = await Comment.findById(parentId);
    if (parentComment) {
      parentComment.replies.push(comment._id);
      await parentComment.save();
    }
  }

  const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');

  res.status(201).json(populatedComment);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private/Admin
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    // Check if user is admin or owner
    if (req.user.isAdmin || comment.user._id.toString() === req.user._id.toString()) {
      
      // If it's a reply, remove from parent
      if (comment.parentId) {
        const parent = await Comment.findById(comment.parentId);
        if (parent) {
          parent.replies = parent.replies.filter(id => id.toString() !== comment._id.toString());
          await parent.save();
        }
      }

      // Delete all replies to this comment (Cascade delete)
      if (comment.replies.length > 0) {
        await Comment.deleteMany({ _id: { $in: comment.replies } });
      }

      await comment.deleteOne();
      res.json({ message: 'Comment removed' });
    } else {
      res.status(401);
      throw new Error('Not authorized to delete this comment');
    }
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
});

export { getComments, getAllComments, createComment, deleteComment };
