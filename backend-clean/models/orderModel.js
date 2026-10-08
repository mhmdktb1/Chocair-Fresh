import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        discountPercent: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        unit: { type: String },
        instruction: { type: String, default: '' },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'Lebanon' },
      googleMapsLink: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      distanceKm: { type: Number },
      additionalInfo: { type: String },
      deliveryPreference: { type: String, default: 'ASAP' },
      deliveryType: { type: String, default: 'asap' },
      deliveryDate: { type: String },
      deliveryTimeSlot: { type: String },
    },
    deliveryPreference: {
      type: String,
      default: 'ASAP',
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    status: {
      type: String,
      required: true,
      default: 'Pending',
      enum: ['Pending', 'Preparing', 'On the Way', 'Delivered', 'Cancelled'],
    },
    // Dynamic Delivery ETA Tracking
    estimatedPrepMinutes: { type: Number },
    estimatedQueueMinutes: { type: Number },
    estimatedDeliveryMinutes: { type: Number },
    estimatedTotalMinutes: { type: Number },
    etaWindow: { type: String },
    prepStartedAt: { type: Date },
    prepCompletedAt: { type: Date },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
    actualPrepMinutes: { type: Number },
    eta: {
      prepMinutes: { type: Number },
      queueMinutes: { type: Number },
      deliveryMinutes: { type: Number },
      totalMinutes: { type: Number },
      remainingMinutes: { type: Number },
      windowText: { type: String },
      minWindowMinutes: { type: Number },
      maxWindowMinutes: { type: Number },
      prepStartedAt: { type: Date },
      prepCompletedAt: { type: Date },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date },
      actualPrepMinutes: { type: Number },
    },
    isPaid: { type: Boolean, required: true, default: false },
    isDelivered: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.email': 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
