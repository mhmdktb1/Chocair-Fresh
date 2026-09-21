import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle2, ShieldCheck, ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';
import './AboutSection.css';

const DEFAULT_LEAD = "We started with a simple idea: fresh produce should feel better from the moment you order it to the moment it reaches your kitchen.";
const DEFAULT_BODY = "At Chocair Fresh, we carefully select, check, and pack every order before it leaves us. We focus on the little details — choosing clean, good-looking pieces and packing them neatly so your order arrives the way you’d expect it to.";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1595855709915-445676d2f6cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

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
  const title = (data?.title && data.title !== 'Cultivating Goodness') ? data.title : 'Our Story';
  
  const isOldDefault = data?.description?.includes('bridging the gap between local farmers');
  const lead = (data?.lead || data?.subtitle) && !isOldDefault ? (data?.lead || data?.subtitle) : DEFAULT_LEAD;
  const body = (data?.description && !isOldDefault) ? data.description : DEFAULT_BODY;
  const image = data?.image || DEFAULT_IMAGE;
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
                alt="Chocair Fresh Farm Story" 
                className="story-scene-img" 
                loading="lazy" 
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
