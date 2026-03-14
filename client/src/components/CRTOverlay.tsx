import React from 'react';

export function CRTOverlay() {
  return (
    <>
      <div className="fixed inset-0 crt-overlay pointer-events-none mix-blend-overlay z-50"></div>
      <div className="fixed inset-0 vignette pointer-events-none z-40"></div>
    </>
  );
}
