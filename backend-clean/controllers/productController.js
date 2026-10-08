import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';
import { applyDiscountToProductDoc } from '../utils/discountHelper.js';
import { sendCachedJson } from '../utils/cache.js';
import { getProductCatalog } from '../services/catalogService.js';

const MAX_DESCRIPTION_LENGTH = 1000;


// Normalize unit to one of the 6 allowed units: 1kg, 500g, 200g, bunch, piece, pack
const normalizeUnit = (rawUnit) => {
  if (!rawUnit) return '1kg';
  const u = String(rawUnit).trim().toLowerCase();
  if (u === '1kg' || u === '1 kg' || u === 'kg' || u === 'kilogram' || u === 'kilograms' || u === 'kilo') return '1kg';
  if (u === '500g' || u === '500 g' || u === '0.5kg' || u === 'half kg' || u === 'g') return '500g';
  if (u === '200g' || u === '200 g' || u === '0.2kg' || u === '250g' || u === '250 g') return '200g';
  if (u === 'bunch' || u === 'bunches' || u === 'bundle' || u === 'bundles') return 'bunch';
  if (u === 'piece' || u === 'peice' || u === 'pieces' || u === 'peices' || u === 'pcs' || u === 'pc' || u === 'unit') return 'piece';
  if (u === 'pack' || u === 'packs' || u === 'box' || u === 'boxes' || u === 'jar' || u === 'bottle' || u === 'cup' || u === 'cups' || u === 'tub' || u === 'tubs') return 'pack';
  return '1kg';
};

// Helper to parse and clean discount payload
const parseDiscountPayload = (discount) => {
  if (!discount || typeof discount !== 'object') {
    return {
      isActive: false,
      type: 'percentage',
      value: 0,
      startDate: null,
      endDate: null,
    };
  }

  const isActive = Boolean(discount.isActive);
  const type = discount.type === 'fixed' ? 'fixed' : 'percentage';
  const numVal = Number(discount.value);
  const value = Number.isFinite(numVal) && numVal > 0 ? numVal : 0;

  let startDate = null;
  if (discount.startDate) {
    const d = new Date(discount.startDate);
    if (!isNaN(d.getTime())) startDate = d;
  }

  let endDate = null;
  if (discount.endDate) {
    const d = new Date(discount.endDate);
    if (!isNaN(d.getTime())) endDate = d;
  }

  return {
    isActive,
    type,
    value,
    startDate,
    endDate,
  };
};

const OFFER_ALIASES = ['offers', 'offer', 'deals', 'deal', 'discounts', 'discount', 'special offers', 'sales', 'sale'];

const sameText = (a, b) => String(a ?? '').trim().toLowerCase() === b;

