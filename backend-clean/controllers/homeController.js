import HomeConfig from '../models/homeModel.js';

// @desc    Get Home Config
// @route   GET /api/home-config
// @access  Public
const getHomeConfig = async (req, res) => {
  try {
    // Find the first config or create default if none exists
    let config = await HomeConfig.findOne().populate('featuredCategories');
    if (!config) {
      config = await HomeConfig.create({});
      // Re-fetch to populate if needed (though newly created won't have categories yet)
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Home Config
// @route   PUT /api/home-config
// @access  Private/Admin
const updateHomeConfig = async (req, res) => {
  try {
    let config = await HomeConfig.findOne();
    if (!config) {
      config = new HomeConfig(req.body);
    } else {
      // Update fields
      if (req.body.hero) config.hero = { ...config.hero, ...req.body.hero };
      if (req.body.featuredCategories) config.featuredCategories = req.body.featuredCategories;
      if (req.body.bundle) config.bundle = { ...config.bundle, ...req.body.bundle };
      if (req.body.story) config.story = { ...config.story, ...req.body.story };
    }
    
    const updatedConfig = await config.save();
    // Populate before returning
    await updatedConfig.populate('featuredCategories');
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getHomeConfig, updateHomeConfig };
