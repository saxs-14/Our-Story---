import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { introNames, relationship } from '@/config/relationship';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSound } from '@/hooks/useSound';
import { ParticleField } from '@/components/fx/ParticleField';

interface Props {
  onDone: () => void;
}

const LINES = ['Our Story', introNames, relationship.tagline];

/** Apple-keynote-style fade sequence that gates the app on first launch. */
export function CinematicIntro({ onDone }: Props) {
  const reduce = useReducedMotion();
  const playSound = useSound();
  const [step, setStep] = useState(0);
  const stepMs = reduce ? 900 : 2200;

  useEffect(() => {
    playSound('open');
    const timers = LINES.map((_, i) =>
      window.setTimeout(() => {
        setStep(i + 1);
        if (i < LINES.length - 1) playSound('sparkle');
      }, stepMs * (i + 1)),
    );
    const finish = window.setTimeout(onDone, stepMs * (LINES.length + 1));
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 40%, #2a172a 0%, #160b16 60%, #0d060d 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="absolute inset-0 opacity-70">
        <ParticleField kind="fireflies" density={30} />
      </div>

      <button
        type="button"
        onClick={onDone}
        aria-label="Skip introduction"
        className="tap absolute right-5 top-[calc(env(safe-area-inset-top)+1.25rem)] z-10 rounded-full px-4 py-2 text-xs uppercase tracking-luxe text-cream/70 transition-colors hover:text-cream"
      >
        Skip
      </button>

      <div className="relative px-8 text-center">
        <AnimatePresence mode="wait">
          {step < LINES.length && (
            <motion.h1
              key={step}
              className="font-display text-4xl font-medium leading-tight text-warmwhite sm:text-6xl"
              initial={{ opacity: 0, y: reduce ? 0 : 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: reduce ? 0 : -18, filter: 'blur(6px)' }}
              transition={{ duration: reduce ? 0.4 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {LINES[step]}
            </motion.h1>
          )}
        </AnimatePresence>

        <motion.div
          className="mx-auto mt-8 h-px w-24"
          style={{
            background: 'linear-gradient(90deg, transparent, #d4af7a, transparent)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.4 }}
        />
      </div>
    </motion.div>
  );
}
