import React from 'react';
import type { PaperEffect } from '../constants/draftStudioTheme';

interface PaperTextureOverlayProps {
  effect: PaperEffect;
}

export const PaperTextureOverlay: React.FC<PaperTextureOverlayProps> = ({ effect }) => {
  if (effect === 'clean' || !effect) return null;

  let style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
  };

  if (effect === 'parchment') {
    const svg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <filter id="crumple">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="5" result="noise" />
    <feColorMatrix type="matrix" values="2 0 0 0 -0.4  0 2 0 0 -0.4  0 0 2 0 -0.4  0 0 0 1 0" in="noise" result="highContrast" />
    <feDiffuseLighting in="highContrast" lighting-color="#ffffff" surfaceScale="4" result="light">
      <feDistantLight azimuth="60" elevation="50" />
    </feDiffuseLighting>
    <feBlend mode="multiply" in="SourceGraphic" in2="light" />
  </filter>
  <rect width="100%" height="100%" filter="url(#crumple)" fill="#f6eedc" />
</svg>`;

    style = {
      ...style,
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
      backgroundSize: 'cover',
      mixBlendMode: 'multiply',
      opacity: 0.95,
    };
  } else if (effect === 'grain') {
    const grainSvg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)" />
</svg>`;

    style = {
      ...style,
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(grainSvg)}")`,
      mixBlendMode: 'multiply',
      opacity: 0.12,
    };
  } else if (effect === 'notebook') {
    style = {
      ...style,
      backgroundImage: `
                linear-gradient(transparent 95%, rgba(160, 190, 220, 0.5) 95%),
                linear-gradient(90deg, transparent 10%, rgba(225, 100, 110, 0.35) 10%, rgba(225, 100, 110, 0.35) 10.5%, transparent 10.5%)
            `,
      backgroundSize: '100% 1.8em, 100% 100%',
      mixBlendMode: 'multiply',
      opacity: 0.9,
    };
  }

  return <div className="paper-texture-overlay" style={style} />;
};
