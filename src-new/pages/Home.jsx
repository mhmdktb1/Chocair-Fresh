import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import PromoBanners from '../components/home/PromoBanners';
import CommentsSection from '../components/home/CommentsSection';
import Footer from '../components/layout/Footer';
import RecommendationRow from '../components/shop/RecommendationRow';
import { useCart } from '../context/CartContext';
import api, { getStoredUser } from '../utils/api';
import './Home.css';

const defaultHomeConfig = {
  hero: {
    title: 'Welcome to Chocair Fresh',
    subtitle: 'Fresh, Organic, and Delicious',
    backgroundImage: '/assets/images/hero-bg.jpg',
  },
  featuredCategories: [],
  bundle: {
    title: 'Limited Time Offer',
    products: [],
  },
  story: {
    title: 'Our Story',
    content: 'We are passionate about providing fresh organic products.',
  },
  seasonal: {
    title: 'Seasonal Favorites',
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
      <CategoryMarquee />
      
      {/* 3. Promo Micro Banners (Seasonal Box & 1-Tap Coupon) */}
      <PromoBanners />

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

      {/* 5. Community Discussion */}
      <CommentsSection />

      {/* 6. Modern Footer */}
      <Footer />
    </div>
  );
};

export default Home;
