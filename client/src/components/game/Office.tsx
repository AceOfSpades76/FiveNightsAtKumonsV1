import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type EnemyType, type Location, type RoamerPhase, type VentStatus } from '@/hooks/use-game';

interface OfficeProps {
  doors: { left: boolean; right: boolean };
  lights: { left: boolean; right: boolean };
  toggleDoor: (side: 'left' | 'right') => void;
  toggleLight: (side: 'left' | 'right') => void;
  enemies: Record<EnemyType, { location: Location }>;
  powerOut: boolean;
  monitorOut: boolean;
  entityLeaving: { left: boolean; right: boolean };
  doorFlicker: { left: boolean; right: boolean };
  roamerPhase: RoamerPhase;
  ventStatus: VentStatus;
  ventResetWindow: number;
  strikes: number;
  deanBreakinTimer: number;
  onOpenVentMinigame: () => void;
}

const CHALK_MESSAGES = [
  'x² + 2x + 1 = 0',
  'STUDY OR ELSE.',
  'lim(x→∞) f(x)',
  '∑(i=1→n) i²',
  'd/dx[xⁿ] = nxⁿ⁻¹',
  '?????',
  'WE SEE YOU.',
  '∫ sin(x) dx',
  'YOU CANNOT LEAVE.',
  'COMPLETE YOUR WORKSHEETS',
];

