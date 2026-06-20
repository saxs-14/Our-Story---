import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useAppStore } from '@/store/useAppStore';
import { haptic } from '@/lib/haptics';
import { GALLERY_SONG, PLAYLISTS } from '@/data/songs';

/** Per-route ambient chord presets (Web Audio fallback when offline) */
const ROUTE_CHORDS: Record<string, number[]> = {
  '/':        [130.81, 196.0, 246.94, 329.63, 392.0],  // home — warm major 9
  '/garden':  [110.0,  164.81, 220.0, 261.63, 329.63], // garden — Dm, earthy
  '/letters': [146.83, 196.0, 220.0, 293.66, 349.23],  // letters — D maj, tender
  '/dreams':  [138.59, 185.0, 246.94, 311.13, 369.99], // dreams — C#/Db maj
  '/vault':   [123.47, 164.81, 196.0,  246.94, 311.13], // vault — Bm, deep
  '/gallery': [130.81, 196.0, 246.94, 329.63, 392.0],  // gallery — same as home (Photograph)
  '/timeline':[138.59, 207.65, 261.63, 311.13, 415.30], // timeline — C# maj
  '/reasons': [146.83, 220.0, 277.18, 369.99, 440.0],  // reasons — D maj
};

function getChordForRoute(path: string): number[] {
  return ROUTE_CHORDS[path] ?? ROUTE_CHORDS['/'];
}

/** Spotify embedded playlist panel */
function SpotifyPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'love' | 'gospel' | 'sa-gospel'>('love');
  const location = useLocation();
  const isGallery = location.pathname === '/gallery';

  const playlist = tab === 'love'
    ? PLAYLISTS.loveSongs
    : tab === 'sa-gospel'
    ? PLAYLISTS.southAfricanGospel
    : PLAYLISTS.christianWorship;

  return (
    <motion.div
      className="glass-strong absolute bottom-14 right-0 z-50 w-[min(340px,90vw)] overflow-hidden rounded-3xl shadow-glass-lg"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-luxe text-rosegold-500">
          🎵 Music
        </p>
        <button
          type="button"
          aria-label="Close music panel"
          onClick={onClose}
          className="tap text-[color:var(--ink-soft)] hover:text-rosegold-500"
        >
          ✕
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 px-4 pb-3">
        {([['love', '❤️ Love'], ['gospel', '🙏 Gospel'], ['sa-gospel', '🇿🇦 SA Gospel']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`tap rounded-full px-3 py-1 text-[0.65rem] font-medium transition-colors ${tab === key ? 'bg-rosegold-500 text-warmwhite' : 'glass text-[color:var(--ink-soft)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Photograph when on Gallery */}
      {isGallery && tab === 'love' && (
        <div className="px-4 pb-2">
          <p className="mb-1 text-[0.6rem] uppercase tracking-luxe text-rosegold-400">
            📸 Playing for the Gallery
          </p>
          <iframe
            src={GALLERY_SONG.embedUrl}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Photograph — Ed Sheeran"
            className="rounded-2xl"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* Playlist embed */}
      <div className="px-4 pb-4">
        <p className="mb-1 text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">
          {playlist.name}
        </p>
        <iframe
          key={playlist.embedUrl}
          src={playlist.embedUrl}
          width="100%"
          height="200"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={playlist.name}
          className="rounded-2xl"
          style={{ border: 'none' }}
        />
        <a
          href={playlist.openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-[0.65rem] text-rosegold-500 underline underline-offset-2"
        >
          Open in Spotify ↗
        </a>
      </div>
    </motion.div>
  );
}

/**
 * Hybrid music player:
 * • Offline: generates ambient pad with Web Audio API (chord varies per route)
 * • Online: Spotify embed panel with 100 love songs + 100 gospel playlists
 * • Gallery page always surfaces "Photograph" by Ed Sheeran first
 */
export function MusicPlayer() {
  const volume = useAppStore((s) => s.musicVolume);
  const setMusicVolume = useAppStore((s) => s.setMusicVolume);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const location = useLocation();

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  const startAmbient = (chord: number[]) => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    const oscs: OscillatorNode[] = [lfo];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 4;
      g.gain.value = 0.16 / chord.length;
      osc.connect(g).connect(master);
      osc.start();
      oscs.push(osc);
    });
    nodesRef.current = oscs;
    master.gain.setTargetAtTime(Math.max(0.05, volume) * 0.5, ctx.currentTime, 1.2);
    setPlaying(true);
  };

  const stopAmbient = () => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      window.setTimeout(() => {
        nodesRef.current.forEach((o) => { try { o.stop(); } catch { /* stopped */ } });
        nodesRef.current = [];
      }, 800);
    }
    setPlaying(false);
  };

  // Morph chord when route changes while playing
  useEffect(() => {
    if (!playing) return;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const chord = getChordForRoute(location.pathname);
    // Fade and restart
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    nodesRef.current.forEach((o) => { try { o.stop(ctx.currentTime + 0.6); } catch { /* stopped */ } });
    nodesRef.current = [];
    masterRef.current = null;
    window.setTimeout(() => startAmbient(chord), 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (playing && master && ctx) {
      master.gain.setTargetAtTime(Math.max(0.05, volume) * 0.5, ctx.currentTime, 0.3);
    }
  }, [volume, playing]);

  useEffect(() => () => stopAmbient(), []);

  const handlePlayPause = () => {
    haptic('tap');
    if (playing) {
      stopAmbient();
    } else {
      startAmbient(getChordForRoute(location.pathname));
    }
  };

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showSpotify && (
          <SpotifyPanel key="spotify" onClose={() => setShowSpotify(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && !showSpotify && (
          <motion.div
            className="glass-strong rounded-3xl p-4 shadow-glass-lg"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <p className="mb-1 text-[0.65rem] uppercase tracking-luxe text-rosegold-500">Ambient mode</p>
            <p className="mb-2 text-sm font-medium text-[color:var(--ink-strong)]">Our quiet soundscape</p>
            <label className="mb-3 flex items-center gap-2 text-xs text-[color:var(--ink-soft)]">
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
            <button
              type="button"
              onClick={() => { haptic('tap'); setOpen(false); setShowSpotify(true); }}
              className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1DB954] px-4 py-2 text-xs font-bold text-white"
            >
              <span>🎵</span> Open Spotify Playlists
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={playing ? 'Pause ambient music' : 'Play ambient music'}
        aria-pressed={playing}
        whileTap={{ scale: 0.9 }}
        onClick={handlePlayPause}
        onDoubleClick={() => { setShowSpotify(true); setOpen(false); }}
        onContextMenu={(e) => { e.preventDefault(); setOpen((o) => !o); }}
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

      <div className="flex gap-1">
        <button
          type="button"
          className="text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)] underline-offset-2 hover:underline"
          onClick={() => { setOpen((o) => !o); setShowSpotify(false); }}
        >
          {open ? 'Close' : 'Volume'}
        </button>
        <span className="text-[0.6rem] text-[color:var(--ink-soft)]">·</span>
        <button
          type="button"
          className="text-[0.6rem] uppercase tracking-luxe text-[#1DB954] underline-offset-2 hover:underline"
          onClick={() => { haptic('tap'); setShowSpotify((s) => !s); setOpen(false); }}
        >
          Spotify
        </button>
      </div>
    </div>
  );
}
