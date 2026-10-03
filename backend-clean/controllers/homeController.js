import HomeConfig from '../models/homeModel.js';
import { sendCachedJson } from '../utils/cache.js';
import { getHomeConfigEntry } from '../services/catalogService.js';

// @desc    Get Home Config
// @route   GET /api/home-config
// @access  Public
const getHomeConfig = async (req, res) => {
  try {
    const entry = await getHomeConfigEntry();
    sendCachedJson(req, res, entry);
  } catch (error) {
    // Never answer with a fabricated default config: clients would cache it over the real
    // one and the admin editor could save it back. A 503 lets clients keep their cache.
    console.error('DB error in getHomeConfig:', error.message);
    res.set('Retry-After', '3');
    res.status(503).json({ message: 'Home configuration is temporarily unavailable, please retry.' });
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
      title: req.body.seasonal.title || config?.seasonal?.title || 'Seasonal Fruits',
      subtitle: req.body.seasonal.subtitle || config?.seasonal?.subtitle || 'Fresh seasonal harvest straight from the farm',
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
      if (req.body.promos) config.promos = { ...config.promos, ...req.body.promos };
      if (req.body.bundle) config.bundle = { ...config.bundle, ...req.body.bundle };
      if (req.body.story) config.story = { ...config.story, ...req.body.story };
      if (req.body.features) config.features = { ...config.features, ...req.body.features };
      if (req.body.newsletter) config.newsletter = { ...config.newsletter, ...req.body.newsletter };
      if (seasonalPayload !== undefined) config.seasonal = seasonalPayload;
      if (req.body.delivery) {
        config.delivery = {
          ...config.delivery?.toObject?.() || config.delivery || {},
          ...req.body.delivery,
          distanceTiers: {
            ...((config.delivery?.distanceTiers?.toObject?.() || config.delivery?.distanceTiers) || {}),
            ...(req.body.delivery?.distanceTiers || {})
          }
        };
      }
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
