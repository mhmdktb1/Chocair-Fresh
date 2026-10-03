import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import HomeConfig from '../models/homeModel.js';
import { createCachedResource } from '../utils/cache.js';
import { applyDiscountToProductDoc } from '../utils/discountHelper.js';

// Discounts depend on start/end dates, so the catalog TTL also bounds how late a
// scheduled discount can appear/disappear.
const productsResource = createCachedResource({
  name: 'products',
  tags: ['products'],
  ttlMs: 30 * 1000,
  load: async () => {
    const docs = await Product.find({}).sort({ createdAt: -1, _id: -1 }).lean();
    return docs.map(applyDiscountToProductDoc);
  },
});

const categoriesResource = createCachedResource({
  name: 'categories',
  tags: ['categories'],
  ttlMs: 60 * 1000,
  load: () => Category.find({}).lean(),
});

const homeConfigResource = createCachedResource({
  name: 'home-config',
  tags: ['home', 'products', 'categories'],
  ttlMs: 60 * 1000,
  load: async () => {
    const populate = (q) => q.populate('featuredCategories').populate('seasonal.products');
    let config = await populate(HomeConfig.findOne());
    if (!config) {
      const created = await HomeConfig.create({});
      config = await populate(HomeConfig.findById(created._id));
    }
    const json = config.toJSON();
    // Deleted products/categories populate as null – drop them and expose live pricing.
    if (Array.isArray(json.featuredCategories)) {
      json.featuredCategories = json.featuredCategories.filter(Boolean);
    }
    if (json.seasonal && Array.isArray(json.seasonal.products)) {
      json.seasonal.products = json.seasonal.products.filter(Boolean).map(applyDiscountToProductDoc);
    }
    return json;
  },
});

const indexCache = new WeakMap();

const buildIndex = (list) => {
  let byId = indexCache.get(list);
  if (!byId) {
    byId = new Map(list.map((p) => [String(p._id), p]));
    indexCache.set(list, byId);
  }
  return byId;
};

/** Full catalog (newest first, discounts applied) plus an id index. Do not mutate. */
export const getProductCatalog = async () => {
  const entry = await productsResource.get();
  return { entry, list: entry.value, byId: buildIndex(entry.value) };
};

export const getCategoriesEntry = () => categoriesResource.get();

export const getHomeConfigEntry = () => homeConfigResource.get();
