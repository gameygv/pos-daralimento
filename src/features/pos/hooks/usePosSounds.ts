import { useCallback, useState } from 'react';

type SoundType = 'addItem' | 'removeItem' | 'payment' | 'error' | 'scan';

function playBeep(frequency: number, duration: number, volume = 0.3) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext not available
  }
}

const SOUND_MAP: Record<SoundType, () => void> = {
  addItem: () => playBeep(800, 0.1, 0.2),
  removeItem: () => playBeep(400, 0.15, 0.15),
  payment: () => {
    playBeep(523, 0.12, 0.25);
    setTimeout(() => playBeep(659, 0.12, 0.25), 120);
    setTimeout(() => playBeep(784, 0.2, 0.25), 240);
  },
  error: () => {
    playBeep(200, 0.15, 0.3);
    setTimeout(() => playBeep(200, 0.15, 0.3), 180);
  },
  scan: () => playBeep(1200, 0.08, 0.15),
};

const SOUNDS_KEY = 'pos-sounds-enabled';

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(SOUNDS_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function usePosSounds() {
  const [enabled, setEnabled] = useState(loadEnabled);

  const play = useCallback(
    (sound: SoundType) => {
      if (!enabled) return;
      SOUND_MAP[sound]();
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUNDS_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { play, toggle, enabled };
}
