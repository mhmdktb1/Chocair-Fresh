import asyncHandler from '../middleware/asyncHandler.js';
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
      user: req.user._id,
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
  // Build query to find orders by phone (normalized or legacy) or email
  const phoneQueries = [{ 'customerInfo.phone': req.user.phone }];

  // If user has a normalized phone (+961...), also check for legacy format (without prefix)
  if (req.user.phone && req.user.phone.startsWith('+961')) {
    const localPhone = req.user.phone.replace('+961', '');
    phoneQueries.push({ 'customerInfo.phone': localPhone }); // e.g. "70123456"
    phoneQueries.push({ 'customerInfo.phone': `0${localPhone}` }); // e.g. "070123456" or "03xxxxxx"
  }

  const query = {
    $or: phoneQueries
  };

  if (req.user.email) {
    query.$or.push({ 'customerInfo.email': req.user.email });
  }

  // Also include orders linked by user ID (if any)
  query.$or.push({ user: req.user._id });

  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Check ownership via phone (normalized or legacy), email, or user ID
    let isOwner = false;

    // 1. Check User ID
    if (order.user && order.user.toString() === req.user._id.toString()) {
      isOwner = true;
    }

    // 2. Check Phone
    if (!isOwner) {
      const orderPhone = order.customerInfo.phone;
      const userPhone = req.user.phone;
      
      if (orderPhone === userPhone) {
        isOwner = true;
      } else if (userPhone.startsWith('+961')) {
        // Check legacy formats
        const localPhone = userPhone.replace('+961', '');
        if (orderPhone === localPhone || orderPhone === `0${localPhone}`) {
          isOwner = true;
        }
      }
    }

    // 3. Check Email
    if (!isOwner && req.user.email && order.customerInfo.email === req.user.email) {
      isOwner = true;
    }

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
