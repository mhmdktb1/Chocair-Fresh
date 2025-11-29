/**
 * ==========================================
 * PRODUCT CONTROLLER
 * ==========================================
 * 
 * Handles product management operations.
 * Includes CRUD operations, search, and filtering.
 */

import Product from '../models/productModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Get all products with filters
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    featured,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 12
  } = req.query;

  // Build query
  let query = { isActive: true };

  // Filter by category
  if (category) {
    query.$or = [
      { category: category },
      { categories: category }
    ];
  }

  // Search by name or description
  if (search) {
    query.$text = { $search: search };
  }

  // Filter by featured
  if (featured === 'true') {
    query.featured = true;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Build sort
  let sortOptions = {};
  if (sort === 'price-asc') sortOptions.price = 1;
  if (sort === 'price-desc') sortOptions.price = -1;
  if (sort === 'name-asc') sortOptions.name = 1;
  if (sort === 'name-desc') sortOptions.name = -1;
  if (sort === 'newest') sortOptions.createdAt = -1;

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const products = await Product.find(query)
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  // Get total count
  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    count: products.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: products
  });
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json({
      success: true,
      data: product
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Create a new product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    priceUnit,
    unit,
    category,
    categories,
    image,
    stock,
    featured
  } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    priceUnit: priceUnit || 'kg',
    unit: unit || 'kg',
    category,
    categories: categories || [category],
    image: image || '/assets/images/products/placeholder.jpg',
    stock: stock || 0,
    featured: featured || false
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

/**
 * @desc    Update product (Admin only)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price ?? product.price;
    product.priceUnit = req.body.priceUnit || product.priceUnit;
    product.unit = req.body.unit || product.unit;
    product.category = req.body.category || product.category;
    product.categories = req.body.categories || product.categories;
    product.image = req.body.image || product.image;
    product.stock = req.body.stock ?? product.stock;
    product.featured = req.body.featured ?? product.featured;
    product.isActive = req.body.isActive ?? product.isActive;

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Delete product (Admin only)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true, isActive: true })
    .limit(8)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 12 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find({
    $or: [
      { category: category },
      { categories: category }
    ],
    isActive: true
  })
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments({
    $or: [
      { category: category },
      { categories: category }
    ],
    isActive: true
  });

  res.json({
    success: true,
    count: products.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: products
  });
});

/**
 * @desc    Update product stock (Admin only)
 * @route   PATCH /api/products/:id/stock
 * @access  Private/Admin
 */
export const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.stock = stock;
    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        _id: product._id,
        name: product.name,
        stock: product.stock
      }
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});
