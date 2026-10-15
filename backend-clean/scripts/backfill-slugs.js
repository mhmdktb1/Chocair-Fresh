import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import { slugify } from '../utils/slug.js';

const apply = process.argv.includes('--apply');

const planSlugs = async (Model, fallbackPrefix) => {
  const documents = await Model.find({}).sort({ _id: 1 }).select('_id name slug').lean();
  const reserved = new Set(documents.map((doc) => doc.slug).filter(Boolean));
  const used = new Set();
  const updates = [];

  for (const doc of documents) {
    if (doc.slug && !used.has(doc.slug)) {
      used.add(doc.slug);
      continue;
    }

    let base = slugify(doc.name) || `${fallbackPrefix}-${String(doc._id).slice(-8)}`;
    if (fallbackPrefix === 'product' && /^[a-f0-9]{24}$/i.test(base)) base = `${base}-item`;
    let candidate = base;
    let suffix = 1;
    while (reserved.has(candidate) || used.has(candidate)) {
      candidate = `${base}-${String(doc._id).slice(-6)}${suffix > 1 ? `-${suffix}` : ''}`;
      suffix += 1;
    }
    reserved.add(candidate);
    used.add(candidate);
    updates.push({ _id: doc._id, slug: candidate });
  }

  return { total: documents.length, updates };
};

const migrate = async (Model, fallbackPrefix, indexName) => {
  const { total, updates } = await planSlugs(Model, fallbackPrefix);
  console.log(`${Model.modelName}: ${updates.length}/${total} slugs ${apply ? 'to update' : 'would be updated'}.`);
  if (!apply) return;

  for (const update of updates) {
    await Model.updateOne({ _id: update._id }, { $set: { slug: update.slug } });
  }
  await Model.collection.createIndex({ slug: 1 }, { name: indexName, unique: true, sparse: true });
};

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be set to run the slug migration');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await migrate(Product, 'product', 'unique_product_slug');
  await migrate(Category, 'category', 'unique_category_slug');
  console.log(apply ? 'Slug migration complete.' : 'Dry run only. Re-run with --apply to persist changes.');
} catch (error) {
  console.error('Slug migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
