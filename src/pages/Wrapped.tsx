import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/fx/Confetti';
import { CloseIcon } from '@/components/icons';
import relationship, { introNames } from '@/config/relationship';
import { daysBetween, formatLongDate } from '@/lib/time';
import { TOTAL_REASONS } from '@/data/reasons';
import { TOTAL_LETTERS } from '@/data/letters';
import { useProgressStore, gardenStageFrom } from '@/store/useProgressStore';
import { useContentStore } from '@/store/useContentStore';
import { useChatStore } from '@/store/useChatStore';
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

const STAGE_NAMES = [
  'Seed of Us 🌱',
  'Tender Sprout 🌿',
  'Rose Bush 🌹',
  'Enchanted Garden 🌸',
  'Blooming Velvet Sanctuary 👑',
];

/** Build the Comprehensive Story Wrapped */
function buildAnnualSlides(
  daysTogether: number,
  daysFirstSight: number,
  favoritesCount: number,
  lettersCount: number,
  memoriesCount: number,
  dreamsCount: number,
  waterCount: number,
  galleryCount: number,
  messagesCount: number,
  gardenStage: number,
): Slide[] {
  return [
    {
      bg: ['#2a172a', '#5a3548'],
      eyebrow: 'Our Story Wrapped',
      big: 'Saxs & Snowpie',
      sub: 'A complete recap of everything we have lived, shared, and built together. Tap to begin →',
    },
    {
      bg: ['#690f23', '#b70932'],
      eyebrow: `04 August 2026 · Love at First Sight`,
      big: `${daysFirstSight}`,
      sub: `days since the very first second Phathu saw Lihle and fell completely in love.`,
    },
    {
      bg: ['#7e4550', '#b76e79'],
      eyebrow: `Official Anniversary · ${formatLongDate(relationship.relationshipStart)}`,
      big: `${daysTogether}`,
      sub: `days of officially choosing each other every single morning.`,
    },
    {
      bg: ['#9c5763', '#d4af7a'],
      eyebrow: 'Timeline Memories',
      big: `${memoriesCount}`,
      sub: `precious moments written into our shared timeline — no templates, only our true story.`,
    },
    {
      bg: ['#5a3548', '#a99ed6'],
      eyebrow: 'Private Letterbox',
      big: `${lettersCount}`,
      sub: `love letters sealed with wax and heartfelt words between Saxs & Snowpie.`,
    },
    {
      bg: ['#1d3d2b', '#3e6b35'],
      eyebrow: `Living Garden · ${STAGE_NAMES[gardenStage]}`,
      big: `${waterCount}💧`,
      sub: `drops of care and water given to nurture our living garden ecosystem.`,
    },
    {
      bg: ['#0e2638', '#20638f'],
      eyebrow: 'Visual Memories',
      big: `${galleryCount} 📸`,
      sub: `photos and videos preserved in our personal Polaroids, grid, and scrapbook.`,
    },
    {
      bg: ['#073b32', '#00a884'],
      eyebrow: 'WhatsApp Chats & Voice Notes',
      big: `${messagesCount} 💬`,
      sub: `conversations, inside jokes, late-night voice notes, and calls exchanged.`,
    },
    {
      bg: ['#3e1628', '#9e2a4b'],
      eyebrow: 'Shared Vision & Dreams',
      big: `${dreamsCount} 🌟`,
      sub: `future dreams, adventures, and Audi dream drives added to our board.`,
    },
    {
      bg: ['#1a101f', '#46234b'],
      eyebrow: 'Reasons Why I Love You',
      big: `${TOTAL_REASONS}`,
      sub: `reasons written down. You've favorited ${favoritesCount} so far.`,
    },
    {
      bg: ['#2e0c1f', '#b76e79'],
      eyebrow: introNames,
      big: 'Forever & Always',
      sub: 'Here is to every chapter still unwritten. Happy us. ❤️',
      confetti: true,
    },
  ];
}

export default function Wrapped() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const playSound = useSound();
  const markViewed = useProgressStore((s) => s.markWrappedViewed);
  const favorites = useProgressStore((s) => s.favorites);
  const waterCount = useProgressStore((s) => s.gardenWaterCount);

  const userMemories = useContentStore((s) => s.memories);
  const userLetters = useContentStore((s) => s.letters);
  const userDreams = useContentStore((s) => s.dreams);
  const gallery = useContentStore((s) => s.gallery);
  const messages = useChatStore((s) => s.messages);

  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const daysFirstSight = Math.max(0, daysBetween(relationship.firstSight));
  const gardenStage = gardenStageFrom(daysTogether, waterCount);

  const slides: Slide[] = useMemo(() => {
    return buildAnnualSlides(
      daysTogether,
      daysFirstSight,
      favorites.length,
      userLetters.length + TOTAL_LETTERS,
      userMemories.length + 4,
      userDreams.length,
      waterCount,
      gallery.length,
      messages.length,
      gardenStage,
    );
  }, [
    daysTogether,
    daysFirstSight,
    favorites.length,
    userLetters.length,
    userMemories.length,
    userDreams.length,
    waterCount,
    gallery.length,
    messages.length,
    gardenStage,
  ]);

  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const slide = slides[Math.min(i, slides.length - 1)];

  useEffect(() => {
    markViewed();
    playSound('open');
    setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (last) return;
    const id = window.setTimeout(() => setI((v) => Math.min(v + 1, slides.length - 1)), 4500);
    return () => clearTimeout(id);
  }, [i, last, slides.length]);

  const next = () => {
    haptic('tap');
    if (!last) {
      playSound('sparkle');
      setI((v) => v + 1);
    }
  };
  const prev = () => {
    haptic('tap');
    setI((v) => Math.max(0, v - 1));
  };

  return (
    <motion.div
      className="fixed inset-0 z-[55] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {slide.confetti && <Confetti />}

      {/* Top Header Badge */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-30 flex justify-center">
        <span className="rounded-full bg-white/20 px-4 py-1 text-[0.65rem] font-bold uppercase tracking-luxe text-warmwhite backdrop-blur-md">
          Saxs & Snowpie · Complete Story Recap
        </span>
      </div>

      {/* Progress segments */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+2.4rem)] z-20 flex gap-1.5 px-4">
        {slides.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full bg-white"
              initial={false}
              animate={{ width: idx < i ? '100%' : idx === i ? '100%' : '0%' }}
              transition={{ duration: idx === i && !reduce ? 4.5 : 0.2, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Close Wrapped"
        onClick={() => navigate('/')}
        className="tap absolute right-4 top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full glass-strong text-warmwhite"
      >
        <CloseIcon width={22} height={22} />
      </button>

      {/* Tap zones */}
      <button
        type="button"
        aria-label="Previous"
        onClick={prev}
        className="absolute inset-y-0 left-0 z-10 w-1/3"
      />
      <button
        type="button"
        aria-label="Next"
        onClick={next}
        className="absolute inset-y-0 right-0 z-10 w-2/3"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
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
            className="text-xs font-semibold uppercase tracking-luxe text-white/80"
          >
            {slide.eyebrow}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="my-4 font-display text-5xl font-semibold leading-none text-warmwhite sm:text-7xl"
          >
            {slide.big}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-md font-serif text-lg leading-relaxed text-white/90"
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
              <Button variant="glass" onClick={() => setI(0)}>
                Replay Recap
              </Button>
              <Button variant="gold" onClick={() => navigate('/')}>
                Back Home ♥
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
