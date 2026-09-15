import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';

// Helper to escape regex special characters
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400);
    throw new Error('Product name is required');
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    res.status(400);
    throw new Error('Valid non-negative price is required');
  }

  const numStock = countInStock !== undefined ? Number(countInStock) : 0;
  if (isNaN(numStock) || numStock < 0) {
    res.status(400);
    throw new Error('Valid non-negative stock count is required');
  }

  const product = new Product({
    name: name.trim(),
    price: numPrice,
    description: description ? description.trim() : '',
    image: image || '/assets/images/placeholder-product.jpg',
    brand: brand ? brand.trim() : 'Chocair Fresh',
    category: category ? category.trim() : 'general',
    countInStock: numStock,
    unit: unit || 'kg',
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

  if (product) {
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        res.status(400);
        throw new Error('Valid non-negative price is required');
      }
      product.price = numPrice;
    }

    if (countInStock !== undefined) {
      const numStock = Number(countInStock);
      if (isNaN(numStock) || numStock < 0) {
        res.status(400);
        throw new Error('Valid non-negative stock count is required');
      }
      product.countInStock = numStock;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (image) product.image = image;
    if (brand) product.brand = brand.trim();
    if (category) product.category = category.trim();
    if (unit) product.unit = unit;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
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
