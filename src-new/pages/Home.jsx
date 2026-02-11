import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import FeaturesSection from '../components/home/FeaturesSection';
import DealSection from '../components/home/DealSection';
import NewsletterSection from '../components/home/NewsletterSection';
import CommentsSection from '../components/home/CommentsSection';
import AboutSection from '../components/home/AboutSection';
import Footer from '../components/layout/Footer';
import RecommendationRow from '../components/shop/RecommendationRow';
import { useCart } from '../context/CartContext';
import api, { getStoredUser } from '../utils/api';

const Home = () => {
  const { hash } = useLocation();
  const { cartItems } = useCart();
  const [user, setUser] = useState(null);
  const [homeConfig, setHomeConfig] = useState(null);
  const [lastViewed, setLastViewed] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

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
        setHomeConfig(response.data);
      } catch (error) {
        console.error("Failed to load home config", error);
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

  if (!homeConfig) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="home-page">
      <Navbar />
      
      {/* 1. Hero */}
      <Hero data={homeConfig.hero} />
      
      {/* 2. Categories Bar */}
      <CategoryMarquee />
      
      {/* 3. Recommendation: Top Seller and Trending */}
      <div className="container" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
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
        
        {homeConfig.seasonal?.products?.length > 0 && (
          <RecommendationRow 
            title={homeConfig.seasonal.title || "Seasonal Favorites"} 
            type="manual" 
            items={homeConfig.seasonal.products} 
          />
        )}
      </div>

      {/* 4. Limited Time Offer */}
      <DealSection data={homeConfig.bundle} />

      {/* 5. Cultivating Goodness and Our Story */}
      <AboutSection data={homeConfig.story} />

      {/* 6. Why Choose Us */}
      <FeaturesSection />

      {/* 7. Get Fresh Update */}
      <NewsletterSection />

      {/* 8. Community Discussion */}
      <CommentsSection />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default Home;