// @desc    Fetch all products (supports category, subCategory, keyword, and limit query params)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { category, subCategory, keyword, limit, discount, discounted } = req.query;
  const { entry, list } = await getProductCatalog();

  const rawCategory = typeof category === 'string' ? category.trim().toLowerCase() : '';
  const isOffersCategory = OFFER_ALIASES.includes(rawCategory);
  const filterOnlyDiscounted = isOffersCategory || discount === 'true' || discounted === 'true';
  const rawSubCategory = typeof subCategory === 'string' ? subCategory.trim().toLowerCase() : '';
  const rawKeyword = typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
  const numLimit = Number(limit);
  const hasLimit = Number.isFinite(numLimit) && numLimit > 0;

  const hasFilters =
    (rawCategory && rawCategory !== 'all') ||
    (rawSubCategory && rawSubCategory !== 'all') ||
    rawKeyword ||
    filterOnlyDiscounted;

  // Fast path: full catalog straight from the pre-serialized cache entry.
  if (!hasFilters && (!hasLimit || numLimit >= list.length)) {
    sendCachedJson(req, res, entry);
    return;
  }

  let result = list;

  if (rawCategory && rawCategory !== 'all' && !isOffersCategory) {
    result = result.filter((p) => sameText(p.category, rawCategory));
  }

  if (rawSubCategory && rawSubCategory !== 'all') {
    result = result.filter((p) => sameText(p.subCategory, rawSubCategory));
  }

  if (rawKeyword) {
    const fields = ['name', 'nameAr', 'description', 'brand', 'subCategory'];
    result = result.filter((p) => fields.some((f) => String(p[f] ?? '').toLowerCase().includes(rawKeyword)));
  }

  if (filterOnlyDiscounted) {
    result = result.filter((p) => p.isDiscounted || sameText(p.category, 'offers'));
  }

  if (hasLimit) {
    result = result.slice(0, Math.min(numLimit, 1000));
  }

  res.set('Cache-Control', 'no-cache');
  res.json(result);
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { byId } = await getProductCatalog();
  let product = byId.get(String(req.params.id));

  if (!product) {
    // Catalog may be a few seconds behind writes made outside this process.
    const doc = await Product.findById(req.params.id).lean();
    product = doc ? applyDiscountToProductDoc(doc) : null;
  }

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.set('Cache-Control', 'no-cache');
  res.json(product);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private / Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, nameAr, price, description, image, brand, category, subCategory, countInStock, unit, discount } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400);
    throw new Error('Product name must be a non-empty string');
  }

  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    res.status(400);
    throw new Error('Valid non-negative finite price is required');
  }

  const numStock = countInStock !== undefined ? Number(countInStock) : 0;
  if (!Number.isFinite(numStock) || numStock < 0) {
    res.status(400);
    throw new Error('Valid non-negative finite stock count is required');
  }

  if (nameAr !== undefined && typeof nameAr !== 'string') {
    res.status(400);
    throw new Error('Arabic name must be a string');
  }

  if (description !== undefined && typeof description !== 'string') {
    res.status(400);
    throw new Error('Description must be a string');
  }

  if (typeof description === 'string' && description.trim().length > MAX_DESCRIPTION_LENGTH) {
    res.status(400);
    throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
  }

  if (image !== undefined && typeof image !== 'string') {
    res.status(400);
    throw new Error('Image must be a string URL or path');
  }

  if (brand !== undefined && typeof brand !== 'string') {
    res.status(400);
    throw new Error('Brand must be a string');
  }

  if (category !== undefined && typeof category !== 'string') {
    res.status(400);
    throw new Error('Category must be a string');
  }

  if (subCategory !== undefined && typeof subCategory !== 'string') {
    res.status(400);
    throw new Error('SubCategory must be a string');
  }

  if (unit !== undefined && typeof unit !== 'string') {
    res.status(400);
    throw new Error('Unit must be a string');
  }

  const product = new Product({
    name: name.trim(),
    nameAr: nameAr ? nameAr.trim() : '',
    price: numPrice,
    description: description ? description.trim() : '',
    image: image ? image.trim() : '/assets/images/placeholder-product.jpg',
    brand: brand ? brand.trim() : 'Choucair Fresh',
    category: category ? category.trim() : 'general',
    subCategory: subCategory ? subCategory.trim() : '',
    countInStock: numStock,
    unit: normalizeUnit(unit),
    discount: parseDiscountPayload(discount),
  });

  const createdProduct = await product.save();
  res.status(201).json(applyDiscountToProductDoc(createdProduct));
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private / Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, nameAr, price, description, image, brand, category, subCategory, countInStock, unit, discount } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400);
      throw new Error('Product name must be a non-empty string');
    }
    product.name = name.trim();
  }

  if (nameAr !== undefined) {
    product.nameAr = typeof nameAr === 'string' ? nameAr.trim() : '';
  }

  if (price !== undefined) {
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      res.status(400);
      throw new Error('Valid non-negative finite price is required');
    }
    product.price = numPrice;
  }

  if (countInStock !== undefined) {
    const numStock = Number(countInStock);
    if (!Number.isFinite(numStock) || numStock < 0) {
      res.status(400);
      throw new Error('Valid non-negative finite stock count is required');
    }
    product.countInStock = numStock;
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      res.status(400);
      throw new Error('Description must be a string');
    }
    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      res.status(400);
      throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
    }
    product.description = description.trim();
  }

  if (image !== undefined) {
    if (typeof image !== 'string') {
      res.status(400);
      throw new Error('Image must be a string');
    }
    product.image = image.trim();
  }

  if (brand !== undefined) {
    if (typeof brand !== 'string') {
      res.status(400);
      throw new Error('Brand must be a string');
    }
    product.brand = brand.trim();
  }

  if (category !== undefined) {
    if (typeof category !== 'string') {
      res.status(400);
      throw new Error('Category must be a string');
    }
    product.category = category.trim();
  }

  if (subCategory !== undefined) {
    if (typeof subCategory !== 'string') {
      res.status(400);
      throw new Error('SubCategory must be a string');
    }
    product.subCategory = subCategory.trim();
  }

  if (unit !== undefined) {
    if (typeof unit !== 'string') {
      res.status(400);
      throw new Error('Unit must be a string');
    }
    product.unit = normalizeUnit(unit);
  }

  if (discount !== undefined) {
    product.discount = parseDiscountPayload(discount);
  }

  const updatedProduct = await product.save();
  res.json(applyDiscountToProductDoc(updatedProduct));
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private / Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
