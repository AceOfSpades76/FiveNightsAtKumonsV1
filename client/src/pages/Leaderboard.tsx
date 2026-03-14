import React from 'react';
import { Link } from 'wouter';
import { useScores } from '@/hooks/use-scores';
import { CRTOverlay } from '@/components/CRTOverlay';
import { StaticNoise } from '@/components/StaticNoise';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function Leaderboard() {
  const { data: scores, isLoading } = useScores();

  // Sort by score descending
  const sortedScores = scores ? [...scores].sort((a, b) => b.score - a.score).slice(0, 10) : [];

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center p-8 relative overflow-hidden font-mono">
      <CRTOverlay />
      <StaticNoise opacity={0.1} />

      <div className="w-full max-w-3xl relative z-10 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-6 mb-8">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft size={24} />
            BACK
          </Link>
          <h1 className="text-4xl font-display text-yellow-500 flex items-center gap-4">
            <Trophy className="text-yellow-600" size={32} />
            HONOR ROLL
          </h1>
          <div className="w-24" /> {/* Spacer for balance */}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto pr-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-zinc-600 text-lg border-b border-zinc-800">
                <th className="py-4 font-normal">RANK</th>
                <th className="py-4 font-normal">STUDENT</th>
                <th className="py-4 font-normal text-right">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-zinc-500 animate-pulse">
                    ACCESSING RECORDS...
                  </td>
                </tr>
              ) : sortedScores.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-zinc-600">
                    NO RECORDS FOUND
                  </td>
                </tr>
              ) : (
                sortedScores.map((score, idx) => (
                  <tr 
                    key={score.id} 
                    className="border-b border-zinc-900/50 text-xl transition-colors hover:bg-zinc-900/30"
                  >
                    <td className={`py-4 ${idx === 0 ? 'text-yellow-500 font-bold' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-700' : 'text-zinc-500'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-4 text-white tracking-widest">{score.playerName}</td>
                    <td className="py-4 text-green-500 text-right font-bold">{score.score.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
