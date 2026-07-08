import React, { useEffect } from 'react';

const KEYFRAMES = `
@keyframes fl-bubble-move {
  0%,100% { transform: translate(0px, 0px) scale(1); }
  20%      { transform: translate(50px, -35px) scale(1.1); }
  40%      { transform: translate(-45px, -20px) scale(0.9); }
  60%      { transform: translate(30px, 40px) scale(1.05); }
  80%      { transform: translate(-30px, 25px) scale(0.95); }
}
`;

interface LoaderProps {
  /** Pass true when rendering on a dark background */
  light?: boolean;
}

export function Loader({ light = false }: LoaderProps) {
  useEffect(() => {
    const STYLE_ID = 'fl-loader-keyframes';
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
  }, []);

  const barColor = light ? 'rgba(255,255,255,0.35)' : '#1a1a1a';

  const bar: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 130,
    height: 46,
    background: barColor,
    borderRadius: 23,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
  };

  const bubbles = [
    { bg: 'radial-gradient(circle at 30% 30%, #ffb3c1, #e64980, #ff8787)', delay: '0s' },
    { bg: 'radial-gradient(circle at 30% 30%, #edb3ff, #ac49e6, #fb87ff)', delay: '-1.4s' },
    { bg: 'radial-gradient(circle at 30% 30%, #b3d8ff, #4963e6, #87a7ff)', delay: '-2.8s' },
    { bg: 'radial-gradient(circle at 30% 30%, #b3ffbc, #35a32f, #75ba61)', delay: '-4.2s' },
  ];

  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      {/* Bar 1 — rotated 45° */}
      <div style={{ ...bar, transform: 'translate(-50%, -50%) rotate(45deg)' }} />
      {/* Bar 2 — rotated −45° (together they form an X) */}
      <div style={{ ...bar, transform: 'translate(-50%, -50%) rotate(-45deg)' }} />

      {/* Coloured bubbles orbit the centre with phase offsets */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -12,
            marginLeft: -12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: b.bg,
            animation: `fl-bubble-move 4s ease-in-out infinite`,
            animationDelay: b.delay,
            zIndex: 10,
          }}
        />
      ))}
    </div>
  );
}

/** Full-screen centered loader for page-level loading states */
export function FullscreenLoader() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f5f0',
    }}>
      <Loader />
    </div>
  );
}
