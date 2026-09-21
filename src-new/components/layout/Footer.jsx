import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock,
  Instagram, 
  Facebook, 
  MessageCircle
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="clean-footer">
      <div className="container footer-content-wrap">
        {/* Main Grid: Brand & Contact Info | Navigation | Big Pinned Map */}
        <div className="footer-layout-grid">
          
          {/* Brand & Store Info Column */}
          <div className="footer-info-col">
            <div className="footer-brand-section">
              <Link to="/" className="footer-brand">
                Chocair<span className="brand-highlight">Fresh</span>
              </Link>
              <p className="footer-tagline">
                Premium hand-picked produce, fruits, and daily essentials delivered fresh to your door in Beirut.
              </p>
            </div>

            {/* Quick Details (Address, Hours) */}
            <div className="footer-meta-list">
              <div className="footer-meta-item">
                <MapPin size={17} className="footer-meta-icon pin-icon" />
                <div>
                  <span className="footer-meta-title">Store Location</span>
                  <p className="footer-meta-text">Chocair Market "Anas Fruits", Beirut</p>
                </div>
              </div>
              <div className="footer-meta-item">
                <Clock size={17} className="footer-meta-icon clock-icon" />
                <div>
                  <span className="footer-meta-title">Opening Hours</span>
                  <p className="footer-meta-text">Mon – Sun: 7:30 AM – 10:30 PM</p>
                </div>
              </div>
            </div>

            {/* Actions: WhatsApp + Socials */}
            <div className="footer-actions-row">
              <a 
                href="https://wa.me/96171966828" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-wa-badge-btn"
                aria-label="WhatsApp +961 71 966 828"
              >
                <div className="wa-icon-bubble">
                  <MessageCircle size={18} className="footer-wa-icon" />
                </div>
                <div className="wa-btn-text">
                  <span className="wa-label">WhatsApp Order & Support</span>
                  <span className="wa-number">+961 71 966 828</span>
                </div>
              </a>

              <div className="footer-social-cluster">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram" 
                  className="footer-social-btn ig-btn"
                >
                  <Instagram size={17} />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Facebook" 
                  className="footer-social-btn fb-btn"
                >
                  <Facebook size={17} />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="TikTok" 
                  className="footer-social-btn tt-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.86-4.47v-7.3a8.28 8.28 0 0 0 4.91 1.63v-3.3z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-nav-links">
              <li><Link to="/shop">Shop Fresh Produce</Link></li>
              <li><Link to="/about">Our Story & Quality</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/profile">My Orders</Link></li>
            </ul>
          </div>

          {/* Big Map Column: Full Pinned Map */}
          <div className="footer-map-col">
            <div className="footer-map-container">
              <div className="footer-map-header">
                <div className="map-badge">
                  <span className="live-dot"></span>
                  <span>Store Location</span>
                </div>
                <span className="map-location-label">Beirut, Lebanon</span>
              </div>
              <div className="footer-map-card">
                <iframe 
                  src="https://maps.google.com/maps?q=WHVR%2BGVR+Chocair+Market+%22Anas+Fruits%22,+Beirut&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Chocair Market Anas Fruits Google Maps Location"
                ></iframe>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="footer-bottom-row">
          <p className="footer-copyright">
            &copy; {currentYear} <strong>Chocair Fresh</strong>. All rights reserved.
          </p>
          <div className="footer-bottom-badges">
            <span className="trust-pill">🌱 100% Fresh Guaranteed</span>
            <span className="trust-pill">⚡ Fast Beirut Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
