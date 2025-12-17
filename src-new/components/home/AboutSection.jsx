import React from 'react';
import { Truck, Heart, ShieldCheck, Leaf } from 'lucide-react';
import Button from '../common/Button';
import '../../pages/About.css'; // Reusing the styles

const Feature = ({ icon: Icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">
      <Icon size={32} />
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);

const AboutSection = () => {
  return (
    <section id="about" className="about-section">
      {/* Hero-like separator */}
      <div className="about-hero" style={{ height: '40vh', marginBottom: '4rem' }}>
        <div className="container">
          <h2 className="about-title">Cultivating <span className="highlight">Goodness</span></h2>
          <p className="about-subtitle">
            We believe in the power of fresh, organic food to transform lives.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="section-story container">
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
              Today, we partner with over 50 local farms, ensuring that the food on your table is harvested within 24 hours of delivery.
            </p>
            <Button variant="primary">Read More</Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="section-features">
        <div className="container">
          <div className="features-grid">
            <Feature 
              icon={Leaf} 
              title="100% Organic" 
              description="Certified organic produce free from harmful pesticides."
            />
            <Feature 
              icon={Truck} 
              title="Fast Delivery" 
              description="Order before 10 AM and get delivery by evening."
            />
            <Feature 
              icon={ShieldCheck} 
              title="Quality Guarantee" 
              description="Not satisfied? We'll replace it for free."
            />
            <Feature 
              icon={Heart} 
              title="Community First" 
              description="We support local farmers with fair prices."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
