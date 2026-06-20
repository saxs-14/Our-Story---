import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useAppStore } from '@/store/useAppStore';
import { haptic } from '@/lib/haptics';

/**
 * A generative "ambient mode" sound-scape — a soft, evolving romantic pad
 * synthesised with the Web Audio API. Ships with zero audio files, plays
 * offline, and honours the global volume. A floating, unobtrusive control.
 */
export function MusicPlayer() {
  const volume = useAppStore((s) => s.musicVolume);
  const setMusicVolume = useAppStore((s) => s.setMusicVolume);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  // A warm major-9 pad with gentle detune.
  const CHORD = [130.81, 196.0, 246.94, 329.63, 392.0];

  const start = () => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') void ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    master.connect(filter).connect(ctx.destination);
    masterRef.current = master;

    // Slow tremolo for a breathing feel.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    const oscs: OscillatorNode[] = [lfo];
    CHORD.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 4;
      g.gain.value = 0.16 / CHORD.length;
      osc.connect(g).connect(master);
      osc.start();
      oscs.push(osc);
    });
    nodesRef.current = oscs;

    master.gain.setTargetAtTime(Math.max(0.05, volume) * 0.5, ctx.currentTime, 1.2);
    setPlaying(true);
  };

  const stop = () => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      window.setTimeout(() => {
        nodesRef.current.forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
        nodesRef.current = [];
      }, 800);
    }
    setPlaying(false);
  };

  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (playing && master && ctx) {
      master.gain.setTargetAtTime(Math.max(0.05, volume) * 0.5, ctx.currentTime, 0.3);
    }
  }, [volume, playing]);

  useEffect(() => () => stop(), []);

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-strong rounded-3xl p-4 shadow-glass-lg"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <p className="mb-1 text-[0.65rem] uppercase tracking-luxe text-rosegold-500">Ambient mode</p>
            <p className="mb-3 text-sm font-medium text-[color:var(--ink-strong)]">Our quiet soundscape</p>
            <label className="flex items-center gap-2 text-xs text-[color:var(--ink-soft)]">
              Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label="Music volume"
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="h-1 w-28 accent-rosegold-500"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={playing ? 'Pause ambient music' : 'Play ambient music'}
        aria-pressed={playing}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          haptic('tap');
          playing ? stop() : start();
        }}
        onDoubleClick={() => setOpen((o) => !o)}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="glass-strong flex h-12 w-12 items-center justify-center rounded-full text-rosegold-600 shadow-glass"
      >
        <span className="relative">
          {playing ? <PauseIcon width={20} height={20} /> : <PlayIcon width={20} height={20} />}
          {playing && (
            <motion.span
              className="absolute inset-0 -m-2 rounded-full border border-rosegold-400/40"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </span>
      </motion.button>
      <button
        type="button"
        className="text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)] underline-offset-2 hover:underline"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close' : 'Volume'}
      </button>
    </div>
  );
}
