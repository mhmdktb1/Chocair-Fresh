import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageSquareText, 
  MessageCircle,
  X, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Headphones,
  ExternalLink,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import api, { getAssetUrl } from '../../utils/api';
import './FloatingContact.css';

const PHONE_NUMBER = '+961 71 966 828';
const RAW_PHONE = '96171966828';
const STORE_LOCATION_URL = 'https://maps.google.com/?q=33.87413,35.50896';

const GENERAL_INQUIRIES = [
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
    text: "Hello Chocair Fresh! I have a question about fruit availability and today's arrivals."
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
  const [customMsg, setCustomMsg] = useState('');
  const [product, setProduct] = useState(null);
  const location = useLocation();
  const { products: adminProducts } = useAdmin();
  const popoverRef = useRef(null);
  const fabRef = useRef(null);

  // Route context detection
  const isAdmin = location.pathname.startsWith('/admin');
  const isProductPage = location.pathname.startsWith('/product/');
  const isCartPage = location.pathname.startsWith('/cart');
  const isShopPage = location.pathname.startsWith('/shop');
  const isCheckoutPage = location.pathname.startsWith('/checkout');

  // Fetch or find product data when on a product details page
  useEffect(() => {
    if (isProductPage) {
      const id = location.pathname.split('/product/')[1]?.split('?')[0]?.split('#')[0];
      if (id) {
        // First check in-memory / cached products
        const matched = adminProducts?.find(p => (p._id || p.id) === id);
        if (matched) {
          setProduct(matched);
        } else {
          // Fetch from API
          api.get(`/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(() => {
              // DOM fallback if available
              const domName = document.querySelector('.toters-product-name')?.textContent;
              if (domName) {
                setProduct({ name: domName, _id: id });
              } else {
                setProduct(null);
              }
            });
        }
        return;
      }
    }
    setProduct(null);
  }, [isProductPage, location.pathname, adminProducts]);

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

  if (isAdmin || isShopPage) {
    return null;
  }

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const getWhatsAppLink = (message) => {
    const encoded = encodeURIComponent(message || 'Hello Chocair Fresh, I have an inquiry.');
    return `https://wa.me/${RAW_PHONE}?text=${encoded}`;
  };

  // Product-specific metadata
  const productName = product?.name || '';
  const productPrice = product?.finalPrice ?? product?.price;
  const formattedPrice = productPrice !== undefined ? `$${Number(productPrice).toFixed(2)}` : '';
  const productUnit = product?.unit ? `per ${product.unit}` : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Tailored quick inquiries for product page vs general pages
  const productInquiries = [
    {
      id: 'prod-fresh',
      emoji: '🌿',
      label: 'Freshness & Stock',
      text: `Hello Chocair Fresh! Is "${productName}" available and fresh in stock today?\n🔗 ${currentUrl}`
    },
    {
      id: 'prod-price',
      emoji: '⚖️',
      label: 'Price & Weights',
      text: `Hello Chocair Fresh! I would like to know more about weight options and pricing for "${productName}" (${formattedPrice} ${productUnit}).\n🔗 ${currentUrl}`
    },
    {
      id: 'prod-bulk',
      emoji: '📦',
      label: 'Bulk / Box Order',
      text: `Hello Chocair Fresh! Do you offer bulk crates or wholesale pricing for "${productName}"?\n🔗 ${currentUrl}`
    },
    {
      id: 'prod-delivery',
      emoji: '🛵',
      label: 'Delivery Speed',
      text: `Hello! If I order "${productName}" now, how fast can you deliver it in Beirut?\n🔗 ${currentUrl}`
    }
  ];

  const activeInquiries = (isProductPage && product) ? productInquiries : GENERAL_INQUIRIES;

  // Primary WhatsApp action text
  const primaryChatText = (isProductPage && product)
    ? `Hello Chocair Fresh! I have a question about "${productName}" (${formattedPrice}):\n🔗 ${currentUrl}`
    : 'Hello Chocair Fresh! I would like to ask a question.';

  const handleCustomSend = (e) => {
    e.preventDefault();
    const base = customMsg.trim() || (isProductPage && product ? `Inquiry regarding ${productName}` : 'Hello Chocair Fresh!');
    const fullText = (isProductPage && product)
      ? `${base}\n\n📍 Product: ${productName} (${formattedPrice})\n🔗 ${currentUrl}`
      : base;
    window.open(getWhatsAppLink(fullText), '_blank', 'noopener,noreferrer');
    setCustomMsg('');
    setIsOpen(false);
  };

  const openStatus = isStoreOpen();

  // Page modifier class for precise bottom offsets
  const pageClass = isProductPage 
    ? 'is-product-page' 
    : isCartPage 
      ? 'is-cart-page' 
      : isShopPage 
        ? 'is-shop-page' 
        : isCheckoutPage 
          ? 'is-checkout-page' 
          : '';

  return (
    <div className={`floating-contact-wrapper ${pageClass} ${isOpen ? 'menu-open' : ''}`} aria-label="Customer Support">
      {/* Floating Action Button (FAB) */}
      <div className="floating-contact-fab-container">
        {/* Main Floating Trigger Button */}
        <button
          ref={fabRef}
          type="button"
          onClick={toggleOpen}
          className={`floating-contact-fab ${isOpen ? 'active' : 'floating-idle-anim'} ${isProductPage && product ? 'is-product-mode' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={isOpen ? 'Close contact menu' : (isProductPage && product ? `Ask about ${productName}` : 'Contact Us')}
        >
          {/* Subtle animated aura pulse rings */}
          {!isOpen && (
            <>
              <div className="fab-aura-ring ring-1" />
              <div className="fab-aura-ring ring-2" />
            </>
          )}

          {/* Shimmer light sweep bar */}
          <div className="fab-shimmer" />

          {/* Icon Section */}
          <div className="fab-icon-bubble">
            {isOpen ? (
              <X size={20} className="fab-icon-close" />
            ) : isProductPage && product ? (
              <div className="fab-icon-active-wrap">
                <ShoppingBag size={18} className="fab-main-icon" />
              </div>
            ) : (
              <div className="fab-icon-active-wrap">
                <MessageSquareText size={18} className="fab-main-icon" />
              </div>
            )}
          </div>

          {/* Text Section */}
          <div className="fab-text-wrap">
            <span className="fab-label-title">
              {isOpen ? 'Close' : (isProductPage && product ? 'Ask About Item' : 'Contact Us')}
            </span>
            {!isOpen && (
              <span className="fab-label-sub">
                {isProductPage && product ? 'WhatsApp Help' : 'Support'}
              </span>
            )}
          </div>
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
                  <h3 id="contact-popover-heading" className="popover-title">
                    {isProductPage && product ? 'Product Inquiry' : 'Chocair Fresh Support'}
                  </h3>
                  <span className="popover-verified-tag">
                    <Sparkles size={11} /> {isProductPage && product ? 'Live Item Help' : 'Fresh Help'}
                  </span>
                </div>
                <p className="popover-status-text">
                  {openStatus ? (
                    <span className="text-emerald">● Online • Fast assistance</span>
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
            {/* Context Product Card if on product details */}
            {isProductPage && product && (
              <div className="popover-product-card">
                {product.image && (
                  <img 
                    src={getAssetUrl(product.image)} 
                    alt={product.name} 
                    className="popover-product-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="popover-product-meta">
                  <span className="popover-product-badge">
                    <Sparkles size={10} /> Active Product
                  </span>
                  <div className="popover-product-title" title={product.name}>
                    {product.name}
                  </div>
                  <div className="popover-product-pricing">
                    <span className="popover-product-price">{formattedPrice}</span>
                    {productUnit && <span className="popover-product-unit">{productUnit}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Card: Chat with us */}
            <a
              href={getWhatsAppLink(primaryChatText)}
              target="_blank"
              rel="noopener noreferrer"
              className="popover-primary-card"
            >
              <div className="primary-icon-box">
                <MessageCircle size={20} />
              </div>
              <div className="popover-primary-info">
                <span className="primary-card-title">
                  {isProductPage && product ? 'Ask About This Product' : 'Live WhatsApp Chat'}
                </span>
                <span className="primary-card-subtitle">
                  {isProductPage && product ? 'Direct chat with store team' : PHONE_NUMBER}
                </span>
              </div>
              <ChevronRight size={18} className="primary-arrow" />
            </a>

            {/* Direct Call Button */}
            <a 
              href={`tel:${PHONE_NUMBER.replace(/\s+/g, '')}`} 
              className="popover-secondary-action"
            >
              <div className="secondary-icon-box phone-box">
                <PhoneCall size={16} />
              </div>
              <div className="secondary-info">
                <span className="secondary-label">Call Store Directly</span>
                <span className="secondary-val">{PHONE_NUMBER}</span>
              </div>
            </a>

            {/* Quick Inquiry Chips */}
            <div className="popover-quick-section">
              <div className="quick-header-row">
                <HelpCircle size={13} className="quick-info-icon" />
                <span className="quick-section-title">
                  {isProductPage && product ? 'Product Questions' : 'Quick Inquiries'}
                </span>
              </div>
              <div className="quick-chips-grid">
                {activeInquiries.map((item) => (
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
                  placeholder={isProductPage && product ? `Ask about ${productName}...` : "Type a message or inquiry..."}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="custom-msg-input"
                  aria-label="Custom inquiry message"
                />
                <button 
                  type="submit" 
                  className="custom-send-btn"
                  aria-label="Send inquiry"
                >
                  <Send size={14} />
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