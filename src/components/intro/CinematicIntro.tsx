import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { introNames, relationship } from '@/config/relationship';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSound } from '@/hooks/useSound';
import { ParticleField } from '@/components/fx/ParticleField';
import { RoseAnimation } from './RoseAnimation';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/haptics';

interface Props {
  onDone: () => void;
}

const NARRATION = [
  { text: 'A single seed was planted...', sub: 'In a world of billions', stage: 0 },
  { text: 'Growing quietly through every season...', sub: 'Roots deepening with every word', stage: 1 },
  { text: 'Reaching for the light...', sub: 'Unfolding in the warmth of our love', stage: 2 },
  { text: 'And blooming into something timeless.', sub: relationship.tagline, stage: 3 },
  { text: `A private universe for ${introNames}`, sub: 'Where every memory grows forever', stage: 4 },
];

export function CinematicIntro({ onDone }: Props) {
  const reduce = useReducedMotion();
  const playSound = useSound();
  const [step, setStep] = useState(0);

  const stage = Math.min(4, NARRATION[step]?.stage ?? 0);
  const isFinalStep = step >= NARRATION.length - 1;

  useEffect(() => {
    playSound('open');

    if (reduce) {
      setStep(NARRATION.length - 1);
      return;
    }

    const interval = window.setInterval(() => {
      setStep((curr) => {
        if (curr < NARRATION.length - 1) {
          playSound(curr === 2 ? 'bloom' : 'sparkle');
          return curr + 1;
        }
        clearInterval(interval);
        return curr;
      });
    }, 2800);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnter = () => {
    haptic('success');
    playSound('unlock');
    onDone();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden px-6 py-10"
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, #2a0b1c 0%, #170614 45%, #0b020a 100%)',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
    >
      {/* Ambient Rose Petals & Fireflies */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <ParticleField kind="petals" density={24} />
      </div>

      {/* Skip button top right */}
      <div className="relative z-20 flex w-full max-w-lg items-center justify-between">
        <span className="font-serif text-xs uppercase tracking-widest text-rosegold-300/60">
          Our Private Story
        </span>
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            onDone();
          }}
          aria-label="Skip introduction"
          className="tap rounded-full border border-rosegold-300/20 bg-rosegold-500/10 px-3.5 py-1.5 text-xs font-medium uppercase tracking-luxe text-warmwhite/80 backdrop-blur-md transition-all hover:border-rosegold-400/50 hover:text-warmwhite active:scale-95"
        >
          Skip ↗
        </button>
      </div>

      {/* Centerpiece: Rose Growing Animation */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <RoseAnimation progress={step / (NARRATION.length - 1)} stage={stage} />

        {/* Narrative Captions */}
        <div className="relative mt-4 min-h-[110px] w-full max-w-md text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1.5 px-4"
            >
              <p className="font-serif text-xs uppercase tracking-[0.2em] text-rosegold-400">
                {NARRATION[step]?.sub}
              </p>
              <h1 className="font-display text-2xl font-medium leading-snug text-warmwhite sm:text-3xl">
                {NARRATION[step]?.text}
              </h1>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="mx-auto mt-4 h-px w-28"
            style={{
              background: 'linear-gradient(90deg, transparent, #d4af7a, transparent)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ delay: 0.3, duration: 1.2 }}
          />
        </div>
      </div>

      {/* Bottom CTA Action Bar */}
      <div className="relative z-20 flex w-full max-w-xs flex-col items-center gap-3">
        {isFinalStep ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Button
              variant="gold"
              size="lg"
              className="w-full shadow-[0_0_25px_rgba(212,175,122,0.4)]"
              onClick={handleEnter}
            >
              Enter Our World ♥
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5">
            {NARRATION.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step
                    ? 'w-6 bg-rosegold-400 shadow-[0_0_8px_rgba(227,70,95,0.8)]'
                    : 'w-1.5 bg-warmwhite/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
