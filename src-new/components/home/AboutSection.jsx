import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import { parseHighlightedText } from '../../utils/textUtils';
import './AboutSection.css';

const AboutSection = ({ data }) => {
  const navigate = useNavigate();
  const {
    title = "Cultivating Goodness",
    subtitle = "Fresh from the farm, straight to your table.",
    description = "Chocair Fresh started with a simple mission: bridging the gap between local farmers and your kitchen. We believe everyone deserves authentic, chemical-free produce.",
    image = "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    yearsOfService = "15+"
  } = data || {};

  return (
    <section id="about" className="home-about-section">
      
      {/* Hero Banner */}
      <div className="about-hero-banner">
        <div className="about-hero-content">
          <h2 className="about-hero-title">{parseHighlightedText(title)}</h2>
          <p className="about-hero-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="about-container">
        {/* Content Grid */}
        <div className="about-content-grid">
          
          {/* Image Side */}
          <div className="about-image-wrapper">
            <img 
              src={image || "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"} 
              alt={title || "About Us"} 
              className="about-main-img"
              loading="lazy"
            />
            <div className="about-stat-badge">
              <span className="stat-number">{yearsOfService}</span>
              <span className="stat-label">Years of Service</span>
            </div>
          </div>
          
          {/* Text Side */}
          <div className="about-text-content">
            <h3 className="story-title">Our Story</h3>
            <p className="story-paragraph">
              {description}
            </p>
            
            <div className="about-cta">
              <Button variant="primary" onClick={() => navigate('/about')} className="flex items-center gap-2">
                <span>Read Full Story</span>
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
