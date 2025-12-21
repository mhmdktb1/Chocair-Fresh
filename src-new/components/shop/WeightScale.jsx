import React, { useState, useRef, useEffect } from 'react';
import './WeightScale.css';

const WeightScale = ({ isOpen, onClose, onConfirm, initialWeight = 1.0, pricePerUnit, unit = 'kg' }) => {
  const [weight, setWeight] = useState(initialWeight);
  const scrollRef = useRef(null);
  
  // Configuration
  const MAX_WEIGHT = 20; // kg
  const TICK_STEP = 0.1; // kg per tick
  const PIXELS_PER_TICK = 20; // px
  const TICKS_PER_UNIT = 1 / TICK_STEP; // 10
  const PIXELS_PER_UNIT = PIXELS_PER_TICK * TICKS_PER_UNIT; // 200px per kg

  // Generate ticks
  const totalTicks = Math.ceil(MAX_WEIGHT / TICK_STEP);
  const ticks = Array.from({ length: totalTicks + 1 }, (_, i) => {
    const value = i * TICK_STEP;
    const isMajor = i % TICKS_PER_UNIT === 0; // Every 1.0
    return { value, isMajor };
  });

  // Sync scroll to weight on open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const scrollPos = initialWeight * PIXELS_PER_UNIT;
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, [isOpen, initialWeight, PIXELS_PER_UNIT]);

  // Handle scroll to update weight
  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    // Calculate weight based on scroll position
    let newWeight = scrollLeft / PIXELS_PER_UNIT;
    
    // Clamp
    if (newWeight < 0) newWeight = 0;
    if (newWeight > MAX_WEIGHT) newWeight = MAX_WEIGHT;
    
    // Round to 1 decimal place for display, but keep precision for smoothness? 
    // Actually, let's snap to nearest 0.1 visually or just display rounded
    setWeight(newWeight);
  };

  const handleConfirm = () => {
    // Round to 2 decimal places before confirming
    onConfirm(parseFloat(weight.toFixed(2)));
  };

  if (!isOpen) return null;

  return (
    <div className="weight-scale-overlay" onClick={onClose}>
      <div className="weight-scale-modal" onClick={e => e.stopPropagation()}>
        <div className="scale-header">
          <h3>Choose Weight</h3>
        </div>

        <div className="scale-display">
          <div>
            <span className="weight-value">{weight.toFixed(2)}</span>
            <span className="weight-unit">{unit}</span>
          </div>
          <div className="calculated-price">
            Total: ${(weight * pricePerUnit).toFixed(2)}
          </div>
        </div>

        <div className="scale-container">
          <div className="scale-pointer"></div>
          <div 
            className="scale-scroll-area" 
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className="scale-ruler">
              {ticks.map((tick, i) => (
                <div 
                  key={i} 
                  className={`scale-tick ${tick.isMajor ? 'major' : 'minor'}`}
                >
                  {tick.isMajor && (
                    <span className="scale-tick-label">{tick.value.toFixed(0)}</span>
                  )}
                </div>
              ))}
              {/* Add extra padding at the end to allow scrolling to the last tick */}
              <div style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>

        <div className="scale-actions">
          <button className="scale-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="scale-btn confirm" onClick={handleConfirm}>
            Confirm Weight
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightScale;
