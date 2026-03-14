import React, { useEffect, useState } from 'react';
import { useGameEngine } from '@/hooks/use-game';
import { unlockAudio } from '@/hooks/use-audio';
import { Office } from '@/components/game/Office';
import { Cameras } from '@/components/game/Cameras';
import { HUD } from '@/components/game/HUD';
import { GameOver } from '@/components/game/GameOver';
import { Victory } from '@/components/game/Victory';
import { VentMinigame } from '@/components/game/VentMinigame';
import { CRTOverlay } from '@/components/CRTOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

export default function Game() {
  const {
    state,
    startGame,
    toggleDoor,
    toggleLight,
    toggleCamera,
    setCamera,
    onVentMinigameSuccess,
    onVentMinigameFail,
  } = useGameEngine();

  const [_, setLocation] = useLocation();
  const [showVentMinigame, setShowVentMinigame] = useState(false);

  // Start night 1 on mount
  useEffect(() => {
    startGame(1);
  }, [startGame]);

  // Unlock audio on first keypress (browsers require user gesture for sound)
  useEffect(() => {
    const handleKeyDown = () => unlockAudio();
    document.addEventListener('keydown', handleKeyDown, { once: true });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = state.status === 'PLAYING' || state.status === 'MONITOR_OUT';
  const isPowerOut = state.status === 'POWER_OUT';
  const roamerWarning =
    state.roamerPhase === 'WARNING' ||
    state.roamerPhase === 'AT_DOOR_LEFT' ||
    state.roamerPhase === 'AT_DOOR_RIGHT' ||
    state.roamerPhase === 'BANGING_LEFT' ||
    state.roamerPhase === 'BANGING_RIGHT';

  const handleOpenVentMinigame = () => {
    if (state.ventStatus === 'FAILING') {
      setShowVentMinigame(true);
    }
  };

  const handleVentSuccess = () => {
    setShowVentMinigame(false);
    onVentMinigameSuccess();
  };

  const handleVentFail = () => {
    setShowVentMinigame(false);
    onVentMinigameFail();
  };

  const handleContinueNight = () => {
    startGame(state.night + 1);
  };

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden select-none" onClick={unlockAudio}>
      <CRTOverlay />

      {/* Active Gameplay */}
      {(isActive || isPowerOut) && (
        <>
          <Office
            doors={state.doors}
            lights={state.lights}
            toggleDoor={toggleDoor}
            toggleLight={toggleLight}
            enemies={state.enemies}
            powerOut={isPowerOut}
            monitorOut={state.status === 'MONITOR_OUT'}
            entityLeaving={state.entityLeaving}
            doorFlicker={state.doorFlicker}
            roamerPhase={state.roamerPhase}
            ventStatus={state.ventStatus}
            ventResetWindow={state.ventResetWindow}
            strikes={state.strikes}
            deanBreakinTimer={state.deanBreakinTimer}
            onOpenVentMinigame={handleOpenVentMinigame}
          />

          {/* Camera Monitor */}
          <AnimatePresence>
            {state.cameraOpen && state.status === 'PLAYING' && (
              <Cameras
                activeCamera={state.activeCamera}
                setCamera={setCamera}
                enemies={state.enemies}
                onClose={toggleCamera}
              />
            )}
          </AnimatePresence>

          {/* HUD */}
          <HUD
            hour={state.hour}
            focus={state.focus}
            usage={state.usage}
            night={state.night}
            ventStatus={state.ventStatus}
            strikes={state.strikes}
            roamerWarning={roamerWarning}
            deanBreakinTimer={state.deanBreakinTimer}
          />

          {/* Raise/Lower Monitor Button */}
          {state.status === 'PLAYING' && (
            <button
              onClick={toggleCamera}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 h-12 bg-white/5 border border-white/20 hover:bg-white/15 backdrop-blur text-white/50 text-base font-mono tracking-widest z-20 uppercase transition-all duration-300 rounded overflow-hidden group"
            >
              <span className="relative z-10">
                {state.cameraOpen ? 'Lower Monitor' : 'Raise Monitor'}
              </span>
              <div className="absolute inset-0 bg-green-500/15 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          )}

          {/* Vent Minigame Overlay */}
          <AnimatePresence>
            {showVentMinigame && (
              <VentMinigame
                onSuccess={handleVentSuccess}
                onFail={handleVentFail}
                timeLimit={10}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Game Over */}
      {state.status === 'JUMPSCARE' && (
        <GameOver
          jumpscareBy={state.jumpscareBy}
          hour={state.hour}
          night={state.night}
        />
      )}

      {/* Night Clear / Victory */}
      {(state.status === 'NIGHT_CLEAR' || state.status === 'VICTORY') && (
        <Victory
          night={state.night}
          onContinue={handleContinueNight}
          isFinalNight={state.status === 'VICTORY' || state.night >= 5}
        />
      )}
    </div>
  );
}
