/**
 * ==========================================
 * ORDER MODEL
 * ==========================================
 * 
 * Defines the Order schema for customer purchases.
 * Includes items, payment, shipping, and status tracking.
 */

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    default: 'kg'
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    orderId: {
      type: String,
      unique: true
    },
    items: [orderItemSchema],
    itemCount: {
      type: Number,
      required: true,
      default: 0
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'Lebanon' }
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      default: 'cash',
      required: true
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      updateTime: { type: String },
      emailAddress: { type: String }
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxAmount: {
      type: Number,
      default: 0.0
    },
    shippingCost: {
      type: Number,
      default: 0.0
    },
    discount: {
      type: Number,
      default: 0.0
    },
    total: {
      type: Number,
      required: true,
      default: 0.0
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// MIDDLEWARE - Generate unique order ID
// ==========================================
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    // Generate order ID: ORD-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    this.orderId = `ORD-${dateStr}-${String(randomNum).padStart(4, '0')}`;
  }
  next();
});

// ==========================================
// INDEXES - Improve query performance
// ==========================================
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
// orderId already has unique index from schema definition

// ==========================================
// VIRTUAL - Calculate total items
// ==========================================
orderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
