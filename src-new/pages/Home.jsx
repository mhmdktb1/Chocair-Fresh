import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import PromoBanners from '../components/home/PromoBanners';
import DealSection from '../components/home/DealSection';
import FeaturesSection from '../components/home/FeaturesSection';
import AboutSection from '../components/home/AboutSection';
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
    title: 'Our Story',
    lead: 'We started with a simple idea: fresh produce should feel better from the moment you order it to the moment it reaches your kitchen.',
    description: 'At Chocair Fresh, we carefully select, check, and pack every order before it leaves us. We focus on the little details — choosing clean, good-looking pieces and packing them neatly so your order arrives the way you’d expect it to.'
  },
  features: {
    enabled: true,
    title: 'What We Offer',
    items: [
      { title: 'Carefully Selected', description: 'Fresh, quality produce carefully chosen for every order.', icon: 'Sparkles' },
      { title: 'Checked & Packed', description: 'Every item is checked and neatly packed before it leaves us.', icon: 'PackageCheck' },
      { title: 'Fast Delivery', description: 'Your order arrives quickly, fresh and ready for your kitchen.', icon: 'Truck' },
      { title: 'Quality Guarantee', description: 'Not satisfied with something? We’ll make it right.', icon: 'ShieldCheck' }
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

      {/* 4. Recommendation Rows: For You by ML Engine & Seasonal by Admin */}
      <div className="container home-recommendations-container">
        {/* 1. Personalized Recommendations (For You) by Backend Engine */}
        <RecommendationRow 
          title="For You" 
          type="personalized" 
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

      {/* 8. Newsletter Club */}
      {activeHomeConfig.newsletter?.enabled !== false && (
        <NewsletterSection data={activeHomeConfig.newsletter} />
      )}

      {/* 9. Customer Reviews & Community Discussion */}
      <CommentsSection />

      {/* 11. Modern Footer */}
      <Footer />
    </div>
  );
};

export default Home;
