import Category from '../models/categoryModel.js';

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Public (for now)
const createCategory = async (req, res) => {
  try {
    const { name, image, description } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const category = await Category.create({
      name,
      image,
      description,
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
    const { name, image, description, isVisible, featured } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.image = image || category.image;
      category.description = description || category.description;
      if (isVisible !== undefined) category.isVisible = isVisible;
      if (featured !== undefined) category.featured = featured;

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
