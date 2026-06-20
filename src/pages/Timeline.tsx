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
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { formatLongDate } from '@/lib/time';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

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
  future?: boolean;
  isUser?: boolean;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'ours', label: 'Our moments' },
  { key: 'friendship', label: 'Friendship' },
  { key: 'relationship', label: 'Us' },
  { key: 'milestone', label: 'Milestones' },
  { key: 'future', label: 'Dreams ahead' },
];

const COLOR: Record<Bucket, string> = {
  friendship: '#a99ed6',
  relationship: '#b76e79',
  milestone: '#d4af7a',
  future: '#c98b8b',
  ours: '#e3706a',
};

const EMOJIS = ['❤️', '😂', '🌅', '🍝', '🎶', '✈️', '🎁', '☕', '🌹', '📸', '🥂', '🌙'];

function MediaThumbs({ ids }: { ids: string[] }) {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto">
      {ids.map((id) => (
        <Thumb key={id} id={id} />
      ))}
    </div>
  );
}
function Thumb({ id }: { id: string }) {
  const url = useMediaUrl(id);
  if (!url) return null;
  return <img src={url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />;
}

function ComposeMoment({ onClose }: { onClose: () => void }) {
  const userId = useAuthStore((s) => s.userId);
  const addMemory = useContentStore((s) => s.addMemory);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('❤️');
  const [mediaIds, setMediaIds] = useState<string[]>([]);

  const save = () => {
    if (!userId || !title.trim()) return;
    haptic('success');
    addMemory({ authorId: userId, date, title: title.trim(), description: description.trim(), emoji, mediaIds });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-plum-900/55 backdrop-blur-md" onClick={onClose} />
      <motion.div role="dialog" aria-label="Add a moment" className="glass-strong relative z-10 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-4xl p-6" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Add a real moment</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]"><CloseIcon width={20} height={20} /></button>
        </div>
        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-500">When did it happen?</label>
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="mb-3 w-full rounded-2xl bg-warmwhite/70 px-4 py-3 text-[color:var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What happened?" aria-label="Title" className="mb-3 w-full rounded-2xl bg-warmwhite/70 px-4 py-3 font-display text-lg text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Tell the story of that day…" aria-label="Description" className="mb-3 w-full resize-none rounded-2xl bg-warmwhite/70 p-4 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className={cn('tap h-9 w-9 rounded-full text-lg', emoji === e ? 'bg-rosegold-500/20 ring-2 ring-rosegold-400' : 'glass')}>{e}</button>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-3">
          <MediaUpload accept="image/*" label="Add a photo to this moment" onUploaded={(id) => setMediaIds((m) => [...m, id])} className="glass rounded-2xl px-4 py-2 text-sm text-rosegold-600">
            📷 Add photo
          </MediaUpload>
          {mediaIds.length > 0 && <span className="text-xs text-[color:var(--ink-soft)]">{mediaIds.length} added</span>}
        </div>
        {mediaIds.length > 0 && <MediaThumbs ids={mediaIds} />}
        <Button variant="primary" className="mt-4 w-full" onClick={save} disabled={!title.trim()}>Save to our timeline</Button>
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
      isUser: true,
    }));
    const all = [...seeded, ...mine];
    const list = filter === 'all' ? all : all.filter((e) => e.bucket === filter);
    return list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [filter, userMemories]);

  return (
    <PageShell eyebrow="Our timeline" title="From friends to forever" subtitle="The real chapters — add what actually happened, the day it happened. No lies, just us.">
      <Button variant="gold" size="lg" className="mb-5 w-full" onClick={() => { haptic('soft'); setComposing(true); }}>
        ➕ Add a moment that really happened
      </Button>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => { haptic('tap'); setFilter(f.key); }} className={cn('tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors', filter === f.key ? 'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative pl-8">
        <div className="absolute bottom-0 left-3 top-2 w-px bg-gradient-to-b from-lavender-400 via-rosegold-400 to-dustyrose-400" />
        <ul className="space-y-6">
          {items.map((e, i) => (
            <motion.li key={e.id} className="relative" initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              <span className="absolute -left-[1.4rem] top-3 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-sm shadow-soft" style={{ background: `radial-gradient(circle at 35% 30%, ${COLOR[e.bucket]}, ${COLOR[e.bucket]}bb)` }} aria-hidden>
                {e.emoji}
              </span>
              <GlassCard className={cn('p-5', e.future && 'border-dashed opacity-95')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.65rem] uppercase tracking-luxe" style={{ color: COLOR[e.bucket] }}>
                    {formatLongDate(e.date)} {e.future && '· yet to come'}
                    {e.authored && ` · ${personById(e.authored).nickname}`}
                  </p>
                  {e.isUser && (
                    <button type="button" aria-label="Delete moment" onClick={() => { haptic('tap'); deleteMemory(e.id); }} className="tap flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--ink-soft)] hover:text-dustyrose-500">
                      <CloseIcon width={14} height={14} />
                    </button>
                  )}
                </div>
                <h3 className="mt-1 font-display text-2xl text-[color:var(--ink-strong)]">{e.title}</h3>
                {e.description && <p className="mt-1.5 text-[color:var(--ink-soft)]">{e.description}</p>}
                {e.place && <p className="mt-2 text-xs text-rosegold-500">📍 {e.place}</p>}
                {e.mediaIds && e.mediaIds.length > 0 && <MediaThumbs ids={e.mediaIds} />}
              </GlassCard>
            </motion.li>
          ))}
        </ul>
      </div>

      <AnimatePresence>{composing && <ComposeMoment onClose={() => setComposing(false)} />}</AnimatePresence>
    </PageShell>
  );
}
