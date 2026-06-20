import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { HeartIcon, HeartFilledIcon, SearchIcon, ShareIcon, SparkleIcon } from '@/components/icons';
import {
  REASONS,
  REASON_CATEGORIES,
  TOTAL_REASONS,
  type Reason,
  type ReasonCategory,
} from '@/data/reasons';
import { useProgressStore } from '@/store/useProgressStore';
import { pick } from '@/lib/random';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';
import relationship from '@/config/relationship';

type Filter = ReasonCategory | 'All' | 'Favourites';

export default function Reasons() {
  const favorites = useProgressStore((s) => s.favorites);
  const toggleFavorite = useProgressStore((s) => s.toggleFavorite);
  const playSound = useSound();

  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [surprise, setSurprise] = useState<Reason | null>(null);
  const [limit, setLimit] = useState(40);

  const filtered = useMemo(() => {
    let list = REASONS;
    if (filter === 'Favourites') list = list.filter((r) => favorites.includes(r.id));
    else if (filter !== 'All') list = list.filter((r) => r.category === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.text.toLowerCase().includes(q));
    }
    return list;
  }, [filter, query, favorites]);

  const visible = filtered.slice(0, limit);

  const reveal = () => {
    haptic('soft');
    playSound('sparkle');
    setSurprise(pick(REASONS, `surprise-${Date.now()}`));
  };

  const share = async (reason: Reason) => {
    haptic('tap');
    const text = `${reason.text}\n\n— one of ${TOTAL_REASONS} reasons, from Our Story ❤️`;
    try {
      if (navigator.share) await navigator.share({ title: 'A reason I love you', text });
      else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* user cancelled */
    }
  };

  const chips: Filter[] = ['All', 'Favourites', ...REASON_CATEGORIES];

  return (
    <PageShell
      eyebrow={`${TOTAL_REASONS} reasons`}
      title="Why I love you"
      subtitle={`Every one of these is true, ${relationship.her.nickname}. Save your favourites to keep them close.`}
    >
      {/* Surprise reveal */}
      <div className="mb-5">
        <Button variant="gold" size="lg" className="w-full" onClick={reveal}>
          <SparkleIcon width={20} height={20} /> Surprise me with a reason
        </Button>
      </div>

      <AnimatePresence>
        {surprise && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard strong glow className="p-6 text-center">
              <p className="text-xs uppercase tracking-luxe text-rosegold-500">{surprise.category}</p>
              <p className="mt-2 font-serif text-2xl leading-relaxed text-[color:var(--ink-strong)]">
                “{surprise.text}”
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" variant="glass" onClick={() => toggleFavorite(surprise.id)}>
                  {favorites.includes(surprise.id) ? 'Saved ♥' : 'Save'}
                </Button>
                <Button size="sm" variant="glass" onClick={() => share(surprise)}>
                  <ShareIcon width={16} height={16} /> Share
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="glass mb-4 flex items-center gap-2 rounded-full px-4 py-2.5">
        <SearchIcon className="text-[color:var(--ink-soft)]" width={18} height={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(40);
          }}
          placeholder="Search reasons…"
          aria-label="Search reasons"
          className="w-full bg-transparent text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none"
        />
      </div>

      {/* Category chips */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => {
              haptic('tap');
              setFilter(c);
              setLimit(40);
            }}
            className={
              'tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ' +
              (filter === c
                ? 'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite'
                : 'glass text-[color:var(--ink-soft)]')
            }
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-8 text-center text-[color:var(--ink-soft)]">
          {filter === 'Favourites'
            ? 'No favourites yet — tap the heart on any reason to keep it here. ♥'
            : 'No reasons match that search.'}
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {visible.map((r, i) => {
            const fav = favorites.includes(r.id);
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] uppercase tracking-luxe text-rosegold-500">{r.category}</p>
                    <p className="mt-1 text-[color:var(--ink-strong)]">{r.text}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      aria-label={fav ? 'Remove favourite' : 'Save favourite'}
                      aria-pressed={fav}
                      onClick={() => {
                        haptic('tap');
                        if (!fav) playSound('chime');
                        toggleFavorite(r.id);
                      }}
                      className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-500"
                    >
                      <motion.span animate={{ scale: fav ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                        {fav ? <HeartFilledIcon width={20} height={20} /> : <HeartIcon width={20} height={20} />}
                      </motion.span>
                    </button>
                    <button
                      type="button"
                      aria-label="Share reason"
                      onClick={() => share(r)}
                      className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]"
                    >
                      <ShareIcon width={18} height={18} />
                    </button>
                  </div>
                </GlassCard>
              </motion.li>
            );
          })}
        </ul>
      )}

      {visible.length < filtered.length && (
        <div className="mt-6 text-center">
          <Button variant="glass" onClick={() => setLimit((l) => l + 40)}>
            Show more ({filtered.length - visible.length} left)
          </Button>
        </div>
      )}
    </PageShell>
  );
}
