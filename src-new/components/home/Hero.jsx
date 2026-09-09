import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, ShieldCheck, HeartHandshake, Leaf, Star, CheckCircle2 } from 'lucide-react';
import './Hero.css';

const Hero = ({ data }) => {
  const navigate = useNavigate();

  const title = data?.title || "Pure Earth. Honest Harvest.";
  const subtitle = data?.subtitle || "Experience the unadulterated freshness of heirloom fruits, crisp vegetables, and artisanal greens delivered from local sustainable soil directly to your home.";
  const image = data?.backgroundImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

  return (
    <section className="editorial-hero-section" aria-label="Farm to Table Showcase">
      {/* Background Soft Glows */}
      <div className="editorial-glow-top" aria-hidden="true" />
      <div className="editorial-glow-bottom" aria-hidden="true" />

      <div className="editorial-hero-container">
        
        {/* Left Column: Editorial Typography & Actions */}
        <div className="editorial-content-side">
          
          <div className="editorial-badge">
            <span className="badge-sprout"><Leaf size={14} /></span>
            <span className="badge-text">100% Certified Sustainable & Local</span>
          </div>

          <h1 className="editorial-title">
            Pure Earth.<br />
            <span className="editorial-title-highlight">Honest Harvest.</span>
          </h1>

          <p className="editorial-description">
            {subtitle}
          </p>

          <div className="editorial-actions">
            <button 
              className="editorial-primary-btn"
              onClick={() => navigate('/shop')}
              type="button"
            >
              <span>Explore Today's Harvest</span>
              <ArrowRight size={18} className="editorial-arrow" />
            </button>

            <button 
              className="editorial-secondary-btn"
              onClick={() => navigate('/#about')}
              type="button"
            >
              <span>Our Farm Story</span>
            </button>
          </div>

          {/* Editorial Trust Highlights */}
          <div className="editorial-features-strip">
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Zero Pesticides</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Harvested Same-Day</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Eco Packaging</span>
            </div>
          </div>

        </div>

        {/* Right Column: Layered Glassmorphic Showcase */}
        <div className="editorial-showcase-side">
          
          <div className="editorial-frame">
            <div className="editorial-frame-overlay" />
            <img 
              src={image} 
              alt="Fresh organic harvest" 
              className="editorial-frame-img"
              loading="eager"
            />
            
            {/* Top Floating Glass Badge */}
            <div className="editorial-glass-pill pill-top-left">
              <Star size={14} className="star-icon" />
              <span>4.9 / 5.0 Rated by 2,500+ Families</span>
            </div>

            {/* Bottom Floating Glass Card */}
            <div className="editorial-glass-card card-bottom-right">
              <div className="glass-icon-box">
                <Award size={20} />
              </div>
              <div className="glass-card-info">
                <strong>Handpicked Daily</strong>
                <span>From local trusted farmers</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;
