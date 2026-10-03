import Category from '../models/categoryModel.js';
import { sendCachedJson } from '../utils/cache.js';
import { getCategoriesEntry } from '../services/catalogService.js';

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const entry = await getCategoriesEntry();
    sendCachedJson(req, res, entry);
  } catch (error) {
    console.error('DB error in getCategories:', error.message);
    res.set('Retry-After', '3');
    res.status(503).json({ message: 'Categories are temporarily unavailable, please retry.' });
  }
};

// Helper to parse subCategories list
const parseSubCategories = (input) => {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map(s => String(s).trim()).filter(Boolean)));
  }
  if (typeof input === 'string') {
    return Array.from(new Set(input.split(',').map(s => s.trim()).filter(Boolean)));
  }
  return [];
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private / Admin
const createCategory = async (req, res) => {
  try {
    const { name, image, description, isVisible, featured, subCategories } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const parsedSubCats = subCategories !== undefined ? parseSubCategories(subCategories) : [];

    const category = await Category.create({
      name,
      image,
      description,
      isVisible: isVisible !== undefined ? isVisible : true,
      featured: featured !== undefined ? featured : false,
      subCategories: parsedSubCats,
    });

    if (category) {
      res.status(201).json(category);
    } else {
      res.status(400).json({ message: 'Invalid category data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Public (for now)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.deleteOne();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Public (for now)
const updateCategory = async (req, res) => {
  try {
    const { name, image, description, isVisible, featured, subCategories } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.image = image || category.image;
      category.description = description || category.description;
      if (isVisible !== undefined) category.isVisible = isVisible;
      if (featured !== undefined) category.featured = featured;
      if (subCategories !== undefined) category.subCategories = parseSubCategories(subCategories);

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getCategories, createCategory, deleteCategory, updateCategory };
