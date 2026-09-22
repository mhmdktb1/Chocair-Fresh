import React, { useState, useRef, useEffect } from 'react';
import { normalizeUnit, formatQuantityWithUnit } from '../../utils/unitHelper';
import './WeightScale.css';

const WeightScale = ({ isOpen, onClose, onConfirm, initialWeight = 1, pricePerUnit = 0, unit = '1kg' }) => {
  const normUnit = normalizeUnit(unit);
  const isWeight = ['1kg', '500g', '200g'].includes(normUnit);
  const baseKg = normUnit === '1kg' ? 1.0 : normUnit === '500g' ? 0.5 : normUnit === '200g' ? 0.2 : 1;

  // We operate in integer units (1, 2, 3, 4...)
  const [units, setUnits] = useState(Math.max(1, Math.round(initialWeight)));
  const scrollRef = useRef(null);

  // Configuration
  const MAX_UNITS = 20;
  const PIXELS_PER_UNIT = 80; // px per unit

  // Generate unit ticks
  const ticks = Array.from({ length: MAX_UNITS + 1 }, (_, i) => ({
    value: i,
    isMajor: true,
  }));

  // Sync scroll to units on open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const currentUnit = Math.max(1, Math.round(initialWeight));
      setUnits(currentUnit);
      scrollRef.current.scrollLeft = currentUnit * PIXELS_PER_UNIT;
    }
  }, [isOpen, initialWeight]);

  // Handle scroll to update units
  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    let newUnits = Math.round(scrollLeft / PIXELS_PER_UNIT);
    if (newUnits < 1) newUnits = 1;
    if (newUnits > MAX_UNITS) newUnits = MAX_UNITS;
    setUnits(newUnits);
  };

  const handleConfirm = () => {
    onConfirm(units);
  };

  if (!isOpen) return null;

  const totalWeightKg = (units * baseKg);
  const weightDisplay = isWeight 
    ? (totalWeightKg >= 1 ? `${totalWeightKg % 1 === 0 ? totalWeightKg.toFixed(0) : totalWeightKg.toFixed(1)} kg` : `${units * (baseKg * 1000)} g`)
    : formatQuantityWithUnit(units, normUnit);

  const totalPrice = (units * Number(pricePerUnit || 0)).toFixed(2);

  return (
    <div className="weight-scale-overlay" onClick={onClose}>
      <div className="weight-scale-modal" onClick={e => e.stopPropagation()}>
        <div className="scale-header">
          <h3>{isWeight ? 'Choose Produce Weight' : 'Choose Quantity'}</h3>
        </div>

        <div className="scale-display">
          <div>
            <span className="weight-value">{units}</span>
            <span className="weight-unit">× {normUnit} ({weightDisplay})</span>
          </div>
          <div className="calculated-price">
            Total: ${totalPrice}
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
                  style={{ width: `${PIXELS_PER_UNIT}px` }}
                >
                  <span className="scale-tick-label">{tick.value === 0 ? '' : tick.value}</span>
                </div>
              ))}
              {/* Extra padding to center last tick */}
              <div style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>

        <div className="scale-actions">
          <button className="scale-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="scale-btn confirm" onClick={handleConfirm}>
            Confirm Quantity
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightScale;
