import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import './Hero.css';

const Hero = ({ data }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Default values if data is missing (e.g. during loading or error)
  const { 
    title = "Nature's Best Delivered to You", 
    subtitle = "Experience the freshest fruits, vegetables, and herbs sourced directly from local farmers.", 
    backgroundImage = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    stats = [
      { label: "Happy Customers", value: "20k+" },
      { label: "Fresh Products", value: "500+" },
      { label: "Fast Delivery", value: "24h" }
    ]
  } = data || {};

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate mouse position relative to center (range -1 to 1)
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Helper to parse title for highlighting
  const renderTitle = (text) => {
    if (!text) return null;
    const parts = text.split('*');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} className="text-gradient">{part}</span>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-bg-gradient"></div>
      
      {/* Parallax Floating Elements */}
      <div className="floating-elements">
        <div 
          className="float-item leaf-1"
          style={{ transform: `translate(${offset.x * -20}px, ${offset.y * -20}px) rotate(${offset.x * 10}deg)` }}
        >🍃</div>
        <div 
          className="float-item leaf-2"
          style={{ transform: `translate(${offset.x * 30}px, ${offset.y * 30}px) rotate(${offset.y * -10}deg)` }}
        >🌿</div>
        <div 
          className="float-item berry-1"
          style={{ transform: `translate(${offset.x * -40}px, ${offset.y * 20}px)` }}
        >🍓</div>
      </div>

      <div className="container hero-container">
        <div className="hero-content" style={{ transform: `translate(${offset.x * -10}px, ${offset.y * -10}px)` }}>
          <div className="hero-badge-wrapper">
            <span className="hero-badge">
              <span className="pulse-dot"></span>
              100% Organic & Fresh
            </span>
          </div>
          
          <h1 className="hero-title">
            {renderTitle(title)}
          </h1>
          
          <p className="hero-subtitle">
            {subtitle}
          </p>
          
          <div className="hero-buttons">
            <Button variant="primary" size="large" onClick={() => navigate('/shop')} className="btn-glow">
              Shop Now
            </Button>
            <Button variant="outline" size="large" className="btn-glass">
              View Process
            </Button>
          </div>
          
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                <div className="stat-item">
                  <span className="stat-number">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
                {index < stats.length - 1 && <div className="stat-divider"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="hero-image-wrapper">
          <div className="hero-circle-bg"></div>
          <img 
            src={backgroundImage} 
            alt="Hero" 
            className="hero-img main-img"
            style={{ transform: `translate(${offset.x * 15}px, ${offset.y * 15}px) scale(1.05)` }}
          />
          
          {/* Floating Cards */}
          <div 
            className="hero-card card-fresh"
            style={{ transform: `translate(${offset.x * 25}px, ${offset.y * -15}px)` }}
          >
            <div className="card-icon-box">🍓</div>
            <div className="card-text">
              <span className="card-title">Fresh Picked</span>
              <span className="card-sub">Just Arrived</span>
            </div>
          </div>

          <div 
            className="hero-card card-delivery"
            style={{ transform: `translate(${offset.x * -20}px, ${offset.y * 25}px)` }}
          >
            <div className="card-icon-box">🚚</div>
            <div className="card-text">
              <span className="card-title">Free Shipping</span>
              <span className="card-sub">On orders $50+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
