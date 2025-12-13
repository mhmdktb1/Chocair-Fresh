import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { get } from "../../utils/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Hero({ page = 'home' }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const data = await get(`/hero?page=${page}`);
        // Filter only active slides and sort by order
        const activeSlides = data
          .filter(slide => slide.isActive)
          .sort((a, b) => a.order - b.order);
        setSlides(activeSlides);
      } catch (error) {
        console.error("Failed to fetch hero slides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [page]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return <div className="hero-section" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (slides.length === 0) {
    // Fallback if no slides
    return (
      <section className="hero-section">
        <img src="/assets/images/hero.jpg" alt="Hero" className="hero-image" />
        <div className="hero-content">
          <h1>Freshness Delivered To Your Door</h1>
          <p>Order premium fruits and vegetables directly from Chocair Fresh.</p>
          <Link to="/products" className="hero-btn">Shop Now</Link>
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${slide.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.5s ease-in-out'
        }}
      />
      
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1
      }} />

      {/* Content */}
      <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
        <Link to={slide.ctaLink} className="hero-btn">{slide.ctaText}</Link>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              color: 'white'
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              color: 'white'
            }}
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            zIndex: 3
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: 'none',
                  background: currentSlide === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Hero;
