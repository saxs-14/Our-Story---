import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { BookmarkIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { LETTERS, LETTER_CATEGORIES, type Letter, type LetterCategory } from '@/data/letters';
import { useProgressStore } from '@/store/useProgressStore';
import { useContentStore, type UserLetter } from '@/store/useContentStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

function userToLetter(u: UserLetter): Letter {
  const paras = u.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return {
    id: u.id,
    title: u.title,
    category: u.category,
    preview: paras[0] ?? u.body.slice(0, 140),
    body: [`${personById(u.to).nickname},`, ...paras],
    signoff: `With all my love,\n${personById(u.authorId).nickname}`,
    readingTime: Math.max(1, Math.round(u.body.split(/\s+/).length / 180)),
  };
}

function ComposeLetter({ onClose }: { onClose: () => void }) {
  const userId = useAuthStore((s) => s.userId);
  const addLetter = useContentStore((s) => s.addLetter);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<LetterCategory>('Love');

  const save = () => {
    if (!userId || !title.trim() || !body.trim()) return;
    haptic('success');
    addLetter({ authorId: userId, to: partnerOf(userId), title: title.trim(), body: body.trim(), category });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-plum-900/55 backdrop-blur-md" onClick={onClose} />
      <motion.div role="dialog" aria-label="Write a letter" className="glass-strong relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col rounded-4xl p-6" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Write a letter</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]"><CloseIcon width={20} height={20} /></button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title…" aria-label="Letter title" className="mb-3 w-full rounded-2xl bg-warmwhite/70 px-4 py-3 font-display text-lg text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <div className="mb-3 flex flex-wrap gap-2">
          {LETTER_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cn('tap rounded-full px-3 py-1 text-xs', category === c ? 'bg-rosegold-500 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>{c}</button>
          ))}
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} placeholder="Pour your heart out… (leave a blank line between paragraphs)" aria-label="Letter body" className="mb-4 w-full flex-1 resize-none rounded-2xl bg-warmwhite/70 p-4 font-serif text-lg leading-relaxed text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300" />
        <Button variant="primary" onClick={save} disabled={!title.trim() || !body.trim()}>Seal & save letter</Button>
      </motion.div>
    </motion.div>
  );
}

type Filter = LetterCategory | 'All' | 'Bookmarked';

