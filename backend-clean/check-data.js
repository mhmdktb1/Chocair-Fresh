import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

const checkData = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    console.log('Database Name:', mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    // Peek at a few products to show the user what's there
    if (collections.find(c => c.name === 'products')) {
        const products = await mongoose.connection.db.collection('products').find().limit(3).toArray();
        console.log('\nSample Products:');
        products.forEach(p => console.log(`- ${p.name} ($${p.price})`));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkData();
