import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Location, type EnemyType } from '@/hooks/use-game';
import { StaticNoise } from '../StaticNoise';

interface CamerasProps {
  activeCamera: Location;
  setCamera: (loc: Location) => void;
  enemies: Record<EnemyType, { location: Location }>;
  onClose: () => void;
}

const MAP_LOCATIONS: { id: Location; label: string; x: number; y: number }[] = [
  { id: '1A', label: 'CAM 1A - Main Hall', x: 50, y: 10 },
  { id: '1B', label: 'CAM 1B - Left Corridor', x: 20, y: 42 },
  { id: '1C', label: 'CAM 1C - Right Corridor', x: 80, y: 42 },
  { id: '2A', label: 'CAM 2A - Left Door', x: 30, y: 72 },
  { id: '2B', label: 'CAM 2B - Right Door', x: 70, y: 72 },
];

const ROOM_LABELS: Record<Location, string> = {
  '1A': 'Main Study Hall',
  '1B': 'Left Corridor',
  '1C': 'Right Corridor',
  '2A': 'Left Door Camera',
  '2B': 'Right Door Camera',
  'HIDDEN': '???',
};

function CameraClassroom({ lit, children }: { lit?: boolean; children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0">
      {/* Dark classroom art */}
      <div className="absolute inset-0 bg-zinc-900" />
      {/* Rows of desks (silhouettes) */}
      {[30, 55, 75].map(top => (
        <div key={top} className="absolute left-0 right-0 flex justify-around" style={{ top: `${top}%` }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-[18%] h-[6%] bg-zinc-800 border border-zinc-700 rounded-sm" />
          ))}
        </div>
      ))}
      {/* Board at front */}
      <div className="absolute top-[5%] left-[10%] right-[10%] h-[22%] bg-zinc-700/60 border-2 border-zinc-600">
        <div className="absolute inset-2 text-zinc-500 font-mono text-sm flex items-center justify-center tracking-widest">
          {children ?? ''}
        </div>
      </div>
      {/* Ceiling light */}
      <div className="absolute top-0 left-[40%] right-[40%] h-[3%] bg-yellow-100/20 blur-sm" />
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
    </div>
  );
}

