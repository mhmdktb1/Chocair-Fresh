import { createContext, useContext, useState, useEffect } from "react";
import { ALLOWED_UNITS, normalizeUnit } from "../utils/unitHelper";

const CMSContext = createContext();

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within CMSProvider");
  }
  return context;
};

export const CMSProvider = ({ children }) => {
  // Hero Sections Management
  const [heroSlides, setHeroSlides] = useState(() => {
    const saved = localStorage.getItem("cms_hero_slides");
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: "Fresh Groceries Delivered to Your Doorstep",
        subtitle: "Get the freshest fruits, vegetables, and more delivered within hours",
        backgroundImage: "/assets/images/hero-bg.jpg",
        ctaText: "Shop Now",
        ctaLink: "/products",
        isActive: true,
        order: 1
      },
      {
        id: 2,
        title: "Organic & Farm Fresh",
        subtitle: "100% natural products sourced directly from local farms",
        backgroundImage: "/assets/images/hero-bg-2.jpg",
        ctaText: "Explore",
        ctaLink: "/categories",
        isActive: true,
        order: 2
      }
    ];
  });

  // Categories Management (extended from AdminContext)
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("cms_categories");
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: "Fruits",
        slug: "fruits",
        description: "Fresh seasonal fruits delivered daily",
        image: "/assets/images/products/fruits/apple-red.jpg",
        isVisible: true,
        order: 1,
        featured: true
      },
      {
        id: 2,
        name: "Vegetables",
        slug: "vegetables",
        description: "Organic vegetables straight from the farm",
        image: "/assets/images/products/vegetables/tomato.jpg",
        isVisible: true,
        order: 2,
        featured: true
      },
      {
        id: 3,
        name: "Herbs",
        slug: "herbs",
        description: "Fresh culinary herbs and seasoning greens",
        image: "/assets/images/products/herbs/parsley.jpg",
        isVisible: true,
        order: 3,
        featured: false
      },
      {
        id: 4,
        name: "Raw Nuts",
        slug: "raw-nuts",
        description: "Natural unroasted whole raw nuts and seeds",
        image: "/assets/images/products/nuts/almond-raw.jpg",
        isVisible: true,
        order: 4,
        featured: true
      },
      {
        id: 5,
        name: "Cooked Nuts",
        slug: "cooked-nuts",
        description: "Crunchy oven-roasted salted and gourmet nuts",
        image: "/assets/images/products/nuts/cashew-roasted.jpg",
        isVisible: true,
        order: 5,
        featured: false
      },
      {
        id: 6,
        name: "Dates",
        slug: "dates",
        description: "Premium Saudi & Lebanese dates, date paste & stuffed dates",
        image: "/assets/images/products/dates/medjool-dates.jpg",
        isVisible: true,
        order: 6,
        featured: true
      }
    ];
  });

  // Offers & Promotions Management
  const [offers, setOffers] = useState(() => {
    const saved = localStorage.getItem("cms_offers");
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: "20% Off All Fruits",
        description: "Fresh seasonal fruits at amazing prices",
        discountType: "percentage", // percentage, fixed, bogo
        discountValue: 20,
        target: "category", // category, product, sitewide
        targetId: 1, // category ID or product ID
        startDate: "2025-11-01",
        endDate: "2025-11-30",
        isActive: true,
        minPurchase: 0,
        code: "FRUIT20"
      },
      {
        id: 2,
        title: "$5 Off Orders Above $50",
        description: "Save big on your grocery shopping",
        discountType: "fixed",
        discountValue: 5,
        target: "sitewide",
        targetId: null,
        startDate: "2025-11-01",
        endDate: "2025-12-31",
        isActive: true,
        minPurchase: 50,
        code: "SAVE5"
      },
      {
        id: 3,
        title: "Buy 2 Get 1 Free on Vegetables",
        description: "Stock up on fresh veggies",
        discountType: "bogo",
        discountValue: 1, // Get 1 free
        target: "category",
        targetId: 2,
        startDate: "2025-11-05",
        endDate: "2025-11-15",
        isActive: true,
        minPurchase: 0,
        code: "VEGGIE321"
      }
    ];
  });

  // Pricing Rules & Logic (strictly: 1kg, 500g, 200g, bunch, piece, pack)
  const [pricingRules, setPricingRules] = useState(() => {
    const defaultRules = {
      defaultUnit: "1kg",
      availableUnits: [
        { value: "1kg", label: "1kg (Kilogram)", base: 1.0 },
        { value: "500g", label: "500g (500 grams)", base: 0.5 },
        { value: "200g", label: "200g (200 grams)", base: 0.2 },
        { value: "bunch", label: "Bunch (Per Bunch)", base: null },
        { value: "piece", label: "Piece (Per Piece)", base: null },
        { value: "pack", label: "Pack (Per Pack)", base: null }
      ],
      autoCalculate: true
    };
    try {
      const saved = localStorage.getItem("cms_pricing_rules");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure units are normalized strictly to the 6 allowed units
        return {
          ...defaultRules,
          ...parsed,
          defaultUnit: normalizeUnit(parsed.defaultUnit || "1kg"),
          availableUnits: defaultRules.availableUnits
        };
      }
    } catch (e) {
      console.error("Failed to parse pricing rules", e);
    }
    return defaultRules;
  });

  // Enhanced Products with CMS features (pricing, categories, featured)
  const [cmsProducts, setCmsProducts] = useState(() => {
    const saved = localStorage.getItem("cms_products");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("cms_hero_slides", JSON.stringify(heroSlides));
  }, [heroSlides]);

  useEffect(() => {
    localStorage.setItem("cms_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("cms_offers", JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem("cms_pricing_rules", JSON.stringify(pricingRules));
  }, [pricingRules]);

  useEffect(() => {
    localStorage.setItem("cms_products", JSON.stringify(cmsProducts));
  }, [cmsProducts]);

  // ===== HERO SLIDES FUNCTIONS =====
  const addHeroSlide = (slide) => {
    const newSlide = {
      ...slide,
      id: Date.now(),
      order: heroSlides.length + 1
    };
    setHeroSlides([...heroSlides, newSlide]);
    console.log("✅ Hero slide added:", newSlide);
  };

  const updateHeroSlide = (id, updatedData) => {
    setHeroSlides(heroSlides.map(slide => 
      slide.id === id ? { ...slide, ...updatedData } : slide
    ));
    console.log("✏️ Hero slide updated:", id);
  };

  const deleteHeroSlide = (id) => {
    setHeroSlides(heroSlides.filter(slide => slide.id !== id));
    console.log("🗑️ Hero slide deleted:", id);
  };

  const reorderHeroSlides = (newOrder) => {
    setHeroSlides(newOrder);
    console.log("↕️ Hero slides reordered");
  };

  // ===== CATEGORIES FUNCTIONS =====
  const addCategory = (category) => {
    const newCategory = {
      ...category,
      id: Date.now(),
      slug: category.name.toLowerCase().replace(/\s+/g, '-'),
      order: categories.length + 1
    };
    setCategories([...categories, newCategory]);
    console.log("✅ Category added:", newCategory);
  };

  const updateCategory = (id, updatedData) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, ...updatedData } : cat
    ));
    console.log("✏️ Category updated:", id);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(cat => cat.id !== id));
    console.log("🗑️ Category deleted:", id);
  };

  const reorderCategories = (newOrder) => {
    setCategories(newOrder);
    console.log("↕️ Categories reordered");
  };

  // ===== OFFERS FUNCTIONS =====
  const addOffer = (offer) => {
    const newOffer = {
      ...offer,
      id: Date.now()
    };
    setOffers([...offers, newOffer]);
    console.log("✅ Offer added:", newOffer);
  };

  const updateOffer = (id, updatedData) => {
    setOffers(offers.map(offer => 
      offer.id === id ? { ...offer, ...updatedData } : offer
    ));
    console.log("✏️ Offer updated:", id);
  };

  const deleteOffer = (id) => {
    setOffers(offers.filter(offer => offer.id !== id));
    console.log("🗑️ Offer deleted:", id);
  };

  const toggleOfferStatus = (id) => {
    setOffers(offers.map(offer => 
      offer.id === id ? { ...offer, isActive: !offer.isActive } : offer
    ));
    console.log("🔄 Offer status toggled:", id);
  };

  // ===== PRICING FUNCTIONS =====
  const calculatePrice = (basePrice, basePriceUnit, targetUnit) => {
    if (!pricingRules.autoCalculate) return basePrice;

    const baseNorm = normalizeUnit(basePriceUnit);
    const targetNorm = normalizeUnit(targetUnit);

    const baseUnitData = pricingRules.availableUnits.find(u => u.value === baseNorm);
    const targetUnitData = pricingRules.availableUnits.find(u => u.value === targetNorm);

    if (!baseUnitData || !targetUnitData || !baseUnitData.base || !targetUnitData.base) {
      return basePrice; // Can't calculate conversion for non-weight units
    }

    // Calculate price per kg, then convert to target unit
    const pricePerKg = Number(basePrice) / baseUnitData.base;
    return (pricePerKg * targetUnitData.base).toFixed(2);
  };

  const updatePricingRules = (newRules) => {
    setPricingRules({ ...pricingRules, ...newRules });
    console.log("✏️ Pricing rules updated");
  };

  // ===== CMS PRODUCTS FUNCTIONS =====
  const addCmsProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now()
    };
    setCmsProducts([...cmsProducts, newProduct]);
    console.log("✅ CMS Product added:", newProduct);
  };

  const updateCmsProduct = (id, updatedData) => {
    setCmsProducts(cmsProducts.map(prod => 
      prod.id === id ? { ...prod, ...updatedData } : prod
    ));
    console.log("✏️ CMS Product updated:", id);
  };

  const deleteCmsProduct = (id) => {
    setCmsProducts(cmsProducts.filter(prod => prod.id !== id));
    console.log("🗑️ CMS Product deleted:", id);
  };

  // Get active offers for a product/category
  const getActiveOffers = (targetType, targetId) => {
    const now = new Date();
    return offers.filter(offer => {
      if (!offer.isActive) return false;
      
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);
      if (now < startDate || now > endDate) return false;

      if (offer.target === "sitewide") return true;
      if (offer.target === targetType && offer.targetId === targetId) return true;
      
      return false;
    });
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (price, productId, categoryId) => {
    const productOffers = getActiveOffers("product", productId);
    const categoryOffers = getActiveOffers("category", categoryId);
    const sitewideOffers = getActiveOffers("sitewide", null);

    const allOffers = [...productOffers, ...categoryOffers, ...sitewideOffers];
    
    if (allOffers.length === 0) return price;

    // Apply best discount
    let bestPrice = price;
    allOffers.forEach(offer => {
      if (offer.discountType === "percentage") {
        const discountedPrice = price * (1 - offer.discountValue / 100);
        if (discountedPrice < bestPrice) bestPrice = discountedPrice;
      } else if (offer.discountType === "fixed") {
        const discountedPrice = price - offer.discountValue;
        if (discountedPrice < bestPrice && discountedPrice > 0) bestPrice = discountedPrice;
      }
    });

    return bestPrice.toFixed(2);
  };

  const value = {
    // Hero
    heroSlides,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    
    // Categories
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    
    // Offers
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    getActiveOffers,
    calculateDiscountedPrice,
    
    // Pricing
    pricingRules,
    updatePricingRules,
    calculatePrice,
    
    // CMS Products
    cmsProducts,
    addCmsProduct,
    updateCmsProduct,
    deleteCmsProduct
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
};
