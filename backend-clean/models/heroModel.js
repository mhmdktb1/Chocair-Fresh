import mongoose from 'mongoose';

const heroSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    backgroundImage: {
      type: String,
      required: true,
    },
    ctaText: {
      type: String,
      default: 'Shop Now',
    },
    page: {
      type: String,
      required: true,
      default: 'home',
      enum: ['home', 'products', 'about', 'contact', 'categories'],
    },
    ctaLink: {
      type: String,
      default: '/products',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Hero = mongoose.model('Hero', heroSchema);

export default Hero;
