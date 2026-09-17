import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Facebook, 
  Instagram, 
  MessageCircle 
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="clean-footer">
      <div className="container footer-content-wrap">
        {/* Main Info Row */}
        <div className="footer-main-row">
          
          {/* Brand & Store Address / Map Link */}
          <div className="footer-brand-section">
            <Link to="/" className="footer-brand">
              Chocair<span className="brand-highlight">Fresh</span>
            </Link>
            <a 
              href="https://maps.app.goo.gl/RdwRYKiHhTusYpG18" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-address-link"
              title="View store location on Google Maps"
            >
              <MapPin size={15} className="footer-icon-pin" />
              <span>Chocair Market "Anas Fruits", Beirut</span>
            </a>
          </div>

          {/* WhatsApp Contact Only */}
          <div className="footer-contact-cluster">
            <a 
              href="https://wa.me/96171866828" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-contact-link footer-wa-link"
              aria-label="WhatsApp 71866828"
            >
              <MessageCircle size={17} className="footer-wa-icon" />
              <span>+961 71 866 828</span>
            </a>
          </div>

          {/* Social Links */}
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
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 1082 4.47 6.27 6.27 0 0 0 1.86-4.47v-7.3a8.28 8.28 0 0 0 4.91 1.63v-3.3z"/>
              </svg>
            </a>
          </div>

        </div>

        {/* Minimal Copyright Bottom Strip */}
        <div className="footer-bottom-row">
          <p className="footer-copyright">
            &copy; {currentYear} <strong>Chocair Fresh</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
