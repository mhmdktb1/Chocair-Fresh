import React, { useMemo, useState, useCallback } from 'react';
import { Sparkles, Leaf, Volume2, VolumeX } from 'lucide-react';
import { ProduceGameSprite } from './produceGameArt';
import './VisualBasket.css';

/**
 * Lightweight procedural sound synthesizer using Web Audio API.
 * Generates fresh "pop / plop" game sounds with zero external audio assets or bloat.
 */
const playPopSound = (pitch = 440) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignore audio error if user blocked auto-play
  }
};

const getDeterministicSeed = (str) => {
  if (!str) return 42;
  return String(str).split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
};

const calculateSlotPlacement = (index, total) => {
  const t = total <= 1 ? 0 : (index / (total - 1)) * 2 - 1;
  const xOffset = t * (total > 5 ? 124 : total > 3 ? 98 : 64);
  const yOffset = (t * t) * 16 - 12; // Natural parabolic curve into the straw bed
  const rotation = t * 15;
  const scale = total > 6 ? 0.85 : total > 4 ? 0.92 : 1.0;

  return {
    x: Math.round(xOffset),
    y: Math.round(yOffset),
    rotation: Math.round(rotation),
    scale: Number(scale.toFixed(2)),
    zIndex: Math.round(20 + (1 - Math.abs(t)) * 10)
  };
};

const VisualBasket = ({ cartItems = [] }) => {
  const [activeItemId, setActiveItemId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  // Capacity calculation (standard crate holds 8 items)
  const capacityPercent = Math.min(100, Math.round((totalItemCount / 8) * 100));

  const visualProduce = useMemo(() => {
    if (!cartItems.length) return [];
    
    // Sort items deterministically by ID/Name to prevent re-position hopping
    const sorted = [...cartItems].sort((a, b) => (a._id || a.name).localeCompare(b._id || b.name));
    
    return sorted.map((item, idx) => {
      const seed = getDeterministicSeed(item._id || item.name);
      const slot = calculateSlotPlacement(idx, sorted.length);
      
      const jitterX = (seed % 9) - 4;
      const jitterY = (seed % 7) - 3;
      const jitterRot = (seed % 11) - 5;

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

  const handleProduceClick = useCallback((id, name) => {
    if (soundEnabled) {
      const seed = getDeterministicSeed(name || 'fruit');
      const pitch = 380 + (seed % 260);
      playPopSound(pitch);
    }
    setActiveItemId(prev => prev === id ? null : id);
  }, [soundEnabled]);

  if (!cartItems.length) return null;

  return (
    <div className="game-harvest-crate-container" aria-label="Interactive 3D Farm Harvest Crate">
      {/* Background Soft Sunshine Radial Glow */}
      <div className="crate-sunshine-glow" />

      {/* Floating Organic Leaves */}
      <div className="crate-leaf leaf-left" aria-hidden="true">
        <Leaf size={18} />
      </div>
      <div className="crate-leaf leaf-right" aria-hidden="true">
        <Leaf size={15} />
      </div>

      {/* Main 3D Stage */}
      <div className="crate-3d-stage">
        
        {/* Layer 1: Crate Back Wall & Interior Shadow */}
        <div className="crate-back-wall">
          <div className="crate-interior-shadow" />
          <div className="crate-back-wood-slats" />
        </div>

        {/* Layer 2: Golden Straw / Hay Bedding Tufts */}
        <div className="crate-straw-bedding" aria-hidden="true">
          <span className="straw-tuft tuft-1" />
          <span className="straw-tuft tuft-2" />
          <span className="straw-tuft tuft-3" />
          <span className="straw-tuft tuft-4" />
          <span className="straw-tuft tuft-5" />
        </div>

        {/* Layer 3: Dynamic 3D Game Produce Stage */}
        <div className="crate-produce-stage">
          {visualProduce.map((item) => {
            const { x, y, rotation, scale, zIndex } = item.placement;
            const quantity = item.quantity || 1;
            const hasClusteredPeeks = quantity > 1;
            const isActive = activeItemId === item._id;

            return (
              <div
                key={item.uniqueKey}
                className={`crate-produce-node ${isActive ? 'is-active' : ''}`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg) scale(${scale})`,
                  zIndex: isActive ? 80 : zIndex
                }}
                onClick={() => handleProduceClick(item._id, item.name)}
                title={`${item.name} (${quantity} ${item.unit || 'qty'})`}
              >
                {/* Secondary Clustered Produce Peeks (Physical game-stacking when quantity > 1) */}
                {hasClusteredPeeks && (
                  <div className="produce-cluster-shadow-item" aria-hidden="true">
                    <ProduceGameSprite
                      name={item.name}
                      category={item.category}
                      image={item.image}
                      className="game-sprite-ghost"
                    />
                  </div>
                )}

                {/* Primary Game Vector Produce Sprite */}
                <div className="produce-sprite-wrapper">
                  <ProduceGameSprite
                    name={item.name}
                    category={item.category}
                    image={item.image}
                    className="game-sprite-main"
                  />
                  {quantity > 1 && (
                    <span className="produce-game-badge">
                      ×{quantity}
                    </span>
                  )}
                </div>

                {/* Tactical Game Tooltip Popup */}
                <div className="produce-game-tooltip">
                  <span className="tooltip-title">{item.name}</span>
                  <span className="tooltip-qty">{quantity} in crate</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Layer 4: 3D Front Wood Crate Face with Brass Corner Brackets & Engraved Plaque */}
        <div className="crate-front-facade">
          {/* Top Beveled Lip */}
          <div className="crate-top-lip" />

          {/* Front Timber Slats */}
          <div className="crate-front-slats">
            <div className="wood-slat slat-top" />
            <div className="wood-slat-gap" />
            <div className="wood-slat slat-bottom" />
          </div>

          {/* Brass Metal Corner Brackets & Rivets */}
          <div className="brass-bracket bracket-top-left"><span className="rivet" /></div>
          <div className="brass-bracket bracket-top-right"><span className="rivet" /></div>
          <div className="brass-bracket bracket-bottom-left"><span className="rivet" /></div>
          <div className="brass-bracket bracket-bottom-right"><span className="rivet" /></div>

          {/* Artisan Stenciled Brand Badge */}
          <div className="crate-brand-plaque">
            <Sparkles size={11} className="plaque-sparkle" />
            <span>Chocair Harvest</span>
          </div>
        </div>

        {/* Layer 5: Ground Ambient Occlusion Shadow */}
        <div className="crate-ground-shadow" />
      </div>

      {/* Crate Interactive Controls & Harvest Status Bar */}
      <div className="crate-control-bar">
        <div className="crate-status-pill">
          <span className="crate-icon">🧺</span>
          <span className="crate-fill-text">
            <strong>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</strong> in crate
          </span>
          <div className="crate-mini-gauge" title={`Crate capacity: ${capacityPercent}%`}>
            <div className="gauge-fill" style={{ width: `${capacityPercent}%` }} />
          </div>
        </div>

        {/* Mini Sound Toggle for Tactile Plop Audio */}
        <button
          type="button"
          className={`sound-toggle-btn ${soundEnabled ? 'on' : 'off'}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute harvest sound FX' : 'Enable harvest sound FX'}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>
    </div>
  );
};

export default VisualBasket;
