import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    customerInfo,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const order = new Order({
      orderItems,
      customerInfo,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'orderItems.product',
    'name image email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get all orders (supports filtering by email/phone)
// @route   GET /api/orders
// @access  Public (Admin/User)
const getOrders = asyncHandler(async (req, res) => {
  const { email, phone } = req.query;
  let query = {};
  
  // If email provided, filter by it (for "My Orders")
  if (email) query['customerInfo.email'] = email;
  if (phone) query['customerInfo.phone'] = phone;

  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Public (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = req.body.status || order.status;
    
    if (req.body.status === 'Delivered') {
      order.isDelivered = true;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Public (Admin)
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const query = {
    $or: [
      { 'customerInfo.phone': req.user.phone }
    ]
  };

  if (req.user.email) {
    query.$or.push({ 'customerInfo.email': req.user.email });
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const isOwner = (order.customerInfo.phone === req.user.phone) || 
                    (req.user.email && order.customerInfo.email === req.user.email);

    if (!isOwner && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to cancel this order');
    }

    if (order.status !== 'Pending') {
      res.status(400);
      throw new Error('Cannot cancel order that is not pending');
    }

    order.status = 'Cancelled';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export { addOrderItems, getOrderById, getOrders, updateOrderStatus, deleteOrder, getMyOrders, cancelMyOrder };
