import React from 'react';
import { Apple, Cherry, Grape, Citrus } from 'lucide-react';
import './Loading.css';

const Loading = ({ fullScreen = true, text = "Picking the freshest items..." }) => {
  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="fruit-bowl">
        <div className="fruit apple">
          <Apple size={28} strokeWidth={2.5} />
        </div>
        <div className="fruit cherry">
          <Cherry size={28} strokeWidth={2.5} />
        </div>
        <div className="fruit grape">
          <Grape size={28} strokeWidth={2.5} />
        </div>
        <div className="fruit citrus">
          <Citrus size={28} strokeWidth={2.5} />
        </div>
        <div className="shadow"></div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default Loading;
