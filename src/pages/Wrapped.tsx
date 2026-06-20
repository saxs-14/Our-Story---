import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/fx/Confetti';
import { CloseIcon } from '@/components/icons';
import relationship, { introNames } from '@/config/relationship';
import { daysBetween, elapsedSince } from '@/lib/time';
import { TOTAL_REASONS } from '@/data/reasons';
import { TOTAL_LETTERS } from '@/data/letters';
import { TOTAL_DAILY_NOTES } from '@/data/dailyMessages';
import { useProgressStore } from '@/store/useProgressStore';
import { useContentStore } from '@/store/useContentStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSound } from '@/hooks/useSound';
import { haptic } from '@/lib/haptics';

interface Slide {
  bg: [string, string];
  eyebrow: string;
  big: string;
  sub: string;
  confetti?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Build a Monthly Wrapped for the given month (0-indexed) */
function buildMonthlySlides(
  year: number,
  month: number,
  userMemories: { createdAt: string; title: string }[],
  userLetters: { createdAt: string }[],
  userDreams: { createdAt: string }[],
): Slide[] {
  const label = MONTH_NAMES[month];
  const momentsThisMonth = userMemories.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const lettersThisMonth = userLetters.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const dreamsThisMonth = userDreams.filter((d) => {
    const dt = new Date(d.createdAt);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });

  const slides: Slide[] = [
    {
      bg: ['#2a172a', '#5a3548'],
      eyebrow: `${label} ${year}`,
      big: 'Monthly Wrapped',
      sub: 'A look back at our month together — tap to continue →',
    },
    {
      bg: ['#7e4550', '#b76e79'],
      eyebrow: 'This month',
      big: `${momentsThisMonth.length}`,
      sub: momentsThisMonth.length === 0
        ? `No moments added yet for ${label}. Add one on the Timeline!`
        : `real moments you lived and added this month. ${momentsThisMonth[0]?.title ? `"${momentsThisMonth[0].title}" was just one of them.` : ''}`,
    },
    {
      bg: ['#9c5763', '#d4af7a'],
      eyebrow: 'Words of love',
      big: `${lettersThisMonth.length}`,
      sub: lettersThisMonth.length === 0
        ? `No letters written yet this month. The pen is yours — write from the heart.`
        : `letter${lettersThisMonth.length === 1 ? '' : 's'} written this month. Love put into words is love that lasts.`,
    },
    {
      bg: ['#5a3548', '#a99ed6'],
      eyebrow: 'New dreams',
      big: `${dreamsThisMonth.length}`,
      sub: dreamsThisMonth.length === 0
        ? `No new dreams added this month — but every day with you is already a dream.`
        : `new dream${dreamsThisMonth.length === 1 ? '' : 's'} added to your board this month. Keep dreaming together.`,
    },
    {
      bg: ['#42242a', '#b76e79'],
      eyebrow: `${introNames}`,
      big: 'Keep going',
      sub: `${label} was just one chapter. Next month writes itself — one moment at a time. ❤️`,
      confetti: true,
    },
  ];
  return slides;
}

/** Build the Annual (full-story) Wrapped */
function buildAnnualSlides(
  daysTogether: number,
  dur: ReturnType<typeof elapsedSince>,
  favorites: string[],
  lettersRead: string[],
): Slide[] {
  return [
    { bg: ['#2a172a', '#5a3548'], eyebrow: 'Our Story', big: 'Wrapped', sub: 'A little replay of us. Tap to continue →' },
    { bg: ['#7e4550', '#b76e79'], eyebrow: 'Since 08 May 2026', big: `${daysTogether}`, sub: `days of choosing each other — and counting.` },
    { bg: ['#9c5763', '#d4af7a'], eyebrow: 'Before all of this', big: 'Friends first', sub: `We knew each other for over a year before it became more. The best things take root quietly.` },
    { bg: ['#5a3548', '#a99ed6'], eyebrow: 'I wrote it all down', big: `${TOTAL_REASONS}`, sub: `reasons I love you. You've saved ${favorites.length} of them so far.` },
    { bg: ['#b76e79', '#f6c9a8'], eyebrow: 'In your inbox of the heart', big: `${TOTAL_LETTERS} letters`, sub: `waiting for you. You've read ${lettersRead.length}. Take your time.` },
    { bg: ['#3a3357', '#c98b8b'], eyebrow: 'Every single day', big: `${TOTAL_DAILY_NOTES}`, sub: 'daily notes — one for every day of the year, never repeating.' },
    { bg: ['#5a3548', '#e4c47e'], eyebrow: 'The headline', big: `${dur.years > 0 ? dur.years + 'y · ' : ''}${dur.months}m ${dur.weeks}w`, sub: 'and every second still feels like the beginning.' },
    { bg: ['#42242a', '#b76e79'], eyebrow: introNames, big: 'Always', sub: "Here's to every chapter still unwritten. Happy us.", confetti: true },
  ];
}

export default function Wrapped() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const playSound = useSound();
  const markViewed = useProgressStore((s) => s.markWrappedViewed);
  const favorites = useProgressStore((s) => s.favorites);
  const lettersRead = useProgressStore((s) => s.lettersRead);
  const userMemories = useContentStore((s) => s.memories);
  const userLetters = useContentStore((s) => s.letters);
  const userDreams = useContentStore((s) => s.dreams);

