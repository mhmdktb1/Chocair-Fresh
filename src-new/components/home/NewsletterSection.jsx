import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button';
import './NewsletterSection.css';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-bg-parallax"></div>
      <div className="newsletter-overlay"></div>
      
      <div className="container newsletter-container">
        <div className="newsletter-content">
          <span className="newsletter-badge">Join The Club</span>
          <h2 className="newsletter-title">Get Fresh Updates</h2>
          <p className="newsletter-desc">
            Subscribe to our newsletter and get 10% off your first order. 
            Plus, receive weekly healthy recipes and exclusive deals.
          </p>
          
          <form onSubmit={handleSubmit} className="newsletter-form">
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" className="newsletter-btn">
                {subscribed ? 'Subscribed!' : (
                  <>
                    Subscribe <Send size={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <p className="newsletter-note">No spam, ever. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;