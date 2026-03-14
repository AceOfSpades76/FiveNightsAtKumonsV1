import React from 'react';

export function StaticNoise({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <div 
      className="absolute inset-0 static-noise pointer-events-none z-30 mix-blend-screen"
      style={{ opacity }}
    />
  );
}
