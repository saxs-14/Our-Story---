import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ACHIEVEMENTS, buildContext } from '@/data/achievements';
import { useProgressStore, gardenStageFrom } from '@/store/useProgressStore';
import { daysBetween } from '@/lib/time';
import relationship from '@/config/relationship';
import { useSound } from '@/hooks/useSound';
import { haptic } from '@/lib/haptics';

/**
 * Watches live progress, unlocks achievements, and surfaces a gentle toast for
 * any newly-earned badge the user hasn't seen. Mounted once, app-wide.
 */
export function AchievementWatcher() {
  const progress = useProgressStore();
  const unlockAchievements = useProgressStore((s) => s.unlockAchievements);
  const markSeen = useProgressStore((s) => s.markAchievementsSeen);
  const playSound = useSound();
  const [toastId, setToastId] = useState<string | null>(null);

  const {
    visits, favorites, lettersRead, vaultOpened, dreamsChecked,
    gardenWaterCount, secretUnlocked, wrappedViewed, weatherChecked,
    capsules, achievementsUnlocked, achievementsSeen,
  } = progress;

  useEffect(() => {
    const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
    const ctx = buildContext({
      daysTogether,
      daysAsFriends: Math.max(0, daysBetween(relationship.friendshipStart)),
      visits,
      reasonsFavorited: favorites.length,
      lettersRead: lettersRead.length,
      vaultOpened: vaultOpened.length,
      dreamsChecked: dreamsChecked.length,
      gardenStage: gardenStageFrom(daysTogether, gardenWaterCount),
      secretUnlocked,
      wrappedViewed,
      weatherChecked,
      capsulesCreated: capsules.length,
    });

    const earned = ACHIEVEMENTS.filter((a) => a.unlock(ctx)).map((a) => a.id);
    const newly = earned.filter((id) => !achievementsUnlocked.includes(id));
    if (newly.length) unlockAchievements(newly);

    const unseen = earned.find((id) => !achievementsSeen.includes(id));
    if (unseen && !toastId) {
      setToastId(unseen);
      markSeen([unseen]);
      playSound('unlock');
      haptic('unlock');
      window.setTimeout(() => setToastId(null), 4200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, favorites.length, lettersRead.length, vaultOpened.length, dreamsChecked.length, gardenWaterCount, secretUnlocked, wrappedViewed, weatherChecked, capsules.length]);

  const ach = ACHIEVEMENTS.find((a) => a.id === toastId);

  return (
    <AnimatePresence>
      {ach && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] z-[80] flex justify-center px-4"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <div className="glass-strong flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5 shadow-glass-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-champagne-200 to-rosegold-300 text-lg">
              {ach.emoji}
            </span>
            <div className="leading-tight">
              <p className="text-[0.65rem] uppercase tracking-luxe text-rosegold-500">Achievement unlocked</p>
              <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{ach.title}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
