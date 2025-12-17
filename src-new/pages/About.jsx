import React from 'react';
import { Truck, Heart, ShieldCheck, Leaf } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import './About.css';

const Feature = ({ icon: Icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">
      <Icon size={32} />
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">Cultivating <span className="highlight">Goodness</span></h1>
          <p className="about-subtitle">
            We believe in the power of fresh, organic food to transform lives and communities.
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
            />
            <div className="story-badge">
              <span className="years">15+</span>
              <span className="label">Years of Service</span>
            </div>
          </div>
          
          <div className="story-content">
            <h2 className="section-title">Our Story</h2>
            <p className="story-text">
              Started in 2010, Chocair Fresh began with a simple mission: to bridge the gap between local farmers and urban households. We noticed that while farmers struggled to find fair markets, city dwellers craved authentic, chemical-free produce.
            </p>
            <p className="story-text">
              Today, we partner with over 50 local farms, ensuring that the food on your table is harvested within 24 hours of delivery. We are not just a grocery store; we are a community dedicated to sustainable living.
            </p>
            <Button variant="primary">Read More</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-features">
        <div className="container">
          <div className="features-grid">
            <Feature 
              icon={Leaf} 
              title="100% Organic" 
              description="Certified organic produce free from harmful pesticides and chemicals."
            />
            <Feature 
              icon={Truck} 
              title="Fast Delivery" 
              description="Order before 10 AM and get your fresh groceries delivered by evening."
            />
            <Feature 
              icon={ShieldCheck} 
              title="Quality Guarantee" 
              description="If you're not satisfied with the freshness, we'll replace it for free."
            />
            <Feature 
              icon={Heart} 
              title="Community First" 
              description="We support local farmers by paying fair prices for their hard work."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
