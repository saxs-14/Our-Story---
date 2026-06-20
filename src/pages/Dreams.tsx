import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/icons';
import { DREAMS, DREAM_CATEGORIES, type Dream, type DreamCategory } from '@/data/dreams';
import { useProgressStore } from '@/store/useProgressStore';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore, personById } from '@/store/useAuthStore';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

const EMOJI_CHOICES = ['✨', '🌅', '🏝️', '🏠', '💍', '✈️', '🌹', '🎶', '🌳', '🚗', '🎈', '💞'];

function ComposeDream({ onClose }: { onClose: () => void }) {
  const userId = useAuthStore((s) => s.userId);
  const addDream = useContentStore((s) => s.addDream);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [category, setCategory] = useState<DreamCategory>('Bucket List');

  const save = () => {
    if (!userId || !title.trim()) return;
    haptic('success');
    addDream({ authorId: userId, title: title.trim(), note: note.trim(), emoji, category });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-plum-900/55 backdrop-blur-md" onClick={onClose} />
      <motion.div role="dialog" aria-label="Add a dream" className="glass-strong relative z-10 w-full max-w-md rounded-4xl p-6" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Add a dream</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]"><CloseIcon width={20} height={20} /></button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you dream of?" aria-label="Dream title" className="mb-3 w-full rounded-2xl bg-warmwhite/70 px-4 py-3 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="A little note about it…" aria-label="Dream note" className="mb-3 w-full rounded-2xl bg-warmwhite/70 px-4 py-3 text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className={cn('tap h-9 w-9 rounded-full text-lg', emoji === e ? 'bg-rosegold-500/20 ring-2 ring-rosegold-400' : 'glass')}>{e}</button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {DREAM_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cn('tap rounded-full px-3 py-1 text-xs', category === c ? 'bg-rosegold-500 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>{c}</button>
          ))}
        </div>
        <Button variant="primary" className="w-full" onClick={save} disabled={!title.trim()}>Add to our board</Button>
      </motion.div>
    </motion.div>
  );
}

export default function Dreams() {
  const checked = useProgressStore((s) => s.dreamsChecked);
  const toggleDream = useProgressStore((s) => s.toggleDream);
  const userDreams = useContentStore((s) => s.dreams);
  const deleteDream = useContentStore((s) => s.deleteDream);
  const playSound = useSound();
  const [filter, setFilter] = useState<DreamCategory | 'All'>('All');
  const [composing, setComposing] = useState(false);

  const userIds = useMemo(() => new Set(userDreams.map((d) => d.id)), [userDreams]);
  const authorById = useMemo(() => new Map(userDreams.map((d) => [d.id, d.authorId])), [userDreams]);
  const allDreams: Dream[] = useMemo(
    () => [...userDreams.map((d) => ({ id: d.id, category: d.category, title: d.title, note: d.note, emoji: d.emoji })), ...DREAMS],
    [userDreams],
  );

  const cats: (DreamCategory | 'All')[] = ['All', ...DREAM_CATEGORIES];
  const list = filter === 'All' ? allDreams : allDreams.filter((d) => d.category === filter);
  const done = allDreams.filter((d) => checked.includes(d.id)).length;

  return (
    <PageShell eyebrow="Our vision board" title="Dreams we're building" subtitle={`${done} of ${allDreams.length} dreamed into motion. Tap one when we make it real.`}>
      <Button variant="gold" size="lg" className="mb-4 w-full" onClick={() => { haptic('soft'); setComposing(true); }}>
        ✨ Add a dream of ours
      </Button>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-rosegold-100/50">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-rosegold-400 to-champagne-400" initial={{ width: 0 }} animate={{ width: `${(done / Math.max(1, allDreams.length)) * 100}%` }} transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.7 }} />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((c) => (
          <button key={c} onClick={() => { haptic('tap'); setFilter(c); }} className={cn('tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors', filter === c ? 'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {list.map((d, i) => {
          const isDone = checked.includes(d.id);
          const isUser = userIds.has(d.id);
          const author = authorById.get(d.id);
          return (
            <motion.div
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => { haptic('soft'); if (!isDone) playSound('chime'); toggleDream(d.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDream(d.id); } }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              whileTap={{ scale: 0.96 }}
              className="cursor-pointer text-left"
              aria-pressed={isDone}
            >
              <GlassCard className={cn('relative h-full overflow-hidden p-4 transition-shadow', isDone && 'shadow-glow')}>
                {isDone && (
                  <motion.span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-rosegold-500 text-warmwhite" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                    ✓
                  </motion.span>
                )}
                <div className="text-3xl" aria-hidden>{d.emoji}</div>
                <p className="mt-2 text-[0.6rem] uppercase tracking-luxe text-rosegold-500">{d.category}</p>
                <p className={cn('mt-0.5 font-display text-lg leading-tight text-[color:var(--ink-strong)]', isDone && 'opacity-70')}>{d.title}</p>
                <p className="mt-1 text-xs text-[color:var(--ink-soft)]">{d.note}</p>
                {isUser && author && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-rosegold-100/70 px-2 py-0.5 text-[0.5rem] uppercase tracking-luxe text-rosegold-600">{personById(author).nickname}'s dream</span>
                    <button type="button" aria-label="Delete dream" onClick={(e) => { e.stopPropagation(); haptic('tap'); deleteDream(d.id); }} className="tap flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink-soft)] hover:text-dustyrose-500">
                      <CloseIcon width={14} height={14} />
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>{composing && <ComposeDream onClose={() => setComposing(false)} />}</AnimatePresence>
    </PageShell>
  );
}
