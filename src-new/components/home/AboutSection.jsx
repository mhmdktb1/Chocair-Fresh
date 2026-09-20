import React from 'react';
import './AboutSection.css';

const DEFAULT_LEAD = "We started with a simple idea: fresh produce should feel better from the moment you order it to the moment it reaches your kitchen.";
const DEFAULT_BODY = "At Chocair Fresh, we carefully select, check, and pack every order before it leaves us. We focus on the little details — choosing clean, good-looking pieces and packing them neatly so your order arrives the way you’d expect it to.";

const AboutSection = ({ data }) => {
  const title = (data?.title && data.title !== 'Cultivating Goodness') ? data.title : 'Our Story';
  
  const isOldDefault = data?.description?.includes('bridging the gap between local farmers');
  const lead = (data?.lead && !isOldDefault) ? data.lead : DEFAULT_LEAD;
  const body = (data?.description && !isOldDefault) ? data.description : DEFAULT_BODY;

  return (
    <section id="about" className="home-story-section" aria-label="Our Story">
      <div className="container">
        <div className="story-card">
          <div className="story-header">
            <h2 className="story-title">{title}</h2>
          </div>
          <div className="story-content">
            <p className="story-lead">{lead}</p>
            <p className="story-body">{body}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
