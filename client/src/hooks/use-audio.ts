import { useCallback } from 'react';

// ── Shared singleton AudioContext ──────────────────────────────────────────
// Must live at module level so it persists across renders and hook calls.
// Browsers suspend the context until unlocked by a user gesture.
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  return _ctx;
}

/** Call this from any click/keydown handler to unlock audio. */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

// ── Helpers ────────────────────────────────────────────────────────────────
function play(fn: (ctx: AudioContext) => void) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      // try to resume first — only works if previously unlocked by user gesture
      ctx.resume().then(() => fn(ctx)).catch(() => {});
    } else {
      fn(ctx);
    }
  } catch {}
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAudio() {
  const playDoorBang = useCallback(() => {
    play(ctx => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    });
  }, []);

  const playEntityLeaving = useCallback(() => {
    play(ctx => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    });
  }, []);

  const playVentWarning = useCallback(() => {
    play(ctx => {
      [0, 0.3, 0.6].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.0, ctx.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + offset + 0.05);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + offset + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.25);
      });
    });
  }, []);

  const playRoamerWarning = useCallback(() => {
    play(ctx => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 2.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    });
  }, []);

  const playStrikeWarning = useCallback(() => {
    play(ctx => {
      [220, 277, 370].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      });
    });
  }, []);

  const playJumpscare = useCallback(() => {
    play(ctx => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.min(1, (1 - i / data.length) * 3);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    });
  }, []);

  const playVentFail = useCallback(() => {
    play(ctx => {
      [0, 0.12, 0.24].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + offset + 0.35);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.45);
      });
    });
  }, []);

  const playNightClear = useCallback(() => {
    play(ctx => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.6);
      });
    });
  }, []);

  const playClanging = useCallback(() => {
    play(ctx => {
      [0, 0.07, 0.18].forEach(offset => {
        const base = 200 + Math.random() * 400;
        [base, base * 1.41, base * 2.0].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + offset);
          gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + offset + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.7 + Math.random() * 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 1.1);
        });
      });
    });
  }, []);

  return {
    playDoorBang,
    playEntityLeaving,
    playVentWarning,
    playRoamerWarning,
    playStrikeWarning,
    playJumpscare,
    playVentFail,
    playNightClear,
    playClanging,
  };
}
