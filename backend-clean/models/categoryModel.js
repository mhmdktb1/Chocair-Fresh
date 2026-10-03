import mongoose from 'mongoose';
import { invalidateOnWrite } from '../utils/cache.js';

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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

invalidateOnWrite(categorySchema, 'categories');

const Category = mongoose.model('Category', categorySchema);

export default Category;
