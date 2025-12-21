import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import CategoryMarquee from '../components/home/CategoryMarquee';
import FeaturesSection from '../components/home/FeaturesSection';
import DealSection from '../components/home/DealSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import NewsletterSection from '../components/home/NewsletterSection';
import AboutSection from '../components/home/AboutSection';
import ContactSection from '../components/home/ContactSection';
import RecommendationRow from '../components/shop/RecommendationRow';
import api, { getStoredUser } from '../utils/api';

const Home = () => {
  const { hash } = useLocation();
  const [user, setUser] = useState(null);
  const [homeConfig, setHomeConfig] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

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
        {user && (
          <RecommendationRow 
            title={`Picked For You, ${user.name?.split(' ')[0] || 'Guest'}`} 
            type="personalized" 
          />
        )}
        <RecommendationRow title="Trending Now" type="new" />
        <RecommendationRow title="Best Sellers" type="popular" />
      </div>

      {/* 4. Limited Time Offer */}
      <DealSection data={homeConfig.bundle} />

      {/* 5. Cultivating Goodness and Our Story */}
      <AboutSection data={homeConfig.story} />

      {/* 6. Why Choose Us */}
      <FeaturesSection />

      {/* 7. Get Fresh Update */}
      <NewsletterSection />

      {/* 8. What Customer Says */}
      <TestimonialsSection />

      {/* 9. Get In Touch */}
      <ContactSection />
    </div>
  );
};

export default Home;
