import React from 'react';
import { ShoppingBag, Sparkles, Leaf } from 'lucide-react';
import './Loading.css';

const Loading = ({ 
  fullScreen = true, 
  text = "Picking the freshest items...", 
  subtext = "Just a moment",
  size = "medium" 
}) => {
  return (
    <div className={`modern-loading-container ${fullScreen ? 'fullscreen' : 'inline'} size-${size}`}>
      <div className="modern-loader-wrapper">
        {/* Ambient Glow */}
        <div className="loader-glow-ring"></div>

        {/* Outer Smooth Spin Ring */}
        <div className="loader-orbit-ring">
          <div className="loader-orbit-dot"></div>
        </div>

        {/* Central Fresh Badge */}
        <div className="loader-badge-core">
          <ShoppingBag className="loader-main-icon" size={size === 'large' ? 32 : size === 'small' ? 20 : 26} strokeWidth={2.2} />
          <Sparkles className="loader-sparkle-icon" size={size === 'large' ? 16 : size === 'small' ? 10 : 13} />
          <Leaf className="loader-leaf-icon" size={size === 'large' ? 14 : size === 'small' ? 9 : 11} />
        </div>
      </div>

      {/* Text Info */}
      <div className="loader-text-wrap">
        <h3 className="loader-heading">{text}</h3>
        {subtext && <p className="loader-subheading">{subtext}</p>}
      </div>

      {/* Smooth Indeterminate Progress Bar */}
      <div className="loader-bar-track">
        <div className="loader-bar-fill"></div>
      </div>
    </div>
  );
};

export default Loading;
