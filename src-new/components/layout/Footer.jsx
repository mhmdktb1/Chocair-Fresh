import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Sparkles, 
  ArrowUp,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Clock
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="modern-footer">
      {/* Top Value Banner Strip */}
      <div className="footer-perks-strip">
        <div className="container">
          <div className="footer-perks-grid">
            <div className="footer-perk-card">
              <div className="perk-icon-wrapper"><Sparkles size={20} /></div>
              <div className="perk-text">
                <h4>100% Organic</h4>
                <p>Fresh daily harvests</p>
              </div>
            </div>
            <div className="footer-perk-card">
              <div className="perk-icon-wrapper"><Truck size={20} /></div>
              <div className="perk-text">
                <h4>Fast Local Delivery</h4>
                <p>Express 25–35 min drop</p>
              </div>
            </div>
            <div className="footer-perk-card">
              <div className="perk-icon-wrapper"><ShieldCheck size={20} /></div>
              <div className="perk-text">
                <h4>Quality Guaranteed</h4>
                <p>Hand-inspected produce</p>
              </div>
            </div>
            <div className="footer-perk-card">
              <div className="perk-icon-wrapper"><HeartHandshake size={20} /></div>
              <div className="perk-text">
                <h4>Community First</h4>
                <p>Supporting local farms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-main-container">
        <div className="footer-columns-grid">
          
          {/* Column 1: Brand & Bio */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand-logo">
              Chocair<span className="brand-highlight">Fresh</span>
            </Link>
            <p className="footer-bio">
              Your neighborhood destination for honest, hand-picked organic fruits, crisp farm vegetables, and daily artisanal greens.
            </p>
            
            <div className="footer-working-hours">
              <Clock size={15} className="hours-icon" />
              <span>Open Daily: <strong>8:00 AM – 9:00 PM</strong></span>
            </div>

            {/* Social Icons */}
            <div className="footer-social-cluster">
              <a 
                href="https://wa.me/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp" 
                className="social-pill social-wa"
              >
                <MessageCircle size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                className="social-pill social-ig"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook" 
                className="social-pill social-fb"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="TikTok" 
                className="social-pill social-tt"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.86-4.47v-7.3a8.28 8.28 0 0 0 4.91 1.63v-3.3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Explore</h3>
            <ul className="footer-nav-links">
              <li><Link to="/">Home Harvest</Link></li>
              <li><Link to="/shop">Shop Fresh Market</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/profile">My Orders & Tracking</Link></li>
              <li><Link to="/#about">About Our Mission</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact & Direct Connect */}
          <div className="footer-col">
            <h3 className="footer-heading">Get in Touch</h3>
            <ul className="footer-contact-items">
              <li>
                <a href="tel:+15551234567" className="f-contact-link">
                  <div className="contact-icon-bubble"><Phone size={15} /></div>
                  <div className="f-contact-text">
                    <span className="f-label">Call Orders</span>
                    <strong>+1 (555) 123-4567</strong>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:hello@chocairfresh.com" className="f-contact-link">
                  <div className="contact-icon-bubble"><Mail size={15} /></div>
                  <div className="f-contact-text">
                    <span className="f-label">Customer Support</span>
                    <strong>hello@chocairfresh.com</strong>
                  </div>
                </a>
              </li>
              <li>
                <div className="f-contact-link">
                  <div className="contact-icon-bubble"><MapPin size={15} /></div>
                  <div className="f-contact-text">
                    <span className="f-label">Location</span>
                    <strong>Organic City, CA 90210</strong>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Interactive Store Map */}
          <div className="footer-col footer-col-map">
            <h3 className="footer-heading">Visit Us</h3>
            <div className="footer-map-wrapper">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153169!3d-37.8173234420211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a32f7f1f84!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1614134345678!5m2!1sen!2sau" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Chocair Fresh Store Location"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Back to Top Strip */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            &copy; {currentYear} <strong>Chocair Fresh</strong>. All rights reserved. Locally Sourced & Delivered Fresh.
          </div>
          
          <button 
            type="button" 
            onClick={scrollToTop} 
            className="footer-back-to-top"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
