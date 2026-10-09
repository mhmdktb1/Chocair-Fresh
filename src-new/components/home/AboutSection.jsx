import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle2, ShieldCheck, ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';
import { getStoryContent } from '../../utils/storyContent';
import './AboutSection.css';

const storyHighlights = [
  {
    id: 1,
    icon: Sprout,
    title: "Direct Farm Sourcing",
    desc: "Harvested fresh from trusted local partner farms."
  },
  {
    id: 2,
    icon: Sparkles,
    title: "Carefully Inspected",
    desc: "Hand-checked for ripeness, cleanliness, and crisp taste."
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "100% Freshness Promise",
    desc: "Delivered straight to your doorstep ready to enjoy."
  }
];

const AboutSection = ({ data }) => {
  const { title, lead, body, image, hasCustomImage } = getStoryContent(data);
  const years = data?.yearsOfService || '15+';

  return (
    <section id="about" className="home-story-section" aria-label="Our Story">
      <div className="container">
        <div className="story-scene-wrapper">
          
          {/* Visual Scene / Image Showcase */}
          <div className="story-visual-scene">
            <div className="story-image-container">
              <img 
                src={image} 
                alt={hasCustomImage ? '' : 'Farmer holding fresh produce'} 
                className="story-scene-img" 
                loading="lazy" 
                decoding="async"
              />
              <div className="story-scene-overlay" />
              
              {/* Floating Scene Badges for Mobile & Desktop */}
              <div className="story-floating-tag">
                <span className="story-tag-dot" />
                <span className="story-tag-text">Direct From Harvest</span>
              </div>

              <div className="story-badge-experience">
                <div className="badge-icon-wrap">
                  <HeartHandshake size={22} className="badge-icon" />
                </div>
                <div className="badge-info">
                  <span className="badge-years">{years}</span>
                  <span className="badge-sub">Years of Trust</span>
                </div>
              </div>
            </div>
          </div>

          {/* Story Narrative Content */}
          <div className="story-narrative-card">
            <div className="story-pre-badge">
              <Sprout size={15} />
              <span>Rooted In Freshness</span>
            </div>

            <h2 className="story-main-title">{title}</h2>
            
            <p className="story-lead-text">{lead}</p>
            <p className="story-body-text">{body}</p>

            {/* Micro Scene Highlights */}
            <div className="story-highlights-list">
              {storyHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="story-highlight-item">
                    <div className="highlight-icon-box">
                      <Icon size={18} />
                    </div>
                    <div className="highlight-text-box">
                      <h4 className="highlight-title">{item.title}</h4>
                      <p className="highlight-desc">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action link */}
            <div className="story-actions">
              <Link to="/about" className="story-cta-btn">
                <span>Read Full Story</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
