import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, ShieldCheck, Truck, Star, Zap } from 'lucide-react';
import './Hero.css';

const defaultSlides = [
  {
    id: 'slide-1',
    badge: '100% Organic & Farm Fresh',
    badgeIcon: 'sparkle',
    title: 'Handpicked Nature, Straight to Your Door',
    subtitle: 'Crisp organic vegetables, luscious seasonal fruits, and aromatic herbs harvested at peak vitality.',
    ctaText: 'Shop Daily Harvest',
    ctaLink: '/shop',
    secondaryText: 'Explore Categories',
    secondaryLink: '/shop',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    accentTag: '⚡ Delivered in 25–35 mins',
    ratingText: '4.9 ★ (2.5k+ Reviews)',
    theme: 'emerald'
  },
  {
    id: 'slide-2',
    badge: 'Direct Farm Harvest',
    badgeIcon: 'zap',
    title: 'Pure Goodness with Zero Compromise',
    subtitle: 'Naturally grown with love, zero artificial chemicals, supporting local sustainable family growers.',
    ctaText: 'Discover Organic',
    ctaLink: '/shop',
    secondaryText: 'Our Story',
    secondaryLink: '/#about',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    accentTag: '🌱 Chemical Free',
    ratingText: '100% Certified Organic',
    theme: 'forest'
  },
  {
    id: 'slide-3',
    badge: 'Seasonal Box Specials',
    badgeIcon: 'truck',
    title: 'Curated Farm Boxes for Healthy Living',
    subtitle: 'Get seasonal fruit & veggie combinations packed with natural vitamins at special everyday value.',
    ctaText: 'View Fresh Deals',
    ctaLink: '/shop',
    secondaryText: 'Quick Search',
    secondaryLink: '/shop?focus=search',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80',
    accentTag: '🎁 Best Family Value',
    ratingText: 'Same-Day Fast Delivery',
    theme: 'amber'
  }
];

const Hero = ({ data }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // If dynamic title / image exists from props, merge it into slide 1
  const slides = React.useMemo(() => {
    if (!data) return defaultSlides;
    const customFirst = {
      ...defaultSlides[0],
      title: data.title || defaultSlides[0].title,
      subtitle: data.subtitle || defaultSlides[0].subtitle,
      image: data.backgroundImage || defaultSlides[0].image
    };
    return [customFirst, defaultSlides[1], defaultSlides[2]];
  }, [data]);

  // Auto-slide every 6 seconds unless user is hovering/interacting
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const activeSlide = slides[currentSlide];

  return (
    <section 
      className={`modern-hero-section theme-${activeSlide.theme}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured showcase"
    >
      {/* Ambient Background Layers (Covering the entire header & hero) */}
      <div className="hero-bg-glow" />
      <div className="hero-bg-mesh" />

      <div className="modern-hero-container">
        
        {/* Story Progress Indicators */}
        <div className="story-progress-bar-group" aria-label="Story Progress">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`story-bar-wrapper ${index === currentSlide ? 'active' : index < currentSlide ? 'completed' : ''}`}
              onClick={() => setCurrentSlide(index)}
            >
              <div 
                className="story-bar-fill" 
                style={{ animationDuration: isPaused ? '0s' : '6s' }}
              />
            </div>
          ))}
        </div>

        {/* Hero Content Grid */}
        <div className="hero-grid-layout">

          {/* Left / Top Content Side */}
          <div className="hero-text-block">
            <div className="hero-micro-pill">
              {activeSlide.badgeIcon === 'sparkle' && <Sparkles size={14} className="pill-icon" />}
              {activeSlide.badgeIcon === 'zap' && <Zap size={14} className="pill-icon" />}
              {activeSlide.badgeIcon === 'truck' && <Truck size={14} className="pill-icon" />}
              <span>{activeSlide.badge}</span>
            </div>

            <h1 className="hero-main-title">
              {activeSlide.title}
            </h1>

            <p className="hero-main-desc">
              {activeSlide.subtitle}
            </p>

            <div className="hero-action-group">
              <button 
                className="hero-btn-primary" 
                onClick={() => navigate(activeSlide.ctaLink)}
                type="button"
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRight size={18} className="btn-arrow" />
              </button>

              <button 
                className="hero-btn-ghost" 
                onClick={() => navigate(activeSlide.secondaryLink)}
                type="button"
              >
                <span>{activeSlide.secondaryText}</span>
              </button>
            </div>

            {/* Micro Trust Pills */}
            <div className="hero-bottom-trust-strip">
              <span className="trust-pill"><Star size={13} className="trust-star" /> {activeSlide.ratingText}</span>
              <span className="trust-pill"><ShieldCheck size={13} className="trust-check" /> Guaranteed Freshness</span>
            </div>
          </div>

          {/* Right / Visual Image Side */}
          <div className="hero-visual-block">
            <div className="image-frame-ring">
              <img 
                src={activeSlide.image} 
                alt={activeSlide.title} 
                className="hero-feature-image" 
                loading="eager"
              />
            </div>

            {/* Floating Glass Pill on the Image */}
            <div className="floating-accent-tag">
              <span>{activeSlide.accentTag}</span>
            </div>
          </div>

          {/* Desktop Arrow Navigation */}
          <button 
            className="hero-arrow-btn arrow-prev" 
            onClick={handlePrev} 
            aria-label="Previous Slide"
            type="button"
          >
            <ChevronLeft size={22} />
          </button>
          
          <button 
            className="hero-arrow-btn arrow-next" 
            onClick={handleNext} 
            aria-label="Next Slide"
            type="button"
          >
            <ChevronRight size={22} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Hero;
