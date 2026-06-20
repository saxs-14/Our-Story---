import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@/components/icons';
import { ALBUMS, PHOTOS, photosByAlbum, type AlbumId, type Photo } from '@/data/gallery';
import { monogram } from '@/config/relationship';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

type Mode = 'grid' | 'polaroid' | 'scrapbook';

function PhotoArt({ photo, className }: { photo: Photo; className?: string }) {
  if (photo.src) {
    return <img src={photo.src} alt={photo.caption} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div
      className={cn('flex h-full w-full items-center justify-center', className)}
      style={{ background: `linear-gradient(135deg, ${photo.gradient[0]}, ${photo.gradient[1]} 55%, ${photo.gradient[2]})` }}
      aria-label={photo.caption}
      role="img"
    >
      <span className="font-display text-xl font-semibold tracking-[0.15em] text-warmwhite/90 drop-shadow">{monogram}</span>
    </div>
  );
}

export default function Gallery() {
  const [album, setAlbum] = useState<AlbumId | 'all'>('all');
  const [mode, setMode] = useState<Mode>('polaroid');
  const [index, setIndex] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);

  const list = useMemo(() => (album === 'all' ? PHOTOS : photosByAlbum(album)), [album]);

  useEffect(() => {
    if (!slideshow || index === null) return;
    const id = window.setInterval(() => setIndex((i) => (i === null ? 0 : (i + 1) % list.length)), 2600);
    return () => clearInterval(id);
  }, [slideshow, index, list.length]);

  const cats: (AlbumId | 'all')[] = ['all', ...ALBUMS.map((a) => a.id)];
  const albumTitle = (id: AlbumId) => ALBUMS.find((a) => a.id === id)?.title ?? '';

  return (
    <PageShell eyebrow="Our moments" title="The Gallery" subtitle="Designed frames for now — drop your real photos into /public/media to bring them to life.">
      {/* Album chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((c) => (
          <button key={c} onClick={() => { haptic('tap'); setAlbum(c); }} className={cn('tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors', album === c ? 'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
            {c === 'all' ? 'All' : albumTitle(c)}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="mb-5 flex gap-1 rounded-full bg-warmwhite/40 p-1 text-sm">
        {(['polaroid', 'grid', 'scrapbook'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { haptic('tap'); setMode(m); }} className={cn('tap flex-1 rounded-full py-1.5 capitalize transition-colors', mode === m ? 'bg-rosegold-500 text-warmwhite' : 'text-[color:var(--ink-soft)]')}>
            {m}
          </button>
        ))}
      </div>

      {/* Layouts */}
      {mode === 'grid' && (
        <div className="grid grid-cols-3 gap-2">
          {list.map((p, i) => (
            <button key={p.id} onClick={() => { haptic('soft'); setIndex(i); }} className="aspect-square overflow-hidden rounded-2xl">
              <PhotoArt photo={p} className="transition-transform duration-500 hover:scale-110" />
            </button>
          ))}
        </div>
      )}

      {mode === 'polaroid' && (
        <div className="grid grid-cols-2 gap-4">
          {list.map((p, i) => (
            <motion.button
              key={p.id}
              onClick={() => { haptic('soft'); setIndex(i); }}
              initial={{ opacity: 0, y: 18, rotate: i % 2 ? 2 : -2 }}
              animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
              transition={{ delay: Math.min(i, 10) * 0.04 }}
              whileHover={{ rotate: 0, y: -4 }}
              className="bg-warmwhite p-2 pb-7 shadow-glass"
            >
              <div className="aspect-square overflow-hidden">
                <PhotoArt photo={p} />
              </div>
              <p className="mt-2 text-center font-script text-lg text-plum-700">{p.caption}</p>
            </motion.button>
          ))}
        </div>
      )}

      {mode === 'scrapbook' && (
        <div className="columns-2 gap-3 [column-fill:_balance]">
          {list.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { haptic('soft'); setIndex(i); }}
              className="mb-3 block w-full break-inside-avoid bg-warmwhite p-2 shadow-soft"
              style={{ transform: `rotate(${i % 3 === 0 ? -2 : i % 3 === 1 ? 1.5 : -0.5}deg)` }}
            >
              <div className={cn('overflow-hidden', i % 2 ? 'aspect-[3/4]' : 'aspect-square')}>
                <PhotoArt photo={p} />
              </div>
              <p className="mt-1 text-center font-script text-base text-plum-700">{p.caption}</p>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {index !== null && list[index] && (
          <motion.div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-plum-900/80 backdrop-blur-md p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] flex gap-2">
              <button onClick={() => { haptic('tap'); setSlideshow((s) => !s); }} aria-label={slideshow ? 'Pause slideshow' : 'Play slideshow'} className="tap flex h-11 w-11 items-center justify-center rounded-full glass-strong text-warmwhite">
                {slideshow ? <PauseIcon width={20} height={20} /> : <PlayIcon width={20} height={20} />}
              </button>
              <button onClick={() => { setSlideshow(false); setIndex(null); }} aria-label="Close" className="tap flex h-11 w-11 items-center justify-center rounded-full glass-strong text-warmwhite">
                <CloseIcon width={22} height={22} />
              </button>
            </div>

            <motion.div key={list[index].id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
              <div className="aspect-square overflow-hidden rounded-3xl shadow-glass-lg">
                <PhotoArt photo={list[index]} />
              </div>
              <p className="mt-4 text-center font-script text-2xl text-warmwhite">{list[index].caption}</p>
              <p className="text-center text-xs uppercase tracking-luxe text-cream/70">{albumTitle(list[index].album)}</p>
            </motion.div>

            <div className="mt-5 flex items-center gap-6">
              <button onClick={() => setIndex((i) => (i === null ? 0 : (i - 1 + list.length) % list.length))} aria-label="Previous" className="tap flex h-12 w-12 items-center justify-center rounded-full glass-strong text-warmwhite">
                <ChevronLeftIcon width={24} height={24} />
              </button>
              <span className="text-sm text-cream/80">{index + 1} / {list.length}</span>
              <button onClick={() => setIndex((i) => (i === null ? 0 : (i + 1) % list.length))} aria-label="Next" className="tap flex h-12 w-12 items-center justify-center rounded-full glass-strong text-warmwhite">
                <ChevronRightIcon width={24} height={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
