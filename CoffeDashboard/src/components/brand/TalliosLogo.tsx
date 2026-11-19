import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const TalliosLogo: React.FC<LogoProps> = ({ collapsed = false, className = '' }) => {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`} title="Tallio's Coffee & Tea Co">
        {/* French Press with 'T' Icon in #1C2C60 & #C68A4C */}
        <svg width="28" height="32" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top Knob & Plunger Lid */}
          <ellipse cx="50" cy="12" rx="14" ry="9" fill="#1C2C60" />
          <path d="M36 21 C36 17, 64 17, 64 21 L70 29 C70 32, 30 32, 30 29 Z" fill="#1C2C60" />
          
          {/* Main Beaker Silhouette */}
          <path d="M26 34 H74 L70 104 C70 108, 66 112, 60 112 H40 C34 112, 30 108, 30 104 Z" fill="#1C2C60" />
          
          {/* Handle */}
          <path d="M72 44 C88 44, 94 58, 92 78 C90 92, 80 96, 70 96" stroke="#1C2C60" strokeWidth="9" strokeLinecap="round" fill="none" />
          
          {/* Spout */}
          <path d="M26 35 L16 30 L26 44 Z" fill="#1C2C60" />
          
          {/* Cutout Capital Letter 'T' inside the French Press in Tertiary Cream #F5EDE6 */}
          {/* T Top Bar */}
          <rect x="36" y="46" width="28" height="7.5" rx="1.5" fill="#F5EDE6" />
          {/* T Serif ends */}
          <rect x="36" y="46" width="4.5" height="4" rx="0.5" fill="#F5EDE6" />
          <rect x="59.5" y="46" width="4.5" height="4" rx="0.5" fill="#F5EDE6" />
          {/* T Stem */}
          <rect x="46.5" y="52" width="7" height="42" fill="#F5EDE6" />
          {/* T Bottom Serif */}
          <rect x="42" y="90" width="16" height="4.5" rx="1" fill="#F5EDE6" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ width: '100%', padding: '0.25rem 0' }}>
      {/* French Press with 'T' SVG */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
        <svg width="42" height="48" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top Knob & Plunger Lid */}
          <ellipse cx="50" cy="12" rx="14" ry="9" fill="#1C2C60" />
          <path d="M36 21 C36 17, 64 17, 64 21 L70 29 C70 32, 30 32, 30 29 Z" fill="#1C2C60" />
          
          {/* Main Beaker Silhouette */}
          <path d="M26 34 H74 L70 104 C70 108, 66 112, 60 112 H40 C34 112, 30 108, 30 104 Z" fill="#1C2C60" />
          
          {/* Handle */}
          <path d="M72 44 C88 44, 94 58, 92 78 C90 92, 80 96, 70 96" stroke="#1C2C60" strokeWidth="9" strokeLinecap="round" fill="none" />
          
          {/* Spout */}
          <path d="M26 35 L16 30 L26 44 Z" fill="#1C2C60" />
          
          {/* Cutout Capital Letter 'T' inside the French Press in Tertiary Cream #F5EDE6 */}
          <rect x="36" y="46" width="28" height="7.5" rx="1.5" fill="#F5EDE6" />
          <rect x="36" y="46" width="4.5" height="4" rx="0.5" fill="#F5EDE6" />
          <rect x="59.5" y="46" width="4.5" height="4" rx="0.5" fill="#F5EDE6" />
          <rect x="46.5" y="52" width="7" height="42" fill="#F5EDE6" />
          <rect x="42" y="90" width="16" height="4.5" rx="1" fill="#F5EDE6" />
        </svg>
      </div>

      {/* Script Brand Wordmark 'Tallio's' */}
      <span style={{
        fontFamily: "'Playfair Display', 'Georgia', 'Outfit', serif",
        fontSize: '1.45rem',
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#1C2C60',
        lineHeight: 1.1,
        letterSpacing: '0.01em',
        textAlign: 'center',
        marginTop: '2px',
        display: 'block'
      }}>
        Tallio's
      </span>

      {/* Subtext 'COFFEE & TEA CO' */}
      <span style={{
        fontSize: '0.5625rem',
        fontWeight: 700,
        color: '#C68A4C',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        marginTop: '2px',
        lineHeight: 1,
        display: 'block'
      }}>
        COFFEE & TEA CO
      </span>
    </div>
  );
};

