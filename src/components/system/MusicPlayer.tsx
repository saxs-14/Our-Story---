import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { GALLERY_SONG, PLAYLISTS } from '@/data/songs';

/** Spotify embedded playlist panel — real, named songs. */
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
      className="glass-strong absolute bottom-14 right-0 z-50 w-[min(360px,94vw)] overflow-hidden rounded-3xl shadow-glass-lg"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
    >
      <div className="flex items-center justify-between px-3 pt-4 pb-2">
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
      <div className="flex gap-1.5 px-3 pb-3">
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
        <div className="px-2 pb-2">
          <p className="mb-1 text-[0.6rem] uppercase tracking-luxe text-rosegold-400">
            📸 Playing for the Gallery
          </p>
          <iframe
            src={GALLERY_SONG.embedUrl}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Photograph — Ed Sheeran"
            className="rounded-2xl"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* Playlist embed */}
      <div className="px-2 pb-4">
        <p className="mb-1 text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">
          {playlist.name}
        </p>
        <iframe
          key={playlist.embedUrl}
          src={playlist.embedUrl}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={playlist.name}
          className="rounded-2xl"
          style={{ border: 'none' }}
        />
        <p className="mt-2 text-center text-[0.6rem] leading-snug text-[color:var(--ink-soft)]">
          Press ▶ on a song to play. Tip: log in to Spotify for full tracks.
        </p>
        <a
          href={playlist.openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-center text-[0.65rem] text-rosegold-500 underline underline-offset-2"
        >
          Open in Spotify ↗
        </a>
      </div>
    </motion.div>
  );
}

/**
 * Music player: a floating button that opens a Spotify panel with real,
 * named songs — love songs, gospel, and SA gospel. The Gallery page surfaces
 * "Photograph" by Ed Sheeran first. (Browsers require a tap on Spotify's own
 * ▶ button before audio starts; full tracks need a Spotify login.)
 */
export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isGallery = location.pathname === '/gallery';

  const toggle = () => {
    haptic('tap');
    setOpen((o) => !o);
  };

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && <SpotifyPanel key="spotify" onClose={() => setOpen(false)} />}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={open ? 'Close music' : 'Open music'}
        aria-pressed={open}
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="glass-strong flex h-12 w-12 items-center justify-center rounded-full text-rosegold-600 shadow-glass"
      >
        <span className="relative text-xl leading-none" aria-hidden="true">
          🎵
          {open && (
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
        onClick={toggle}
        className="text-[0.6rem] uppercase tracking-luxe text-[#1DB954] underline-offset-2 hover:underline"
      >
        {open ? 'Close' : isGallery ? 'Play our song' : 'Music'}
      </button>
    </div>
  );
}
