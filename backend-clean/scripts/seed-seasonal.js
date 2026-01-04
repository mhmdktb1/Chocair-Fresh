import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import HomeConfig from '../models/homeModel.js';
import Product from '../models/productModel.js';

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

const seedSeasonal = async () => {
  await connectDB();

  try {
    // Get 4 random products
    const products = await Product.aggregate([{ $sample: { size: 4 } }]);
    const productIds = products.map(p => p._id);

    console.log('Selected products for seasonal:', products.map(p => p.name));

    let config = await HomeConfig.findOne();
    if (!config) {
      config = new HomeConfig({});
    }

    config.seasonal = {
      title: "Seasonal Favorites",
      products: productIds
    };

    await config.save();
    console.log('✅ Home Config updated with Seasonal products');
  } catch (error) {
    console.error('Error updating config:', error);
  }

  process.exit();
};

seedSeasonal();
