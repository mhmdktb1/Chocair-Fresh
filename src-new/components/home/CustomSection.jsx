import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import './CustomSection.css';

const CustomSection = ({ data }) => {
  const navigate = useNavigate();

  if (!data || data.enabled === false) return null;

  const themeClass = data.theme ? `theme-${data.theme}` : 'theme-emerald';

  return (
    <section className={`custom-home-section ${themeClass}`} aria-label={data.title || 'Special Promotion'}>
      <div className="container custom-home-container">
        <div className="custom-home-card">
          <div className="custom-home-text">
            {data.badge && (
              <div className="custom-home-badge">
                <Sparkles size={14} className="custom-badge-icon" />
                <span>{data.badge}</span>
              </div>
            )}

            {data.title && <h2 className="custom-home-title">{data.title}</h2>}
            {data.subtitle && <p className="custom-home-subtitle">{data.subtitle}</p>}

            {data.ctaText && (
              <div className="custom-home-actions">
                <button 
                  type="button" 
                  className="custom-home-btn"
                  onClick={() => navigate(data.ctaLink || '/shop')}
                >
                  <span>{data.ctaText}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {data.image && (
            <div className="custom-home-visual">
              <img 
                src={data.image} 
                alt={data.title || 'Promotion'} 
                className="custom-home-img"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomSection;
