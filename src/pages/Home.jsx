import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Leaf, Truck, CreditCard, Sprout, MapPin, Phone, Clock } from "lucide-react";
import { useChocairFeatures } from "../hooks/useChocairFeatures";

// استيراد المكونات الجاهزة
import Header from "../components/layout/Header";
import Hero from "../components/home/Hero";
import Footer from "../components/layout/Footer";
import TrendingProducts from "../components/recommendations/TrendingProducts";

import "../styles/style.css";

function Home() {
  const navigate = useNavigate();
  const {
    initProductRow,
    handleSliderClick,
    initFadeUpReveal,
  } = useChocairFeatures();

  // مراجع الأقسام القابلة للسحب
  const fruitsRef = useRef(null);
  const vegetablesRef = useRef(null);
  const herbsRef = useRef(null);
  const organicRef = useRef(null);

  // Reviews auto-slide state
  const [activeReview, setActiveReview] = useState(0);
  const reviewsData = [
    {
      name: "Sarah K.",
      location: "Beirut",
      image: "/assets/images/user1.jpg",
      text: "The best delivery experience I've ever had! Fruits were perfectly fresh and beautifully packed."
    },
    {
      name: "Ahmad D.",
      location: "Dbayeh",
      image: "/assets/images/user2.jpg",
      text: "I love how easy it is to order and how clean everything arrives — quality is always top-notch!"
    },
    {
      name: "Maya H.",
      location: "Jounieh",
      image: "/assets/images/user3.jpg",
      text: "Great prices, professional service, and super friendly delivery guys. Highly recommended!"
    }
  ];

  useEffect(() => {
    // تفعيل السحب الأفقي للأقسام
    const cleanups = [
      fruitsRef.current && initProductRow(fruitsRef.current, "fruits"),
      vegetablesRef.current && initProductRow(vegetablesRef.current, "vegetables"),
      herbsRef.current && initProductRow(herbsRef.current, "herbs"),
      organicRef.current && initProductRow(organicRef.current, "organic"),
    ];

    // تفعيل أنيميشن الظهور التدريجي للبطاقات
    document.querySelectorAll(".feature-card").forEach((card) => initFadeUpReveal(card));

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, []);

  // Auto-slide reviews every 5 seconds on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % 3); // 3 reviews
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* HEADER */}
      <Header active="home" variant="home" />


      {/* HERO SECTION */}
      <Hero />

      {/* TRENDING PRODUCTS - RECOMMENDATION SYSTEM */}
      <TrendingProducts />

      {/* FEATURED CATEGORIES */}
      <section className="featured-categories">
        <div className="section-header">
          <h2>Featured Categories</h2>
          <p>Freshly picked products from every corner of Chocair Fresh.</p>
        </div>

        {/* Fruits */}
        <article className="category-block">
          <div className="category-header">
            <div className="category-top">
              <h3>🍎 Fruits</h3>
              <Link to="/products" className="shop-all">Shop All →</Link>
            </div>
            <div className="nav-buttons">
              <button className="slider-btn prev" onClick={() => handleSliderClick("fruits", "prev")}>‹</button>
              <button className="slider-btn next" onClick={() => handleSliderClick("fruits", "next")}>›</button>
            </div>
          </div>

          <div ref={fruitsRef} className="products-row" id="fruits">
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/apple.jpg" alt="Apple" /><figcaption>Apple</figcaption></figure>
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/banana.jpg" alt="Banana" /><figcaption>Banana</figcaption></figure>
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/orange.jpg" alt="Orange" /><figcaption>Orange</figcaption></figure>
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/mango.jpg" alt="Mango" /><figcaption>Mango</figcaption></figure>
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/strawberry.jpg" alt="Strawberry" /><figcaption>Strawberry</figcaption></figure>
            <figure className="product-card" onClick={() => navigate("/products")}><img src="/assets/images/pineapple.jpg" alt="Pineapple" /><figcaption>Pineapple</figcaption></figure>
          </div>
        </article>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-chocair">
        <div className="container">
          <h2 className="section-title">
            Why Choose <span>Chocair Fresh?</span>
          </h2>
          <p className="section-subtitle">
            We bring freshness, speed, and quality straight from our farms to your table.
          </p>

          <div className="features-grid">
            <article className="feature-card">
              <Leaf className="feature-icon" />
              <h3>Always Fresh</h3>
              <p>We handpick our produce daily to guarantee the highest quality for every order.</p>
            </article>

            <article className="feature-card">
              <Truck className="feature-icon" />
              <h3>Fast Delivery</h3>
              <p>Get your fruits and vegetables delivered in less than 2 hours — straight to your door.</p>
            </article>

            <article className="feature-card">
              <CreditCard className="feature-icon" />
              <h3>Fair Prices</h3>
              <p>Premium quality produce at prices that stay friendly and transparent.</p>
            </article>

            <article className="feature-card">
              <Sprout className="feature-icon" />
              <h3>Locally Grown</h3>
              <p>We support local farmers and promote sustainable agriculture practices.</p>
            </article>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mission">
        <div className="mission-container">
          <div className="mission-text">
            <h2>Our <span>Mission</span> & Vision</h2>
            <p>
              At <strong>Chocair Fresh</strong>, we believe that freshness is more than just a word — it's our promise. 
              Every product we deliver is carefully selected from trusted local farmers who share our passion for quality and sustainability.
            </p>
            <p>
              Our mission is to redefine the grocery experience in Lebanon by combining technology, community, and nature. 
              We aim to make healthy eating simple, accessible, and exciting for every home.
            </p>
            <Link to="/products" className="learn-more-btn">Learn More</Link>
          </div>

          <div className="mission-image">
            <img src="/assets/images/mission.jpg" alt="Fresh produce vision" loading="lazy" />
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews">
        <div className="reviews-header">
          <h2>What Our Customers Say</h2>
          <p>Real stories from people who love Chocair Fresh.</p>
        </div>

        <div className="reviews-grid">
          {reviewsData.map((review, index) => (
            <article 
              key={index}
              className={`review-card ${index === activeReview ? 'active' : ''}`}
            >
              <div className="reviewer">
                <img src={review.image} alt={review.name} />
                <h4>{review.name}</h4>
                <p>{review.location}</p>
              </div>
              <p className="review-text">"{review.text}"</p>
            </article>
          ))}
        </div>

        {/* Mobile dots indicator */}
        <div className="review-dots">
          {reviewsData.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === activeReview ? 'active' : ''}`}
              onClick={() => setActiveReview(index)}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* LOCATION */}
      <section className="location-section">
        <div className="location-container">
          <div className="location-text">
            <h2>Visit Us</h2>
            <p>We're always happy to welcome you! Drop by our store or order online — freshness is closer than you think.</p>

            <ul className="location-info">
              <li><MapPin /> Dbayeh Highway, Lebanon</li>
              <li><Phone /> +961 76 123 456</li>
              <li><Clock /> Mon – Sun: 8:00 AM – 10:00 PM</li>
            </ul>

            <a href="https://maps.google.com/?q=Dbayeh+Lebanon" target="_blank" className="map-btn">
              Open in Google Maps
            </a>
          </div>

          <div className="location-map">
            <iframe 
              src="https://www.google.com/maps?q=Dbayeh,Lebanon&output=embed" 
              allowFullScreen=""
              loading="lazy">
            </iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </>
  );
}

export default Home;
