import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { GALLERY_SONG, PLAYLISTS } from '@/data/songs';

/** Spotify embedded playlist panel tailored for Saxs & Snowpie */
function SpotifyPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'rnb-love' | 'sa-gospel' | 'makhadzi' | 'amapiano'>('rnb-love');
  const location = useLocation();
  const isGallery = location.pathname === '/gallery';

  const playlist =
    tab === 'sa-gospel'
      ? PLAYLISTS.saGospel
      : tab === 'makhadzi'
      ? PLAYLISTS.makhadzi
      : tab === 'amapiano'
      ? PLAYLISTS.amapiano
      : PLAYLISTS.rnbLove;


  return (
    <motion.div
      className="glass-strong absolute bottom-16 right-0 z-50 w-[min(380px,94vw)] max-h-[85vh] overflow-hidden rounded-4xl border border-rosegold-400/30 shadow-2xl backdrop-blur-2xl"
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
    >
      <div className="flex items-center justify-between border-b border-rosegold-400/20 px-5 pt-4 pb-3">
        <div>
          <span className="text-[0.65rem] uppercase tracking-luxe text-rosegold-400">Our Soundtrack</span>
          <h3 className="font-display text-lg font-medium text-[color:var(--ink-strong)]">Music & Playlists</h3>
        </div>
        <button
          type="button"
          aria-label="Close music panel"
          onClick={onClose}
          className="tap flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-rosegold-400 hover:text-rosegold-600"
        >
          ✕
        </button>
      </div>

      {/* Music Category Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-4">
        {[
          ['rnb-love', '🍷 R&B / Love'],
          ['sa-gospel', '🇿🇦 SA Gospel'],
          ['makhadzi', '👑 Makhadzi'],
          ['amapiano', '🎹 Amapiano'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              haptic('tap');
              setTab(key as typeof tab);
            }}
            className={`tap rounded-xl px-2 py-2 text-[0.68rem] font-medium transition-all ${
              tab === key
                ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-700 text-warmwhite font-bold shadow-md'
                : 'bg-black/5 text-[color:var(--ink-soft)] hover:bg-black/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Special track when in Gallery */}
      {isGallery && tab === 'rnb-love' && (
        <div className="px-3 pb-2">
          <p className="mb-1 text-[0.6rem] uppercase tracking-luxe text-rosegold-400">
            📸 Curated for the Gallery
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

      {/* Embedded Spotify Player */}
      <div className="px-3 pb-4">
        <iframe
          key={playlist.embedUrl}
          src={playlist.embedUrl}
          width="100%"
          height="280"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={playlist.name}
          className="rounded-3xl border border-white/10 shadow-lg"
          style={{ border: 'none' }}
        />

        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-[0.65rem] text-[color:var(--ink-soft)]">
            Tap ▶ to play · Log in for full tracks
          </p>
          <a
            href={playlist.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] font-bold text-rosegold-400 underline underline-offset-2 hover:text-rosegold-300"
          >
            Open in Spotify ↗
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    haptic('tap');
    setOpen((o) => !o);
  };

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.8rem)] z-40 flex flex-col items-end gap-1.5">
      <AnimatePresence>
        {open && <SpotifyPanel key="spotify" onClose={() => setOpen(false)} />}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={open ? 'Close music' : 'Open music'}
        aria-pressed={open}
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        className="glass-strong flex h-12 w-12 items-center justify-center rounded-full border border-rosegold-400/40 text-rosegold-300 shadow-[0_0_20px_rgba(227,70,95,0.4)] backdrop-blur-xl"
      >
        <span className="relative text-xl leading-none" aria-hidden="true">
          🎵
          {open && (
            <motion.span
              className="absolute inset-0 -m-2 rounded-full border border-rosegold-400/50"
              animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </span>
      </motion.button>
    </div>
  );
}
