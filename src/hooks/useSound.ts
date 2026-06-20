import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Lightweight sound design using the Web Audio API — soft, bell-like tones
 * synthesised on the fly so the PWA ships with zero audio assets and works
 * fully offline. Respects the Sound preference.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export type Tone = 'chime' | 'sparkle' | 'open' | 'bloom' | 'unlock';

const RECIPES: Record<Tone, { freqs: number[]; type: OscillatorType; dur: number; gain: number }> = {
  chime: { freqs: [880, 1320], type: 'sine', dur: 0.5, gain: 0.12 },
  sparkle: { freqs: [1568, 2093, 2637], type: 'sine', dur: 0.4, gain: 0.08 },
  open: { freqs: [523.25, 659.25, 783.99], type: 'triangle', dur: 0.9, gain: 0.12 },
  bloom: { freqs: [392, 523.25, 659.25, 783.99], type: 'sine', dur: 1.2, gain: 0.1 },
  unlock: { freqs: [659.25, 987.77, 1318.51], type: 'sine', dur: 1.0, gain: 0.14 },
};

export function useSound() {
  const soundOn = useAppStore((s) => s.soundOn);
  const volume = useAppStore((s) => s.musicVolume);

  return useCallback(
    (tone: Tone = 'chime') => {
      if (!soundOn) return;
      const audio = getCtx();
      if (!audio) return;
      const recipe = RECIPES[tone];
      const now = audio.currentTime;
      recipe.freqs.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = recipe.type;
        osc.frequency.value = freq;
        const start = now + i * 0.06;
        const peak = recipe.gain * Math.max(0.15, volume);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + recipe.dur);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + recipe.dur + 0.05);
      });
    },
    [soundOn, volume],
  );
}