function ClassroomBackground({ lit, chalkText }: { lit: boolean; chalkText: string }) {
  return (
    <div className={`absolute inset-0 transition-all duration-500 ${lit ? 'opacity-100' : 'opacity-20'}`}>
      <div className="absolute inset-0 bg-zinc-800" />
      <div className="absolute top-[10%] left-[12%] right-[12%] h-[32%] bg-zinc-600 border-4 border-zinc-500">
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm font-mono tracking-widest px-2 text-center">
          {chalkText}
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute bottom-[20%] bg-zinc-700 border border-zinc-600"
          style={{ left: `${12 + i * 30}%`, width: '22%', height: '12%' }}
        />
      ))}
      <div className="absolute bottom-[20%] left-0 right-0 h-[2px] bg-zinc-600" />
      <div className={`absolute top-[5%] left-[38%] right-[38%] h-[4%] ${lit ? 'bg-yellow-100/50' : 'bg-zinc-900'} border border-zinc-600`} />
      {lit && (
        <div className="absolute top-[9%] left-[25%] right-[25%] h-[60%] bg-gradient-to-b from-yellow-100/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export function Office({
  doors,
  lights,
  toggleDoor,
  toggleLight,
  enemies,
  powerOut,
  monitorOut,
  entityLeaving,
  doorFlicker,
  roamerPhase,
  ventStatus,
  ventResetWindow,
  strikes,
  deanBreakinTimer,
  onOpenVentMinigame,
}: OfficeProps) {
  const [lookOffset, setLookOffset] = useState(0);
  const [chalkText, setChalkText] = useState(CHALK_MESSAGES[0]);
  const [chalkVisible, setChalkVisible] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const normalized = (e.clientX / window.innerWidth) - 0.5;
    setLookOffset(normalized * -32);
  };

  // Random chalk writing ambient effect
  useEffect(() => {
    const cycleChalk = () => {
      const next = CHALK_MESSAGES[Math.floor(Math.random() * CHALK_MESSAGES.length)];
      setChalkText(next);
      setChalkVisible(true);
      setTimeout(() => setChalkVisible(false), 4000);
    };
    const schedule = () => setTimeout(() => {
      cycleChalk();
      schedule();
    }, 18000 + Math.random() * 20000);
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  const mathTeacherAtDoor = enemies.MATH_TEACHER.location === '2A';
  const readingTeacherAtDoor = enemies.READING_TEACHER.location === '2B';
  const roamerAtLeft = roamerPhase === 'AT_DOOR_LEFT' || roamerPhase === 'BANGING_LEFT';
  const roamerAtRight = roamerPhase === 'AT_DOOR_RIGHT' || roamerPhase === 'BANGING_RIGHT';
  const roamerBanging = roamerPhase === 'BANGING_LEFT' || roamerPhase === 'BANGING_RIGHT';

  const [flickerOn, setFlickerOn] = useState(true);
  useEffect(() => {
    if (!doorFlicker.left && !doorFlicker.right) {
      setFlickerOn(true);
      return;
    }
    const interval = setInterval(() => setFlickerOn(f => !f), 150);
    return () => clearInterval(interval);
  }, [doorFlicker.left, doorFlicker.right]);

  const disabled = powerOut || monitorOut;

  const HallwayEntity = ({
    symbol, name, color, glowColor, side,
  }: { symbol: string; name: string; color: string; glowColor: string; side: 'left' | 'right' }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      style={{ filter: `drop-shadow(0 0 18px ${glowColor})` }}
    >
      <div className={`${color} text-7xl leading-none select-none`}>{symbol}</div>
      <div className={`${color} text-xs font-mono mt-2 bg-black/80 px-2 py-1 tracking-widest opacity-90`}>{name}</div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${glowColor}18 0%, transparent 70%)` }} />
    </motion.div>
  );

  return (
    <div
      className="absolute inset-0 bg-[#060606] flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="w-[108vw] h-[108vh] flex relative"
        animate={{ x: lookOffset }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      >
        {/* ── Left Hallway ──────────────────────────────────────────────── */}
        <div className="w-[24%] h-full relative flex items-center justify-end pr-8">
          {/* Door Frame */}
          <div className="w-[170px] h-[70vh] max-h-[500px] border-[12px] border-[#1c1c1c] bg-black relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
            <ClassroomBackground
              lit={!!(lights.left && !doors.left && !disabled)}
              chalkText={chalkText}
            />

            {(!lights.left || disabled) && (
              <div className="absolute inset-0 bg-black/88 z-10" />
            )}

            <AnimatePresence>
              {lights.left && !doors.left && mathTeacherAtDoor && !disabled && (
                <HallwayEntity symbol="∑" name="MR. CALCULUS" color="text-red-400" glowColor="#ef4444" side="left" />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {roamerAtLeft && !disabled && flickerOn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: roamerBanging ? [0.8, 1, 0.6, 1] : [0.5, 1, 0.7, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: roamerBanging ? 0.1 : 0.2, repeat: Infinity }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  style={{ filter: 'drop-shadow(0 0 20px #a855f7)' }}
                >
                  <div className="text-purple-400 text-7xl leading-none select-none">λ</div>
                  <div className="text-purple-300 text-xs font-mono mt-2 bg-black/80 px-2 py-1 tracking-widest">
                    {roamerBanging ? 'BANGING...' : 'MR. SUB'}
                  </div>
                  {roamerBanging && (
                    <motion.div
                      animate={{ x: [-2, 2, -2, 2, 0] }}
                      transition={{ duration: 0.15, repeat: Infinity }}
                      className="absolute inset-0 bg-purple-900/20 pointer-events-none"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {entityLeaving.left && (
                <motion.div
                  initial={{ opacity: 0.8, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: 40, scale: 0.4 }}
                  exit={{}}
                  transition={{ duration: 1.2, ease: 'easeIn' }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-25 pointer-events-none"
                >
                  <div className="text-zinc-400 text-6xl leading-none">◈</div>
                  <div className="text-zinc-500 text-xs font-mono mt-2">retreating...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {doorFlicker.left && flickerOn && (
              <div className="absolute inset-0 bg-purple-500/20 z-30 pointer-events-none" />
            )}

            <AnimatePresence>
              {(doors.left || disabled) && (
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="absolute inset-0 bg-[#242424] border-4 border-[#333] flex flex-col justify-evenly p-4 z-30"
                >
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-full h-5 bg-[#1a1a1a] rounded border border-zinc-700" />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left Buttons */}
          {!disabled && (
            <div className="absolute right-[190px] top-[33%] flex flex-col gap-5">
              <button
                data-testid="button-door-left"
                onClick={() => toggleDoor('left')}
                className={`w-14 h-20 rounded-lg border-4 text-white text-xs font-mono font-bold transition-all
                  ${doors.left
                    ? 'bg-red-700 border-red-500 shadow-[0_0_22px_#ef4444]'
                    : 'bg-red-950 border-red-900 hover:bg-red-900'
                  }`}
                style={{ textShadow: doors.left ? '0 0 8px #fca5a5' : undefined }}
              >
                DOOR
              </button>
              <button
                data-testid="button-light-left"
                onClick={() => toggleLight('left')}
                className={`w-14 h-20 rounded-lg border-4 text-white text-xs font-mono font-bold transition-all
                  ${lights.left
                    ? 'bg-white border-blue-100 shadow-[0_0_30px_#fff] text-black'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                  }`}
                style={{ textShadow: lights.left ? '0 0 8px #bfdbfe' : undefined }}
              >
                LIGHT
              </button>
            </div>
          )}
        </div>

        {/* ── Center Office ──────────────────────────────────────────────── */}
        <div className="w-[52%] h-full relative border-x-[12px] border-[#111] flex flex-col items-center justify-end pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />

          {/* Back wall decorations */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center opacity-25 -rotate-1 z-10">
            <div className="text-2xl font-mono text-white border-2 border-white px-4 py-2 tracking-widest">STUDY HARD.</div>
          </div>
          <div className="absolute top-12 right-8 opacity-20 rotate-1 z-10">
            <div className="text-xl font-mono text-blue-300 border border-blue-500 px-3 py-1">KUMON</div>
          </div>

          {/* Ambient chalk text overlay on back wall */}
          <AnimatePresence>
            {chalkVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute top-[28%] left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center"
              >
                <div className="text-white/15 font-mono text-xl tracking-widest whitespace-nowrap">
                  {chalkText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vent grate on ceiling */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-8 bg-zinc-800 border-2 border-zinc-600 grid grid-cols-5 gap-0.5 p-1 z-10">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-zinc-700 rounded-sm" />
            ))}
          </div>

          {/* Vent button — wall panel, above desk area */}
          <div className="absolute left-6 top-[38%] z-20">
            <button
              data-testid="button-vent"
              onClick={onOpenVentMinigame}
              disabled={ventStatus !== 'FAILING'}
              className={`relative w-16 h-16 rounded border-4 font-mono font-bold text-xs transition-all
                ${ventStatus === 'FAILING'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_24px_#3b82f6] animate-pulse cursor-pointer hover:bg-blue-500'
                  : ventStatus === 'FAILED'
                    ? 'bg-red-950 border-red-900 text-red-800 cursor-not-allowed'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
                }`}
              style={{ textShadow: ventStatus === 'FAILING' ? '0 0 8px #93c5fd' : undefined }}
            >
              VENT
              {ventStatus === 'FAILING' && (
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold animate-bounce">!</div>
              )}
              {ventStatus === 'FAILING' && (
                <div className="text-[9px] mt-0.5 text-blue-200">{ventResetWindow}s</div>
              )}
            </button>
            <div className="text-zinc-600 text-[8px] font-mono text-center mt-1">CIRCUIT</div>
          </div>

          {/* Desk */}
          <div className="w-[130%] h-[220px] bg-[#1c1a17] absolute bottom-[-30px] border-t-[16px] border-[#2a2723] rounded-t-[32px] shadow-[0_-16px_40px_rgba(0,0,0,0.8)] z-10 flex items-start justify-center pt-6 gap-6">
            {/* Fan */}
            <div className="w-16 h-16 rounded-full border-4 border-zinc-600 flex items-center justify-center relative bg-black/60 flex-shrink-0">
              <motion.div
                animate={{ rotate: powerOut ? 0 : 360 }}
                transition={{ repeat: Infinity, duration: powerOut ? 2 : 0.5, ease: 'linear' }}
                className="w-full h-1.5 bg-zinc-500 absolute"
              />
              <motion.div
                animate={{ rotate: powerOut ? 90 : 450 }}
                transition={{ repeat: Infinity, duration: powerOut ? 2 : 0.5, ease: 'linear' }}
                className="w-1.5 h-full bg-zinc-500 absolute"
              />
            </div>
            {/* Kumon pencil cup */}
            <div className="w-12 h-14 bg-blue-900/30 border-2 border-blue-700 rounded-b-lg flex items-center justify-center flex-shrink-0 mt-2">
              <span className="text-blue-400 font-bold text-xs">✏</span>
            </div>
            {/* Stacked papers */}
            <div className="flex flex-col gap-0.5 mt-2 flex-shrink-0 opacity-40">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-10 h-2 bg-zinc-400 border border-zinc-500" style={{ transform: `rotate(${(i - 1) * 2}deg)` }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Hallway ──────────────────────────────────────────────── */}
        <div className="w-[24%] h-full relative flex items-center justify-start pl-8">
          {/* Door Frame */}
          <div className="w-[170px] h-[70vh] max-h-[500px] border-[12px] border-[#1c1c1c] bg-black relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
            <ClassroomBackground
              lit={!!(lights.right && !doors.right && !disabled)}
              chalkText={chalkText}
            />

            {(!lights.right || disabled) && (
              <div className="absolute inset-0 bg-black/88 z-10" />
            )}

            <AnimatePresence>
              {lights.right && !doors.right && readingTeacherAtDoor && !disabled && (
                <HallwayEntity symbol="Ω" name="MS. SYNTAX" color="text-blue-400" glowColor="#3b82f6" side="right" />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {roamerAtRight && !disabled && flickerOn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: roamerBanging ? [0.8, 1, 0.6, 1] : [0.5, 1, 0.7, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: roamerBanging ? 0.1 : 0.2, repeat: Infinity }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  style={{ filter: 'drop-shadow(0 0 20px #a855f7)' }}
                >
                  <div className="text-purple-400 text-7xl leading-none select-none">λ</div>
                  <div className="text-purple-300 text-xs font-mono mt-2 bg-black/80 px-2 py-1 tracking-widest">
                    {roamerBanging ? 'BANGING...' : 'MR. SUB'}
                  </div>
                  {roamerBanging && (
                    <motion.div
                      animate={{ x: [-2, 2, -2, 2, 0] }}
                      transition={{ duration: 0.15, repeat: Infinity }}
                      className="absolute inset-0 bg-purple-900/20 pointer-events-none"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {entityLeaving.right && (
                <motion.div
                  initial={{ opacity: 0.8, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: 40, scale: 0.4 }}
                  exit={{}}
                  transition={{ duration: 1.2, ease: 'easeIn' }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-25 pointer-events-none"
                >
                  <div className="text-zinc-400 text-6xl leading-none">◈</div>
                  <div className="text-zinc-500 text-xs font-mono mt-2">retreating...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {doorFlicker.right && flickerOn && (
              <div className="absolute inset-0 bg-purple-500/20 z-30 pointer-events-none" />
            )}

            <AnimatePresence>
              {(doors.right || disabled) && (
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="absolute inset-0 bg-[#242424] border-4 border-[#333] flex flex-col justify-evenly p-4 z-30"
                >
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-full h-5 bg-[#1a1a1a] rounded border border-zinc-700" />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Buttons */}
          {!disabled && (
            <div className="absolute left-[190px] top-[33%] flex flex-col gap-5">
              <button
                data-testid="button-door-right"
                onClick={() => toggleDoor('right')}
                className={`w-14 h-20 rounded-lg border-4 text-white text-xs font-mono font-bold transition-all
                  ${doors.right
                    ? 'bg-red-700 border-red-500 shadow-[0_0_22px_#ef4444]'
                    : 'bg-red-950 border-red-900 hover:bg-red-900'
                  }`}
                style={{ textShadow: doors.right ? '0 0 8px #fca5a5' : undefined }}
              >
                DOOR
              </button>
              <button
                data-testid="button-light-right"
                onClick={() => toggleLight('right')}
                className={`w-14 h-20 rounded-lg border-4 text-white text-xs font-mono font-bold transition-all
                  ${lights.right
                    ? 'bg-white border-blue-100 shadow-[0_0_30px_#fff] text-black'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                  }`}
                style={{ textShadow: lights.right ? '0 0 8px #bfdbfe' : undefined }}
              >
                LIGHT
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Power / Monitor out darkness */}
      {(powerOut || monitorOut) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: monitorOut ? 0.97 : 0.92 }}
          className="absolute inset-0 bg-black z-20 pointer-events-none"
        />
      )}

      {monitorOut && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-red-500 text-3xl font-mono tracking-widest text-center"
            style={{ textShadow: '0 0 20px #ef4444' }}
          >
            MONITOR OFFLINE<br />
            <span className="text-lg text-red-700">DOORS &amp; LIGHTS DISABLED</span>
          </motion.div>
        </div>
      )}

      {/* Dean Breakin Warning */}
      {deanBreakinTimer > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none text-center">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-orange-400 text-4xl font-mono tracking-widest"
            style={{ textShadow: '0 0 16px #f97316' }}
          >
            Δ THE DEAN APPROACHES Δ
          </motion.div>
          <div className="text-orange-600 text-xl mt-2" style={{ textShadow: '0 0 10px #f97316' }}>
            {deanBreakinTimer}s
          </div>
        </div>
      )}
    </div>
  );
}
