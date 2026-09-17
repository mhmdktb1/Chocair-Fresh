import mongoose from 'mongoose';

const homeSchema = mongoose.Schema({
  hero: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "FRESHER. CLEANER. BETTER." },
    subtitle: { type: String, default: "Carefully selected fresh produce, every day." },
    backgroundImage: { type: String, default: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80" },
    badge: { type: String, default: "" },
    badgeIcon: { type: String, default: "" },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/shop" },
    secondaryText: { type: String, default: "Explore Produce" },
    secondaryLink: { type: String, default: "/shop" },
    accentTag: { type: String, default: "" },
    ratingText: { type: String, default: "" },
    theme: { type: String, default: "emerald" },
    stats: [
      { label: { type: String, default: "Happy Customers" }, value: { type: String, default: "20k+" } },
      { label: { type: String, default: "Fresh Products" }, value: { type: String, default: "500+" } },
      { label: { type: String, default: "Fast Delivery" }, value: { type: String, default: "24h" } }
    ],
    slides: [
      {
        title: { type: String, default: "FRESHER. CLEANER. BETTER." },
        subtitle: { type: String, default: "Carefully selected fresh produce, every day." },
        ctaText: { type: String, default: "Shop Now" },
        ctaLink: { type: String, default: "/shop" },
        secondaryText: { type: String, default: "Explore Produce" },
        secondaryLink: { type: String, default: "/shop" },
        image: { type: String, default: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80" },
        theme: { type: String, default: "emerald" }
      }
    ]
  },
  categoryMarquee: {
    enabled: { type: Boolean, default: true }
  },
  featuredCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  promos: {
    enabled: { type: Boolean, default: true },
    boxCard: {
      badge: { type: String, default: "Hot Offer" },
      discountTag: { type: String, default: "Save 25%" },
      title: { type: String, default: "Weekly Organic Harvest Box" },
      description: { type: String, default: "Freshly harvested local vegetables & berries" },
      ctaText: { type: String, default: "Shop Box" },
      ctaLink: { type: String, default: "/shop?category=Organic" },
      emoji: { type: String, default: "🥗" }
    },
    couponCard: {
      badge: { type: String, default: "New Customer" },
      discountTag: { type: String, default: "$10 OFF" },
      title: { type: String, default: "Use Code at Checkout" },
      description: { type: String, default: "Valid on your first order over $35" },
      code: { type: String, default: "FRESH30" },
      emoji: { type: String, default: "🎟️" }
    }
  },
  trending: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Trending Right Now" }
  },
  seasonal: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Seasonal Favorites" },
    subtitle: { type: String, default: "Picked at the peak of flavor this season" },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  bundle: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Organic Summer Berry Bundle" },
    description: { type: String, default: "Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking." },
    price: { type: Number, default: 29.99 },
    originalPrice: { type: Number, default: 45.00 },
    saveAmount: { type: String, default: "Save $15.01" },
    claimedPercentage: { type: Number, default: 84 },
    stockLeftText: { type: String, default: "Only 16 bundles left" },
    image: { type: String, default: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80" },
    link: { type: String, default: "/shop?discount=true" }
  },
  story: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Cultivating Goodness" },
    subtitle: { type: String, default: "Fresh from the farm, straight to your table." },
    description: { type: String, default: "Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen. We believe everyone deserves authentic, chemical-free produce." },
    image: { type: String, default: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
    yearsOfService: { type: String, default: "15+" }
  },
  features: {
    enabled: { type: Boolean, default: true },
    pillText: { type: String, default: "Key Benefits" },
    title: { type: String, default: "Why Choose Us" },
    items: [
      {
        title: { type: String, default: "100% Organic" },
        description: { type: String, default: "Certified organic produce sourced directly from sustainable local farms." },
        icon: { type: String, default: "Leaf" },
        color: { type: String, default: "#2ecc71" }
      },
      {
        title: { type: String, default: "Fast Delivery" },
        description: { type: String, default: "Same-day delivery for orders placed before 2 PM. Freshness guaranteed." },
        icon: { type: String, default: "Truck" },
        color: { type: String, default: "#3498db" }
      },
      {
        title: { type: String, default: "Quality Check" },
        description: { type: String, default: "Every item is hand-picked and quality checked before it reaches your door." },
        icon: { type: String, default: "ShieldCheck" },
        color: { type: String, default: "#9b59b6" }
      },
      {
        title: { type: String, default: "24/7 Support" },
        description: { type: String, default: "Our dedicated support team is always here to help you with your needs." },
        icon: { type: String, default: "Clock" },
        color: { type: String, default: "#e67e22" }
      }
    ]
  },
  testimonials: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "What Our Customers Say" }
  },
  newsletter: {
    enabled: { type: Boolean, default: true },
    badge: { type: String, default: "Join The Club" },
    title: { type: String, default: "Get Fresh Updates" },
    description: { type: String, default: "Subscribe to our newsletter and get 10% off your first order. Plus, receive weekly healthy recipes and exclusive deals." }
  },
  comments: {
    enabled: { type: Boolean, default: true }
  },
  customSections: [
    {
      id: { type: String },
      enabled: { type: Boolean, default: true },
      badge: { type: String, default: "Featured" },
      title: { type: String, default: "Special Promotion" },
      subtitle: { type: String, default: "Discover exclusive offers and seasonal picks" },
      image: { type: String, default: "" },
      ctaText: { type: String, default: "Explore Now" },
      ctaLink: { type: String, default: "/shop" },
      theme: { type: String, default: "emerald" }
    }
  ]
}, { timestamps: true });

const HomeConfig = mongoose.model('HomeConfig', homeSchema);
export default HomeConfig;
