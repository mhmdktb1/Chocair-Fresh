import React from 'react';

/**
 * High-performance, zero-bloat vector game sprites for farm produce.
 * Pure SVG vectors with specular highlights, rim lights, stems, and leaf dew drops.
 * Weighs < 12KB total, scales infinitely with zero pixelation on Retina/OLED displays.
 */

export const ProduceGameSprite = ({ name = '', category = '', image = '', className = '' }) => {
  const query = `${name} ${category}`.toLowerCase();

  // 1. Apple (Red / Green)
  if (query.includes('apple') || query.includes('تفاح')) {
    const isGreen = query.includes('green');
    const baseGradId = isGreen ? 'greenAppleGrad' : 'redAppleGrad';
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="redAppleGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="45%" stopColor="#e02424" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#631010" />
          </radialGradient>
          <radialGradient id="greenAppleGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="45%" stopColor="#65a30d" />
            <stop offset="85%" stopColor="#3f6212" />
            <stop offset="100%" stopColor="#253e06" />
          </radialGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        {/* Stem */}
        <path d="M 50 25 C 48 12, 58 4, 62 2" fill="none" stroke="#543310" strokeWidth="4" strokeLinecap="round" />
        {/* Leaf */}
        <path d="M 53 18 C 66 10, 76 16, 73 26 C 63 28, 55 24, 53 18 Z" fill="url(#leafGrad)" />
        <path d="M 55 20 Q 64 20 71 24" fill="none" stroke="#14532d" strokeWidth="1" opacity="0.6" />
        {/* Apple Body */}
        <path
          d="M 50 30 C 35 22, 12 30, 16 60 C 19 82, 38 94, 50 90 C 62 94, 81 82, 84 60 C 88 30, 65 22, 50 30 Z"
          fill={`url(#${baseGradId})`}
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
        />
        {/* Specular Highlight Arc */}
        <path d="M 28 38 C 22 46, 22 58, 28 66" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
        <circle cx="34" cy="36" r="3" fill="#ffffff" opacity="0.7" />
        {/* Dew drop */}
        <circle cx="68" cy="58" r="2.5" fill="#ffffff" opacity="0.6" />
      </svg>
    );
  }

  // 2. Orange / Citrus / Mandarin
  if (query.includes('orange') || query.includes('mandarin') || query.includes('citrus') || query.includes('برتقال') || query.includes('يوسفي')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="orangeGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="35%" stopColor="#fb923c" />
            <stop offset="80%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
        </defs>
        {/* Stem Cap */}
        <circle cx="50" cy="18" r="4" fill="#65a30d" />
        <path d="M 50 18 L 47 11" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
        {/* Orange Body */}
        <circle cx="50" cy="54" r="38" fill="url(#orangeGrad)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.22))" />
        {/* Citrus Peel Pores & Texture */}
        <circle cx="36" cy="42" r="1.5" fill="#c2410c" opacity="0.4" />
        <circle cx="44" cy="48" r="1.2" fill="#c2410c" opacity="0.4" />
        <circle cx="32" cy="56" r="1.5" fill="#c2410c" opacity="0.4" />
        <circle cx="58" cy="42" r="1.2" fill="#c2410c" opacity="0.4" />
        {/* Specular Glow */}
        <ellipse cx="36" cy="38" rx="12" ry="7" transform="rotate(-30 36 38)" fill="#ffffff" opacity="0.35" />
        <circle cx="30" cy="32" r="2.5" fill="#ffffff" opacity="0.75" />
      </svg>
    );
  }

  // 3. Avocado
  if (query.includes('avocado') || query.includes('افوكادو')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="avoSkin" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#3f6212" />
            <stop offset="60%" stopColor="#1e3a0f" />
            <stop offset="100%" stopColor="#0f1f07" />
          </radialGradient>
          <radialGradient id="avoFlesh" cx="45%" cy="55%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#d9f99d" />
            <stop offset="85%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#3f6212" />
          </radialGradient>
          <radialGradient id="avoPit" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#713f12" />
            <stop offset="100%" stopColor="#3c1d06" />
          </radialGradient>
        </defs>
        {/* Avocado Outer Pear Shape */}
        <path
          d="M 50 14 C 36 14, 28 30, 25 48 C 21 68, 30 90, 50 90 C 70 90, 79 68, 75 48 C 72 30, 64 14, 50 14 Z"
          fill="url(#avoSkin)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
        />
        {/* Sliced Flesh */}
        <path
          d="M 50 20 C 39 20, 33 34, 30 49 C 27 65, 34 84, 50 84 C 66 84, 73 65, 70 49 C 67 34, 61 20, 50 20 Z"
          fill="url(#avoFlesh)"
        />
        {/* Golden Pit */}
        <circle cx="50" cy="58" r="16" fill="url(#avoPit)" />
        {/* Pit Specular */}
        <ellipse cx="44" cy="52" rx="4" ry="2" transform="rotate(-25 44 52)" fill="#ffffff" opacity="0.6" />
      </svg>
    );
  }

  // 4. Banana
  if (query.includes('banana') || query.includes('موز')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="15%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="95%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
        {/* Banana Stem */}
        <path d="M 22 28 C 18 20, 16 14, 18 10" stroke="#4d7c0f" strokeWidth="5" strokeLinecap="round" />
        {/* Banana Curve */}
        <path
          d="M 22 26 C 42 18, 78 30, 86 64 C 88 74, 82 84, 76 86 C 72 87, 68 81, 68 76 C 64 52, 42 36, 22 26 Z"
          fill="url(#bananaGrad)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.22))"
        />
        {/* Center Ridge line */}
        <path d="M 26 27 C 46 25, 72 40, 78 68" fill="none" stroke="#fef08a" strokeWidth="2.5" opacity="0.6" />
        {/* Bottom Tip */}
        <circle cx="76" cy="85" r="2.5" fill="#451a03" />
      </svg>
    );
  }

  // 5. Tomato / Pepper
  if (query.includes('tomato') || query.includes('pepper') || query.includes('طماطم') || query.includes('بندورة') || query.includes('فلفل')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="tomatoGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="85%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
        </defs>
        {/* Tomato Body */}
        <ellipse cx="50" cy="56" rx="38" ry="34" fill="url(#tomatoGrad)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))" />
        {/* 5-Star Green Calyx Sepals */}
        <g fill="#15803d" stroke="#14532d" strokeWidth="0.8">
          <path d="M 50 26 L 40 18 L 46 28 Z" />
          <path d="M 50 26 L 60 18 L 54 28 Z" />
          <path d="M 50 26 L 34 28 L 44 32 Z" />
          <path d="M 50 26 L 66 28 L 56 32 Z" />
          <path d="M 50 26 L 50 36 L 46 30 Z" />
        </g>
        <path d="M 50 26 L 52 14" stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
        {/* Highlights */}
        <ellipse cx="34" cy="44" rx="10" ry="6" transform="rotate(-25 34 44)" fill="#ffffff" opacity="0.5" />
        <circle cx="28" cy="40" r="2.5" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }

  // 6. Lettuce / Greens / Herbs / Cabbage
  if (query.includes('lettuce') || query.includes('greens') || query.includes('herb') || query.includes('cabbage') || query.includes('خس') || query.includes('ملفوف') || query.includes('نعناع') || query.includes('بقدونس')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="lettuceCenter" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="60%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </radialGradient>
        </defs>
        {/* Back Leaves */}
        <path d="M 20 40 C 15 15, 45 10, 50 25 C 55 10, 85 15, 80 40 C 95 60, 75 90, 50 85 C 25 90, 5 60, 20 40 Z" fill="#3f6212" opacity="0.7" />
        {/* Main Lettuce Head with Ruffled Edges */}
        <path
          d="M 26 42 C 20 24, 46 18, 50 32 C 54 18, 80 24, 74 42 C 86 58, 70 82, 50 78 C 30 82, 14 58, 26 42 Z"
          fill="url(#lettuceCenter)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
        />
        {/* Core Ruffles */}
        <path d="M 38 48 C 36 38, 48 34, 50 42 C 52 34, 64 38, 62 48 C 68 58, 56 68, 50 66 C 44 68, 32 58, 38 48 Z" fill="#ecfccb" />
        <path d="M 50 44 L 50 64" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Carrot
  if (query.includes('carrot') || query.includes('جزر')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        {/* Green Top Frills */}
        <path d="M 65 24 C 68 8, 80 4, 85 2" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
        <path d="M 65 24 C 76 12, 88 16, 92 12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 65 24 C 70 18, 78 22, 82 20" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        {/* Tapered Carrot Body */}
        <path
          d="M 55 24 C 68 18, 75 28, 68 36 L 24 88 C 21 92, 17 90, 16 86 L 36 38 C 42 28, 48 24, 55 24 Z"
          fill="url(#carrotGrad)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.22))"
        />
        {/* Ridge Creases */}
        <path d="M 48 36 L 56 42" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 38 52 L 46 58" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 28 68 L 34 74" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        {/* Specular */}
        <path d="M 54 28 L 38 48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  // 8. Strawberry / Berry
  if (query.includes('strawberr') || query.includes('berry') || query.includes('فراولة') || query.includes('توت')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="berryGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="40%" stopColor="#e11d48" />
            <stop offset="85%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>
        </defs>
        {/* Strawberry Cone Heart */}
        <path
          d="M 50 86 C 36 78, 20 54, 24 38 C 26 26, 44 26, 50 32 C 56 26, 74 26, 76 38 C 80 54, 64 78, 50 86 Z"
          fill="url(#berryGrad)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
        />
        {/* Green Crown */}
        <path d="M 50 32 L 40 18 L 46 30 L 32 26 L 44 34 L 50 32 Z" fill="#22c55e" />
        <path d="M 50 32 L 60 18 L 54 30 L 68 26 L 56 34 L 50 32 Z" fill="#16a34a" />
        <circle cx="50" cy="18" r="2" fill="#15803d" />
        {/* Seeds */}
        {[
          [40, 42], [50, 40], [60, 42],
          [34, 52], [44, 52], [54, 52], [64, 52],
          [40, 64], [50, 64], [60, 64],
          [46, 74], [54, 74]
        ].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="1.5" ry="2.2" fill="#fef08a" opacity="0.85" transform={`rotate(10 ${cx} ${cy})`} />
        ))}
      </svg>
    );
  }

  // 9. Lemon / Lime
  if (query.includes('lemon') || query.includes('lime') || query.includes('ليمون') || query.includes('حامض')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="lemonGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
        </defs>
        {/* Lemon Pointed Oval */}
        <path
          d="M 18 50 C 24 32, 40 24, 56 24 C 74 24, 84 38, 88 50 C 84 62, 74 76, 56 76 C 40 76, 24 68, 18 50 Z"
          fill="url(#lemonGrad)"
          transform="rotate(-25 50 50)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.22))"
        />
        {/* Highlight */}
        <ellipse cx="44" cy="40" rx="14" ry="7" transform="rotate(-35 44 40)" fill="#ffffff" opacity="0.45" />
        <circle cx="36" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }

  // 10. Watermelon / Melon
  if (query.includes('watermelon') || query.includes('melon') || query.includes('بطيخ') || query.includes('شمام')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="melonGrad" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="70%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>
        </defs>
        {/* Rind Outer */}
        <path d="M 14 34 C 28 82, 72 82, 86 34 Z" fill="#15803d" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))" />
        {/* White Pith */}
        <path d="M 18 36 C 30 78, 70 78, 82 36 Z" fill="#f0fdf4" />
        {/* Red Juicy Flesh */}
        <path d="M 22 38 C 32 74, 68 74, 78 38 Z" fill="url(#melonGrad)" />
        {/* Black Seeds */}
        {[[36, 48], [48, 54], [60, 48], [42, 62], [54, 62]].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="2" ry="3" fill="#18181b" transform={`rotate(${i % 2 === 0 ? 15 : -15} ${cx} ${cy})`} />
        ))}
      </svg>
    );
  }

  // 11. Grapes
  if (query.includes('grape') || query.includes('عنب')) {
    return (
      <svg viewBox="0 0 100 100" className={`game-produce-svg ${className}`}>
        <defs>
          <radialGradient id="grapeGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>
        </defs>
        {/* Stem */}
        <path d="M 50 18 C 50 10, 58 6, 62 4" stroke="#543310" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Cluster of Grapes */}
        {[
          [50, 28, 9], [40, 36, 9.5], [60, 36, 9.5], [50, 44, 10],
          [34, 48, 9], [66, 48, 9], [44, 56, 9.5], [56, 56, 9.5],
          [50, 68, 9], [50, 80, 7.5]
        ].map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="url(#grapeGrad)" />
            <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.25} fill="#ffffff" opacity="0.4" />
          </g>
        ))}
      </svg>
    );
  }

  // Fallback: 3D Artisan Produce Badge with stenciled product image
  return (
    <div className={`game-produce-fallback-badge ${className}`}>
      <div className="fallback-badge-rim">
        <img
          src={image || '/assets/images/products/apple-red.jpg'}
          alt={name}
          className="fallback-badge-img"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};
