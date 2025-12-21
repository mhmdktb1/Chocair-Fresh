import mongoose from 'mongoose';

const homeSchema = mongoose.Schema({
  hero: {
    title: { type: String, default: "Nature's Best Delivered to You" },
    subtitle: { type: String, default: "Experience the freshest fruits, vegetables, and herbs sourced directly from local farmers." },
    backgroundImage: { type: String, default: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
    stats: [
      { label: { type: String, default: "Happy Customers" }, value: { type: String, default: "20k+" } },
      { label: { type: String, default: "Fresh Products" }, value: { type: String, default: "500+" } },
      { label: { type: String, default: "Fast Delivery" }, value: { type: String, default: "24h" } }
    ]
  },
  featuredCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  bundle: {
    title: { type: String, default: "Organic Summer Berry Bundle" },
    description: { type: String, default: "Get a curated selection of our freshest strawberries, blueberries, and raspberries." },
    price: { type: Number, default: 29.99 },
    image: { type: String, default: "" }
  },
  story: {
    title: { type: String, default: "Cultivating Goodness" },
    subtitle: { type: String, default: "Fresh from the farm, straight to your table." },
    description: { type: String, default: "Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen." },
    image: { type: String, default: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
  }
}, { timestamps: true });

const HomeConfig = mongoose.model('HomeConfig', homeSchema);
export default HomeConfig;
