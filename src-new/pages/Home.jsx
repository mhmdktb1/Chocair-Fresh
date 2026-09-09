import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import PromoBanners from '../components/home/PromoBanners';
import NewsletterSection from '../components/home/NewsletterSection';
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

      {/* 4. Recommendation: Top Seller and Trending */}
      <div className="container home-recommendations-container">
        {/* For You Section - Personalized for User, Trending for Guest */}
        <RecommendationRow 
          title={user && user.name ? `Recommended for You, ${user.name.split(' ')[0]}` : "Recommended for You"} 
          type={user ? "personalized" : "new"} 
        />

        {cartItems.length > 0 && (
          <RecommendationRow 
            title="Frequently Bought Together" 
            type="cart" 
            cartItems={cartItems}
          />
        )}

        {lastViewed && (
          <RecommendationRow 
            title={`Similar to ${lastViewed.name}`} 
            type="related" 
            productId={lastViewed._id}
          />
        )}

        <RecommendationRow title="Featured Products" type="popular" />
        
        {activeHomeConfig.seasonal?.products?.length > 0 && (
          <RecommendationRow 
            title={activeHomeConfig.seasonal.title || "Seasonal Favorites"} 
            type="manual" 
            items={activeHomeConfig.seasonal.products} 
          />
        )}
      </div>

      {/* 5. Get Fresh Update */}
      <NewsletterSection />

      {/* 6. Community Discussion */}
      <CommentsSection />

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default Home;
