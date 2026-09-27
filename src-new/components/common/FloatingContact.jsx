import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Headphones,
  ExternalLink
} from 'lucide-react';
import './FloatingContact.css';

const PHONE_NUMBER = '+961 71 966 828';
const RAW_PHONE = '96171966828';
const STORE_LOCATION_URL = 'https://maps.google.com/?q=33.87413,35.50896';

const QUICK_INQUIRIES = [
  {
    id: 'order',
    emoji: '📦',
    label: 'Track Order',
    text: 'Hello Chocair Fresh! I would like to check the status of my order.'
  },
  {
    id: 'fruits',
    emoji: '🍎',
    label: 'Fresh Produce',
    text: 'Hello Chocair Fresh! I have a question about fruit availability and today\'s arrivals.'
  },
  {
    id: 'delivery',
    emoji: '🛵',
    label: 'Delivery Info',
    text: 'Hello! Could you please help me with delivery coverage and timing in Beirut?'
  },
  {
    id: 'general',
    emoji: '💬',
    label: 'General Chat',
    text: 'Hello Chocair Fresh team! I have a general question.'
  }
];

const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const location = useLocation();
  const popoverRef = useRef(null);
  const fabRef = useRef(null);

  // Hide on admin panel routes
  const isAdmin = location.pathname.startsWith('/admin');

  // Check store open status (7:30 AM - 10:30 PM Lebanon local time)
  const isStoreOpen = () => {
    try {
      const now = new Date();
      // Beirut is UTC+2 / UTC+3
      const beirutTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Beirut' }));
      const hours = beirutTime.getHours();
      const minutes = beirutTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      const openMinutes = 7 * 60 + 30; // 7:30 AM
      const closeMinutes = 22 * 60 + 30; // 10:30 PM
      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch {
      return true;
    }
  };

  // Show tooltip after a short delay on initial mount, hide after 6 seconds
  useEffect(() => {
    if (isAdmin) return;
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 9000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [isAdmin]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        fabRef.current &&
        !fabRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (isAdmin) {
    return null;
  }

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (showTooltip) setShowTooltip(false);
  };

  const getWhatsAppLink = (message) => {
    const encoded = encodeURIComponent(message || 'Hello Chocair Fresh, I have an inquiry.');
    return `https://wa.me/${RAW_PHONE}?text=${encoded}`;
  };

  const handleCustomSend = (e) => {
    e.preventDefault();
    const text = customMsg.trim() || 'Hello Chocair Fresh!';
    window.open(getWhatsAppLink(text), '_blank', 'noopener,noreferrer');
    setCustomMsg('');
    setIsOpen(false);
  };

  const openStatus = isStoreOpen();

  return (
    <div className="floating-contact-wrapper" aria-label="Customer Support">
      {/* Floating Action Button (FAB) */}
      <div className="floating-contact-fab-container">
        {/* Animated Greeting Bubble / Tooltip */}
        {!isOpen && showTooltip && (
          <div 
            className="floating-contact-tooltip animate-fade-in"
            onClick={toggleOpen}
            role="button"
            tabIndex={0}
          >
            <div className="tooltip-avatar-badge">
              <span className="tooltip-pulse-dot" />
              <Headphones size={14} className="tooltip-icon" />
            </div>
            <div className="tooltip-content">
              <span className="tooltip-title">Need fresh help? 👋</span>
              <span className="tooltip-subtitle">Chat with us on WhatsApp!</span>
            </div>
            <button 
              type="button" 
              className="tooltip-close" 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              aria-label="Dismiss greeting"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          ref={fabRef}
          type="button"
          onClick={toggleOpen}
          className={`floating-contact-fab ${isOpen ? 'active' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={isOpen ? 'Close contact menu' : 'Contact Chocair Fresh'}
        >
          <div className="fab-pulse-ring" />
          <div className="fab-icon-container">
            {isOpen ? (
              <X size={24} className="fab-icon-close" />
            ) : (
              <div className="fab-icon-open-group">
                <img 
                  src="/assets/icons/whatsapp.png" 
                  alt="WhatsApp Contact" 
                  className="fab-wa-icon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <MessageCircle size={26} className="fab-fallback-icon" />
                <span className="fab-online-dot" title="Support Online" />
              </div>
            )}
          </div>
          <span className="fab-label-text">Contact Us</span>
        </button>
      </div>

      {/* Floating Popover / Dialog Card */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="floating-contact-popover animate-scale-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-popover-heading"
        >
          {/* Header */}
          <div className="popover-header">
            <div className="popover-brand">
              <div className="popover-avatar-wrap">
                <div className="popover-avatar">
                  <Headphones size={20} />
                </div>
                <span className={`popover-status-badge ${openStatus ? 'online' : 'away'}`}>
                  <span className="status-dot" />
                </span>
              </div>
              <div className="popover-titles">
                <div className="popover-heading-row">
                  <h3 id="contact-popover-heading" className="popover-title">Chocair Fresh Support</h3>
                  <span className="popover-verified-tag">
                    <Sparkles size={11} /> Verified
                  </span>
                </div>
                <p className="popover-status-text">
                  {openStatus ? (
                    <span className="text-emerald">● Online • Replies in ~5 mins</span>
                  ) : (
                    <span className="text-amber">● Away • Opens 7:30 AM</span>
                  )}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="popover-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close contact dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="popover-body">
            {/* Primary Direct WhatsApp Action Card */}
            <a
              href={getWhatsAppLink('Hello Chocair Fresh! I would like to ask a question.')}
              target="_blank"
              rel="noopener noreferrer"
              className="popover-primary-card"
            >
              <div className="wa-brand-icon-box">
                <img 
                  src="/assets/icons/whatsapp.png" 
                  alt="WhatsApp" 
                  className="popover-wa-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="popover-primary-info">
                <span className="primary-card-title">Chat on WhatsApp</span>
                <span className="primary-card-subtitle">{PHONE_NUMBER}</span>
              </div>
              <ChevronRight size={18} className="primary-arrow" />
            </a>

            {/* Direct Call Button */}
            <a 
              href={`tel:${PHONE_NUMBER.replace(/\s+/g, '')}`} 
              className="popover-secondary-action"
            >
              <div className="secondary-icon-box phone-box">
                <Phone size={16} />
              </div>
              <div className="secondary-info">
                <span className="secondary-label">Call Store Directly</span>
                <span className="secondary-val">{PHONE_NUMBER}</span>
              </div>
            </a>

            {/* Quick Inquiry Chips */}
            <div className="popover-quick-section">
              <span className="quick-section-title">Quick Inquiries</span>
              <div className="quick-chips-grid">
                {QUICK_INQUIRIES.map((item) => (
                  <a
                    key={item.id}
                    href={getWhatsAppLink(item.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quick-chip-btn"
                  >
                    <span className="chip-emoji">{item.emoji}</span>
                    <span className="chip-label">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Message Box */}
            <form onSubmit={handleCustomSend} className="popover-custom-form">
              <div className="custom-input-wrap">
                <input
                  type="text"
                  placeholder="Type a quick message..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="custom-msg-input"
                  aria-label="Custom inquiry message"
                />
                <button 
                  type="submit" 
                  className="custom-send-btn"
                  aria-label="Send WhatsApp message"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>

            {/* Store Meta Row (Location & Hours) */}
            <div className="popover-meta-details">
              <div className="popover-meta-row">
                <Clock size={14} className="meta-row-icon" />
                <div className="meta-row-text">
                  <span>Mon – Sun: <strong>7:30 AM – 10:30 PM</strong></span>
                </div>
              </div>
              <a 
                href={STORE_LOCATION_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="popover-meta-row clickable"
              >
                <MapPin size={14} className="meta-row-icon" />
                <div className="meta-row-text">
                  <span>Chocair Market, Beirut</span>
                </div>
                <ExternalLink size={12} className="meta-link-icon" />
              </a>
            </div>

            {/* Social Icons Cluster */}
            <div className="popover-socials-row">
              <span className="socials-label">Follow Us:</span>
              <div className="socials-icons">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-circle-btn"
                  aria-label="Instagram"
                >
                  <img src="/assets/icons/instagram.png" alt="Instagram" />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-circle-btn"
                  aria-label="TikTok"
                >
                  <img src="/assets/icons/tiktok.png" alt="TikTok" />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-circle-btn"
                  aria-label="Facebook"
                >
                  <img src="/assets/icons/facebook.png" alt="Facebook" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingContact;