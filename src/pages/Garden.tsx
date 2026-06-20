import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ParticleField } from '@/components/fx/ParticleField';
import relationship from '@/config/relationship';
import { daysBetween } from '@/lib/time';
import { useProgressStore, gardenStageFrom } from '@/store/useProgressStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

const STAGE_LABELS = ['A seed of us', 'First sprout', 'Growing strong', 'Our tree', 'In full bloom'];

function Butterfly({ delay, color }: { delay: number; color: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      className="pointer-events-none absolute text-xl"
      initial={{ x: -20, y: 120 }}
      animate={{ x: [0, 120, 60, 200, 40], y: [120, 40, 90, 20, 110] }}
      transition={{ duration: 16, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{ color }}
      aria-hidden
    >
      🦋
    </motion.span>
  );
}

export default function Garden() {
  const water = useProgressStore((s) => s.waterGarden);
  const waterCount = useProgressStore((s) => s.gardenWaterCount);
  const playSound = useSound();
  const reduce = useReducedMotion();
  const [night, setNight] = useState(() => { const h = new Date().getHours(); return h < 6 || h >= 19; });
  const [found, setFound] = useState(false);

  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const stage = gantStage(daysTogether, waterCount);

  function gantStage(d: number, w: number) {
    return gardenStageFrom(d, w);
  }

  const flowers = useMemo(() => Array.from({ length: Math.min(12, stage * 3) }), [stage]);

  const doWater = () => {
    haptic('soft');
    playSound('bloom');
    water();
  };

  const sky = night
    ? 'linear-gradient(180deg, #1c1030 0%, #3a2547 60%, #5a3548 100%)'
    : 'linear-gradient(180deg, #cfe3ff 0%, #f7d9d9 55%, #f6e4c9 100%)';

  return (
    <PageShell eyebrow="Our living garden" title="The Garden" subtitle="It grows with our time together — and a little with every drop of love you give it." bleed>
      <div className="px-5">
        <GlassCard className="relative mb-5 overflow-hidden p-0">
          {/* Scene */}
          <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden" style={{ background: sky }}>
            {/* sun / moon */}
            <motion.div
              className="absolute right-8 top-8 h-16 w-16 rounded-full"
              style={{ background: night ? 'radial-gradient(circle at 35% 35%, #fff, #e7e0ff)' : 'radial-gradient(circle at 35% 35%, #fff6d6, #ffd27a)', boxShadow: night ? '0 0 40px rgba(231,224,255,0.6)' : '0 0 60px rgba(255,210,122,0.7)' }}
              animate={reduce ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* particles */}
            <div className="absolute inset-0 opacity-70">
              <ParticleField kind={night ? 'fireflies' : 'petals'} density={night ? 26 : 20} />
            </div>

            {/* butterflies */}
            {!night && (
              <>
                <Butterfly delay={0} color="#b76e79" />
                <Butterfly delay={6} color="#a99ed6" />
              </>
            )}

            {/* ground */}
            <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: night ? 'linear-gradient(180deg, #3a4a2e, #243018)' : 'linear-gradient(180deg, #8fbf6b, #5e8c3e)' }} />

            {/* the plant — grows with stage */}
            <svg viewBox="0 0 200 200" className="absolute bottom-[18%] left-1/2 h-[55%] -translate-x-1/2" aria-label={STAGE_LABELS[stage]} role="img">
              {/* stem */}
              {stage >= 1 && (
                <motion.path d="M100 200 C100 160 100 150 100 110" stroke="#5e8c3e" strokeWidth={5} fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
              )}
              {/* leaves */}
              {stage >= 2 && (
                <>
                  <motion.path d="M100 150 C70 140 60 120 80 115 C95 118 100 135 100 150" fill="#6fa84a" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '100px 150px' }} transition={{ delay: 0.4 }} />
                  <motion.path d="M100 135 C130 125 140 105 120 100 C105 103 100 120 100 135" fill="#7cb854" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '100px 135px' }} transition={{ delay: 0.6 }} />
                </>
              )}
              {/* canopy / tree */}
              {stage >= 3 && (
                <motion.circle cx="100" cy="95" r="42" fill={night ? '#3f6b34' : '#5fa544'} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '100px 95px' }} transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.3 }} />
              )}
              {/* blossoms */}
              {flowers.map((_, i) => {
                const angle = (i / flowers.length) * Math.PI * 2;
                const r = stage >= 3 ? 38 : 20;
                const cx = 100 + Math.cos(angle) * r;
                const cy = (stage >= 3 ? 95 : 120) + Math.sin(angle) * r;
                const colors = ['#f6b6b1', '#f7d9d9', '#e3a0c0', '#d4af7a'];
                return (
                  <motion.circle key={i} cx={cx} cy={cy} r={5} fill={colors[i % colors.length]} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 200 }} />
                );
              })}
              {/* seed (stage 0) */}
              {stage === 0 && <motion.ellipse cx="100" cy="150" rx="10" ry="13" fill="#9c6b4a" animate={reduce ? {} : { y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity }} />}

              {/* hidden flower easter egg */}
              <circle cx="38" cy="172" r="6" fill={found ? '#e3706a' : 'transparent'} stroke={found ? 'none' : 'transparent'} onClick={() => { if (!found) { setFound(true); haptic('unlock'); playSound('sparkle'); } }} style={{ cursor: 'pointer' }} />
            </svg>

            {/* toggle day/night */}
            <button type="button" onClick={() => { haptic('tap'); setNight((n) => !n); }} aria-label="Toggle day and night" className="absolute left-4 top-4 rounded-full glass-strong px-3 py-1.5 text-xs text-[color:var(--ink-strong)]">
              {night ? '🌙 Night' : '☀️ Day'}
            </button>
          </div>

          <div className="p-5">
            <p className="text-xs uppercase tracking-luxe text-rosegold-500">Stage {stage + 1} of 5</p>
            <h2 className="mt-1 font-display text-2xl text-[color:var(--ink-strong)]">{STAGE_LABELS[stage]}</h2>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              Our garden has grown over {daysTogether} day{daysTogether === 1 ? '' : 's'} together.
              {stage < 4 && ' Water it with love to help it bloom.'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="primary" onClick={doWater}>💧 Water our garden</Button>
              <span className="text-xs text-[color:var(--ink-soft)]">Watered {waterCount}×</span>
            </div>
            {found && <p className="mt-3 text-sm text-rosegold-600">✨ You found the hidden flower — you really do look closely. ♥</p>}
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
