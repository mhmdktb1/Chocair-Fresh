import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          {/* Column 1: Brand & Contact */}
          <div className="footer-info">
            <div className="footer-brand">
              <h2 className="footer-logo">Chocair <span className="highlight">Fresh</span></h2>
              <p className="footer-tagline">Fresh fruits & vegetables, delivered locally.</p>
              <p className="trust-badge">🌱 Local • Fresh • Fast</p>
            </div>

            <div className="footer-contact">
              <h3>Contact Us</h3>
              <ul className="contact-list">
                <li>
                  <a href="tel:+15551234567" className="contact-item">
                    <Phone size={18} />
                    <span>+1 (555) 123-4567</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@chocairfresh.com" className="contact-item">
                    <Mail size={18} />
                    <span>hello@chocairfresh.com</span>
                  </a>
                </li>
                <li className="location-item">
                  <div className="contact-item">
                    <MapPin size={18} />
                    <span>Organic City, CA 90210</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Map */}
          <div className="footer-map-container">
            <div className="social-links-top">
              <a href="https://wa.me/15551234567" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-whatsapp">
                <MessageCircle size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-facebook">
                <Facebook size={20} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-tiktok">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
            <div className="footer-map">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153169!3d-37.8173234420211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a32f7f1f84!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1614134345678!5m2!1sen!2sau" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Chocair Fresh Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {currentYear} Chocair Fresh – All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
