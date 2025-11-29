import { createContext, useContext, useState, useEffect } from "react";

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
        image: "/assets/images/categories/fruits.jpg",
        isVisible: true,
        order: 1,
        featured: true
      },
      {
        id: 2,
        name: "Vegetables",
        slug: "vegetables",
        description: "Organic vegetables straight from the farm",
        image: "/assets/images/categories/vegetables.jpg",
        isVisible: true,
        order: 2,
        featured: true
      },
      {
        id: 3,
        name: "Herbs",
        slug: "herbs",
        description: "Fresh herbs and spices for your kitchen",
        image: "/assets/images/categories/herbs.jpg",
        isVisible: true,
        order: 3,
        featured: false
      },
      {
        id: 4,
        name: "Dairy",
        slug: "dairy",
        description: "Fresh dairy products and cheese",
        image: "/assets/images/categories/dairy.jpg",
        isVisible: true,
        order: 4,
        featured: true
      },
      {
        id: 5,
        name: "Bakery",
        slug: "bakery",
        description: "Freshly baked bread and pastries",
        image: "/assets/images/categories/bakery.jpg",
        isVisible: true,
        order: 5,
        featured: false
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

  // Pricing Rules & Logic
  const [pricingRules, setPricingRules] = useState(() => {
    const saved = localStorage.getItem("cms_pricing_rules");
    return saved ? JSON.parse(saved) : {
      defaultUnit: "kg",
      availableUnits: [
        { value: "kg", label: "Kilogram (kg)", base: 1 },
        { value: "500g", label: "500 grams", base: 0.5 },
        { value: "250g", label: "250 grams", base: 0.25 },
        { value: "200g", label: "200 grams", base: 0.2 },
        { value: "pcs", label: "Per Piece", base: null },
        { value: "bunch", label: "Per Bunch", base: null },
        { value: "pack", label: "Per Pack", base: null },
        { value: "jar", label: "Per Jar", base: null },
        { value: "bottle", label: "Per Bottle", base: null }
      ],
      autoCalculate: true
    };
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

    const baseUnitData = pricingRules.availableUnits.find(u => u.value === basePriceUnit);
    const targetUnitData = pricingRules.availableUnits.find(u => u.value === targetUnit);

    if (!baseUnitData || !targetUnitData || !baseUnitData.base || !targetUnitData.base) {
      return basePrice; // Can't calculate for non-weight units
    }

    // Calculate price per kg, then convert to target unit
    const pricePerKg = basePrice / baseUnitData.base;
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
