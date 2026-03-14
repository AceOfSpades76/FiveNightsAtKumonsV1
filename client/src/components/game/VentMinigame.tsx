import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VentMinigameProps {
  onSuccess: () => void;
  onFail: () => void;
  timeLimit: number; // seconds
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

const CIRCUIT_NODES: Node[] = [
  { id: 0, x: 10, y: 50, label: 'PWR' },
  { id: 1, x: 28, y: 20, label: 'A1' },
  { id: 2, x: 50, y: 65, label: 'B2' },
  { id: 3, x: 72, y: 25, label: 'C3' },
  { id: 4, x: 88, y: 55, label: 'GND' },
];

// The correct sequence to click
const CORRECT_ORDER = [0, 1, 2, 3, 4];

export function VentMinigame({ onSuccess, onFail, timeLimit }: VentMinigameProps) {
  const [nextToClick, setNextToClick] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          setFailed(true);
          setTimeout(() => onFail(), 500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onFail]);

  const handleNodeClick = useCallback((nodeId: number) => {
    if (failed) return;
    if (nodeId === CORRECT_ORDER[nextToClick]) {
      const newCompleted = [...completed, nodeId];
      setCompleted(newCompleted);
      setNextToClick(prev => prev + 1);
      if (newCompleted.length === CORRECT_ORDER.length) {
        setTimeout(() => onSuccess(), 300);
      }
    } else {
      // Wrong click
      setFailed(true);
      setTimeout(() => onFail(), 500);
    }
  }, [failed, nextToClick, completed, onSuccess, onFail]);

  const progressPct = (timeLeft / timeLimit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="bg-zinc-900 border-2 border-blue-500 rounded-lg p-6 w-[500px] shadow-[0_0_40px_rgba(59,130,246,0.4)] font-mono">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-blue-400 text-xl font-bold tracking-widest">VENT CIRCUIT RESET</h2>
            <p className="text-zinc-500 text-sm mt-1">Connect nodes in sequence: PWR → A1 → B2 → C3 → GND</p>
          </div>
          <div className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2 bg-zinc-800 rounded mb-6 overflow-hidden">
          <motion.div
            className={`h-full rounded transition-colors ${progressPct > 50 ? 'bg-blue-500' : progressPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Circuit Board */}
        <div className="relative w-full h-48 bg-zinc-950 border border-zinc-700 rounded mb-4 overflow-hidden">
          {/* Circuit trace lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {CIRCUIT_NODES.slice(0, -1).map((node, i) => {
              const next = CIRCUIT_NODES[i + 1];
              const isLit = completed.includes(node.id) && completed.includes(next.id);
              return (
                <line
                  key={i}
                  x1={`${node.x}%`} y1={`${node.y}%`}
                  x2={`${next.x}%`} y2={`${next.y}%`}
                  stroke={isLit ? '#3b82f6' : '#27272a'}
                  strokeWidth="3"
                  strokeDasharray={isLit ? 'none' : '6,4'}
                  style={{ filter: isLit ? 'drop-shadow(0 0 6px #3b82f6)' : 'none' }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {CIRCUIT_NODES.map((node, i) => {
            const isCompleted = completed.includes(node.id);
            const isNext = CORRECT_ORDER[nextToClick] === node.id && !failed;
            const isFail = failed && !isCompleted && i === nextToClick;
            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                disabled={failed || isCompleted}
                className={`absolute z-10 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 -translate-x-1/2 -translate-y-1/2
                  ${isCompleted
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_#3b82f6] cursor-default'
                    : isNext
                      ? 'bg-blue-900 border-blue-400 text-blue-200 animate-pulse cursor-pointer hover:bg-blue-700 shadow-[0_0_20px_#60a5fa]'
                      : failed
                        ? 'bg-red-950 border-red-800 text-red-700 cursor-not-allowed'
                        : 'bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed'
                  }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span className="text-base">{isCompleted ? '✓' : isNext ? '●' : '○'}</span>
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div className="text-center">
          {failed ? (
            <span className="text-red-500 text-lg animate-pulse">CIRCUIT FAILURE — VENT OFFLINE</span>
          ) : completed.length === CIRCUIT_NODES.length ? (
            <span className="text-green-400 text-lg">CIRCUIT RESTORED ✓</span>
          ) : (
            <span className="text-zinc-400">
              Click node <span className="text-blue-400 font-bold">{CIRCUIT_NODES[nextToClick]?.label}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
