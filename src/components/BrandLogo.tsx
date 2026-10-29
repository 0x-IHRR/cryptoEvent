import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 34 }) => {
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      {/* SVG Radar Hexagon Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105"
        aria-hidden="true"
      >
        {/* Background Hexagon Shield */}
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          fill="#111822"
          stroke="#1e3447"
          strokeWidth="1.5"
        />

        {/* Concentric Radar Rings */}
        <circle cx="20" cy="20" r="13" stroke="#25465e" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
        <circle cx="20" cy="20" r="8" stroke="#33668a" strokeWidth="1" opacity="0.8" />

        {/* Radar Crosshairs */}
        <line x1="20" y1="7" x2="20" y2="33" stroke="#234257" strokeWidth="1" strokeDasharray="1 2" />
        <line x1="7" y1="20" x2="33" y2="20" stroke="#234257" strokeWidth="1" strokeDasharray="1 2" />

        {/* Radar Scanning Sweep / Wedge */}
        <path
          d="M20,20 L32,13 A14,14 0 0,0 20,6 Z"
          fill="url(#radar-sweep)"
          opacity="0.85"
        />

        {/* Central Core & Target Dot */}
        <circle cx="20" cy="20" r="3.5" fill="#4ca6e1" />
        <circle cx="20" cy="20" r="1.5" fill="#ffffff" />

        {/* Detected Alpha Blip (Opportunity Signal) */}
        <circle cx="27" cy="15" r="2" fill="#38ef7d">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="radar-sweep" x1="20" y1="20" x2="32" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4ca6e1" stopOpacity="0.8" />
            <stop offset="1" stopColor="#4ca6e1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
