import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const updateImages = async () => {
  await connectDB();

  console.log('📚 Fetching categories...');
  const categories = await Category.find({});
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  const products = await Product.find({});
  console.log(`Found ${products.length} products. Updating images...`);

  for (const product of products) {
    // Get category name from map, fallback to empty string if not found
    const categoryName = categoryMap[product.category] || 'food';
    
    // Create keywords for loremflickr: Product Name words + Category Name
    // e.g. "Sweet Potato" -> "sweet,potato,vegetables"
    const keywords = `${product.name},${categoryName}`.replace(/[^a-zA-Z0-9]/g, ',').toLowerCase();
    
    // Generate the URL
    // We use ?lock= to ensure the same product always gets the same random image
    const newImage = `https://loremflickr.com/600/600/${keywords}?lock=${product._id.toString()}`;
    
    product.image = newImage;
    await product.save();
  }

  console.log('✅ All product images updated with correct names!');
  process.exit();
};

updateImages();
