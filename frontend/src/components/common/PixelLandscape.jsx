import React from 'react';

/**
 * Атмосферный пиксельный пейзаж (горы, сосны, озеро, сторожевая башня)
 * Создаёт ощущение ретро-фэнтези RPG внизу экрана
 */
export function PixelLandscape({ className = '' }) {
  return (
    <div
      className={`pixel-landscape-wrapper ${className}`}
      style={{
        width: '100%',
        height: '130px',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
        marginTop: 'auto',
        opacity: 0.85,
      }}
    >
      <svg
        viewBox="0 0 360 120"
        preserveAspectRatio="xMidYMax slice"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          shapeRendering: 'crispEdges',
        }}
      >
        <defs>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfa970" stopOpacity="0" />
            <stop offset="60%" stopColor="#b58d59" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8a673c" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Солнце / Луна */}
        <circle cx="230" cy="45" r="14" fill="#dfbe88" opacity="0.6" />

        {/* Дальние горы */}
        <polygon
          points="20,75 75,35 130,75 190,40 250,80 300,48 350,85 360,85 360,120 0,120 0,85"
          fill="#9e7b4b"
          opacity="0.5"
        />

        {/* Средний хребет гор */}
        <polygon
          points="0,85 45,55 90,88 150,58 210,92 280,62 340,95 360,95 360,120 0,120"
          fill="#7d5c34"
          opacity="0.65"
        />

        {/* Туманная гладь воды / долины */}
        <rect x="0" y="85" width="360" height="35" fill="url(#mist)" />

        {/* Сторожевая башня справа */}
        <g opacity="0.75" fill="#4d3720">
          <rect x="296" y="58" width="14" height="2" />
          <rect x="298" y="52" width="10" height="6" />
          <polygon points="296,52 303,42 310,52" />
          <rect x="299" y="60" width="8" height="28" />
          <rect x="295" y="88" width="16" height="4" />
        </g>

        {/* Силуэты соснового леса (пиксельные зубцы) */}
        <polygon
          points="
            0,120 0,88 8,76 16,88 22,78 30,90 40,74 48,88 
            55,80 62,92 70,75 80,94 92,72 102,90 115,82 125,95
            140,84 150,96 165,86 175,98 190,88 200,99 215,85
            230,98 245,82 258,95 270,78 285,96 300,84 315,98
            330,76 345,92 360,80 360,120
          "
          fill="#44321d"
        />

        {/* Ближний тёмный ярус леса */}
        <polygon
          points="
            0,120 0,98 12,86 24,100 36,88 48,102 60,85 74,104
            90,87 105,106 120,92 135,105 150,89 170,108 
            280,105 295,90 310,108 330,88 345,104 360,92 360,120
          "
          fill="#2b1d12"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
