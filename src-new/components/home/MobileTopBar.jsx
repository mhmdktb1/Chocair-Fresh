import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronDown, Clock, Sparkles, Tag, ShieldCheck, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../utils/translations';
import './MobileTopBar.css';

const MobileTopBar = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage, theme, toggleTheme, isDark } = useTheme();
  const t = translations[language] || translations.en;
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
      {/* Location, Speed & Quick Lang/Theme Strip */}
      <div className="mobile-location-strip">
        <div className="location-info">
          <div className="location-pin-box">
            <MapPin size={14} className="location-pin-icon" />
          </div>
          <div className="location-text-group">
            <div className="location-title">
              <span>{t.deliverTo} <strong>Beirut, Lebanon</strong></span>
              <ChevronDown size={13} className="location-chevron" />
            </div>
            <div className="delivery-time-pill">
              <Clock size={10} />
              <span>25–35 {t.mins}</span>
            </div>
          </div>
        </div>

        <div className="mobile-top-actions-group">
          <button 
            type="button" 
            className="mobile-lang-pill-btn"
            onClick={toggleLanguage}
            title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe size={11} />
            <span>{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          <button 
            type="button" 
            className="mobile-theme-pill-btn"
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
          </button>

          <div className="mobile-top-badge" onClick={() => navigate('/shop?discount=true')}>
            <Sparkles size={12} />
            <span>{t.offers}</span>
          </div>
        </div>
      </div>

      {/* Embedded Modern Search Bar */}
      <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
        <div className="mobile-search-box">
          <Search size={18} className="search-box-icon" />
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t.searchPlaceholder}
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
              {t.search}
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
