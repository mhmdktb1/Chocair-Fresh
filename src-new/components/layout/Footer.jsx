import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="clean-footer">
      <div className="container footer-content-wrap">
        {/* Main Grid: Store Details & Actions | Large Pinned Map */}
        <div className="footer-layout-grid">
          
          {/* Brand & Store Info Column */}
          <div className="footer-info-col">
            <div className="footer-brand-section">
              <Link to="/" className="footer-brand">
                Chocair<span className="brand-highlight">Fresh</span>
              </Link>
              <p className="footer-tagline">
                Premium hand-picked produce, fruits, and daily essentials delivered fresh to your door across Beirut.
              </p>
            </div>

            {/* Store Meta (Location & Hours) */}
            <div className="footer-meta-list">
              <div className="footer-meta-item">
                <MapPin size={18} className="footer-meta-icon pin-icon" />
                <div>
                  <span className="footer-meta-title">Store Location</span>
                  <p className="footer-meta-text">Chocair Market "Anas Fruits", Beirut, Lebanon</p>
                </div>
              </div>
              <div className="footer-meta-item">
                <Clock size={18} className="footer-meta-icon clock-icon" />
                <div>
                  <span className="footer-meta-title">Opening Hours</span>
                  <p className="footer-meta-text">Mon – Sun: 7:30 AM – 10:30 PM</p>
                </div>
              </div>
            </div>

            {/* Actions: WhatsApp Direct Contact + Social Icons */}
            <div className="footer-actions-row">
              <a 
                href="https://wa.me/96171966828" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-wa-badge-btn"
                aria-label="WhatsApp +961 71 966 828"
              >
                <div className="wa-icon-bubble">
                  <img 
                    src="/assets/icons/whatsapp.png" 
                    alt="WhatsApp" 
                    className="footer-wa-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
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
                  title="Follow us on Instagram"
                >
                  <img 
                    src="/assets/icons/instagram.png" 
                    alt="Instagram" 
                    className="footer-social-img" 
                  />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Facebook" 
                  className="footer-social-btn fb-btn"
                  title="Follow us on Facebook"
                >
                  <img 
                    src="/assets/icons/facebook.png" 
                    alt="Facebook" 
                    className="footer-social-img" 
                  />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="TikTok" 
                  className="footer-social-btn tt-btn"
                  title="Follow us on TikTok"
                >
                  <img 
                    src="/assets/icons/tiktok.png" 
                    alt="TikTok" 
                    className="footer-social-img" 
                  />
                </a>
              </div>
            </div>
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
