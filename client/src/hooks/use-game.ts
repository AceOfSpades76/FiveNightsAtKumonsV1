import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from './use-audio';

// ─── Constants ────────────────────────────────────────────────────────────────
const REAL_SECONDS_PER_GAME_HOUR = 45;
const TOTAL_HOURS = 6;
const TICK_RATE_MS = 1000;
const TOTAL_NIGHTS = 5;

// How often (seconds) we check entity movement
const MOVE_CHECK_INTERVAL = 10;
// Entity waits at the door this long before killing (if door stays open)
const DOOR_WAIT_SECONDS = 8;
// Forced advance: entity MUST move forward if idle this long
const BASE_FORCED_ADVANCE = 90; // seconds night 1, decreases per night
// Battery drain — aggressive FNAF-style pressure.
// 1 bar (idle) = 0.18%/sec (~48%/night). 6 bars (all on) = 0.75%/sec (~200%/night).
const DRAIN_BASE = 0.066;
const DRAIN_PER_USAGE = 0.114;
// Mr. Sub roamer — one encounter per night, more time to react
const ROAMER_WARNING_SECS = 7;
const ROAMER_ATDOOR_SECS = 6;
const ROAMER_BANG_SECS = 3;
const MAX_ROAMER_ENCOUNTERS = 1;

// ─── Types ────────────────────────────────────────────────────────────────────
export type Location = '1A' | '1B' | '1C' | '2A' | '2B' | 'HIDDEN';
export type GameStatus =
  | 'MENU' | 'PLAYING' | 'POWER_OUT' | 'MONITOR_OUT'
  | 'JUMPSCARE' | 'NIGHT_CLEAR' | 'VICTORY';
export type EnemyType = 'MATH_TEACHER' | 'READING_TEACHER' | 'ROAMER' | 'DEAN';
export type RoamerPhase =
  | 'IDLE' | 'WARNING'
  | 'AT_DOOR_LEFT' | 'AT_DOOR_RIGHT'
  | 'BANGING_LEFT' | 'BANGING_RIGHT';
export type VentStatus = 'OK' | 'FAILING' | 'FAILED';

export interface EnemyState {
  id: EnemyType;
  location: Location;
  aggression: number;
  timeSinceLastMove: number;
}

