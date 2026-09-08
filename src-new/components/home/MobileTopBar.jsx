import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronDown, Clock, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import './MobileTopBar.css';

const MobileTopBar = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const handleQuickCategory = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="mobile-top-bar-wrapper">
      {/* Location & Speed Header */}
      <div className="mobile-location-strip">
        <div className="location-info">
          <div className="location-pin-box">
            <MapPin size={14} className="location-pin-icon" />
          </div>
          <div className="location-text-group">
            <div className="location-title">
              <span>Deliver to <strong>Organic City, CA</strong></span>
              <ChevronDown size={13} className="location-chevron" />
            </div>
            <div className="delivery-time-pill">
              <Clock size={10} />
              <span>25–35 mins</span>
            </div>
          </div>
        </div>

        <div className="mobile-top-badge" onClick={() => navigate('/shop?discount=true')}>
          <Sparkles size={12} />
          <span>Offers</span>
        </div>
      </div>

      {/* Embedded Modern Search Bar */}
      <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
        <div className="mobile-search-box">
          <Search size={18} className="search-box-icon" />
          <input
            type="text"
            className="mobile-search-input"
            placeholder="Search 'fresh strawberries', 'avocados', 'milk'..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Search products"
          />
          {searchValue ? (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => setSearchValue('')}
            >
              ✕
            </button>
          ) : (
            <button type="submit" className="search-submit-pill">
              Go
            </button>
          )}
        </div>
      </form>

      {/* Micro Perks Strip */}
      <div className="mobile-perks-ticker" role="region" aria-label="Store Benefits">
        <div className="ticker-track">
          <div className="perk-pill">
            <span className="perk-icon">⚡</span>
            <span>Same-Day 30m Express</span>
          </div>
          <div className="perk-pill">
            <span className="perk-icon">🌿</span>
            <span>100% Farm Fresh Direct</span>
          </div>
          <div className="perk-pill">
            <span className="perk-icon">🏷️</span>
            <span>Use <strong>FRESH30</strong> for 30% Off</span>
          </div>
          <div className="perk-pill">
            <span className="perk-icon">🛡️</span>
            <span>Money-Back Freshness Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;
