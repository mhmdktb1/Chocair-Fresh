import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';

// Helper to escape regex special characters
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Normalize unit to one of the 6 allowed units: 1kg, 500g, 200g, bunch, piece, pack
const normalizeUnit = (rawUnit) => {
  if (!rawUnit) return '1kg';
  const u = String(rawUnit).trim().toLowerCase();
  if (u === '1kg' || u === '1 kg' || u === 'kg' || u === 'kilogram' || u === 'kilograms' || u === 'kilo') return '1kg';
  if (u === '500g' || u === '500 g' || u === '0.5kg' || u === 'half kg' || u === 'g') return '500g';
  if (u === '200g' || u === '200 g' || u === '0.2kg' || u === '250g' || u === '250 g') return '200g';
  if (u === 'bunch' || u === 'bunches' || u === 'bundle' || u === 'bundles') return 'bunch';
  if (u === 'piece' || u === 'peice' || u === 'pieces' || u === 'peices' || u === 'pcs' || u === 'pc' || u === 'unit') return 'piece';
  if (u === 'pack' || u === 'packs' || u === 'box' || u === 'boxes' || u === 'jar' || u === 'bottle') return 'pack';
  return '1kg';
};

// @desc    Fetch all products (supports category, keyword, and limit query params)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  try {
    const { category, keyword, limit } = req.query;
    const query = {};

    if (category && category !== 'all') {
      const safeCat = escapeRegex(category.trim());
      query.category = { $regex: `^${safeCat}$`, $options: 'i' };
    }

    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      const safeKeyword = escapeRegex(keyword.trim());
      query.$or = [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
        { brand: { $regex: safeKeyword, $options: 'i' } },
      ];
    }

    let productQuery = Product.find(query).sort({ createdAt: -1 });

    if (limit && Number(limit) > 0) {
      productQuery = productQuery.limit(Math.min(Number(limit), 1000));
    }

    const products = await productQuery;
    res.json(products);
  } catch (error) {
    console.error('DB error in getProducts:', error.message);
    res.json([]);
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('DB error in getProductById:', error.message);
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private / Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock, unit } = req.body;

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

  if (description !== undefined && typeof description !== 'string') {
    res.status(400);
    throw new Error('Description must be a string');
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

  if (unit !== undefined && typeof unit !== 'string') {
    res.status(400);
    throw new Error('Unit must be a string');
  }

  const product = new Product({
    name: name.trim(),
    price: numPrice,
    description: description ? description.trim() : '',
    image: image ? image.trim() : '/assets/images/placeholder-product.jpg',
    brand: brand ? brand.trim() : 'Chocair Fresh',
    category: category ? category.trim() : 'general',
    countInStock: numStock,
    unit: normalizeUnit(unit),
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private / Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock, unit } = req.body;

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

  if (unit !== undefined) {
    if (typeof unit !== 'string') {
      res.status(400);
      throw new Error('Unit must be a string');
    }
    product.unit = normalizeUnit(unit);
  }

  const updatedProduct = await product.save();
  res.json(updatedProduct);
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
