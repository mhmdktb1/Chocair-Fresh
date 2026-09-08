import HomeConfig from '../models/homeModel.js';

// @desc    Get Home Config
// @route   GET /api/home-config
// @access  Public
const getHomeConfig = async (req, res) => {
  try {
    // Find the first config or create default if none exists
    let config = await HomeConfig.findOne()
      .populate('featuredCategories')
      .populate('seasonal.products');
      
    if (!config) {
      config = await HomeConfig.create({});
      // Re-fetch to populate if needed (though newly created won't have categories yet)
    }
    res.json(config);
  } catch (error) {
    // If DB fails, return default config
    console.error('DB error in getHomeConfig:', error.message);
    const defaultConfig = {
      hero: {
        title: "Welcome to Chocair Fresh",
        subtitle: "Fresh, Organic, and Delicious",
        backgroundImage: "/assets/images/hero-bg.jpg"
      },
      featuredCategories: [],
      bundle: {
        title: "Limited Time Offer",
        products: []
      },
      story: {
        title: "Our Story",
        content: "We are passionate about providing fresh organic products."
      },
      seasonal: {
        title: "Seasonal Favorites",
        products: []
      }
    };
    res.json(defaultConfig);
  }
};

// @desc    Update Home Config
// @route   PUT /api/home-config
// @access  Private/Admin
const updateHomeConfig = async (req, res) => {
  try {
    let config = await HomeConfig.findOne();
    
    // Clean up IDs for seasonal products and featured categories
    const seasonalPayload = req.body.seasonal ? {
      title: req.body.seasonal.title || config?.seasonal?.title || 'Seasonal Favorites',
      products: Array.isArray(req.body.seasonal.products)
        ? req.body.seasonal.products.map(p => (p && p._id ? p._id : p))
        : []
    } : undefined;

    const featuredCategoriesPayload = Array.isArray(req.body.featuredCategories)
      ? req.body.featuredCategories.map(c => (c && c._id ? c._id : c))
      : undefined;

    if (!config) {
      config = new HomeConfig({
        ...req.body,
        ...(seasonalPayload && { seasonal: seasonalPayload }),
        ...(featuredCategoriesPayload && { featuredCategories: featuredCategoriesPayload }),
      });
    } else {
      // Update fields
      if (req.body.hero) config.hero = { ...config.hero, ...req.body.hero };
      if (featuredCategoriesPayload !== undefined) config.featuredCategories = featuredCategoriesPayload;
      if (req.body.bundle) config.bundle = { ...config.bundle, ...req.body.bundle };
      if (req.body.story) config.story = { ...config.story, ...req.body.story };
      if (seasonalPayload !== undefined) config.seasonal = seasonalPayload;
    }
    
    const updatedConfig = await config.save();
    // Populate before returning
    await updatedConfig.populate('featuredCategories');
    await updatedConfig.populate('seasonal.products');
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error in updateHomeConfig:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export { getHomeConfig, updateHomeConfig };
