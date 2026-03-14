import React from 'react';
import { Battery, Clock, Wind, AlertTriangle } from 'lucide-react';
import { type VentStatus } from '@/hooks/use-game';
import { motion, AnimatePresence } from 'framer-motion';

interface HUDProps {
  hour: number;
  focus: number;
  usage: number;
  night: number;
  ventStatus: VentStatus;
  strikes: number;
  roamerWarning: boolean;
  deanBreakinTimer: number;
}

export function HUD({ hour, focus, usage, night, ventStatus, strikes, roamerWarning, deanBreakinTimer }: HUDProps) {
  const displayHour = hour === 0 ? 12 : hour;

  const focusColor = focus < 20 ? '#ef4444' : focus < 50 ? '#facc15' : '#4ade80';
  const focusGlow = focus < 20 ? '#ef444480' : focus < 50 ? '#facc1580' : '#4ade8080';

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 pointer-events-none font-mono">

      {/* Left: Focus + Usage */}
      <div
        className="flex flex-col gap-3 p-3 rounded border min-w-[170px]"
        style={{
          background: 'rgba(0,0,0,0.75)',
          borderColor: 'rgba(255,255,255,0.18)',
          boxShadow: '0 0 12px rgba(0,0,0,0.8)',
        }}
      >
        {/* Focus row */}
        <div className="flex items-center gap-2 text-sm">
          <Battery
            className="w-4 h-4 flex-shrink-0"
            style={{ color: focusColor, filter: `drop-shadow(0 0 4px ${focusColor})` }}
          />
          <span style={{ color: 'rgba(200,200,200,0.7)', textShadow: '0 0 6px rgba(200,200,200,0.3)' }}>FOCUS</span>
          <span
            className="font-bold ml-auto"
            style={{
              color: focusColor,
              textShadow: `0 0 8px ${focusGlow}, 0 0 16px ${focusGlow}`,
            }}
          >
            {Math.ceil(focus)}%
          </span>
        </div>

        {/* Focus bar */}
        <div className="w-full h-1.5 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
          <motion.div
            className="h-full rounded"
            animate={{ width: `${focus}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background: focusColor,
              boxShadow: `0 0 6px ${focusColor}`,
            }}
          />
        </div>

        {/* Usage load */}
        <div className="flex items-center gap-1">
          <span style={{ color: 'rgba(150,150,150,0.6)', fontSize: '10px' }} className="mr-1">LOAD</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-4 border border-zinc-700"
              style={i < usage ? {
                background: '#22c55e',
                boxShadow: '0 0 5px #22c55e',
              } : { background: '#1f2937' }}
            />
          ))}
        </div>

        {/* Vent status */}
        <div className="flex items-center gap-2 text-xs">
          <Wind
            className="w-3.5 h-3.5"
            style={{
              color: ventStatus === 'OK' ? 'rgba(100,100,100,0.6)' : ventStatus === 'FAILING' ? '#60a5fa' : '#dc2626',
              filter: ventStatus !== 'OK' ? `drop-shadow(0 0 4px ${ventStatus === 'FAILING' ? '#60a5fa' : '#dc2626'})` : undefined,
            }}
          />
          <span style={{
            color: ventStatus === 'OK' ? 'rgba(100,100,100,0.6)' : ventStatus === 'FAILING' ? '#93c5fd' : '#f87171',
            textShadow: ventStatus !== 'OK' ? `0 0 8px ${ventStatus === 'FAILING' ? '#3b82f6' : '#ef4444'}` : undefined,
          }}>
            VENT: {ventStatus === 'OK' ? 'NOMINAL' : ventStatus === 'FAILING' ? 'FAILING!' : 'OFFLINE'}
          </span>
        </div>

        {/* Strikes */}
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: 'rgba(100,100,100,0.6)' }}>STRIKES:</span>
          <div className="flex gap-1">
            {[0, 1].map(i => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border-2"
                style={i < strikes ? {
                  background: '#ea580c',
                  borderColor: '#f97316',
                  boxShadow: '0 0 8px #f97316, 0 0 16px #f9731640',
                } : {
                  background: '#18181b',
                  borderColor: '#3f3f46',
                }}
              />
            ))}
          </div>
          {strikes >= 2 && (
            <span style={{ color: '#f87171', textShadow: '0 0 8px #ef4444' }} className="animate-pulse font-bold">DEAN!</span>
          )}
        </div>
      </div>

      {/* Center warnings */}
      <div className="flex-1 flex flex-col items-center gap-2 pt-2 pointer-events-none px-4">
        <AnimatePresence>
          {roamerWarning && (
            <motion.div
              key="roamer"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: [0.6, 1, 0.6], y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="border px-5 py-2 rounded text-sm tracking-widest flex items-center gap-2"
              style={{
                background: 'rgba(59,7,100,0.85)',
                borderColor: '#9333ea',
                color: '#d8b4fe',
                textShadow: '0 0 10px #9333ea, 0 0 20px #6b21a8',
                boxShadow: '0 0 16px rgba(147,51,234,0.4)',
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px #9333ea)' }} />
              MR. SUB IS APPROACHING — CLOSE A DOOR
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deanBreakinTimer > 0 && (
            <motion.div
              key="dean"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="border px-5 py-2 rounded text-sm tracking-widest flex items-center gap-2"
              style={{
                background: 'rgba(69,10,10,0.85)',
                borderColor: '#ea580c',
                color: '#fdba74',
                textShadow: '0 0 10px #f97316, 0 0 20px #ea580c',
                boxShadow: '0 0 16px rgba(249,115,22,0.4)',
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px #f97316)' }} />
              THE DEAN BREAKS IN: {deanBreakinTimer}s
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Night + Clock */}
      <div
        className="flex flex-col gap-2 p-3 rounded border text-right"
        style={{
          background: 'rgba(0,0,0,0.75)',
          borderColor: 'rgba(255,255,255,0.18)',
          boxShadow: '0 0 12px rgba(0,0,0,0.8)',
        }}
      >
        <div
          className="text-xs tracking-widest"
          style={{ color: 'rgba(180,180,180,0.6)', textShadow: '0 0 6px rgba(180,180,180,0.3)' }}
        >
          NIGHT {night} / 5
        </div>
        <div
          className="flex items-center gap-2 text-2xl font-bold"
          style={{ color: '#e2e8f0', textShadow: '0 0 10px rgba(226,232,240,0.4)' }}
        >
          <Clock className="w-5 h-5" style={{ color: 'rgba(160,160,160,0.7)', filter: 'drop-shadow(0 0 3px rgba(160,160,160,0.4))' }} />
          <span>{displayHour}:00 AM</span>
        </div>
        <div className="w-full h-1 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${(hour / 6) * 100}%`,
              background: '#64748b',
              boxShadow: '0 0 4px #64748b',
            }}
          />
        </div>
      </div>
    </div>
  );
}
