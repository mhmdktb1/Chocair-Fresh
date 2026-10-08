import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import HomeConfig from '../models/homeModel.js';
import { sendWhatsAppOrderNotification } from '../utils/whatsappService.js';
import { sendTelegramOrderAlert } from '../utils/telegramService.js';
import { calculateProductDiscount } from '../utils/discountHelper.js';
import {
  calculateDistanceKm,
  calculateDeliveryFee,
  DEFAULT_DELIVERY_CONFIG,
  MAX_DELIVERY_RADIUS_KM,
  STORE_COORDS,
  extractCoordsFromUrl,
} from '../utils/distanceHelper.js';
import {
  calculateOrderPrepMinutes,
  calculateDeliveryMinutes,
  calculateEtaWindow,
  calculateQueueWaitMinutes,
  computeDynamicOrderEta,
  previewCheckoutEta,
} from '../utils/etaHelper.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    customerInfo,
    paymentMethod,
    deliveryPreference,
    shippingPrice: clientShippingPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Fetch active store delivery settings
  let storeConfig = null;
  try {
    storeConfig = await HomeConfig.findOne().select('delivery');
  } catch (err) {
    console.warn('Failed to fetch storeConfig in addOrderItems:', err.message);
  }
  const deliverySettings = storeConfig?.delivery || DEFAULT_DELIVERY_CONFIG;
  const maxDeliveryRadius = Number(deliverySettings?.maxDeliveryRadiusKm || MAX_DELIVERY_RADIUS_KM);

  // Validate delivery location range
  let orderLat = customerInfo?.lat;
  let orderLng = customerInfo?.lng;

  if ((orderLat == null || orderLng == null) && customerInfo?.googleMapsLink) {
    const extracted = extractCoordsFromUrl(customerInfo.googleMapsLink);
    if (extracted) {
      orderLat = extracted.lat;
      orderLng = extracted.lng;
    }
  }

  let calculatedDistanceKm = null;
  if (orderLat != null && orderLng != null) {
    calculatedDistanceKm = calculateDistanceKm(
      STORE_COORDS.lat,
      STORE_COORDS.lng,
      Number(orderLat),
      Number(orderLng)
    );

    if (calculatedDistanceKm != null && calculatedDistanceKm > maxDeliveryRadius) {
      res.status(400);
      throw new Error(
        `Delivery location is out of our ${maxDeliveryRadius} km delivery range (${calculatedDistanceKm} km away). We only deliver within ${maxDeliveryRadius} km of our store.`
      );
    }
  }

  // Atomically decrement stock and securely calculate price per item
  const decrementedItems = [];
  const normalizedOrderItems = [];
  let calculatedItemsPrice = 0;

  try {
    // Validate every line before touching stock so bad input never needs a rollback.
    const parsedItems = orderItems.map((item) => {
      const productId = item.product || item._id || item.id;
      const rawQty = item.qty !== undefined ? item.qty : item.quantity;
      const qty = Number(rawQty);

      if (rawQty === undefined || rawQty === null || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        res.status(400);
        throw new Error(`Invalid item quantity for "${item.name || 'Product'}". Quantity must be a positive integer.`);
      }

      if (!productId) {
        res.status(400);
        throw new Error(`Invalid product reference for item: ${item.name || 'Unknown'}`);
      }

      return { item, productId, qty };
    });

    // Each decrement is an atomic conditional update; running them concurrently keeps
    // checkout fast (one DB round-trip instead of one per line item).
    const results = await Promise.allSettled(
      parsedItems.map(({ productId, qty }) =>
        Product.findOneAndUpdate(
          { _id: productId, countInStock: { $gte: qty } },
          { $inc: { countInStock: -qty } },
          { new: true }
        ).lean()
      )
    );

    let firstFailure = null;
    results.forEach((result, idx) => {
      const { item, productId, qty } = parsedItems[idx];
      if (result.status === 'fulfilled' && result.value) {
        decrementedItems.push({ productId, qty });
      } else if (!firstFailure) {
        firstFailure =
          result.status === 'rejected'
            ? result.reason
            : new Error(`Insufficient stock for "${item.name || 'Product'}". Please reduce quantity.`);
      }
    });

    if (firstFailure) throw firstFailure;

    parsedItems.forEach(({ item, qty }, idx) => {
      const updatedProduct = results[idx].value;

      // Calculate server-side product discount
      const discountCalc = calculateProductDiscount(updatedProduct);
      const chargedPrice = discountCalc.finalPrice;
      const lineTotal = Number((chargedPrice * qty).toFixed(2));
      calculatedItemsPrice += lineTotal;

      normalizedOrderItems.push({
        product: updatedProduct._id,
        name: updatedProduct.name,
        qty,
        unit: updatedProduct.unit || item.unit || '1kg',
        price: chargedPrice,
        originalPrice: discountCalc.isDiscounted ? discountCalc.originalPrice : chargedPrice,
        discountPercent: discountCalc.discountPercent,
        discountAmount: discountCalc.discountAmount,
        image: updatedProduct.image || item.image || '/assets/images/placeholder-product.jpg',
        instruction: item.instruction || item.instructions || item.specialInstructions || item.note || item.notes || '',
      });
    });

    calculatedItemsPrice = Number(calculatedItemsPrice.toFixed(2));
    
    let calculatedShippingPrice;
    if (calculatedDistanceKm != null) {
      const feeInfo = calculateDeliveryFee(calculatedDistanceKm, calculatedItemsPrice, deliverySettings);
      calculatedShippingPrice = feeInfo.fee;
    } else if (clientShippingPrice !== undefined && !isNaN(Number(clientShippingPrice))) {
      calculatedShippingPrice = (deliverySettings.freeDeliveryEnabled && calculatedItemsPrice >= (deliverySettings.freeDeliveryThreshold ?? 50))
        ? 0
        : Number(clientShippingPrice);
    } else {
      const feeInfo = calculateDeliveryFee(null, calculatedItemsPrice, deliverySettings);
      calculatedShippingPrice = feeInfo.fee;
    }
    calculatedShippingPrice = Number(calculatedShippingPrice.toFixed(2));
    const calculatedTotalPrice = Number((calculatedItemsPrice + calculatedShippingPrice).toFixed(2));

    const enrichedCustomerInfo = {
      ...customerInfo,
      lat: orderLat != null ? Number(orderLat) : undefined,
      lng: orderLng != null ? Number(orderLng) : undefined,
      distanceKm: calculatedDistanceKm != null ? calculatedDistanceKm : undefined,
    };

    // Calculate dynamic ETA metrics for the new order based on current store workload
    const activeOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean();
    const prepMinutes = calculateOrderPrepMinutes(normalizedOrderItems);
    const queueMinutes = calculateQueueWaitMinutes(activeOrders);
    const deliveryMinutes = calculateDeliveryMinutes(calculatedDistanceKm);
    const totalMinutes = deliveryMinutes != null ? (queueMinutes + prepMinutes + deliveryMinutes) : null;
    const etaWindowObj = calculateEtaWindow(totalMinutes);

    const initialEta = {
      prepMinutes,
      queueMinutes,
      deliveryMinutes,
      totalMinutes,
      remainingMinutes: totalMinutes,
      windowText: etaWindowObj ? etaWindowObj.text : null,
      minWindowMinutes: etaWindowObj ? etaWindowObj.min : null,
      maxWindowMinutes: etaWindowObj ? etaWindowObj.max : null,
      prepStartedAt: null,
      prepCompletedAt: null,
      dispatchedAt: null,
      deliveredAt: null,
      actualPrepMinutes: null,
    };

    const order = new Order({
      orderItems: normalizedOrderItems,
      user: req.user ? req.user._id : undefined,
      customerInfo: enrichedCustomerInfo,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      deliveryPreference: deliveryPreference || customerInfo?.deliveryPreference || 'ASAP',
      itemsPrice: calculatedItemsPrice,
      shippingPrice: calculatedShippingPrice,
      totalPrice: calculatedTotalPrice,
      estimatedPrepMinutes: prepMinutes,
      estimatedQueueMinutes: queueMinutes,
      estimatedDeliveryMinutes: deliveryMinutes,
      estimatedTotalMinutes: totalMinutes,
      etaWindow: etaWindowObj ? etaWindowObj.text : null,
      eta: initialEta,
    });

    const createdOrder = await order.save();

    console.log(`🔔 [Admin Notification] New order #${createdOrder._id} ($${createdOrder.totalPrice}) placed by ${customerInfo?.name || 'Guest'}`);

    res.status(201).json(createdOrder);

    // Fire-and-forget: the customer should not wait for admin lookups or messaging APIs.
    dispatchOrderNotifications(createdOrder, customerInfo).catch((err) =>
      console.error('Order notification dispatch failed:', err.message)
    );
  } catch (error) {
    // Rollback decremented quantities on failure
    await Promise.all(
      decrementedItems.map((dec) =>
        Product.updateOne({ _id: dec.productId }, { $inc: { countInStock: dec.qty } }).catch((err) =>
          console.error('Rollback error:', err.message)
        )
      )
    );

    res.status(400);
    throw new Error(error.message || 'Failed to place order due to inventory constraints');
  }
});

