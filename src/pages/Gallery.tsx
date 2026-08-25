import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MediaUpload } from '@/components/ui/MediaUpload';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@/components/icons';
import { ALBUMS, type AlbumId } from '@/data/gallery';
import { useContentStore, type GalleryItem } from '@/store/useContentStore';
import { useAuthStore, personById } from '@/store/useAuthStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useDialogA11y } from '@/hooks/useDialogA11y';

type Mode = 'polaroid' | 'grid' | 'scrapbook';

function UploadModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);
  const userId = useAuthStore((s) => s.userId);
  const addGalleryItem = useContentStore((s) => s.addGalleryItem);
  const [caption, setCaption] = useState('');
  const [album, setAlbum] = useState<AlbumId>('journey');
  const [mediaId, setMediaId] = useState<string | null>(null);

  const save = () => {
    if (!userId || !mediaId) return;
    haptic('success');
    addGalleryItem({
      authorId: userId,
      caption: caption.trim() || 'A beautiful memory ♥',
      album,
      mediaId,
    });
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Upload photo or video"
        tabIndex={-1}
        className="glass-strong relative z-10 w-full max-w-md rounded-4xl border border-rosegold-400/30 p-6 shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Add to Gallery</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-400 hover:text-rosegold-600"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-400">Select Album</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {ALBUMS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAlbum(a.id)}
              className={cn(
                'tap rounded-full px-3 py-1 text-xs transition-colors',
                album === a.id ? 'bg-rosegold-500 text-warmwhite' : 'bg-black/5 text-[color:var(--ink-soft)]',
              )}
            >
              {a.emoji} {a.title}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <MediaUpload
            accept="image/*,video/*"
            label="Upload photo or video"
            onUploaded={(id) => setMediaId(id)}
            className="flex w-full items-center justify-center rounded-2xl border border-dashed border-rosegold-400/50 bg-rosegold-500/10 p-6 text-sm text-[color:var(--ink-strong)] transition-colors hover:bg-rosegold-500/20"
          >
            {mediaId ? '✓ Photo / Video Loaded' : '📷 Choose Photo or Video'}
          </MediaUpload>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (e.g. Golden hour with you)…"
          aria-label="Caption"
          className="mb-4 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <Button variant="gold" size="lg" className="w-full" onClick={save} disabled={!mediaId}>
          Add to Our Gallery ♥
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ItemDisplay({
  item,
  className,
  fit = 'cover',
}: {
  item: GalleryItem;
  className?: string;
  fit?: 'cover' | 'contain';
}) {
  const url = useMediaUrl(item.mediaId);
  const finalSrc = item.mediaUrl || url;

  if (!finalSrc) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-rosegold-900/30', className)}>
        <span className="text-2xl">🌹</span>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={item.caption}
      loading="lazy"
      className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover', className)}
    />
  );
}

