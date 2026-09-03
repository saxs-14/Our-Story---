import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MediaUpload } from '@/components/ui/MediaUpload';
import { CloseIcon } from '@/components/icons';
import { MEMORIES, type MemoryType } from '@/data/memories';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore, personById, type PersonId } from '@/store/useAuthStore';
import { useMediaUrl, useMediaKind } from '@/hooks/useMediaUrl';
import { MediaViewerModal } from '@/components/ui/MediaViewerModal';
import { formatLongDate } from '@/lib/time';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useDialogA11y } from '@/hooks/useDialogA11y';

type Bucket = MemoryType | 'ours';
type Filter = Bucket | 'all';

interface Item {
  id: string;
  date: string;
  title: string;
  description: string;
  emoji: string;
  bucket: Bucket;
  place?: string;
  authored?: PersonId;
  mediaIds?: string[];
  mediaUrls?: string[];
  future?: boolean;
  isUser?: boolean;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything ✨' },
  { key: 'ours', label: 'Our Moments 💖' },
  { key: 'relationship', label: 'Us Official ❤️' },
  { key: 'friendship', label: 'Friendship 🌱' },
  { key: 'milestone', label: 'Milestones 🎂' },
  { key: 'future', label: 'Future Dreams 💍' },
];

const COLOR: Record<Bucket, string> = {
  friendship: '#a99ed6',
  relationship: '#e3706a',
  milestone: '#d4af7a',
  future: '#c98b8b',
  ours: '#f06292',
};

const EMOJIS = ['❤️', '❄️', '🔥', '🥹', '🌹', '✨', '🎂', '🥂', '✈️', '💍', '📸', '🎵', '🌙', '🌱'];

/** Sniffs image vs. video from a cloud Storage URL's filename extension —
 *  the only signal available for a `mediaUrls` entry, since (unlike a local
 *  `mediaIds` entry) there's no IndexedDB record carrying a real MIME type
 *  alongside it. */
function kindFromUrl(url: string): 'image' | 'video' {
  return /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(url) ? 'video' : 'image';
}

function MediaTile({
  url,
  type,
  large,
  onOpen,
}: {
  url: string;
  type: 'image' | 'video';
  large: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={type === 'video' ? 'View video' : 'View photo'}
      className={cn(
        'tap relative shrink-0 overflow-hidden rounded-2xl shadow-md',
        large ? 'h-64 w-full' : 'h-40 w-40',
      )}
    >
      {type === 'video' ? (
        <>
          <video src={url} className="h-full w-full object-cover" preload="metadata" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-warmwhite">
              ▶
            </span>
          </span>
        </>
      ) : (
        <img src={url} alt="Memory attachment" className="h-full w-full object-cover" loading="lazy" />
      )}
    </button>
  );
}

function IdThumb({
  id,
  large,
  onOpen,
}: {
  id: string;
  large: boolean;
  onOpen: (v: { url: string; type: 'image' | 'video' }) => void;
}) {
  const url = useMediaUrl(id);
  const kind = useMediaKind(id);
  if (!url) return null;
  const type = kind === 'video' ? 'video' : 'image';
  return <MediaTile url={url} type={type} large={large} onOpen={() => onOpen({ url, type })} />;
}

/** Previously every attachment rendered as a fixed 96x96 <img> — too small
 *  to actually see, with no way to view it larger, and videos (accepted by
 *  the upload picker but never handled here) silently rendered as broken
 *  images. Now: a single attachment shows large (matches the "large"
 *  request), multiple show at a real "medium" size in a scroll row (up from
 *  96px), videos get a real <video> + play affordance, and tapping any of
 *  them opens the same full-size viewer Chat uses. */
