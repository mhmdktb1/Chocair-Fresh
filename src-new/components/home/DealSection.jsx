import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
import Button from '../common/Button';
import { parseHighlightedText } from '../../utils/textUtils';
import './DealSection.css';

const DealSection = ({ data }) => {
  const navigate = useNavigate();
  const {
    title = "Organic Summer Berry Bundle",
    description = "Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking.",
    price = 29.99,
    originalPrice = 45.00,
    saveAmount = "Save $15.01",
    claimedPercentage = 84,
    stockLeftText = "Only 16 bundles left",
    image = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80",
    link = "/shop?discount=true"
  } = data || {};

  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset for demo purposes
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const discountPercent = originalPrice && price && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 30;

  const displaySaveAmount = saveAmount || (originalPrice && price && originalPrice > price
    ? `Save $${(originalPrice - price).toFixed(2)}`
    : null);

  return (
    <section className="deal-section" aria-label="Limited Time Offer">
      <div className="container">
        <div className="deal-wrapper">
          <div className="deal-content">
            <div className="deal-badge-row">
              <span className="deal-badge">
                <Flame size={14} className="deal-flame" /> Flash Deal
              </span>
              <span className="deal-tag-sub">Ends Soon</span>
            </div>

            <h2 className="deal-title">{parseHighlightedText(title)}</h2>
            <p className="deal-desc">
              {description}
            </p>
            
            <div className="deal-timer">
              <div className="timer-block">
                <span className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="timer-label">Hours</span>
              </div>
              <div className="timer-separator">:</div>
              <div className="timer-block">
                <span className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="timer-label">Mins</span>
              </div>
              <div className="timer-separator">:</div>
              <div className="timer-block">
                <span className="timer-value highlight-timer">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="timer-label">Secs</span>
              </div>
            </div>

            {/* Deal Stock / Progress Meter */}
            <div className="deal-progress-box">
              <div className="deal-progress-info">
                <span>🔥 <strong>{claimedPercentage}% Claimed</strong></span>
                <span className="deal-stock-left">{stockLeftText}</span>
              </div>
              <div className="deal-progress-track">
                <div className="deal-progress-fill" style={{ width: `${Math.min(100, Math.max(0, claimedPercentage))}%` }}></div>
              </div>
            </div>

            <div className="deal-price">
              {originalPrice && <span className="old-price">${Number(originalPrice).toFixed(2)}</span>}
              <span className="new-price">${Number(price).toFixed(2)}</span>
              {displaySaveAmount && <span className="deal-save-pill">{displaySaveAmount}</span>}
            </div>

            <Button variant="primary" size="large" onClick={() => navigate(link || '/shop?discount=true')} className="deal-btn">
              <ShoppingBag size={18} />
              <span>Claim Offer Now</span>
              <ArrowRight size={18} />
            </Button>
          </div>

          <div className="deal-image-wrapper">
            <div className="deal-circle"></div>
            <img 
              src={image || "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80"} 
              alt={title || "Deal Bundle"} 
              className="deal-img"
              loading="lazy"
            />
            {discountPercent > 0 && (
              <div className="discount-tag">
                <span className="discount-amount">{discountPercent}%</span>
                <span className="discount-label">OFF</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealSection;