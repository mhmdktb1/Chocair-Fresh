/**
 * ==========================================
 * PRODUCT MODEL
 * ==========================================
 * 
 * Defines the Product schema for grocery items.
 * Includes pricing, categories, stock, and images.
 */

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative']
    },
    priceUnit: {
      type: String,
      enum: ['kg', '500g', '250g', '200g', 'pcs', 'bunch', 'pack', 'jar', 'bottle'],
      default: 'kg'
    },
    unit: {
      type: String,
      enum: ['kg', '500g', '250g', '200g', 'pcs', 'bunch', 'pack', 'jar', 'bottle'],
      default: 'kg'
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['fruits', 'vegetables', 'herbs', 'dairy', 'bakery', 'nuts', 'pickles', 'organic'],
      default: 'fruits'
    },
    categories: [{
      type: String,
      enum: ['fruits', 'vegetables', 'herbs', 'dairy', 'bakery', 'nuts', 'pickles', 'organic']
    }],
    image: {
      type: String,
      default: '/assets/images/products/placeholder.jpg'
    },
    images: [{
      type: String
    }],
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    numReviews: {
      type: Number,
      default: 0
    },
    customPrices: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// INDEXES - Improve query performance
// ==========================================
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isActive: 1 });

// ==========================================
// VIRTUAL - Check if product is in stock
// ==========================================
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// ==========================================
// METHODS - Calculate price for different units
// ==========================================
productSchema.methods.calculatePriceForUnit = function (targetUnit) {
  // Unit conversion factors (relative to 1 kg)
  const unitFactors = {
    'kg': 1,
    '500g': 0.5,
    '250g': 0.25,
    '200g': 0.2,
    'pcs': null,
    'bunch': null,
    'pack': null,
    'jar': null,
    'bottle': null
  };

  const baseFactor = unitFactors[this.priceUnit];
  const targetFactor = unitFactors[targetUnit];

  // If either unit is not weight-based, return original price
  if (!baseFactor || !targetFactor) {
    return this.price;
  }

  // Calculate price per kg, then convert to target unit
  const pricePerKg = this.price / baseFactor;
  return (pricePerKg * targetFactor).toFixed(2);
};

const Product = mongoose.model('Product', productSchema);

export default Product;
