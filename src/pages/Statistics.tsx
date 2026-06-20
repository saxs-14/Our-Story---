import { useState } from 'react';
import { motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { HourglassIcon } from '@/components/icons';

import relationship from '@/config/relationship';
import { daysBetween, daysBetween as _d, formatLongDate } from '@/lib/time';
import { TOTAL_DAILY_NOTES } from '@/data/dailyMessages';
import { TOTAL_REASONS } from '@/data/reasons';
import { TOTAL_LETTERS } from '@/data/letters';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useProgressStore, gardenStageFrom } from '@/store/useProgressStore';
import { haptic } from '@/lib/haptics';

const GARDEN_STAGES = ['Seed', 'Sprout', 'Sapling', 'Tree', 'In bloom'];

export default function Statistics() {
  const progress = useProgressStore();
  const addCapsule = useProgressStore((s) => s.addCapsule);
  const openCapsule = useProgressStore((s) => s.openCapsule);

  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const daysAsFriends = Math.max(0, _d(relationship.friendshipStart));
  const stage = gardenStageFrom(daysTogether, progress.gardenWaterCount);
  const unlocked = progress.achievementsUnlocked.length;

  const stats = [
    { label: 'Days together', value: daysTogether, suffix: '' },
    { label: 'Days as friends', value: daysAsFriends, suffix: '' },
    { label: 'Daily notes written', value: TOTAL_DAILY_NOTES, suffix: '' },
    { label: 'Reasons I love you', value: TOTAL_REASONS, suffix: '' },
    { label: 'Letters waiting', value: TOTAL_LETTERS, suffix: '' },
    { label: 'Letters you’ve read', value: progress.lettersRead.length, suffix: '' },
    { label: 'Reasons you saved', value: progress.favorites.length, suffix: '' },
    { label: 'Times you visited', value: progress.visits, suffix: '' },
    { label: 'Achievements earned', value: unlocked, suffix: `/${ACHIEVEMENTS.length}` },
  ];

  // Time capsule
  const [message, setMessage] = useState('');
  const [span, setSpan] = useState(6);
  const createCapsule = () => {
    if (!message.trim()) return;
    haptic('success');
    const unlock = new Date();
    unlock.setMonth(unlock.getMonth() + span);
    addCapsule({ message: message.trim(), createdAt: new Date().toISOString(), unlockAt: unlock.toISOString() });
    setMessage('');
  };

  return (
    <PageShell eyebrow="Our story in numbers" title="Statistics" subtitle="Proof, in figures, of something that can't really be measured.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard className="p-4">
              <div className="font-display text-3xl font-semibold tabular-nums text-rosegold-700">
                <AnimatedNumber value={s.value} />
                {s.suffix}
              </div>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Garden growth */}
      <GlassCard className="mt-5 p-5">
        <p className="text-xs uppercase tracking-luxe text-rosegold-500">Garden growth</p>
        <div className="mt-3 flex items-center justify-between">
          {GARDEN_STAGES.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className={'flex h-9 w-9 items-center justify-center rounded-full text-sm ' + (i <= stage ? 'bg-gradient-to-br from-rosegold-300 to-champagne-300 text-plum-900' : 'glass text-[color:var(--ink-soft)]')}>
                {['🌰', '🌱', '🌿', '🌳', '🌸'][i]}
              </div>
              <span className={'mt-1 text-[0.55rem] ' + (i <= stage ? 'text-rosegold-600' : 'text-[color:var(--ink-soft)]')}>{label}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Achievements */}
      <h2 className="mb-3 mt-7 font-display text-2xl text-[color:var(--ink-strong)]">Milestones & badges</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = progress.achievementsUnlocked.includes(a.id);
          return (
            <GlassCard key={a.id} className={'flex flex-col items-center p-3 text-center ' + (got ? '' : 'opacity-45 grayscale')}>
              <span className="text-2xl" aria-hidden>{a.emoji}</span>
              <p className="mt-1 text-[0.62rem] font-medium leading-tight text-[color:var(--ink-strong)]">{a.title}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Time capsule */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-2xl text-[color:var(--ink-strong)]">
        <HourglassIcon className="text-rosegold-500" width={22} height={22} /> Time capsule
      </h2>
      <GlassCard className="p-5">
        <label htmlFor="capsule" className="text-sm text-[color:var(--ink-soft)]">
          Write something to unlock later.
        </label>
        <textarea
          id="capsule"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="A message to our future selves…"
          className="mt-2 w-full resize-none rounded-2xl bg-warmwhite/60 p-3 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-300"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[6, 12, 60].map((m) => (
            <button key={m} onClick={() => setSpan(m)} className={'tap rounded-full px-3 py-1.5 text-sm ' + (span === m ? 'bg-rosegold-500 text-warmwhite' : 'glass text-[color:var(--ink-soft)]')}>
              {m === 60 ? 'In 5 years' : `In ${m} months`}
            </button>
          ))}
          <Button size="sm" className="ml-auto" onClick={createCapsule} disabled={!message.trim()}>
            Seal it
          </Button>
        </div>
      </GlassCard>

      {progress.capsules.length > 0 && (
        <ul className="mt-4 space-y-3">
          {progress.capsules.map((c) => {
            const unlockable = new Date(c.unlockAt) <= new Date();
            const daysLeft = daysBetween(new Date(), c.unlockAt);
            return (
              <li key={c.id}>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-luxe text-rosegold-500">Sealed {formatLongDate(c.createdAt)}</p>
                    {c.opened || unlockable ? null : <span className="text-xs text-[color:var(--ink-soft)]">🔒 {daysLeft} days left</span>}
                  </div>
                  {c.opened ? (
                    <p className="mt-2 font-serif text-lg text-[color:var(--ink-strong)]">“{c.message}”</p>
                  ) : unlockable ? (
                    <Button size="sm" variant="gold" className="mt-2" onClick={() => { haptic('unlock'); openCapsule(c.id); }}>
                      Unlock now ✦
                    </Button>
                  ) : (
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">Opens {formatLongDate(c.unlockAt)}.</p>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
