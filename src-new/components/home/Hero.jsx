import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { parseHighlightedText } from '../../utils/textUtils';
import './Hero.css';

const Hero = ({ data }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    // Detect mobile on resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only enable parallax on desktop
    if (isMobile) return;

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
  }, [isMobile]);

  return (
    <section className="hero" ref={heroRef} role="region" aria-label="Hero banner">
      <div className="hero-bg-gradient"></div>
      
      {/* Parallax Floating Elements - Hidden on Mobile */}
      {!isMobile && (
        <div className="floating-elements">
          <div 
            className="float-item leaf-1"
            style={{ transform: `translate(${offset.x * -20}px, ${offset.y * -20}px) rotate(${offset.x * 10}deg)` }}
            aria-hidden="true"
          >🍃</div>
          <div 
            className="float-item leaf-2"
            style={{ transform: `translate(${offset.x * 30}px, ${offset.y * 30}px) rotate(${offset.y * -10}deg)` }}
            aria-hidden="true"
          >🌿</div>
          <div 
            className="float-item leaf-3"
            style={{ transform: `translate(${offset.x * 25}px, ${offset.y * -25}px) rotate(${offset.x * -15}deg)` }}
            aria-hidden="true"
          >🍃</div>
          <div 
            className="float-item berry-1"
            style={{ transform: `translate(${offset.x * -40}px, ${offset.y * 20}px)` }}
            aria-hidden="true"
          >🍓</div>
          <div 
            className="float-item berry-2"
            style={{ transform: `translate(${offset.x * -35}px, ${offset.y * 35}px)` }}
            aria-hidden="true"
          >🍇</div>
          <div 
            className="float-item berry-3"
            style={{ transform: `translate(${offset.x * 45}px, ${offset.y * -10}px)` }}
            aria-hidden="true"
          >🍊</div>
        </div>
      )}

      <div className="container hero-container">
        <div className="hero-content" style={!isMobile ? { transform: `translate(${offset.x * -10}px, ${offset.y * -10}px)` } : {}}>
          <div className="hero-badge-wrapper">
            <span className="hero-badge" aria-label="100% Organic and Fresh">
              <span className="pulse-dot" aria-hidden="true"></span>
              100% Organic & Fresh
            </span>
          </div>
          
          <h1 className="hero-title">
            {parseHighlightedText(title, 'text-gradient')}
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
          
          <div className="hero-stats" role="list">
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                <div className="stat-item" role="listitem">
                  <span className="stat-number">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
                {index < stats.length - 1 && <div className="stat-divider" aria-hidden="true"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="hero-image-wrapper">
          <div className="hero-circle-bg" aria-hidden="true"></div>
          <img 
            src={backgroundImage} 
            alt="Fresh organic produce - Chocair Fresh" 
            className="hero-img main-img"
            loading="lazy"
            style={!isMobile ? { transform: `translate(${offset.x * 15}px, ${offset.y * 15}px) scale(1.05)` } : {}}
          />
          
          {/* Floating Cards - Hidden on Mobile */}
          {!isMobile && (
            <>
              <div 
                className="hero-card card-fresh"
                style={{ transform: `translate(${offset.x * 25}px, ${offset.y * -15}px)` }}
              >
                <div className="card-icon-box" aria-hidden="true">🍓</div>
                <div className="card-text">
                  <span className="card-title">Fresh Picked</span>
                  <span className="card-sub">Just Arrived</span>
                </div>
              </div>

              <div 
                className="hero-card card-delivery"
                style={{ transform: `translate(${offset.x * -20}px, ${offset.y * 25}px)` }}
              >
                <div className="card-icon-box" aria-hidden="true">🚚</div>
                <div className="card-text">
                  <span className="card-title">Free Shipping</span>
                  <span className="card-sub">On orders $50+</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="scroll-indicator" aria-hidden="true">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <div className="arrow-scroll">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
