import React from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import './AboutSection.css';

const AboutSection = ({ data }) => {
  const {
    title = "Cultivating Goodness",
    subtitle = "Fresh from the farm, straight to your table.",
    description = "Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen. We believe everyone deserves authentic, chemical-free produce.",
    image = "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  } = data || {};

  // Helper to parse title for highlighting
  const renderTitle = (text) => {
    if (!text) return null;
    const parts = text.split('*');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} className="highlight">{part}</span>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <section id="about" className="home-about-section">
      
      {/* Hero Banner - Restored as requested */}
      <div className="about-hero-banner">
        <div className="about-hero-content">
          <h2 className="about-hero-title">{renderTitle(title)}</h2>
          <p className="about-hero-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="about-container">
        {/* Content Grid */}
        <div className="about-content-grid">
          
          {/* Image Side - New Image */}
          <div className="about-image-wrapper">
            <img 
              src={image} 
              alt="About Us" 
              className="about-main-img"
            />
            <div className="about-stat-badge">
              <span className="stat-number">15+</span>
              <span className="stat-label">Years of Service</span>
            </div>
          </div>
          
          {/* Text Side - Shortened Text */}
          <div className="about-text-content">
            <h3 className="story-title">Our Story</h3>
            <p className="story-paragraph">
              {description}
            </p>
            
            <div className="about-cta">
              <Button variant="primary" className="flex items-center gap-2">
                Read Full Story <ArrowRight size={18} />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