  const now = new Date();
  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const dur = elapsedSince(relationship.relationshipStart);

  // Monthly = previous month; Annual = overall
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [mode, setMode] = useState<'annual' | 'monthly'>('monthly');

  const slides: Slide[] = useMemo(() => {
    if (mode === 'monthly') {
      return buildMonthlySlides(prevMonthYear, prevMonth, userMemories, userLetters, userDreams);
    }
    return buildAnnualSlides(daysTogether, dur, favorites, lettersRead);
  }, [mode, prevMonthYear, prevMonth, userMemories, userLetters, userDreams, daysTogether, dur, favorites, lettersRead]);

  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const slide = slides[Math.min(i, slides.length - 1)];

  useEffect(() => {
    markViewed();
    playSound('open');
    setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (last) return;
    const id = window.setTimeout(() => setI((v) => Math.min(v + 1, slides.length - 1)), 4200);
    return () => clearTimeout(id);
  }, [i, last, slides.length]);

  const next = () => { haptic('tap'); if (!last) { playSound('sparkle'); setI((v) => v + 1); } };
  const prev = () => { haptic('tap'); setI((v) => Math.max(0, v - 1)); };

  return (
    <motion.div className="fixed inset-0 z-[55] overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {slide.confetti && <Confetti />}

      {/* Mode switcher */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.25rem)] z-30 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode('monthly')}
          className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-luxe transition-all ${mode === 'monthly' ? 'bg-white text-plum-900' : 'bg-white/20 text-white/70'}`}
        >
          {monthLabel(new Date(prevMonthYear, prevMonth))} ↩
        </button>
        <button
          type="button"
          onClick={() => setMode('annual')}
          className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-luxe transition-all ${mode === 'annual' ? 'bg-white text-plum-900' : 'bg-white/20 text-white/70'}`}
        >
          Full Story
        </button>
      </div>

      {/* Progress segments */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+2.4rem)] z-20 flex gap-1.5 px-4">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full bg-white"
              initial={false}
              animate={{ width: idx < i ? '100%' : idx === i ? '100%' : '0%' }}
              transition={{ duration: idx === i && !reduce ? 4.2 : 0.2, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Close Wrapped"
        onClick={() => navigate('/')}
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full glass-strong text-warmwhite"
      >
        <CloseIcon width={22} height={22} />
      </button>

      {/* Tap zones */}
      <button type="button" aria-label="Previous" onClick={prev} className="absolute inset-y-0 left-0 z-10 w-1/3" />
      <button type="button" aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 z-10 w-2/3" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${i}`}
          className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: `linear-gradient(150deg, ${slide.bg[0]}, ${slide.bg[1]})` }}
          initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-medium uppercase tracking-luxe text-white/80"
          >
            {slide.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="my-4 font-display text-6xl font-semibold leading-none text-warmwhite sm:text-7xl"
          >
            {slide.big}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-sm font-serif text-xl text-white/90"
          >
            {slide.sub}
          </motion.p>

          {last && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex gap-3"
            >
              <Button variant="glass" onClick={() => setI(0)}>Replay</Button>
              <Button variant="gold" onClick={() => navigate('/')}>Back home</Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