function Reader({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const markRead = useProgressStore((s) => s.markLetterRead);
  const bookmarks = useProgressStore((s) => s.letterBookmarks);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);
  const [hand, setHand] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? el.scrollTop / max : 1;
    setProgress(p);
    if (p > 0.85) markRead(letter.id);
  };

  const bookmarked = bookmarks.includes(letter.id);

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-plum-900/55 backdrop-blur-md" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label={letter.title}
        className="glass-strong relative z-10 flex max-h-[86dvh] w-full max-w-lg flex-col rounded-4xl shadow-glass-lg"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <div className="h-1 overflow-hidden rounded-t-4xl bg-rosegold-100/50">
          <div className="h-full bg-gradient-to-r from-rosegold-400 to-champagne-400" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 pt-4">
          <p className="text-xs uppercase tracking-luxe text-rosegold-500">{letter.category} · {letter.readingTime} min</p>
          <div className="flex gap-1">
            <button type="button" aria-label="Handwritten mode" aria-pressed={hand} onClick={() => { haptic('tap'); setHand((h) => !h); }} className={cn('tap flex h-9 items-center rounded-full px-3 text-xs', hand ? 'bg-rosegold-500 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
              Aa
            </button>
            <button type="button" aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} aria-pressed={bookmarked} onClick={() => { haptic('tap'); toggleBookmark(letter.id); }} className={cn('tap flex h-9 w-9 items-center justify-center rounded-full', bookmarked ? 'text-champagne-500' : 'text-[color:var(--ink-soft)]')}>
              <BookmarkIcon width={18} height={18} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button type="button" aria-label="Close" onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]">
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="overflow-y-auto px-7 pb-8 pt-3">
          <h2 className="font-display text-3xl text-[color:var(--ink-strong)]">{letter.title}</h2>
          <div className={cn('mt-4 space-y-4 leading-relaxed text-[color:var(--ink-strong)]', hand ? 'font-script text-2xl' : 'font-serif text-lg')}>
            {letter.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className={cn('mt-7 text-right text-rosegold-600', hand ? 'font-script text-3xl' : 'font-script text-2xl')}>
            {letter.signoff.split('\n').map((l, i) => <span key={i} className="block">{l}</span>)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Letters() {
  const lettersRead = useProgressStore((s) => s.lettersRead);
  const bookmarks = useProgressStore((s) => s.letterBookmarks);
  const userLetters = useContentStore((s) => s.letters);
  const deleteLetter = useContentStore((s) => s.deleteLetter);
  const userId = useAuthStore((s) => s.userId);
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Letter | null>(null);
  const [composing, setComposing] = useState(false);

  const userIds = useMemo(() => new Set(userLetters.map((u) => u.id)), [userLetters]);
  const authorById = useMemo(() => new Map(userLetters.map((u) => [u.id, u.authorId])), [userLetters]);

  const allLetters = useMemo(() => [...userLetters.map(userToLetter), ...LETTERS], [userLetters]);

  const filtered = useMemo(() => {
    let list = allLetters;
    if (filter === 'Bookmarked') list = list.filter((l) => bookmarks.includes(l.id));
    else if (filter !== 'All') list = list.filter((l) => l.category === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q) || l.preview.toLowerCase().includes(q));
    }
    return list;
  }, [allLetters, filter, query, bookmarks]);

  const chips: Filter[] = ['All', 'Bookmarked', ...LETTER_CATEGORIES];

  return (
    <PageShell eyebrow={`${allLetters.length} letters`} title="Letters" subtitle={`${lettersRead.length} read so far. Write your own any time — they aren't going anywhere.`}>
      <Button variant="gold" size="lg" className="mb-4 w-full" onClick={() => { haptic('soft'); setComposing(true); }}>
        ✍️ Write a letter to {userId ? personById(partnerOf(userId)).nickname : 'them'}
      </Button>

      <div className="glass mb-4 flex items-center gap-2 rounded-full px-4 py-2.5">
        <SearchIcon className="text-[color:var(--ink-soft)]" width={18} height={18} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search letters…" aria-label="Search letters" className="w-full bg-transparent text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none" />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <button key={c} onClick={() => { haptic('tap'); setFilter(c); }} className={cn('tap whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors', filter === c ? 'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-8 text-center text-[color:var(--ink-soft)]">
          {filter === 'Bookmarked' ? 'No bookmarks yet — open a letter and tap the ribbon to keep it here.' : 'No letters match that search.'}
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {filtered.map((l, i) => {
            const isUser = userIds.has(l.id);
            const author = authorById.get(l.id);
            return (
              <motion.li key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }}>
                <GlassCard className="flex items-center gap-3 p-4">
                  <button type="button" onClick={() => { haptic('soft'); setActive(l); }} className="min-w-0 flex-1 text-left transition-transform active:scale-[0.99]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl text-[color:var(--ink-strong)]">{l.title}</p>
                      {isUser && author && (
                        <span className="rounded-full bg-rosegold-100/70 px-2 py-0.5 text-[0.55rem] uppercase tracking-luxe text-rosegold-600">
                          from {personById(author).nickname}
                        </span>
                      )}
                      {lettersRead.includes(l.id) && <span className="text-[0.55rem] uppercase tracking-luxe text-rosegold-400">read</span>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[color:var(--ink-soft)]">{l.preview}</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-luxe text-rosegold-500">{l.category} · {l.readingTime} min</p>
                  </button>
                  {bookmarks.includes(l.id) && <BookmarkIcon className="shrink-0 text-champagne-500" width={18} height={18} fill="currentColor" />}
                  {isUser && (
                    <button type="button" aria-label="Delete letter" onClick={() => { haptic('tap'); deleteLetter(l.id); }} className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--ink-soft)] hover:text-dustyrose-500">
                      <CloseIcon width={16} height={16} />
                    </button>
                  )}
                </GlassCard>
              </motion.li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>{active && <Reader letter={active} onClose={() => setActive(null)} />}</AnimatePresence>
      <AnimatePresence>{composing && <ComposeLetter onClose={() => setComposing(false)} />}</AnimatePresence>
    </PageShell>
  );
}
