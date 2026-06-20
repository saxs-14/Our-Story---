import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Confetti } from '@/components/fx/Confetti';
import { Button } from '@/components/ui/Button';
import relationship from '@/config/relationship';
import { isBirthdayToday, isAnniversaryToday, isMonthiversaryToday } from '@/lib/time';
import { useSound } from '@/hooks/useSound';
import { haptic } from '@/lib/haptics';

interface Celebration {
  key: string;
  title: string;
  message: string;
}

function detect(now = new Date()): Celebration | null {
  const { relationshipStart, her, him } = relationship;
  if (isAnniversaryToday(relationshipStart, now)) {
    return {
      key: 'anniversary-' + now.getFullYear(),
      title: 'Happy Anniversary 🥂',
      message: 'Another stretch of road, side by side. I would choose you all over again.',
    };
  }
  if (isBirthdayToday(her.birthday, now)) {
    return {
      key: 'bday-her-' + now.getFullYear(),
      title: `Happy Birthday, ${her.nickname} 🎂`,
      message: 'The world got better the day you arrived in it. Today is all about you.',
    };
  }
  if (isBirthdayToday(him.birthday, now)) {
    return {
      key: 'bday-him-' + now.getFullYear(),
      title: `Happy Birthday, ${him.nickname} 🎈`,
      message: 'Another year of the person lucky enough to love you.',
    };
  }
  if (isMonthiversaryToday(relationshipStart, now)) {
    return {
      key: 'month-' + now.getFullYear() + '-' + now.getMonth(),
      title: 'Happy Monthiversary 💗',
      message: 'One more month of us. Small number, enormous feeling.',
    };
  }
  return null;
}

/** Automatic confetti + message on anniversaries, monthiversaries & birthdays. */
export function CelebrationMode() {
  const [active, setActive] = useState<Celebration | null>(null);
  const playSound = useSound();

  useEffect(() => {
    const c = detect();
    if (!c) return;
    const dismissed = sessionStorage.getItem('our-story:celebrated:' + c.key);
    if (dismissed) return;
    const id = window.setTimeout(() => {
      setActive(c);
      playSound('bloom');
      haptic('celebrate');
    }, 1400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    if (active) sessionStorage.setItem('our-story:celebrated:' + active.key, '1');
    setActive(null);
  };

  return (
    <AnimatePresence>
      {active && (
        <>
          <Confetti />
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" aria-label="Dismiss" className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm" onClick={dismiss} />
            <motion.div
              role="dialog"
              aria-label={active.title}
              className="glass-strong relative z-10 w-full max-w-sm rounded-5xl p-8 text-center shadow-glass-lg"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <h2 className="font-display text-3xl text-[color:var(--ink-strong)]">{active.title}</h2>
              <p className="mt-3 text-[color:var(--ink-soft)]">{active.message}</p>
              <Button className="mt-6" variant="primary" onClick={dismiss}>
                Celebrate together
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