const dispatchOrderNotifications = async (createdOrder, customerInfo) => {
  const notificationTargets = [];

  if (customerInfo && customerInfo.phone) {
    notificationTargets.push({ phone: customerInfo.phone, isAdmin: false });
  }

  const adminPhones = new Set();
  if (process.env.ADMIN_PHONE) {
    adminPhones.add(process.env.ADMIN_PHONE);
  }
  if (process.env.ADMIN_NOTIFICATION_PHONE) {
    adminPhones.add(process.env.ADMIN_NOTIFICATION_PHONE);
  }

  try {
    const adminUsers = await User.find({ isAdmin: true }).select('phone').lean();
    for (const admin of adminUsers) {
      if (admin.phone) {
        adminPhones.add(admin.phone);
      }
    }
  } catch (adminFetchErr) {
    console.warn('Could not retrieve admin users for order notification:', adminFetchErr.message);
  }

  for (const phone of adminPhones) {
    notificationTargets.push({ phone, isAdmin: true });
  }

  for (const target of notificationTargets) {
    sendWhatsAppOrderNotification(target.phone, createdOrder, { isAdmin: target.isAdmin }).catch((err) =>
      console.error('WhatsApp notification dispatch failed:', err.message)
    );
  }

  // Dispatch Instant Telegram Alert to Store Admin Phone
  sendTelegramOrderAlert(createdOrder).catch((telegramErr) =>
    console.error('Telegram notification dispatch failed:', telegramErr.message)
  );
};

