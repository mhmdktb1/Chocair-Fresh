import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Sparkles, ArrowRight, Gift, Flame } from 'lucide-react';
import { toast } from 'react-toastify';
import './PromoBanners.css';

const PromoBanners = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code) => {
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
          <div className="promo-card promo-card-green" onClick={() => navigate('/shop?category=Organic')}>
            <div className="promo-card-content">
              <div className="promo-tag-row">
                <span className="promo-badge-pill">
                  <Flame size={12} className="badge-flame-icon" /> Hot Offer
                </span>
                <span className="promo-discount-tag">Save 25%</span>
              </div>
              <h3 className="promo-title">Weekly Organic Harvest Box</h3>
              <p className="promo-desc">Freshly harvested local vegetables & berries</p>
              <div className="promo-cta-row">
                <span className="promo-shop-link">
                  <span>Shop Box</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
            <div className="promo-card-graphic" aria-hidden="true">
              <span className="promo-emoji">🥗</span>
            </div>
          </div>

          {/* Promo Card 2: 1-Tap Coupon Voucher */}
          <div className="promo-card promo-card-orange">
            <div className="promo-card-content">
              <div className="promo-tag-row">
                <span className="promo-badge-pill orange-pill">
                  <Gift size={12} /> New Customer
                </span>
                <span className="promo-discount-tag orange-tag">$10 OFF</span>
              </div>
              <h3 className="promo-title">Use Code at Checkout</h3>
              <p className="promo-desc">Valid on your first order over $35</p>
              
              <div className="coupon-copy-box">
                <span className="coupon-code-text">FRESH30</span>
                <button 
                  type="button" 
                  className="coupon-copy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode('FRESH30');
                  }}
                  aria-label="Copy coupon code FRESH30"
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
              <span className="promo-emoji">🎟️</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
