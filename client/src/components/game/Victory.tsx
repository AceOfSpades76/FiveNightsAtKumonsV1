import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useCreateScore } from '@/hooks/use-scores';
import { StaticNoise } from '../StaticNoise';

interface VictoryProps {
  night: number;
  onContinue: () => void;
  isFinalNight: boolean;
}

export function Victory({ night, onContinue, isFinalNight }: VictoryProps) {
  const [_, setLocation] = useLocation();
  const createScore = useCreateScore();
  const [name, setName] = useState('');
  // Match Game Over formula: night*1000 + hour*500 (6 AM = full night clear)
const score = night * 1000 + 6 * 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createScore.mutate(
      { playerName: name.toUpperCase().slice(0, 3), nightsSurvived: night, score },
      { onSuccess: () => setLocation('/leaderboard') }
    );
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono">
      <StaticNoise opacity={0.04} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="text-center mb-8"
      >
        <div className="text-yellow-500 text-[80px] font-mono font-bold leading-none mb-2">
          {isFinalNight ? '🎓' : '⭐'}
        </div>
        <h1 className="text-yellow-400 text-6xl font-bold tracking-widest mb-2">6:00 AM</h1>
        <p className="text-green-400 text-xl tracking-widest">
          {isFinalNight ? 'ALL NIGHTS CLEARED' : `NIGHT ${night} CLEARED`}
        </p>
        <p className="text-zinc-500 mt-2 text-sm">
          {isFinalNight
            ? 'You survived all five nights at Kumon. Congratulations.'
            : `You survived the shift. ${5 - night} more night${5 - night > 1 ? 's' : ''} remain.`}
        </p>
        <div className="text-yellow-500 text-2xl font-bold mt-4">SCORE: {score.toLocaleString()}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8"
      >
        {!isFinalNight && (
          <button
            onClick={onContinue}
            className="w-full bg-green-950 text-green-400 border-2 border-green-800 py-4 text-xl font-bold hover:bg-green-900 hover:text-white transition-colors tracking-widest mb-4"
          >
            CONTINUE TO NIGHT {night + 1} →
          </button>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col text-left">
            <label className="text-zinc-500 mb-2 text-sm tracking-widest">RECORD INITIALS</label>
            <input
              type="text"
              maxLength={3}
              value={name}
              onChange={e => setName(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
              className="bg-black border-2 border-zinc-700 text-yellow-400 text-4xl p-4 text-center tracking-[1em] focus:outline-none focus:border-yellow-500 transition-colors uppercase placeholder:text-zinc-800"
              placeholder="___"
            />
          </div>

          <button
            type="submit"
            disabled={name.length < 1 || createScore.isPending}
            className="bg-yellow-950 text-yellow-500 border-2 border-yellow-900 py-3 text-lg font-bold hover:bg-yellow-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-widest"
          >
            {createScore.isPending ? 'SAVING...' : 'SAVE TO HONOR ROLL'}
          </button>

          <button
            type="button"
            onClick={() => setLocation('/')}
            className="text-zinc-600 hover:text-white transition-colors text-sm tracking-widest text-center"
          >
            Return to Menu
          </button>
        </form>
      </motion.div>
    </div>
  );
}