// @desc    Preview dynamic ETA for checkout
// @route   POST /api/orders/eta-preview
// @access  Public
const getCheckoutEtaPreview = asyncHandler(async (req, res) => {
  const { cartItems, distanceKm, lat, lng } = req.body || {};

  let effectiveDist = distanceKm != null ? Number(distanceKm) : null;
  if (effectiveDist == null && lat != null && lng != null) {
    effectiveDist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, Number(lat), Number(lng));
  }

  const activeOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean();
  const preview = previewCheckoutEta(cartItems || [], effectiveDist, activeOrders);

  res.json(preview);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public / Private (Admin or Owner)
const getOrderById = asyncHandler(async (req, res) => {
  const orderDoc = await Order.findById(req.params.id).populate(
    'orderItems.product',
    'name image email'
  );

  if (!orderDoc) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization if user context is provided
  if (req.user && req.user.role !== 'admin' && !req.user.isAdmin) {
    let isOwner = false;
    if (orderDoc.user && orderDoc.user.toString() === req.user._id.toString()) {
      isOwner = true;
    }
    if (!isOwner && req.user.phone) {
      const orderPhone = orderDoc.customerInfo?.phone;
      const userPhone = req.user.phone;
      if (orderPhone === userPhone) {
        isOwner = true;
      } else if (userPhone.startsWith('+961')) {
        const localPhone = userPhone.replace('+961', '');
        if (orderPhone === localPhone || orderPhone === `0${localPhone}`) {
          isOwner = true;
        }
      }
    }
    if (!isOwner && req.user.email && orderDoc.customerInfo?.email) {
      if (orderDoc.customerInfo.email.toLowerCase() === req.user.email.toLowerCase()) {
        isOwner = true;
      }
    }
    if (!isOwner) {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
  }

  const order = orderDoc.toObject();
  const activeOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean();
  order.eta = computeDynamicOrderEta(order, activeOrders);

  res.json(order);
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

  const [orders, activeOrders] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).lean(),
    Order.find({ status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean(),
  ]);

  const enrichedOrders = orders.map((o) => ({
    ...o,
    eta: computeDynamicOrderEta(o, activeOrders),
  }));

  // Polled every few seconds by the admin dashboard: let the browser revalidate via ETag (304).
  res.set('Cache-Control', 'private, no-cache');
  res.json(enrichedOrders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Public (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const previousStatus = order.status;
    const newStatus = req.body.status || order.status;
    const now = new Date();

    order.status = newStatus;
    
    // Status transition tracking for dynamic ETA
    if (newStatus === 'Preparing') {
      if (!order.prepStartedAt) {
        order.prepStartedAt = now;
      }
      if (!order.estimatedPrepMinutes) {
        order.estimatedPrepMinutes = calculateOrderPrepMinutes(order.orderItems);
      }
    } else if (newStatus === 'On the Way') {
      order.dispatchedAt = now;
      if (order.prepStartedAt) {
        order.prepCompletedAt = now;
        order.actualPrepMinutes = Math.max(1, Math.round((now.getTime() - new Date(order.prepStartedAt).getTime()) / 60000));
      }
    } else if (newStatus === 'Delivered') {
      order.deliveredAt = now;
      order.isDelivered = true;
    }

    // Restore stock if transitioning to Cancelled
    if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
      await Promise.all(
        order.orderItems
          .filter((item) => item.product)
          .map((item) =>
            Product.updateOne({ _id: item.product }, { $inc: { countInStock: item.qty } }).catch((err) =>
              console.error('Restore stock error:', err.message)
            )
          )
      );
    }

    // Calculate dynamic ETA for the updated state
    const activeOrders = await Order.find({ _id: { $ne: order._id }, status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean();
    const updatedEta = computeDynamicOrderEta(order, activeOrders);
    order.eta = updatedEta;

    const updatedOrder = await order.save();
    const resultObj = updatedOrder.toObject();
    resultObj.eta = updatedEta;

    res.json(resultObj);
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
  if (!req.user) {
    res.json([]);
    return;
  }

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

  const [orders, activeOrders] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).lean(),
    Order.find({ status: { $in: ['Pending', 'Preparing'] } }).sort({ createdAt: 1 }).lean(),
  ]);

  const enrichedOrders = orders.map((o) => ({
    ...o,
    eta: computeDynamicOrderEta(o, activeOrders),
  }));

  res.set('Cache-Control', 'private, no-cache');
  res.json(enrichedOrders);
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
    await Promise.all(
      order.orderItems
        .filter((item) => item.product)
        .map((item) =>
          Product.updateOne({ _id: item.product }, { $inc: { countInStock: item.qty } }).catch((err) =>
            console.error('Restore stock error on user cancel:', err.message)
          )
        )
    );

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export { 
  addOrderItems, 
  getOrderById, 
  getOrders, 
  updateOrderStatus, 
  deleteOrder, 
  getMyOrders, 
  cancelMyOrder,
  getCheckoutEtaPreview,
};
