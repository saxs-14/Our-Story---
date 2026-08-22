import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/icons';
import { DREAM_CATEGORIES, type Dream, type DreamCategory } from '@/data/dreams';
import { AudiDreamGarage } from '@/components/audi/AudiDreamGarage';
import { useProgressStore } from '@/store/useProgressStore';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore, personById } from '@/store/useAuthStore';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

const EMOJI_CHOICES = ['✨', '🚗', '💍', '🏠', '✈️', '🌅', '🏝️', '🌹', '🎶', '🌳', '🎈', '💞'];

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
    addDream({
      authorId: userId,
      title: title.trim(),
      note: note.trim(),
      emoji,
      category,
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
        role="dialog"
        aria-label="Add a dream"
        className="glass-strong relative z-10 w-full max-w-md rounded-4xl border border-rosegold-400/30 p-6 shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-luxe text-rosegold-400">Our Future Vision</span>
            <h2 className="font-display text-2xl text-warmwhite">Add a Joint Dream</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-300 hover:text-white"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are we dreaming of doing together?"
          aria-label="Dream title"
          className="mb-3 w-full rounded-2xl bg-warmwhite/10 px-4 py-3 font-display text-lg text-warmwhite placeholder:text-rosegold-200/50 focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="A little note or plan for this dream…"
          aria-label="Dream note"
          className="mb-3 w-full resize-none rounded-2xl bg-warmwhite/10 p-4 text-sm text-warmwhite placeholder:text-rosegold-200/50 focus:outline-none focus:ring-2 focus:ring-rosegold-400"
        />

        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-400">Choose an Emoji</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
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

        <label className="mb-1 block text-xs uppercase tracking-luxe text-rosegold-400">Category</label>
        <div className="mb-5 flex flex-wrap gap-2">
          {DREAM_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'tap rounded-full px-3 py-1 text-xs transition-colors',
                category === c ? 'bg-rosegold-500 text-warmwhite' : 'bg-warmwhite/10 text-rosegold-200/70',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <Button variant="gold" size="lg" className="w-full" onClick={save} disabled={!title.trim()}>
          Save to Our Board ♥
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function Dreams() {
  const checked = useProgressStore((s) => s.dreamsChecked);
  const toggleCheck = useProgressStore((s) => s.toggleDream);
  const userDreams = useContentStore((s) => s.dreams);
  const deleteDream = useContentStore((s) => s.deleteDream);
  const playSound = useSound();

  const [category, setCategory] = useState<DreamCategory | 'All'>('All');
  const [composing, setComposing] = useState(false);
  const [showAudiGarage, setShowAudiGarage] = useState(false);

  const dreams = useMemo<Dream[]>(() => {
    return userDreams.map((u) => ({
      id: u.id,
      category: u.category as DreamCategory,
      title: u.title,
      note: u.note,
      emoji: u.emoji,
    }));
  }, [userDreams]);

  const filtered = useMemo(() => {
    if (category === 'All') return dreams;
    return dreams.filter((d) => d.category === category);
  }, [dreams, category]);

  const achievedCount = checked.filter((id) => dreams.some((d) => d.id === id)).length;

  return (
    <PageShell
      eyebrow="Our Future Vision"
      title="Dreams & Goals"
      subtitle="Every adventure, road trip, and life milestone Saxs & Snowpie are building together."
    >
      {/* Top Action Buttons */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button
          variant="gold"
          size="lg"
          className="shadow-[0_0_20px_rgba(212,175,122,0.35)]"
          onClick={() => {
            haptic('soft');
            setComposing(true);
          }}
        >
          ✨ Add a New Dream
        </Button>

        {/* Audi Dream Garage Opener */}
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            playSound('sparkle');
            setShowAudiGarage(true);
          }}
          className="glass tap flex items-center justify-between rounded-3xl border border-rosegold-400/40 bg-gradient-to-r from-rosegold-900/40 to-black/60 px-5 py-3.5 shadow-lg transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg">
              🚗
            </span>
            <div>
              <p className="text-xs uppercase tracking-luxe text-rosegold-400">Our Shared Passion</p>
              <p className="font-display text-base font-semibold text-warmwhite">
                Audi Dream Garage OOOO
              </p>
            </div>
          </div>
          <span className="text-sm text-rosegold-300">Explore ↗</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <GlassCard className="mb-5 flex items-center justify-between p-4">
        <div>
          <span className="text-xs uppercase tracking-luxe text-rosegold-400">Dreams Board</span>
          <p className="font-display text-lg text-warmwhite">
            {dreams.length} {dreams.length === 1 ? 'Dream' : 'Dreams'} Recorded
          </p>
        </div>
        <div className="text-right">
          <span className="font-display text-xl font-bold text-emerald-400">{achievedCount}</span>
          <p className="text-[0.6rem] uppercase tracking-luxe text-rosegold-200/70">Achieved Together</p>
        </div>
      </GlassCard>

      {/* Category Chips */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {['All', ...DREAM_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => {
              haptic('tap');
              setCategory(c as typeof category);
            }}
            className={cn(
              'tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all',
              category === c
                ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-700 text-warmwhite font-medium shadow-md'
                : 'glass text-[color:var(--ink-soft)]',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Empty State or Dream Items */}
      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-10 text-center text-rosegold-200/70">
          <span className="text-4xl">✨</span>
          <p className="mt-3 font-display text-xl text-warmwhite">No dreams in this category yet</p>
          <p className="mt-1 text-xs">
            Tap the button above or browse the Audi Garage to add your first dream together!
          </p>
        </GlassCard>
      ) : (
        <ul className="space-y-3.5">
          {filtered.map((d, i) => {
            const isDone = checked.includes(d.id);
            const userDream = userDreams.find((u) => u.id === d.id);
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
              >
                <GlassCard
                  className={cn(
                    'flex items-center gap-3.5 p-4 transition-all',
                    isDone && 'border-emerald-400/40 bg-emerald-950/20 opacity-90',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic('tap');
                      playSound(isDone ? 'chime' : 'sparkle');
                      toggleCheck(d.id);
                    }}
                    className={cn(
                      'tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-transform',
                      isDone
                        ? 'bg-emerald-500 text-warmwhite scale-110 ring-2 ring-emerald-300'
                        : 'bg-white/10 hover:bg-white/20',
                    )}
                    aria-label={isDone ? 'Mark unachieved' : 'Mark achieved'}
                  >
                    {isDone ? '✓' : d.emoji}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-display text-lg font-medium text-warmwhite',
                        isDone && 'line-through text-rosegold-200/60',
                      )}
                    >
                      {d.title}
                    </p>
                    {d.note && (
                      <p className="mt-0.5 text-xs text-rosegold-200/80 leading-relaxed">{d.note}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[0.6rem] font-bold uppercase tracking-luxe text-rosegold-400">
                        {d.category}
                      </span>
                      {userDream && (
                        <span className="text-[0.6rem] text-rosegold-300/70">
                          · added by {personById(userDream.authorId).nickname}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Delete dream"
                    onClick={() => {
                      haptic('tap');
                      deleteDream(d.id);
                    }}
                    className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rosegold-300 hover:text-red-400"
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </GlassCard>
              </motion.li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>{composing && <ComposeDream onClose={() => setComposing(false)} />}</AnimatePresence>
      <AnimatePresence>
        {showAudiGarage && <AudiDreamGarage onClose={() => setShowAudiGarage(false)} />}
      </AnimatePresence>
    </PageShell>
  );
}
