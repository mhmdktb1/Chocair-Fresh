import mongoose from 'mongoose';
import { invalidateOnWrite } from '../utils/cache.js';
import { createUniqueSlug, slugify } from '../utils/slug.js';

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    subCategories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ slug: 1 }, { unique: true, sparse: true, name: 'unique_category_slug' });

categorySchema.pre('save', async function assignSlug() {
  if (!this.isNew && !this.isModified('name') && this.slug) return;
  if (this.slug && !this.isNew && this.slug === slugify(this.name)) return;
  this.slug = await createUniqueSlug(Category, this.name, this._id, 'category');
});

invalidateOnWrite(categorySchema, 'categories');

const Category = mongoose.model('Category', categorySchema);

export default Category;
