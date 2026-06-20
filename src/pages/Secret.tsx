import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { HeartFilledIcon } from '@/components/icons';
import { SECRET_MESSAGES } from '@/data/secretMessages';
import { useProgressStore } from '@/store/useProgressStore';
import { useSound } from '@/hooks/useSound';
import { haptic } from '@/lib/haptics';

const NEEDED = 5;

export default function Secret() {
  const unlocked = useProgressStore((s) => s.secretUnlocked);
  const unlock = useProgressStore((s) => s.unlockSecret);
  const playSound = useSound();
  const [taps, setTaps] = useState(0);

  const tap = () => {
    haptic('tap');
    playSound('chime');
    const n = taps + 1;
    setTaps(n);
    if (n >= NEEDED) {
      playSound('unlock');
      haptic('unlock');
      unlock();
    }
  };

  if (!unlocked) {
    return (
      <PageShell eyebrow="Shh…" title="A hidden place">
        <GlassCard strong className="flex flex-col items-center p-10 text-center">
          <p className="mb-8 max-w-xs text-[color:var(--ink-soft)]">
            There's a little more of my heart hidden here. Tap it {NEEDED} times to open it.
          </p>
          <motion.button
            type="button"
            aria-label={`Tap the heart to unlock (${taps} of ${NEEDED})`}
            onClick={tap}
            whileTap={{ scale: 0.85 }}
            className="tap relative text-rosegold-500"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <HeartFilledIcon width={120} height={120} />
            <motion.span
              key={taps}
              className="absolute inset-0 flex items-center justify-center font-display text-3xl text-warmwhite"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {taps > 0 ? taps : ''}
            </motion.span>
          </motion.button>
          <div className="mt-8 flex gap-2">
            {Array.from({ length: NEEDED }).map((_, i) => (
              <span key={i} className={'h-2 w-2 rounded-full transition-colors ' + (i < taps ? 'bg-rosegold-500' : 'bg-rosegold-200/50')} />
            ))}
          </div>
        </GlassCard>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Just for you" title="The secret" subtitle="Things I mean even when I don't say them out loud. You found them — of course you did.">
      <ul className="space-y-3">
        <AnimatePresence>
          {SECRET_MESSAGES.map((m, i) => (
            <motion.li key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.05 }}>
              <GlassCard className="p-5">
                <p className="text-[0.65rem] uppercase tracking-luxe text-rosegold-500">{m.title}</p>
                <p className="mt-1.5 font-serif text-lg leading-relaxed text-[color:var(--ink-strong)]">{m.text}</p>
              </GlassCard>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <p className="mt-8 text-center font-script text-3xl text-rosegold-600">I love you, always. — Phathu</p>
    </PageShell>
  );
}
