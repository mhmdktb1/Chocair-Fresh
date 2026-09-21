import React from 'react';
import { Truck, Heart, ShieldCheck, Leaf, Sprout, Sparkles, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './About.css';

const featuresList = [
  {
    icon: Leaf,
    badge: 'Purity',
    title: '100% Organic & Clean',
    description: 'Certified farm-grown produce free from harmful synthetic chemicals and pesticides.'
  },
  {
    icon: Truck,
    badge: 'Fast Route',
    title: 'Express Delivery',
    description: 'Chilled express transit directly from our sorting hub straight to your kitchen.'
  },
  {
    icon: ShieldCheck,
    badge: 'Protected',
    title: 'Quality Guarantee',
    description: 'If you are not 100% satisfied with freshness, we will replace or refund instantly.'
  },
  {
    icon: Heart,
    badge: 'Local Pride',
    title: 'Community First',
    description: 'We partner directly with local family farms and guarantee fair pricing for growers.'
  }
];

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-badge">
            <Sparkles size={14} />
            <span>Farm Fresh Heritage</span>
          </div>
          <h1 className="about-title">Cultivating <span className="highlight">Goodness</span></h1>
          <p className="about-subtitle">
            We believe in the power of wholesome, farm-fresh produce to nourish lives, families, and local grower communities.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-story container">
        <div className="story-grid">
          <div className="story-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1595855709915-445676d2f6cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Farmer holding fresh produce" 
              className="story-img"
              loading="lazy"
            />
            <div className="story-image-overlay" />
            
            <div className="story-badge">
              <span className="years">15+</span>
              <span className="label">Years of Freshness</span>
            </div>

            <div className="story-pill-scene">
              <Sprout size={16} />
              <span>50+ Partner Farms</span>
            </div>
          </div>
          
          <div className="story-content">
            <div className="story-tag">
              <Sprout size={14} />
              <span>Our Roots</span>
            </div>
            <h2 className="section-title">Our Story</h2>
            <p className="story-text">
              Started in 2010, Chocair Fresh began with a simple mission: to bridge the gap between local growers and urban households. We noticed that while farmers struggled to find fair markets, families craved authentic, chemical-free produce with real flavor.
            </p>
            <p className="story-text">
              Today, we partner with over 50 local farms, ensuring that the fruits and greens on your table are harvested at peak ripeness and handled with the utmost care. We are not just a grocery store — we are a family committed to sustainable, healthy living.
            </p>
            
            <div className="story-stats-grid">
              <div className="story-stat-card">
                <span className="stat-num">50+</span>
                <span className="stat-desc">Local Farms</span>
              </div>
              <div className="story-stat-card">
                <span className="stat-num">24h</span>
                <span className="stat-desc">Harvest to Door</span>
              </div>
              <div className="story-stat-card">
                <span className="stat-num">100%</span>
                <span className="stat-desc">Fresh Guarantee</span>
              </div>
            </div>

            <div className="story-btn-row">
              <Link to="/shop" className="story-shop-btn">
                <span>Shop Fresh Harvest</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-features">
        <div className="container">
          <div className="features-header-wrap">
            <div className="features-badge">
              <Award size={14} />
              <span>Our Pillars</span>
            </div>
            <h2 className="features-main-heading">What We Offer</h2>
            <p className="features-main-sub">
              Every detail is designed to give you produce that looks, tastes, and feels better.
            </p>
          </div>

          <div className="features-grid">
            {featuresList.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="feature-card">
                  <div className="feature-card-top">
                    <div className="feature-icon">
                      <Icon size={22} />
                    </div>
                    <span className="feature-badge-tag">{f.badge}</span>
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;

export default About;
