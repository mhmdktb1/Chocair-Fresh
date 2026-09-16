import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Sparkles, ArrowRight, Gift, Flame } from 'lucide-react';
import { toast } from 'react-toastify';
import './PromoBanners.css';

const PromoBanners = ({ data }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const boxCard = data?.boxCard || {
    badge: 'Hot Offer',
    discountTag: 'Save 25%',
    title: 'Weekly Organic Harvest Box',
    description: 'Freshly harvested local vegetables & berries',
    ctaText: 'Shop Box',
    ctaLink: '/shop?category=Organic',
    emoji: '🥗'
  };

  const couponCard = data?.couponCard || {
    badge: 'New Customer',
    discountTag: '$10 OFF',
    title: 'Use Code at Checkout',
    description: 'Valid on your first order over $35',
    code: 'FRESH30',
    emoji: '🎟️'
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="promo-banners-section" aria-label="Special Offers">
      <div className="container">
        <div className="promo-banners-grid">
          {/* Promo Card 1: Seasonal Harvest Mix */}
          <div 
            className="promo-card promo-card-green" 
            onClick={() => navigate(boxCard.ctaLink || '/shop?category=Organic')}
            role="button"
            tabIndex={0}
          >
            <div className="promo-card-content">
              <div className="promo-tag-row">
                <span className="promo-badge-pill">
                  <Flame size={12} className="badge-flame-icon" /> {boxCard.badge || 'Hot Offer'}
                </span>
                <span className="promo-discount-tag">{boxCard.discountTag || 'Save 25%'}</span>
              </div>
              <h3 className="promo-title">{boxCard.title || 'Weekly Organic Harvest Box'}</h3>
              <p className="promo-desc">{boxCard.description || 'Freshly harvested local vegetables & berries'}</p>
              <div className="promo-cta-row">
                <span className="promo-shop-link">
                  <span>{boxCard.ctaText || 'Shop Box'}</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
            <div className="promo-card-graphic" aria-hidden="true">
              <span className="promo-emoji">{boxCard.emoji || '🥗'}</span>
            </div>
          </div>

          {/* Promo Card 2: 1-Tap Coupon Voucher */}
          <div className="promo-card promo-card-orange">
            <div className="promo-card-content">
              <div className="promo-tag-row">
                <span className="promo-badge-pill orange-pill">
                  <Gift size={12} /> {couponCard.badge || 'New Customer'}
                </span>
                <span className="promo-discount-tag orange-tag">{couponCard.discountTag || '$10 OFF'}</span>
              </div>
              <h3 className="promo-title">{couponCard.title || 'Use Code at Checkout'}</h3>
              <p className="promo-desc">{couponCard.description || 'Valid on your first order over $35'}</p>
              
              <div className="coupon-copy-box">
                <span className="coupon-code-text">{couponCard.code || 'FRESH30'}</span>
                <button 
                  type="button" 
                  className="coupon-copy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(couponCard.code || 'FRESH30');
                  }}
                  aria-label={`Copy coupon code ${couponCard.code || 'FRESH30'}`}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="copied-icon" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="promo-card-graphic" aria-hidden="true">
              <span className="promo-emoji">{couponCard.emoji || '🎟️'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
