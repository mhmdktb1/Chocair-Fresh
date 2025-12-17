import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/AboutSection';
import ContactSection from '../components/home/ContactSection';

const Home = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <AboutSection />
      <ContactSection />
    </div>
  );
};

export default Home;
