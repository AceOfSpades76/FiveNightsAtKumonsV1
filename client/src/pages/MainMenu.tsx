import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { CRTOverlay } from '@/components/CRTOverlay';
import { StaticNoise } from '@/components/StaticNoise';
import { unlockAudio } from '@/hooks/use-audio';

export default function MainMenu() {
  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-mono">
      <CRTOverlay />
      <StaticNoise />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,0,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      
      <div className="relative z-10 w-full max-w-4xl p-8 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Title Area */}
        <div className="flex-1 flex flex-col">
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl font-display text-red-600 leading-none mb-2"
          >
            FIVE NIGHTS
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-3xl md:text-5xl font-display text-zinc-400 mb-8"
          >
            AT KUMON
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col gap-4 text-2xl w-64"
          >
            <Link 
              href="/game" 
              onClick={unlockAudio}
              className="text-white hover:text-red-500 hover:pl-4 transition-all duration-300 text-left border-b border-white/10 pb-2 flex items-center justify-between group"
            >
              <span>NEW GAME</span>
              <span className="opacity-0 group-hover:opacity-100">&gt;</span>
            </Link>
            
            <Link 
              href="/leaderboard" 
              onClick={unlockAudio}
              className="text-white hover:text-green-500 hover:pl-4 transition-all duration-300 text-left border-b border-white/10 pb-2 flex items-center justify-between group"
            >
              <span>HONOR ROLL</span>
              <span className="opacity-0 group-hover:opacity-100">&gt;</span>
            </Link>
          </motion.div>
        </div>

        {/* Creepy Visual Graphic */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-64 h-64 border border-zinc-800 flex items-center justify-center relative overflow-hidden bg-zinc-950 mix-blend-screen"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
          <div className="text-9xl font-display text-red-900 blur-[2px]">∑</div>
          <div className="absolute bottom-2 right-2 text-xs text-red-900 font-mono">CAM_1A_RECORDING</div>
        </motion.div>

      </div>

      {/* Footer info */}
      <div className="absolute bottom-8 left-8 text-zinc-600 text-sm">
        <p>WARNING: Contains flashing lights and loud noises.</p>
        <p>© 2025 Study Session Interactive</p>
      </div>
    </div>
  );
}