export interface GameEngineState {
  status: GameStatus;
  night: number;
  hour: number;
  focus: number;
  usage: number;
  doors: { left: boolean; right: boolean };
  lights: { left: boolean; right: boolean };
  cameraOpen: boolean;
  activeCamera: Location;
  enemies: Record<EnemyType, EnemyState>;
  jumpscareBy: EnemyType | null;
  timeElapsed: number;
  // Door wait timers — entity waits at door before attacking
  doorWaitTimer: { left: number; right: number };
  // Vent
  ventStatus: VentStatus;
  ventFailTimer: number;
  ventResetWindow: number;
  // Monitor out
  monitorOutTimer: number;
  // Roamer (Mr. Sub) — threshold-based, one encounter per night
  roamerPhase: RoamerPhase;
  roamerWarningTimer: number;
  roamerEncounterCount: number;
  roamerThresholds: number[]; // remaining focus thresholds to trigger [65, 35]
  roamerPickedSide: 'left' | 'right' | null;
  roamerCooldown: number; // seconds before next encounter can trigger after one ends
  // Strikes (Dean)
  strikes: number;
  deanBreakinTimer: number;
  // Visual cues
  entityLeaving: { left: boolean; right: boolean };
  doorFlicker: { left: boolean; right: boolean };
  // Ambient
  ambientClangTimer: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function nightAggression(night: number) {
  // Very low starting aggression — ramps up with hours and nights
  return {
    MATH_TEACHER: 0.8 + (night - 1) * 0.8,
    READING_TEACHER: 0.6 + (night - 1) * 0.6,
    ROAMER: 0, DEAN: 0,
  };
}

function ventFailInterval(night: number): number {
  return Math.max(25, 70 - (night - 1) * 10);
}

function forcedAdvanceSeconds(night: number): number {
  // Night 1: ~90s. Night 5: ~50s
  return Math.max(50, BASE_FORCED_ADVANCE - (night - 1) * 10);
}

function randomClangInterval(): number {
  return 25 + Math.floor(Math.random() * 30); // 25–55 seconds
}

function initialState(night: number): GameEngineState {
  const agg = nightAggression(night);
  return {
    status: 'PLAYING',
    night,
    hour: 0,
    focus: 100,
    usage: 1,
    doors: { left: false, right: false },
    lights: { left: false, right: false },
    cameraOpen: false,
    activeCamera: '1A',
    enemies: {
      MATH_TEACHER: { id: 'MATH_TEACHER', location: '1A', aggression: agg.MATH_TEACHER, timeSinceLastMove: 0 },
      READING_TEACHER: { id: 'READING_TEACHER', location: '1A', aggression: agg.READING_TEACHER, timeSinceLastMove: 0 },
      ROAMER: { id: 'ROAMER', location: 'HIDDEN', aggression: 0, timeSinceLastMove: 0 },
      DEAN: { id: 'DEAN', location: 'HIDDEN', aggression: 0, timeSinceLastMove: 0 },
    },
    jumpscareBy: null,
    timeElapsed: 0,
    doorWaitTimer: { left: 0, right: 0 },
    ventStatus: 'OK',
    ventFailTimer: ventFailInterval(night),
    ventResetWindow: 0,
    monitorOutTimer: 0,
    roamerPhase: 'IDLE',
    roamerWarningTimer: 0,
    roamerEncounterCount: 0,
    roamerThresholds: [45], // trigger once per night when focus drops to 45%
    roamerPickedSide: null,
    roamerCooldown: 0,
    strikes: 0,
    deanBreakinTimer: 0,
    entityLeaving: { left: false, right: false },
    doorFlicker: { left: false, right: false },
    ambientClangTimer: randomClangInterval(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGameEngine() {
  const [state, setState] = useState<GameEngineState>(() => ({
    ...initialState(1), status: 'MENU',
  }));

  const audio = useAudio();
  const audioRef = useRef(audio);
  audioRef.current = audio;

  // ── Public actions ────────────────────────────────────────────────────────
  const startGame = useCallback((night: number = 1) => {
    setState(initialState(night));
  }, []);

  const toggleDoor = useCallback((side: 'left' | 'right') => {
    setState(prev => {
      if (prev.status !== 'PLAYING') return prev;
      if (prev.focus <= 0) return prev;

      const isOpening = !prev.doors[side];
      const newDoors = { ...prev.doors, [side]: !prev.doors[side] };
      let newEntityLeaving = { ...prev.entityLeaving };
      let enemiesCopy = { ...prev.enemies };
      let newDoorWaitTimer = { ...prev.doorWaitTimer };
      let newRoamerPhase = prev.roamerPhase;
      let newRoamerEncounterCount = prev.roamerEncounterCount;
      let newRoamerThresholds = prev.roamerThresholds;
      let newRoamerWarningTimer = prev.roamerWarningTimer;

      // Opening the door while Mr. Sub is at that door → instant jumpscare
      if (
        isOpening &&
        ((side === 'left' && (prev.roamerPhase === 'AT_DOOR_LEFT' || prev.roamerPhase === 'BANGING_LEFT')) ||
          (side === 'right' && (prev.roamerPhase === 'AT_DOOR_RIGHT' || prev.roamerPhase === 'BANGING_RIGHT')))
      ) {
        setTimeout(() => audioRef.current.playJumpscare(), 0);
        return {
          ...prev,
          doors: newDoors,
          status: 'JUMPSCARE',
          jumpscareBy: 'ROAMER',
        };
      }

      if (!isOpening) {
        // ─ Math Teacher blocked at left door ─
        if (side === 'left' && prev.enemies.MATH_TEACHER.location === '2A') {
          enemiesCopy = {
            ...enemiesCopy,
            MATH_TEACHER: { ...enemiesCopy.MATH_TEACHER, location: '1B', timeSinceLastMove: 0 },
          };
          newEntityLeaving = { ...newEntityLeaving, left: true };
          newDoorWaitTimer = { ...newDoorWaitTimer, left: 0 };
          setTimeout(() => {
            audioRef.current.playDoorBang();
            setTimeout(() => audioRef.current.playEntityLeaving(), 500);
          }, 50);
        }
        // ─ Reading Teacher blocked at right door ─
        if (side === 'right' && prev.enemies.READING_TEACHER.location === '2B') {
          enemiesCopy = {
            ...enemiesCopy,
            READING_TEACHER: { ...enemiesCopy.READING_TEACHER, location: '1C', timeSinceLastMove: 0 },
          };
          newEntityLeaving = { ...newEntityLeaving, right: true };
          newDoorWaitTimer = { ...newDoorWaitTimer, right: 0 };
          setTimeout(() => {
            audioRef.current.playDoorBang();
            setTimeout(() => audioRef.current.playEntityLeaving(), 500);
          }, 50);
        }
        // ─ Mr. Sub blocked ─
        if (
          (side === 'left' && (prev.roamerPhase === 'AT_DOOR_LEFT' || prev.roamerPhase === 'BANGING_LEFT')) ||
          (side === 'right' && (prev.roamerPhase === 'AT_DOOR_RIGHT' || prev.roamerPhase === 'BANGING_RIGHT'))
        ) {
          newEntityLeaving = { ...newEntityLeaving, [side]: true };
          newRoamerPhase = 'IDLE';
          newRoamerWarningTimer = 0;
          newRoamerEncounterCount = prev.roamerEncounterCount + 1;
          // Do NOT consume another threshold — it was already consumed when WARNING started
          newRoamerThresholds = prev.roamerThresholds;
          setTimeout(() => {
            audioRef.current.playDoorBang();
            setTimeout(() => audioRef.current.playEntityLeaving(), 500);
          }, 50);
          return {
            ...prev,
            doors: newDoors,
            enemies: enemiesCopy,
            entityLeaving: newEntityLeaving,
            doorWaitTimer: newDoorWaitTimer,
            roamerPhase: newRoamerPhase,
            roamerWarningTimer: newRoamerWarningTimer,
            roamerEncounterCount: newRoamerEncounterCount,
            roamerThresholds: newRoamerThresholds,
            roamerCooldown: 20, // prevent immediate re-trigger
            doorFlicker: { left: false, right: false },
          };
        }
      }

      return {
        ...prev,
        doors: newDoors,
        enemies: enemiesCopy,
        entityLeaving: newEntityLeaving,
        doorWaitTimer: newDoorWaitTimer,
      };
    });
  }, []);

  const toggleLight = useCallback((side: 'left' | 'right') => {
    setState(prev => {
      if (prev.status !== 'PLAYING') return prev;
      if (prev.focus <= 0) return prev;
      const newLights = { left: false, right: false };
      if (!prev.lights[side]) newLights[side] = true;
      return { ...prev, lights: newLights };
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'PLAYING') return prev;
      if (prev.focus <= 0) return prev;
      return { ...prev, cameraOpen: !prev.cameraOpen };
    });
  }, []);

  const setCamera = useCallback((loc: Location) => {
    setState(prev => {
      if (prev.status !== 'PLAYING' || !prev.cameraOpen) return prev;
      return { ...prev, activeCamera: loc };
    });
  }, []);

  const onVentMinigameSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      ventStatus: 'OK',
      ventResetWindow: 0,
      ventFailTimer: ventFailInterval(prev.night),
    }));
  }, []);

  const onVentMinigameFail = useCallback(() => {
    setState(prev => {
      const newStrikes = prev.strikes + 1;
      setTimeout(() => audioRef.current.playVentFail(), 0);
      setTimeout(() => audioRef.current.playStrikeWarning(), 350);
      return {
        ...prev,
        ventStatus: 'FAILED',
        ventResetWindow: 0,
        monitorOutTimer: 6,
        strikes: newStrikes,
        status: 'MONITOR_OUT',
        doors: { left: false, right: false },
        lights: { left: false, right: false },
        cameraOpen: false,
        deanBreakinTimer: newStrikes >= 2 ? 10 : prev.deanBreakinTimer,
      };
    });
  }, []);

  const clearEntityLeaving = useCallback((side: 'left' | 'right') => {
    setState(prev => ({
      ...prev,
      entityLeaving: { ...prev.entityLeaving, [side]: false },
    }));
  }, []);

  // ── Core Game Loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'PLAYING' && state.status !== 'MONITOR_OUT') return;

    const tick = setInterval(() => {
      setState(prev => {
        if (prev.status !== 'PLAYING' && prev.status !== 'MONITOR_OUT') return prev;

        let next = { ...prev };
        next.enemies = {
          MATH_TEACHER: { ...prev.enemies.MATH_TEACHER },
          READING_TEACHER: { ...prev.enemies.READING_TEACHER },
          ROAMER: { ...prev.enemies.ROAMER },
          DEAN: { ...prev.enemies.DEAN },
        };
        next.doorFlicker = { left: false, right: false };

        // ── Time ─────────────────────────────────────────────────────────
        next.timeElapsed += 1;
        const newHour = Math.floor(next.timeElapsed / REAL_SECONDS_PER_GAME_HOUR);
        if (newHour > next.hour) {
          next.hour = newHour;
          next.enemies.MATH_TEACHER.aggression += 0.6;
          next.enemies.READING_TEACHER.aggression += 0.5;
          if (next.hour >= TOTAL_HOURS) {
            setTimeout(() => audioRef.current.playNightClear(), 100);
            return { ...next, status: next.night >= TOTAL_NIGHTS ? 'VICTORY' : 'NIGHT_CLEAR' };
          }
        }

        // ── Monitor Out ───────────────────────────────────────────────────
        if (next.status === 'MONITOR_OUT') {
          next.monitorOutTimer = Math.max(0, next.monitorOutTimer - 1);
          if (next.monitorOutTimer <= 0) {
            next.status = 'PLAYING';
            next.ventStatus = 'OK';
            next.ventFailTimer = ventFailInterval(next.night);
          }
          return next;
        }

        // ── Vent ─────────────────────────────────────────────────────────
        if (next.ventStatus === 'OK') {
          next.ventFailTimer = Math.max(0, next.ventFailTimer - 1);
          if (next.ventFailTimer <= 0) {
            next.ventStatus = 'FAILING';
            next.ventResetWindow = 12;
            setTimeout(() => audioRef.current.playVentWarning(), 0);
          }
        } else if (next.ventStatus === 'FAILING') {
          next.ventResetWindow = Math.max(0, next.ventResetWindow - 1);
          if (next.ventResetWindow <= 0) {
            const newStrikes = next.strikes + 1;
            setTimeout(() => audioRef.current.playVentFail(), 0);
            setTimeout(() => audioRef.current.playStrikeWarning(), 350);
            next.strikes = newStrikes;
            next.ventStatus = 'FAILED';
            next.monitorOutTimer = 6;
            next.status = 'MONITOR_OUT';
            next.doors = { left: false, right: false };
            next.lights = { left: false, right: false };
            next.cameraOpen = false;
            if (newStrikes >= 2) next.deanBreakinTimer = 10;
          }
        }

        // ── Dean Break-in ─────────────────────────────────────────────────
        if (next.strikes >= 2 && next.deanBreakinTimer > 0) {
          next.deanBreakinTimer = Math.max(0, next.deanBreakinTimer - 1);
          if (next.deanBreakinTimer <= 0) {
            setTimeout(() => audioRef.current.playJumpscare(), 0);
            return { ...next, status: 'JUMPSCARE', jumpscareBy: 'DEAN' };
          }
        }

        // ── Focus Drain ───────────────────────────────────────────────────
        let usage = 1;
        if (next.doors.left) usage++;
        if (next.doors.right) usage++;
        if (next.lights.left) usage++;
        if (next.lights.right) usage++;
        if (next.cameraOpen) usage++;
        next.usage = usage;

        const drain = DRAIN_BASE + usage * DRAIN_PER_USAGE;
        next.focus = Math.max(0, next.focus - drain);

        if (next.focus <= 0) {
          next.status = 'POWER_OUT';
          next.doors = { left: false, right: false };
          next.lights = { left: false, right: false };
          next.cameraOpen = false;
          setTimeout(() => {
            setState(s => s.status === 'POWER_OUT'
              ? { ...s, status: 'JUMPSCARE', jumpscareBy: 'MATH_TEACHER' } : s);
            audioRef.current.playJumpscare();
          }, 8000 + Math.random() * 10000);
          return next;
        }

        // ── Ambient Clanging ──────────────────────────────────────────────
        next.ambientClangTimer = Math.max(0, next.ambientClangTimer - 1);
        if (next.ambientClangTimer <= 0) {
          setTimeout(() => audioRef.current.playClanging(), 0);
          next.ambientClangTimer = randomClangInterval();
        }

        // ── Hall Entities ─────────────────────────────────────────────────
        const forced = forcedAdvanceSeconds(next.night);
        const mtAtDoor = next.enemies.MATH_TEACHER.location === '2A';
        const rtAtDoor = next.enemies.READING_TEACHER.location === '2B';

        // Mutual exclusion: if one is at their door, the other can't advance past corridor
        const leftPathBlocked = mtAtDoor;
        const rightPathBlocked = rtAtDoor;

        // ─ Math Teacher ─
        {
          const mt = next.enemies.MATH_TEACHER;
          mt.timeSinceLastMove += 1;

          const isMoveTick = next.timeElapsed % MOVE_CHECK_INTERVAL === 0;
          const randomChance = Math.random() * 20 < mt.aggression;
          const forcedAdvance = mt.timeSinceLastMove >= forced;
          const shouldMove = isMoveTick && (randomChance || forcedAdvance) && mt.location !== '2A';

          if (shouldMove) {
            if (mt.location === '1A') {
              mt.location = '1B'; mt.timeSinceLastMove = 0;
            } else if (mt.location === '1B') {
              // Can't advance if reading teacher is already at her door
              if (!rightPathBlocked) {
                mt.location = '2A'; mt.timeSinceLastMove = 0;
              }
            }
          }

          // Door wait timer logic for left door
          if (mt.location === '2A') {
            if (!next.doors.left) {
              // Door is open — start/continue wait timer
              if (next.doorWaitTimer.left === 0) {
                next.doorWaitTimer = { ...next.doorWaitTimer, left: DOOR_WAIT_SECONDS };
              } else {
                next.doorWaitTimer = { ...next.doorWaitTimer, left: next.doorWaitTimer.left - 1 };
                if (next.doorWaitTimer.left <= 0) {
                  setTimeout(() => audioRef.current.playJumpscare(), 0);
                  return { ...next, enemies: { ...next.enemies, MATH_TEACHER: mt }, status: 'JUMPSCARE', jumpscareBy: 'MATH_TEACHER' };
                }
              }
            } else {
              // Door is closed — retreat over time
              if (next.doorWaitTimer.left === 0 && mt.timeSinceLastMove >= 6) {
                mt.location = '1B';
                mt.timeSinceLastMove = 0;
                next.entityLeaving = { ...next.entityLeaving, left: true };
                setTimeout(() => {
                  audioRef.current.playDoorBang();
                  setTimeout(() => audioRef.current.playEntityLeaving(), 500);
                }, 50);
              }
              next.doorWaitTimer = { ...next.doorWaitTimer, left: 0 };
            }
          } else {
            next.doorWaitTimer = { ...next.doorWaitTimer, left: 0 };
          }
          next.enemies.MATH_TEACHER = mt;
        }

        // ─ Reading Teacher ─
        {
          const rt = next.enemies.READING_TEACHER;
          rt.timeSinceLastMove += 1;

          const isMoveTick = next.timeElapsed % MOVE_CHECK_INTERVAL === 0;
          const randomChance = Math.random() * 20 < rt.aggression;
          const forcedAdvance = rt.timeSinceLastMove >= forced;
          const shouldMove = isMoveTick && (randomChance || forcedAdvance) && rt.location !== '2B';

          if (shouldMove) {
            if (rt.location === '1A') {
              rt.location = '1C'; rt.timeSinceLastMove = 0;
            } else if (rt.location === '1C') {
              if (!leftPathBlocked) {
                rt.location = '2B'; rt.timeSinceLastMove = 0;
              }
            }
          }

          if (rt.location === '2B') {
            if (!next.doors.right) {
              if (next.doorWaitTimer.right === 0) {
                next.doorWaitTimer = { ...next.doorWaitTimer, right: DOOR_WAIT_SECONDS };
              } else {
                next.doorWaitTimer = { ...next.doorWaitTimer, right: next.doorWaitTimer.right - 1 };
                if (next.doorWaitTimer.right <= 0) {
                  setTimeout(() => audioRef.current.playJumpscare(), 0);
                  return { ...next, enemies: { ...next.enemies, READING_TEACHER: rt }, status: 'JUMPSCARE', jumpscareBy: 'READING_TEACHER' };
                }
              }
            } else {
              if (next.doorWaitTimer.right === 0 && rt.timeSinceLastMove >= 6) {
                rt.location = '1C';
                rt.timeSinceLastMove = 0;
                next.entityLeaving = { ...next.entityLeaving, right: true };
                setTimeout(() => {
                  audioRef.current.playDoorBang();
                  setTimeout(() => audioRef.current.playEntityLeaving(), 500);
                }, 50);
              }
              next.doorWaitTimer = { ...next.doorWaitTimer, right: 0 };
            }
          } else {
            next.doorWaitTimer = { ...next.doorWaitTimer, right: 0 };
          }
          next.enemies.READING_TEACHER = rt;
        }

        // ── Mr. Sub (Roamer) — Foxy-style ─────────────────────────────────
        // Trigger based on focus thresholds, max 2 encounters
        if (next.roamerPhase === 'IDLE') {
          // Always tick down cooldown
          next.roamerCooldown = Math.max(0, next.roamerCooldown - 1);

          if (
            next.roamerCooldown <= 0 &&
            next.roamerEncounterCount < MAX_ROAMER_ENCOUNTERS &&
            next.roamerThresholds.length > 0
          ) {
            const nextThreshold = next.roamerThresholds[0];
            if (next.focus <= nextThreshold) {
              next.roamerPhase = 'WARNING';
              next.roamerWarningTimer = ROAMER_WARNING_SECS;
              next.roamerPickedSide = Math.random() > 0.5 ? 'left' : 'right';
              next.roamerThresholds = next.roamerThresholds.slice(1); // consume threshold
              setTimeout(() => audioRef.current.playRoamerWarning(), 0);
            }
          }
        } else if (next.roamerPhase === 'WARNING') {
          next.roamerWarningTimer = Math.max(0, next.roamerWarningTimer - 1);
          // Random flicker during warning
          next.doorFlicker = { left: Math.random() > 0.6, right: Math.random() > 0.6 };
          if (next.roamerWarningTimer <= 0) {
            // Commit to picked side
            const side = next.roamerPickedSide ?? 'left';
            next.roamerPhase = side === 'left' ? 'AT_DOOR_LEFT' : 'AT_DOOR_RIGHT';
            next.roamerWarningTimer = ROAMER_ATDOOR_SECS;
            next.doorFlicker = { left: side === 'left', right: side === 'right' };
          }
        } else if (next.roamerPhase === 'AT_DOOR_LEFT' || next.roamerPhase === 'AT_DOOR_RIGHT') {
          const side = next.roamerPhase === 'AT_DOOR_LEFT' ? 'left' : 'right';
          next.doorFlicker = { left: side === 'left', right: side === 'right' };
          next.roamerWarningTimer = Math.max(0, next.roamerWarningTimer - 1);

          if (next.roamerWarningTimer <= 0) {
            if (next.doors[side]) {
              // Blocked! Transition to BANGING phase — he bangs for ROAMER_BANG_SECS then leaves
              next.roamerPhase = side === 'left' ? 'BANGING_LEFT' : 'BANGING_RIGHT';
              next.roamerWarningTimer = ROAMER_BANG_SECS;
              setTimeout(() => {
                audioRef.current.playDoorBang();
                setTimeout(() => audioRef.current.playDoorBang(), 300);
              }, 0);
            } else {
              // Door open — JUMPSCARE
              setTimeout(() => audioRef.current.playJumpscare(), 0);
              return { ...next, status: 'JUMPSCARE', jumpscareBy: 'ROAMER' };
            }
          }
        } else if (next.roamerPhase === 'BANGING_LEFT' || next.roamerPhase === 'BANGING_RIGHT') {
          const side = next.roamerPhase === 'BANGING_LEFT' ? 'left' : 'right';
          next.doorFlicker = { left: side === 'left', right: side === 'right' };
          next.roamerWarningTimer = Math.max(0, next.roamerWarningTimer - 1);
          if (next.roamerWarningTimer <= 0) {
            // Mr. Sub leaves — enforce a cooldown so he can't instantly re-trigger
            next.roamerPhase = 'IDLE';
            next.roamerWarningTimer = 0;
            next.roamerPickedSide = null;
            next.roamerEncounterCount = next.roamerEncounterCount + 1;
            next.roamerCooldown = 20; // 20s before next encounter can start
            next.entityLeaving = { ...next.entityLeaving, [side]: true };
            setTimeout(() => audioRef.current.playEntityLeaving(), 100);
          }
        }

        return next;
      });
    }, TICK_RATE_MS);

    return () => clearInterval(tick);
  }, [state.status]);

  // Auto-clear entityLeaving visuals
  useEffect(() => {
    if (state.entityLeaving.left) {
      const t = setTimeout(() => clearEntityLeaving('left'), 1500);
      return () => clearTimeout(t);
    }
  }, [state.entityLeaving.left, clearEntityLeaving]);

  useEffect(() => {
    if (state.entityLeaving.right) {
      const t = setTimeout(() => clearEntityLeaving('right'), 1500);
      return () => clearTimeout(t);
    }
  }, [state.entityLeaving.right, clearEntityLeaving]);

  return {
    state, startGame, toggleDoor, toggleLight,
    toggleCamera, setCamera, onVentMinigameSuccess, onVentMinigameFail,
  };
}
