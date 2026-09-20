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
      config = await HomeConfig.findById(config._id)
        .populate('featuredCategories')
        .populate('seasonal.products');
    }
    res.json(config);
  } catch (error) {
    console.error('DB error in getHomeConfig:', error.message);
    const defaultConfig = {
      hero: {
        title: "FRESHER. CLEANER. BETTER.",
        subtitle: "Carefully selected fresh produce, every day.",
        backgroundImage: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80",
        ctaText: "Shop Now",
        ctaLink: "/shop",
        secondaryText: "Explore Produce",
        secondaryLink: "/shop",
        theme: "emerald",
        stats: [
          { label: "Happy Customers", value: "20k+" },
          { label: "Fresh Products", value: "500+" },
          { label: "Fast Delivery", value: "24h" }
        ]
      },
      featuredCategories: [],
      promos: {
        enabled: true,
        boxCard: {
          badge: "Hot Offer",
          discountTag: "Save 25%",
          title: "Weekly Organic Harvest Box",
          description: "Freshly harvested local vegetables & berries",
          ctaText: "Shop Box",
          ctaLink: "/shop?category=Organic",
          emoji: "🥗"
        },
        couponCard: {
          badge: "New Customer",
          discountTag: "$10 OFF",
          title: "Use Code at Checkout",
          description: "Valid on your first order over $35",
          code: "FRESH30",
          emoji: "🎟️"
        }
      },
      bundle: {
        enabled: true,
        title: "Organic Summer Berry Bundle",
        description: "Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking.",
        price: 29.99,
        originalPrice: 45.00,
        saveAmount: "Save $15.01",
        claimedPercentage: 84,
        stockLeftText: "Only 16 bundles left",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80",
        link: "/shop?discount=true"
      },
      story: {
        enabled: true,
        title: "Our Story",
        subtitle: "",
        lead: "We started with a simple idea: fresh produce should feel better from the moment you order it to the moment it reaches your kitchen.",
        description: "At Chocair Fresh, we carefully select, check, and pack every order before it leaves us. We focus on the little details — choosing clean, good-looking pieces and packing them neatly so your order arrives the way you’d expect it to.",
        image: "",
        yearsOfService: ""
      },
      features: {
        enabled: true,
        pillText: "",
        title: "What We Offer",
        items: [
          { title: "Carefully Selected", description: "Fresh, quality produce carefully chosen for every order.", icon: "Sparkles", color: "#2ecc71" },
          { title: "Checked & Packed", description: "Every item is checked and neatly packed before it leaves us.", icon: "PackageCheck", color: "#3498db" },
          { title: "Fast Delivery", description: "Your order arrives quickly, fresh and ready for your kitchen.", icon: "Truck", color: "#9b59b6" },
          { title: "Quality Guarantee", description: "Not satisfied with something? We’ll make it right.", icon: "ShieldCheck", color: "#e67e22" }
        ]
      },
      newsletter: {
        enabled: true,
        badge: "Join The Club",
        title: "Get Fresh Updates",
        description: "Subscribe to our newsletter and get 10% off your first order. Plus, receive weekly healthy recipes and exclusive deals."
      },
      seasonal: {
        title: "Seasonal Favorites",
        subtitle: "Picked at the peak of flavor this season",
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
      subtitle: req.body.seasonal.subtitle || config?.seasonal?.subtitle || 'Picked at the peak of flavor this season',
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