export function Cameras({ activeCamera, setCamera, enemies, onClose }: CamerasProps) {
  const [heavyStatic, setHeavyStatic] = useState(false);

  useEffect(() => {
    setHeavyStatic(true);
    const t = setTimeout(() => setHeavyStatic(false), 280);
    return () => clearTimeout(t);
  }, [activeCamera]);

  const enemiesInView = (Object.entries(enemies) as [EnemyType, { location: Location }][]).filter(
    ([, e]) => e.location === activeCamera && e.location !== 'HIDDEN'
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="absolute inset-0 bg-black z-30 font-mono flex flex-col"
    >
      <StaticNoise opacity={heavyStatic ? 0.85 : 0.2} />

      {/* Camera Feed */}
      <div className="flex-1 relative border-b-4 border-white/10 overflow-hidden">
        {/* Room background */}
        {!heavyStatic && (
          <CameraClassroom>
            {activeCamera === '1A' ? 'GRADE A STUDY REQUIRED' :
             activeCamera === '1B' ? 'MATH: x² + 5x - 6 = 0' :
             activeCamera === '1C' ? 'READING: Chapter 12' :
             activeCamera === '2A' ? 'LEFT RESTRICTED AREA' :
             'RIGHT RESTRICTED AREA'}
          </CameraClassroom>
        )}

        {/* Camera label */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-black/80 px-4 py-2 border border-white/20">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="text-white text-xl tracking-widest">
            {MAP_LOCATIONS.find(l => l.id === activeCamera)?.label ?? activeCamera}
          </span>
        </div>

        {/* Timestamp */}
        <div className="absolute top-6 right-6 z-20 text-white/40 text-sm bg-black/60 px-3 py-1">
          REC ● {new Date().toLocaleTimeString()}
        </div>

        {/* Entities in view */}
        {!heavyStatic && enemiesInView.map(([enemyType], i) => {
          const isMath = enemyType === 'MATH_TEACHER';
          const isReading = enemyType === 'READING_TEACHER';
          const isRoamer = enemyType === 'ROAMER';
          const isDean = enemyType === 'DEAN';

          return (
            <motion.div
              key={enemyType}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{
                filter: isMath
                  ? 'drop-shadow(0 0 30px #ef4444)'
                  : isReading
                    ? 'drop-shadow(0 0 30px #3b82f6)'
                    : isRoamer
                      ? 'drop-shadow(0 0 30px #a855f7)'
                      : 'drop-shadow(0 0 30px #f97316)',
              }}
            >
              {/* Red / Blue room glow overlay */}
              <div
                className="absolute inset-0 mix-blend-screen pointer-events-none"
                style={{
                  background: isMath
                    ? 'rgba(239,68,68,0.12)'
                    : isReading
                      ? 'rgba(59,130,246,0.12)'
                      : isRoamer
                        ? 'rgba(168,85,247,0.12)'
                        : 'rgba(249,115,22,0.12)',
                }}
              />
              <div
                className="text-[10rem] leading-none select-none"
                style={{
                  color: isMath ? '#ef4444' : isReading ? '#60a5fa' : isRoamer ? '#c084fc' : '#fb923c',
                }}
              >
                {isMath ? '∑' : isReading ? 'Ω' : isRoamer ? 'λ' : 'Δ'}
              </div>
              <div
                className="text-2xl mt-4 px-6 py-2 bg-black/60 tracking-widest"
                style={{ color: isMath ? '#fca5a5' : isReading ? '#93c5fd' : isRoamer ? '#d8b4fe' : '#fed7aa' }}
              >
                {isMath ? 'MR. CALCULUS' : isReading ? 'MS. SYNTAX' : isRoamer ? 'MR. SUB' : 'THE DEAN'}
              </div>
            </motion.div>
          );
        })}

        {/* Empty room */}
        {!heavyStatic && enemiesInView.length === 0 && (
          <div className="absolute bottom-12 w-full text-center text-zinc-600 text-lg tracking-widest z-10">
            — no movement detected —
          </div>
        )}
      </div>

      {/* Map & Controls */}
      <div className="h-56 bg-zinc-950 flex items-center justify-between px-8 border-t-4 border-zinc-800">
        {/* Map */}
        <div className="relative w-[380px] h-[180px] border-2 border-white/10 bg-black/60">
          {/* Map lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <line x1="50%" y1="10%" x2="20%" y2="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1="50%" y1="10%" x2="80%" y2="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1="20%" y1="42%" x2="30%" y2="72%" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1="80%" y1="42%" x2="70%" y2="72%" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </svg>

          {MAP_LOCATIONS.map(loc => {
            const hasEnemy = Object.values(enemies).some(
              e => e.location === loc.id && e.location !== 'HIDDEN'
            );
            return (
              <button
                key={loc.id}
                onClick={() => setCamera(loc.id)}
                className={`absolute z-10 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 border-2 text-sm transition-all duration-150
                  ${activeCamera === loc.id
                    ? 'bg-green-700 border-green-400 text-white shadow-[0_0_12px_#22c55e]'
                    : hasEnemy
                      ? 'bg-red-950 border-red-700 text-red-400 shadow-[0_0_8px_#ef4444] animate-pulse'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                style={{ top: `${loc.y}%`, left: `${loc.x}%` }}
              >
                {loc.id}
                {hasEnemy && <span className="ml-1 text-red-500">!</span>}
              </button>
            );
          })}

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-yellow-500 border border-yellow-600 px-3 py-0.5 text-xs bg-black/80 z-10">
            YOU ARE HERE
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-zinc-800 border-4 border-zinc-600 text-white px-10 py-5 text-xl hover:bg-zinc-700 hover:border-white/50 transition-colors uppercase font-bold"
        >
          Lower Monitor
        </button>
      </div>
    </motion.div>
  );
}