function MediaThumbs({ ids, urls }: { ids?: string[]; urls?: string[] }) {
  const allIds = ids || [];
  const allUrls = urls || [];
  const large = allIds.length + allUrls.length === 1;
  const [viewer, setViewer] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  return (
    <>
      <div className={cn('mt-3 flex gap-2.5', !large && 'overflow-x-auto pb-1')}>
        {allIds.map((id) => (
          <IdThumb key={id} id={id} large={large} onOpen={setViewer} />
        ))}
        {allUrls.map((url, i) => {
          const type = kindFromUrl(url);
          return <MediaTile key={i} url={url} type={type} large={large} onOpen={() => setViewer({ url, type })} />;
        })}
      </div>
      <AnimatePresence>
        {viewer && <MediaViewerModal url={viewer.url} type={viewer.type} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </>
  );
}

function ComposeMoment({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);
  const userId = useAuthStore((s) => s.userId);
  const addMemory = useContentStore((s) => s.addMemory);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [emoji, setEmoji] = useState('❤️');
  const [mediaIds, setMediaIds] = useState<string[]>([]);

  const save = () => {
    if (!userId || !title.trim()) return;
    haptic('success');
    addMemory({
      authorId: userId,
      date,
      title: title.trim(),
      description: description.trim(),
      emoji,
      mediaIds,
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
        aria-label="Add a real moment"
        tabIndex={-1}
        className="glass-strong relative z-10 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-4xl border border-rosegold-400/30 p-6 shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-luxe text-rosegold-400">Add to our story</span>
            <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">A Moment That Happened</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-400 hover:text-rosegold-600"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-400">Date of Memory</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          className="mb-3 w-full rounded-2xl bg-black/5 px-4 py-3 text-[color:var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of this special moment…"
          aria-label="Title"
          className="mb-3 w-full rounded-2xl bg-black/5 px-4 py-3 font-display text-lg text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Tell the story of what happened between us that day…"
          aria-label="Description"
          className="mb-3 w-full resize-none rounded-2xl bg-black/5 p-4 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Location (e.g. Mbombela, our favourite spot)"
          aria-label="Place"
          className="mb-3 w-full rounded-2xl bg-black/5 px-4 py-2.5 text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-400">Choose an Emoji</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                'tap flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform',
                emoji === e ? 'bg-rosegold-500/30 ring-2 ring-rosegold-400 scale-110' : 'bg-warmwhite/10',
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-3">
          <MediaUpload
            accept="image/*,video/*"
            label="Attach photo or video"
            onUploaded={(id) => setMediaIds((m) => [...m, id])}
            className="rounded-2xl border border-rosegold-400/30 bg-rosegold-500/20 px-4 py-2 text-sm text-[color:var(--ink-strong)]"
          >
            📷 Attach Photo / Video
          </MediaUpload>
          {mediaIds.length > 0 && (
            <span className="text-xs text-rosegold-300">{mediaIds.length} attached</span>
          )}
        </div>

        {mediaIds.length > 0 && <MediaThumbs ids={mediaIds} />}

        <Button variant="gold" size="lg" className="mt-4 w-full" onClick={save} disabled={!title.trim()}>
          Save to Our Timeline ♥
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function Timeline() {
  const [filter, setFilter] = useState<Filter>('all');
  const [composing, setComposing] = useState(false);
  const userMemories = useContentStore((s) => s.memories);
  const deleteMemory = useContentStore((s) => s.deleteMemory);


  const items = useMemo<Item[]>(() => {
    const seeded: Item[] = MEMORIES.map((m) => ({
      id: m.id,
      date: m.date,
      title: m.title,
      description: m.description,
      emoji: m.emoji,
      bucket: m.type,
      place: m.place,
      future: m.type === 'future',
    }));

    const mine: Item[] = userMemories.map((m) => ({
      id: m.id,
      date: m.date,
      title: m.title,
      description: m.description,
      emoji: m.emoji,
      bucket: 'ours',
      authored: m.authorId,
      mediaIds: m.mediaIds,
      mediaUrls: m.mediaUrls,
      isUser: true,
    }));

    const all = [...seeded, ...mine];
    const list = filter === 'all' ? all : all.filter((e) => e.bucket === filter);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [filter, userMemories]);

  return (
    <PageShell
      eyebrow="Our Journey"
      title="The Timeline"
      subtitle="From the very first day we talked to the memories we create today. Only our real story."
    >
      <Button
        variant="gold"
        size="lg"
        className="mb-5 w-full shadow-[0_0_20px_rgba(212,175,122,0.35)]"
        onClick={() => {
          haptic('soft');
          setComposing(true);
        }}
      >
        ➕ Add a moment that happened
      </Button>

      {/* Filter Chips */}
      <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              haptic('tap');
              setFilter(f.key);
            }}
            className={cn(
              'tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all',
              filter === f.key
                ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-700 text-warmwhite font-medium shadow-md'
                : 'glass text-[color:var(--ink-soft)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Vertical Glowing Timeline */}
      <div className="relative pl-7">
        <div className="absolute bottom-0 left-3 top-2 w-0.5 bg-gradient-to-b from-rosegold-400 via-rose-500 to-dustyrose-400 shadow-[0_0_10px_rgba(227,70,95,0.6)]" />

        <ul className="space-y-6">
          {items.map((e, i) => (
            <motion.li
              key={e.id}
              className="relative"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Floating Emoji Marker on Line */}
              <span
                className="absolute -left-[1.45rem] top-3 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-base shadow-[0_0_15px_rgba(227,70,95,0.5)] border border-white/20"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${COLOR[e.bucket]}, ${COLOR[e.bucket]}cc)`,
                }}
                aria-hidden
              >
                {e.emoji}
              </span>

              <GlassCard className={cn('p-5 shadow-glass transition-all hover:border-rosegold-400/40', e.future && 'border-dashed opacity-95')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-luxe" style={{ color: COLOR[e.bucket] }}>
                    {formatLongDate(e.date)} {e.future && '· future aspiration'}
                    {e.authored && ` · added by ${personById(e.authored).nickname}`}
                  </p>
                  {e.isUser && (
                    <button
                      type="button"
                      aria-label="Delete moment"
                      onClick={() => {
                        haptic('tap');
                        deleteMemory(e.id);
                      }}
                      className="tap flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--ink-soft)] hover:text-red-400"
                    >
                      <CloseIcon width={14} height={14} />
                    </button>
                  )}
                </div>

                <h3 className="mt-1 font-display text-2xl text-[color:var(--ink-strong)]">{e.title}</h3>
                {e.description && <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-soft)]">{e.description}</p>}
                {e.place && <p className="mt-2.5 text-xs text-rosegold-500">📍 {e.place}</p>}

                {(e.mediaIds?.length || e.mediaUrls?.length) ? (
                  <MediaThumbs ids={e.mediaIds} urls={e.mediaUrls} />
                ) : null}
              </GlassCard>
            </motion.li>
          ))}
        </ul>
      </div>

      <AnimatePresence>{composing && <ComposeMoment onClose={() => setComposing(false)} />}</AnimatePresence>
    </PageShell>
  );
}
