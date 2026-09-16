import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

const defaultSlides = [
  {
    id: 'slide-1',
    title: 'FRESHER. CLEANER. BETTER.',
    subtitle: 'Carefully selected fresh produce, every day.',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    secondaryText: 'Explore Produce',
    secondaryLink: '/shop',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
    theme: 'emerald'
  },
  {
    id: 'slide-2',
    title: 'FRESH TO YOUR DOOR',
    subtitle: 'Your order, delivered in 30 minutes.',
    ctaText: 'Order Now',
    ctaLink: '/shop',
    secondaryText: 'Explore Shop',
    secondaryLink: '/shop',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    theme: 'forest'
  },
  {
    id: 'slide-3',
    title: 'COME VISIT US',
    subtitle: 'Fresh produce, picked with care.',
    ctaText: 'Visit Us',
    ctaLink: '/contact',
    secondaryText: 'Our Story',
    secondaryLink: '/about',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    theme: 'emerald'
  }
];

const Hero = ({ data }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // If dynamic slides exist from props with custom content, use them; otherwise use defaultSlides
  const slides = React.useMemo(() => {
    if (!data) return defaultSlides;
    if (Array.isArray(data.slides) && data.slides.length > 0) {
      return data.slides.map((s, idx) => ({
        id: s._id || s.id || `slide-${idx + 1}`,
        title: s.title || defaultSlides[idx % defaultSlides.length]?.title,
        subtitle: s.subtitle || defaultSlides[idx % defaultSlides.length]?.subtitle,
        ctaText: s.ctaText || defaultSlides[idx % defaultSlides.length]?.ctaText || 'Shop Now',
        ctaLink: s.ctaLink || defaultSlides[idx % defaultSlides.length]?.ctaLink || '/shop',
        secondaryText: s.secondaryText || defaultSlides[idx % defaultSlides.length]?.secondaryText || 'Explore',
        secondaryLink: s.secondaryLink || defaultSlides[idx % defaultSlides.length]?.secondaryLink || '/shop',
        image: s.image || s.backgroundImage || defaultSlides[idx % defaultSlides.length]?.image,
        theme: s.theme || defaultSlides[idx % defaultSlides.length]?.theme || 'emerald'
      }));
    }
    return defaultSlides;
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