export default function Gallery() {
  const galleryItems = useContentStore((s) => s.gallery);
  const deleteGalleryItem = useContentStore((s) => s.deleteGalleryItem);

  const [album, setAlbum] = useState<AlbumId | 'all'>('all');
  const [mode, setMode] = useState<Mode>('polaroid');
  const [index, setIndex] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [uploading, setUploading] = useState(false);

  const list = useMemo(() => {
    if (album === 'all') return galleryItems;
    return galleryItems.filter((g) => g.album === album);
  }, [album, galleryItems]);

  useEffect(() => {
    if (!slideshow || index === null || list.length === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i === null ? 0 : (i + 1) % list.length)), 3000);
    return () => clearInterval(id);
  }, [slideshow, index, list.length]);

  const albumTitle = (id: string) => ALBUMS.find((a) => a.id === id)?.title ?? '';

  return (
    <PageShell
      eyebrow="Our Visual Memories"
      title="The Gallery"
      subtitle="Every picture and video tells a chapter of Saxs & Snowpie."
    >
      <Button
        variant="gold"
        size="lg"
        className="mb-4 w-full shadow-[0_0_20px_rgba(212,175,122,0.35)]"
        onClick={() => {
          haptic('soft');
          setUploading(true);
        }}
      >
        📷 Upload Photo or Video
      </Button>

      {/* Album Selector Tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            setAlbum('all');
          }}
          className={cn(
            'tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all',
            album === 'all'
              ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-700 text-warmwhite font-medium shadow-md'
              : 'glass text-[color:var(--ink-soft)]',
          )}
        >
          All Memories ({galleryItems.length})
        </button>
        {ALBUMS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              haptic('tap');
              setAlbum(a.id);
            }}
            className={cn(
              'tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all',
              album === a.id
                ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-700 text-warmwhite font-medium shadow-md'
                : 'glass text-[color:var(--ink-soft)]',
            )}
          >
            {a.emoji} {a.title}
          </button>
        ))}
      </div>

      {/* Display Mode Switcher */}
      <div className="mb-5 flex gap-1 rounded-full bg-black/75 p-1 text-sm backdrop-blur-md">
        {(['polaroid', 'grid', 'scrapbook'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              haptic('tap');
              setMode(m);
            }}
            className={cn(
              'tap flex-1 rounded-full py-1.5 capitalize transition-colors',
              mode === m ? 'bg-rosegold-500 text-warmwhite font-semibold' : 'text-warmwhite/70',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {list.length === 0 && (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center text-[color:var(--ink-soft)]">
          <span className="text-4xl">📸</span>
          <p className="mt-3 font-display text-xl text-[color:var(--ink-strong)]">No photos in this album yet</p>
          <p className="mt-1 text-xs">Tap the upload button above to add the first memory.</p>
        </GlassCard>
      )}

      {/* Mode 1: Polaroid View */}
      {mode === 'polaroid' && list.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {list.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, rotate: i % 2 ? 2 : -2 }}
              animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
              whileHover={{ rotate: 0, y: -4, scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl bg-warmwhite p-2.5 pb-6 text-plum-900 shadow-glass"
            >
              <button
                type="button"
                onClick={() => {
                  haptic('soft');
                  setIndex(i);
                }}
                className="block w-full"
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-black/10">
                  <ItemDisplay item={item} />
                </div>
                <p className="mt-2 text-center font-script text-lg leading-snug">{item.caption}</p>
                <p className="text-center text-[0.6rem] uppercase tracking-luxe text-rosegold-600/80">
                  by {personById(item.authorId).nickname}
                </p>
              </button>

              <button
                type="button"
                aria-label="Delete item"
                onClick={() => {
                  haptic('tap');
                  deleteGalleryItem(item.id);
                }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mode 2: Luxury Grid View */}
      {mode === 'grid' && list.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {list.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic('soft');
                setIndex(i);
              }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-rosegold-400/20 shadow-md"
            >
              <ItemDisplay item={item} className="transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-2">
                <p className="truncate text-[0.65rem] text-warmwhite">{item.caption}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mode 3: Romantic Scrapbook View */}
      {mode === 'scrapbook' && list.length > 0 && (
        <div className="columns-2 gap-3 [column-fill:_balance]">
          {list.map((item, i) => (
            <div
              key={item.id}
              className="mb-4 block break-inside-avoid rounded-2xl bg-warmwhite/95 p-2 pb-5 text-plum-900 shadow-soft"
              style={{ transform: `rotate(${i % 3 === 0 ? -2 : i % 3 === 1 ? 1.5 : -1}deg)` }}
            >
              <button
                type="button"
                onClick={() => {
                  haptic('soft');
                  setIndex(i);
                }}
                className="block w-full"
              >
                <div className={cn('overflow-hidden rounded-xl', i % 2 ? 'aspect-[3/4]' : 'aspect-square')}>
                  <ItemDisplay item={item} />
                </div>
                <p className="mt-2 text-center font-script text-base text-plum-800">{item.caption}</p>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox & Slideshow */}
      <AnimatePresence>
        {index !== null && list[index] && (
          <motion.div
            className="fixed inset-0 z-[110] flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top Toolbar */}
            <div className="flex w-full max-w-xl items-center justify-between pt-2">
              <span className="text-xs uppercase tracking-luxe text-rosegold-300">
                {albumTitle(list[index].album)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    setSlideshow((s) => !s);
                  }}
                  className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-warmwhite"
                  aria-label={slideshow ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {slideshow ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideshow(false);
                    setIndex(null);
                  }}
                  className="tap flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-warmwhite"
                  aria-label="Close lightbox"
                >
                  <CloseIcon width={20} height={20} />
                </button>
              </div>
            </div>

            {/* Main Picture Centerpiece */}
            <motion.div
              key={list[index].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex max-h-[70vh] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-3xl"
            >
              <div className="max-h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl">
                <ItemDisplay item={list[index]} fit="contain" />
              </div>
              <p className="mt-4 text-center font-script text-2xl text-warmwhite">{list[index].caption}</p>
              <p className="text-xs text-rosegold-300">Added by {personById(list[index].authorId).nickname}</p>
            </motion.div>

            {/* Bottom Nav Arrows */}
            <div className="flex items-center gap-6 pb-4">
              <button
                type="button"
                onClick={() => setIndex((i) => (i === null ? 0 : (i - 1 + list.length) % list.length))}
                aria-label="Previous memory"
                className="tap flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-warmwhite"
              >
                <ChevronLeftIcon width={24} height={24} />
              </button>
              <span className="text-sm font-medium text-warmwhite/80">
                {index + 1} / {list.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => (i === null ? 0 : (i + 1) % list.length))}
                aria-label="Next memory"
                className="tap flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-warmwhite"
              >
                <ChevronRightIcon width={24} height={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{uploading && <UploadModal onClose={() => setUploading(false)} />}</AnimatePresence>
    </PageShell>
  );
}
