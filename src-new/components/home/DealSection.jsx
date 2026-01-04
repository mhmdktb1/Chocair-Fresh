import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { parseHighlightedText } from '../../utils/textUtils';
import './DealSection.css';

const DealSection = ({ data }) => {
  const navigate = useNavigate();
  const {
    title = "Organic Summer Berry Bundle",
    description = "Get a curated selection of our freshest strawberries, blueberries, and raspberries. Perfect for smoothies, desserts, or healthy snacking.",
    price = 29.99,
    image = ""
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

  return (
    <section className="deal-section">
      <div className="container">
        <div className="deal-wrapper">
          <div className="deal-content">
            <span className="deal-badge">Limited Time Offer</span>
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

            <div className="deal-price">
              <span className="old-price">$45.00</span>
              <span className="new-price">$29.99</span>
            </div>

            <Button variant="primary" size="large" onClick={() => navigate('/shop')} className="deal-btn">
              Claim Offer Now
            </Button>
          </div>

          <div className="deal-image-wrapper">
            <div className="deal-circle"></div>
            <img 
              src="https://images.unsplash.com/photo-1519999482648-25049ddd37b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Berry Bundle" 
              className="deal-img"
            />
            <div className="discount-tag">
              <span className="discount-amount">35%</span>
              <span className="discount-label">OFF</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealSection;