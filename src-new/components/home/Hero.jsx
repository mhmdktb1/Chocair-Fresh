import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-bg-shape"></div>
      <div className="container hero-container">
        <div className="hero-content">
          <span className="hero-badge">100% Organic & Fresh</span>
          <h1 className="hero-title">
            Nature's Best <br />
            <span className="text-gradient">Delivered to You</span>
          </h1>
          <p className="hero-subtitle">
            Experience the freshest fruits, vegetables, and herbs sourced directly from local farmers. Healthy living starts here.
          </p>
          <div className="hero-buttons">
            <Button variant="primary" size="large" onClick={() => navigate('/shop')}>Shop Now</Button>
            <Button variant="secondary" size="large">Learn More</Button>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">20k+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Products</span>
            </div>
          </div>
        </div>
        
        <div className="hero-image-wrapper">
          <div className="hero-circle"></div>
          <img 
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Fresh Fruits" 
            className="hero-img floating"
          />
          
          <div className="hero-card card-1 floating-delayed">
            <span className="card-icon">🍓</span>
            <div className="card-text">
              <span className="card-title">Fresh Strawberries</span>
              <span className="card-sub">Just Arrived</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
