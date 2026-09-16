import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import PromoBanners from '../components/home/PromoBanners';
import DealSection from '../components/home/DealSection';
import FeaturesSection from '../components/home/FeaturesSection';
import AboutSection from '../components/home/AboutSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import CommentsSection from '../components/home/CommentsSection';
import Footer from '../components/layout/Footer';
import RecommendationRow from '../components/shop/RecommendationRow';
import { useCart } from '../context/CartContext';
import api, { getStoredUser } from '../utils/api';
import './Home.css';

const defaultHomeConfig = {
  hero: {
    title: 'FRESHER. CLEANER. BETTER.',
    subtitle: 'Carefully selected fresh produce, every day.',
    backgroundImage: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    secondaryText: 'Explore Produce',
    secondaryLink: '/shop',
    theme: 'emerald',
    stats: [
      { label: 'Happy Customers', value: '20k+' },
      { label: 'Fresh Products', value: '500+' },
      { label: 'Fast Delivery', value: '24h' }
    ]
  },
  featuredCategories: [],
  promos: {
    enabled: true,
    boxCard: {
      badge: 'Hot Offer',
      discountTag: 'Save 25%',
      title: 'Weekly Organic Harvest Box',
      description: 'Freshly harvested local vegetables & berries',
      ctaText: 'Shop Box',
      ctaLink: '/shop?category=Organic',
      emoji: '🥗'
    },
    couponCard: {
      badge: 'New Customer',
      discountTag: '$10 OFF',
      title: 'Use Code at Checkout',
      description: 'Valid on your first order over $35',
      code: 'FRESH30',
      emoji: '🎟️'
    }
  },
  bundle: {
    enabled: true,
    title: 'Organic Summer Berry Bundle',
    description: 'Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking.',
    price: 29.99,
    originalPrice: 45.00,
    saveAmount: 'Save $15.01',
    claimedPercentage: 84,
    stockLeftText: 'Only 16 bundles left',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80',
    link: '/shop?discount=true'
  },
  story: {
    enabled: true,
    title: 'Cultivating Goodness',
    subtitle: 'Fresh from the farm, straight to your table.',
    description: 'Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen. We believe everyone deserves authentic, chemical-free produce.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    yearsOfService: '15+'
  },
  features: {
    enabled: true,
    pillText: 'Key Benefits',
    title: 'Why Choose Us',
    items: [
      { title: '100% Organic', description: 'Certified organic produce sourced directly from sustainable local farms.', icon: 'Leaf', color: '#2ecc71' },
      { title: 'Fast Delivery', description: 'Same-day delivery for orders placed before 2 PM. Freshness guaranteed.', icon: 'Truck', color: '#3498db' },
      { title: 'Quality Check', description: 'Every item is hand-picked and quality checked before it reaches your door.', icon: 'ShieldCheck', color: '#9b59b6' },
      { title: '24/7 Support', description: 'Our dedicated support team is always here to help you with your needs.', icon: 'Clock', color: '#e67e22' }
    ]
  },
  newsletter: {
    enabled: true,
    badge: 'Join The Club',
    title: 'Get Fresh Updates',
    description: 'Subscribe to our newsletter and get 10% off your first order. Plus, receive weekly healthy recipes and exclusive deals.'
  },
  seasonal: {
    title: 'Seasonal Favorites',
    subtitle: 'Picked at the peak of flavor this season',
    products: [],
  },
};

const Home = () => {
  const { hash } = useLocation();
  const { cartItems } = useCart();
  const [user, setUser] = useState(null);
  const [homeConfig, setHomeConfig] = useState(defaultHomeConfig);
  const [lastViewed, setLastViewed] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    try {
      const cachedHomeConfig = localStorage.getItem('homeConfigCache');
      if (cachedHomeConfig) {
        const parsed = JSON.parse(cachedHomeConfig);
        setHomeConfig(parsed);
      }
    } catch (e) {
      console.error('Failed to read cached home config', e);
    }

    // Get last viewed product
    try {
      const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
      if (history.length > 0) {
        setLastViewed(history[0]);
      }
    } catch (e) {
      console.error(e);
    }

    const fetchHomeConfig = async () => {
      try {
        const response = await api.get('/home-config');
        const nextConfig = response?.data || defaultHomeConfig;
        setHomeConfig(nextConfig);
        localStorage.setItem('homeConfigCache', JSON.stringify(nextConfig));
      } catch (error) {
        console.error('Failed to load home config', error);
        setHomeConfig((prev) => prev || defaultHomeConfig);
      }
    };
    fetchHomeConfig();

    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  const activeHomeConfig = homeConfig || defaultHomeConfig;

  return (
    <div className="home-page">
      <Navbar />

      {/* 1. Hero */}
      <Hero data={activeHomeConfig.hero} />
      
      {/* 2. Categories Bar / Mobile App Category Rail */}
      <CategoryMarquee categories={activeHomeConfig.featuredCategories} />
      
      {/* 3. Promo Micro Banners (Seasonal Box & 1-Tap Coupon) */}
      {activeHomeConfig.promos?.enabled !== false && (
        <PromoBanners data={activeHomeConfig.promos} />
      )}

      {/* 4. Recommendation Rows: Trending by ML Engine & Seasonal by Admin */}
      <div className="container home-recommendations-container">
        {/* 1. Trending by Backend Engine */}
        <RecommendationRow 
          title="Trending Right Now" 
          type="popular" 
          limit={8}
        />

        {/* 2. Seasonal Fruits / Harvest Curated by Admin */}
        <RecommendationRow 
          title={activeHomeConfig.seasonal?.title || "Seasonal Harvest Picks"} 
          type="manual" 
          items={activeHomeConfig.seasonal?.products || []} 
          limit={8}
        />

        {/* 3. Complete Your Basket (When items in cart) */}
        {cartItems.length > 0 && (
          <RecommendationRow 
            title="Complete Your Fresh Basket" 
            type="cart" 
            cartItems={cartItems}
          />
        )}
      </div>

      {/* 5. Flash Deal / Bundle Section */}
      {activeHomeConfig.bundle?.enabled !== false && (
        <DealSection data={activeHomeConfig.bundle} />
      )}

      {/* 6. Key Value Propositions / Features */}
      {activeHomeConfig.features?.enabled !== false && (
        <FeaturesSection data={activeHomeConfig.features} />
      )}

      {/* 7. Brand Story & Heritage */}
      {activeHomeConfig.story?.enabled !== false && (
        <AboutSection data={activeHomeConfig.story} />
      )}

      {/* 8. Customer Testimonials */}
      <TestimonialsSection />

      {/* 9. Newsletter Club */}
      {activeHomeConfig.newsletter?.enabled !== false && (
        <NewsletterSection data={activeHomeConfig.newsletter} />
      )}

      {/* 10. Community Discussion */}
      <CommentsSection />

      {/* 11. Modern Footer */}
      <Footer />
    </div>
  );
};

export default Home;
