import mongoose from 'mongoose';
import { invalidateOnWrite } from '../utils/cache.js';
import { createUniqueSlug, slugify } from '../utils/slug.js';

const discountSchema = mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    nameAr: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      default: '',
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      default: '1kg',
      enum: ['1kg', '500g', '200g', 'bunch', 'piece', 'pack'],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: discountSchema,
      default: () => ({ isActive: false, type: 'percentage', value: 0 }),
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ rating: -1, numReviews: -1 });
productSchema.index({ slug: 1 }, { unique: true, sparse: true, name: 'unique_product_slug' });

productSchema.pre('save', async function assignSlug() {
  if (!this.isNew && !this.isModified('name') && this.slug) return;
  if (this.slug && !this.isNew && this.slug === slugify(this.name)) return;
  this.slug = await createUniqueSlug(Product, this.name, this._id, 'product');
});

invalidateOnWrite(productSchema, 'products');

const Product = mongoose.model('Product', productSchema);

export default Product;
