/**
 * ==========================================
 * ORDER CONTROLLER
 * ==========================================
 * 
 * Handles order management operations.
 * Includes creating, updating, and retrieving orders.
 */

import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import '../models/userModel.js'; // Ensure User model is registered for population
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    subtotal,
    taxAmount,
    shippingCost,
    discount,
    total
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  const stockAdjustments = [];

  const releaseReservedStock = async () => {
    if (!stockAdjustments.length) return;
    await Promise.all(
      stockAdjustments.map(({ product, quantity }) =>
        Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
      )
    );
    stockAdjustments.length = 0;
  };

  for (const item of items) {
    const updateResult = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (!updateResult.matchedCount) {
      await releaseReservedStock();
      const exists = await Product.exists({ _id: item.product });
      res.status(exists ? 400 : 404);
      throw new Error(
        exists
          ? `Insufficient stock for ${item.name || 'product'}`
          : `Product ${item.name || 'product'} not found`
      );
    }

    stockAdjustments.push({ product: item.product, quantity: item.quantity });
  }

  try {
    const order = await Order.create({
      user: req.body.user || null,
      items,
      itemCount: items.length,
      shippingAddress,
      paymentMethod,
      subtotal,
      taxAmount,
      shippingCost,
      discount,
      total
    });

    // Populate order with product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price image');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    await releaseReservedStock();
    throw error;
  }
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name price image');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get user's orders
 * @route   GET /api/orders/myorders?userId=...
 * @access  Public
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.json({
      success: true,
      count: 0,
      data: []
    });
  }

  const orders = await Order.find({ user: userId })
    .populate('items.product', 'name price image')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 15
  } = req.query;

  // Build query
  let query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateTime;
    }
  }

  // Search by order ID or customer name
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('items.product', 'name price image')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip);

  // Get total count
  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: orders
  });
});

/**
 * @desc    Update order status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;

  // Update delivery status
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

/**
 * @desc    Update order to paid (Admin only)
 * @route   PUT /api/orders/:id/pay
 * @access  Private/Admin
 */
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    updateTime: req.body.update_time,
    emailAddress: req.body.email_address
  };

  await order.save();

  res.json({
    success: true,
    message: 'Order marked as paid',
    data: order
  });
});

/**
 * @desc    Delete order (Admin only)
 * @route   DELETE /api/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await order.deleteOne();

  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
});

/**
 * @desc    Get order statistics (Admin only)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'Pending' });
  const preparingOrders = await Order.countDocuments({ status: 'Preparing' });
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

  // Calculate total revenue
  const revenueResult = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      preparingOrders,
      deliveredOrders,
      totalRevenue
    }
  });
});
