import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { type EnemyType } from '@/hooks/use-game';
import { useCreateScore } from '@/hooks/use-scores';
import { useLocation } from 'wouter';
import { StaticNoise } from '../StaticNoise';

interface GameOverProps {
  jumpscareBy: EnemyType | null;
  hour: number;
  night: number;
}

const ENTITY_INFO: Record<string, { symbol: string; color: string; name: string; flavor: string }> = {
  MATH_TEACHER: {
    symbol: '∑',
    color: '#ef4444',
    name: 'MR. CALCULUS',
    flavor: 'You forgot to close the left door.',
  },
  READING_TEACHER: {
    symbol: 'Ω',
    color: '#3b82f6',
    name: 'MS. SYNTAX',
    flavor: 'The right corridor was left unguarded.',
  },
  ROAMER: {
    symbol: 'λ',
    color: '#a855f7',
    name: 'MR. SUB',
    flavor: 'He came from nowhere. You hesitated.',
  },
  DEAN: {
    symbol: 'Δ',
    color: '#f97316',
    name: 'THE DEAN',
    flavor: 'Two strikes. No mercy. No escape.',
  },
};

export function GameOver({ jumpscareBy, hour, night }: GameOverProps) {
  const [phase, setPhase] = useState<'jumpscare' | 'form'>('jumpscare');
  const [name, setName] = useState('');
  const [_, setLocation] = useLocation();
  const createScore = useCreateScore();

  const entity = jumpscareBy ? ENTITY_INFO[jumpscareBy] : ENTITY_INFO.MATH_TEACHER;
  const score = night * 1000 + hour * 500;

  useEffect(() => {
    const t = setTimeout(() => setPhase('form'), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createScore.mutate(
      { playerName: name.toUpperCase().slice(0, 3), nightsSurvived: night, score },
      { onSuccess: () => setLocation('/leaderboard') }
    );
  };

  if (phase === 'jumpscare') {
    return (
      <div className="absolute inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
        <StaticNoise opacity={0.6} />
        <motion.div
          initial={{ scale: 0.05, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5, 1.2, 2.5],
            opacity: [1, 0.9, 1, 1],
            x: [0, -40, 40, -20, 20, 0],
            y: [0, 30, -30, 0],
          }}
          transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}
          className="text-[280px] leading-none font-mono select-none"
          style={{
            color: entity.color,
            textShadow: `0 0 80px ${entity.color}, 0 0 160px ${entity.color}`,
          }}
        >
          {entity.symbol}
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 0.7, 0, 0.9, 0] }}
          transition={{ duration: 0.25, repeat: 8 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: entity.color, mixBlendMode: 'overlay' }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono p-4">
      <StaticNoise opacity={0.08} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-6 text-center scale-[0.85]"
      >
        {/* Entity badge */}
        <div
          className="text-5xl mb-1 font-mono"
          style={{ color: entity.color, textShadow: `0 0 20px ${entity.color}` }}
        >
          {entity.symbol}
        </div>
        <div className="text-xs tracking-widest mb-1" style={{ color: entity.color }}>{entity.name}</div>

        <h1 className="text-red-600 text-3xl font-mono font-bold mt-3 mb-1">GAME OVER</h1>
        <p className="text-zinc-500 text-base mb-1">Night {night} — Survived until {hour === 0 ? 12 : hour} AM</p>
        <p className="text-zinc-600 text-sm italic mb-4 border-b border-zinc-800 pb-3">"{entity.flavor}"</p>

        <div className="text-yellow-500 text-xl font-bold mb-4">SCORE: {score.toLocaleString()}</div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col text-left">
            <label className="text-zinc-500 mb-1 text-xs tracking-widest">ENTER INITIALS</label>
            <input
              type="text"
              maxLength={3}
              value={name}
              onChange={e => setName(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
              className="bg-black border-2 border-zinc-700 text-green-400 text-2xl p-3 text-center tracking-[0.5em] focus:outline-none focus:border-red-600 transition-colors uppercase placeholder:text-zinc-800"
              placeholder="___"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={name.length < 1 || createScore.isPending}
            className="bg-red-950 text-red-400 border-2 border-red-900 py-3 text-lg hover:bg-red-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold tracking-widest"
          >
            {createScore.isPending ? 'SAVING...' : 'SUBMIT SCORE'}
          </button>

          <button
            type="button"
            onClick={() => setLocation('/')}
            className="text-zinc-600 hover:text-white transition-colors text-xs tracking-widest"
          >
            Return to Menu
          </button>
        </form>
      </motion.div>
    </div>
  );
}
