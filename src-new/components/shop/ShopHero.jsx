import React, { useEffect, useRef, useState } from 'react';
import './ShopHero.css';

const ShopHero = ({ 
  title = "Fresh Market", 
  subtitle = "Discover our premium selection of organic fruits and vegetables",
  children
}) => {
  const heroRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="shop-hero" ref={heroRef}>
      <div className="shop-hero-bg-gradient"></div>
      
      {/* Floating Elements (Same as Home) */}
      <div className="shop-floating-elements">
        <div 
          className="shop-float-item leaf-1"
          style={{ transform: `translate(${offset.x * -15}px, ${offset.y * -15}px) rotate(${offset.x * 5}deg)` }}
        >🍃</div>
        <div 
          className="shop-float-item leaf-2"
          style={{ transform: `translate(${offset.x * 20}px, ${offset.y * 20}px) rotate(${offset.y * -5}deg)` }}
        >🌿</div>
        <div 
          className="shop-float-item berry-1"
          style={{ transform: `translate(${offset.x * -25}px, ${offset.y * 15}px)` }}
        >🍓</div>
      </div>

      <div className="shop-hero-content">
        <div className="shop-hero-badge">
          <span className="shop-pulse-dot"></span>
          100% Organic & Fresh
        </div>
        
        <h1 className="shop-hero-title">
          {title}
        </h1>
        
        <p className="shop-hero-subtitle">
          {subtitle}
        </p>
      </div>

      {children && (
        <div className="shop-hero-bottom">
          {children}
        </div>
      )}
    </div>
  );
};

export default ShopHero;
