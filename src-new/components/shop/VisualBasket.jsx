import React, { useMemo, useState } from 'react';
import { Sparkles, Leaf } from 'lucide-react';
import './VisualBasket.css';

/**
 * Deterministic hash-based placement generator to ensure stable positions for items
 * across re-renders while giving an organic, hand-arranged harvest basket feel.
 */
const getSeed = (str) => {
  if (!str) return 42;
  return String(str).split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
};

const calculateSlotPlacement = (index, total) => {
  // Compute normalized horizontal angle [-1 to 1]
  const t = total <= 1 ? 0 : (index / (total - 1)) * 2 - 1;
  
  // Arch curve formula: items in the center sit lower, edges flare outward slightly
  const xOffset = t * (total > 5 ? 120 : total > 3 ? 95 : 60);
  const yOffset = (t * t) * 18 - 8; // gentle parabola
  const rotation = t * 14; // natural tilt outward
  const baseScale = total > 6 ? 0.82 : total > 4 ? 0.9 : 1.0;
  
  return {
    x: Math.round(xOffset),
    y: Math.round(yOffset),
    rotation: Math.round(rotation),
    scale: baseScale,
    zIndex: Math.round(20 + (1 - Math.abs(t)) * 10) // center items can stack naturally
  };
};

const VisualBasket = ({ cartItems = [] }) => {
  const [activeItemId, setActiveItemId] = useState(null);

  const totalCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  // Generate visual representations for cart items with organic staggering
  const visualProduce = useMemo(() => {
    if (!cartItems.length) return [];
    
    // Sort items deterministically so they don't jump on quantity change
    const sorted = [...cartItems].sort((a, b) => (a._id || a.name).localeCompare(b._id || b.name));
    
    return sorted.map((item, idx) => {
      const seed = getSeed(item._id || item.name);
      const slot = calculateSlotPlacement(idx, sorted.length);
      
      // Add subtle micro-jitter from seed
      const jitterX = ((seed % 11) - 5);
      const jitterY = ((seed % 9) - 4);
      const jitterRot = ((seed % 13) - 6);
      
      return {
        ...item,
        uniqueKey: item._id || `${item.name}-${idx}`,
        placement: {
          x: slot.x + jitterX,
          y: slot.y + jitterY,
          rotation: slot.rotation + jitterRot,
          scale: slot.scale,
          zIndex: slot.zIndex + (idx % 3)
        }
      };
    });
  }, [cartItems]);

  if (!cartItems.length) return null;

  return (
    <div className="visual-harvest-basket-container" aria-label="Visual Harvest Basket">
      {/* Background Ambience Glow */}
      <div className="basket-ambient-glow" />

      <div className="basket-stage">
        {/* Decorative Floating Fresh Leaves */}
        <div className="basket-leaf leaf-left">
          <Leaf size={18} />
        </div>
        <div className="basket-leaf leaf-right">
          <Leaf size={15} />
        </div>

        {/* 1. Back Basket Layer (Inner cavity & Back handles/rim) */}
        <div className="basket-layer-back">
          <svg viewBox="0 0 340 120" className="basket-back-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="basketBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a2e12" />
                <stop offset="60%" stopColor="#382109" />
                <stop offset="100%" stopColor="#241403" />
              </linearGradient>
              <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8c5828" />
                <stop offset="50%" stopColor="#b3783e" />
                <stop offset="100%" stopColor="#6e4219" />
              </linearGradient>
            </defs>
            {/* Woven Back Handle Arch */}
            <path
              d="M 60 85 C 60 -15, 280 -15, 280 85"
              fill="none"
              stroke="url(#handleGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              className="basket-handle-back"
            />
            {/* Back Inner Shadow Bowl */}
            <ellipse cx="170" cy="88" rx="145" ry="32" fill="url(#basketBackGrad)" />
          </svg>
        </div>

        {/* 2. Middle Layer: Dynamic Interactive Produce */}
        <div className="basket-produce-canvas">
          {visualProduce.map((item) => {
            const { x, y, rotation, scale, zIndex } = item.placement;
            const hasMultiQty = (item.quantity || 1) > 1;
            const isActive = activeItemId === item._id;

            return (
              <div
                key={item.uniqueKey}
                className={`basket-produce-item ${isActive ? 'is-active' : ''}`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg) scale(${scale})`,
                  zIndex: isActive ? 60 : zIndex
                }}
                onClick={() => setActiveItemId(isActive ? null : item._id)}
                title={`${item.name} (${item.quantity} ${item.unit || 'qty'})`}
              >
                {/* Visual Stack Shadow if quantity > 1 */}
                {hasMultiQty && (
                  <div className="produce-peek-ghost" aria-hidden="true">
                    <img
                      src={item.image}
                      alt=""
                      className="produce-img ghost-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Primary Produce Image */}
                <div className="produce-disc">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="produce-img"
                    onError={(e) => {
                      e.target.src = '/assets/images/products/apple-red.jpg';
                    }}
                  />
                  {hasMultiQty && (
                    <span className="produce-qty-pill">
                      ×{item.quantity}
                    </span>
                  )}
                </div>

                {/* Item Mini Tooltip Bubble on tap / hover */}
                <div className="produce-hover-label">
                  <span className="produce-label-name">{item.name}</span>
                  <span className="produce-label-qty">Qty: {item.quantity}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Front Basket Layer (Woven Wicker Body & Front Rim Lip) */}
        <div className="basket-layer-front">
          <svg viewBox="0 0 340 160" className="basket-front-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="basketFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d89b53" />
                <stop offset="35%" stopColor="#ba7d38" />
                <stop offset="85%" stopColor="#8d561d" />
                <stop offset="100%" stopColor="#63390d" />
              </linearGradient>
              
              <linearGradient id="rimHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffdda1" />
                <stop offset="50%" stopColor="#c58842" />
                <stop offset="100%" stopColor="#824f1b" />
              </linearGradient>

              <pattern id="wickerWeave" width="24" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 6 0, 12 10 T 24 10" fill="none" stroke="#683d12" strokeWidth="2.5" opacity="0.45" />
                <path d="M 0 20 Q 6 10, 12 20 T 24 20" fill="none" stroke="#683d12" strokeWidth="2.5" opacity="0.45" />
                <path d="M 6 0 L 6 20 M 18 0 L 18 20" fill="none" stroke="#522f0c" strokeWidth="1.8" opacity="0.3" />
              </pattern>
            </defs>

            {/* Front Basket Shell */}
            <path
              d="M 12 24 C 18 100, 48 152, 170 152 C 292 152, 322 100, 328 24 C 280 40, 60 40, 12 24 Z"
              fill="url(#basketFrontGrad)"
              className="basket-body-shape"
            />

            {/* Wicker Pattern Texture */}
            <path
              d="M 14 26 C 20 98, 48 148, 170 148 C 292 148, 320 98, 326 26 C 280 40, 60 40, 14 26 Z"
              fill="url(#wickerWeave)"
            />

            {/* Front Lip Braided Rim */}
            <ellipse
              cx="170"
              cy="24"
              rx="158"
              ry="16"
              fill="none"
              stroke="url(#rimHighlightGrad)"
              strokeWidth="9"
              className="basket-rim-braid"
            />
          </svg>

          {/* Wooden Store Tag Badge */}
          <div className="basket-brand-badge">
            <Sparkles size={13} className="badge-sparkle" />
            <span>Farm Harvest</span>
          </div>
        </div>

        {/* Floor Shadow Under Basket */}
        <div className="basket-ground-shadow" />
      </div>

      {/* Responsive Freshness Status Bar */}
      <div className="basket-status-bar">
        <span className="basket-count-chip">
          🧺 {totalCount} {totalCount === 1 ? 'item' : 'items'} in your fresh basket
        </span>
        <span className="basket-hint-chip">
          Packed with organic care
        </span>
      </div>
    </div>
  );
};

export default VisualBasket;
