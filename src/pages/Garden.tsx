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

const STAGE_LABELS = [
  'Stage 1: A Seed of Us 🌱',
  'Stage 2: Tender Sprout 🌿',
  'Stage 3: Growing Rose Bush 🌹',
  'Stage 4: Enchanted Flowering Garden 🌸',
  'Stage 5: Blooming Velvet Rose Sanctuary 👑',
];

const STAGE_DESC = [
  'A sacred seed of love planted in Mbombela. Every great forever begins with a single quiet moment.',
  'The first signs of life — delicate, green, and reaching upward toward the warmth of our love.',
  'Roots are deepening. The thorny stems grow strong and the emerald leaves unfold wide.',
  'Flowers are opening everywhere. Butterflies dance along the cobblestone path of our story.',
  'In full romantic bloom — velvet crimson roses, golden stardust, and a forever place created only for Saxs & Snowpie.',
];

function Cloud({ x, y, size, speed }: { x: number; y: number; size: number; speed: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      initial={{ x }}
      animate={reduce ? {} : { x: [x, x + 50, x] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx={y} cy={x} rx={size} ry={size * 0.55} fill="white" opacity={0.82} />
      <ellipse cx={y - size * 0.45} cy={x + 4} rx={size * 0.62} ry={size * 0.42} fill="white" opacity={0.75} />
      <ellipse cx={y + size * 0.45} cy={x + 4} rx={size * 0.55} ry={size * 0.38} fill="white" opacity={0.75} />
    </motion.g>
  );
}

function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={1.5}
      fill="#fff"
      opacity={0.85}
      animate={reduce ? {} : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function Butterfly({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.text
      x={x}
      y={y}
      fontSize={16}
      textAnchor="middle"
      initial={{ x, y }}
      animate={{
        x: [x, x + 70, x + 20, x + 100, x + 10, x],
        y: [y, y - 35, y + 10, y - 20, y + 5, y],
      }}
      transition={{ duration: 18, delay, repeat: Infinity, ease: 'easeInOut' }}
      fill={color}
      aria-hidden
    >
      🦋
    </motion.text>
  );
}

function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={2.5}
      fill="#ffe082"
      animate={{
        cx: [x, x + 30, x - 20, x + 15, x],
        cy: [y, y - 25, y + 15, y - 10, y],
        opacity: [0, 1, 0.5, 1, 0],
      }}
      transition={{ duration: 5 + delay, delay: delay * 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/** Full Living Romantic SVG Garden Scene */
function GardenScene({
  stage,
  night,
  isWatering,
  found,
  onFoundFlower,
}: {
  stage: number;
  night: boolean;
  isWatering: boolean;
  found: boolean;
  onFoundFlower: () => void;
}) {
  const reduce = useReducedMotion();
  const flowers = useMemo(() => Array.from({ length: Math.min(20, (stage + 1) * 4) }), [stage]);
  const stars = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        x: 15 + ((i * 37) % 370),
        y: 8 + ((i * 23) % 90),
        delay: i * 0.25,
      })),
    [],
  );

  const skyTop = night ? '#0d0416' : '#2b1028';
  const skyBot = night ? '#2a0e28' : '#e28892';
  const groundTop = night ? '#1a0c1a' : '#3e6b35';
  const groundBot = night ? '#0e050e' : '#1e3d1b';

  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      aria-label={`Garden: ${STAGE_LABELS[stage]}`}
      role="img"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="gardenGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={groundTop} />
          <stop offset="100%" stopColor={groundBot} />
        </linearGradient>
        <linearGradient id="gardenTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3e2723" />
          <stop offset="50%" stopColor="#6d4c41" />
          <stop offset="100%" stopColor="#3e2723" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff9c4" />
          <stop offset="60%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#ff8f00" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f3e5f5" />
          <stop offset="100%" stopColor="#ce93d8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="waterDropGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e0f7fa" />
          <stop offset="60%" stopColor="#4dd0e1" />
          <stop offset="100%" stopColor="#00acc1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sky Canvas */}
      <rect width={400} height={230} fill="url(#gardenSky)" />

      {/* Stars (Night) */}
      {night && stars.map((s, i) => <Star key={i} x={s.x} y={s.y} delay={s.delay} />)}

      {/* Sun or Radiant Crescent Moon */}
      {!night ? (
        <motion.g animate={reduce ? {} : { y: [0, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={340} cy={50} r={28} fill="url(#sunGlow)" filter="url(#glow)" />
          <circle cx={340} cy={50} r={18} fill="#ffd54f" />
        </motion.g>
      ) : (
        <motion.g animate={reduce ? {} : { y: [0, -3, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={340} cy={45} r={24} fill="url(#moonGlow)" filter="url(#glow)" opacity={0.9} />
          <circle cx={349} cy={38} r={16} fill="#0d0416" />
        </motion.g>
      )}

      {/* Clouds (Day) */}
      {!night && (
        <>
          <Cloud x={30} y={80} size={28} speed={20} />
          <Cloud x={60} y={230} size={22} speed={26} />
        </>
      )}

      {/* Ground Terrain */}
      <rect x={0} y={210} width={400} height={90} fill="url(#gardenGround)" />

      {/* Cobblestone Garden Pathway */}
      <ellipse cx={200} cy={250} rx={32} ry={13} fill={night ? '#2b1b2a' : '#8d6e63'} opacity={0.6} />
      <ellipse cx={200} cy={270} rx={24} ry={10} fill={night ? '#2b1b2a' : '#8d6e63'} opacity={0.5} />

      {/* Grass Blades */}
      {Array.from({ length: 32 }).map((_, i) => {
        const bx = 8 + i * 12.5;
        const h = 14 + ((i * 7) % 12);
        const lean = i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0;
        return (
          <path
            key={i}
            d={`M${bx},210 Q${bx + lean * 4},${212 - h} ${bx + lean * 7},${210 - h}`}
            stroke={night ? '#382035' : '#81c784'}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* ── BOTANICAL STAGES ────────────────────────────────────────── */}

      {/* STAGE 0: ENCHANTED SEED */}
      {stage === 0 && (
        <motion.g
          animate={reduce ? {} : { y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx={200} cy={220} rx={14} ry={9} fill="#4e342e" />
          <circle cx={200} cy={218} r={6} fill="#ffd54f" filter="url(#glow)" />
          <circle cx={200} cy={218} r={3} fill="#fff" />
          <text x={200} y={242} textAnchor="middle" fontSize={10} fill="#f06292" fontFamily="serif" opacity={0.9}>
            A love in seed 🌱
          </text>
        </motion.g>
      )}

      {/* STAGE 1: TENDER SPROUT */}
      {stage === 1 && (
        <motion.g initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.8 }}>
          <path d="M200,225 Q198,195 200,170" stroke="#66bb6a" strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* Left Little Leaf */}
          <path d="M200,195 Q180,185 175,175 Q190,175 200,190" fill="#81c784" />
          {/* Right Little Leaf */}
          <path d="M200,185 Q220,175 225,165 Q210,165 200,180" fill="#a5d6a7" />
          <circle cx={200} cy={170} r={4} fill="#ff80ab" filter="url(#glow)" />
        </motion.g>
      )}

      {/* STAGE 2: GROWING ROSE BUSH */}
      {stage >= 2 && (
        <g>
          {/* Main Stem */}
          <path
            d="M198,225 C195,190 205,150 198,115"
            stroke="url(#gardenTrunk)"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
          />
          {/* Left Branch */}
          <path
            d="M198,170 Q160,150 150,125 Q175,130 198,160"
            fill={night ? '#2e1828' : '#388e3c'}
          />
          {/* Right Branch */}
          <path
            d="M198,150 Q235,135 245,110 Q220,115 198,140"
            fill={night ? '#381c32' : '#43a047'}
          />
        </g>
      )}

      {/* STAGE 3+: CANOPY & FLORAL BRANCHES */}
      {stage >= 3 && (
        <g>
          <ellipse cx={198} cy={105} rx={54} ry={44} fill={night ? '#2b1026' : '#2e7d32'} filter="url(#glow)" opacity={0.9} />
          <ellipse cx={165} cy={115} rx={38} ry={32} fill={night ? '#381630' : '#388e3c'} />
          <ellipse cx={232} cy={112} rx={36} ry={30} fill={night ? '#381630' : '#43a047'} />
          <ellipse cx={198} cy={90} rx={42} ry={28} fill={night ? '#421a3b' : '#66bb6a'} />
        </g>
      )}

      {/* STAGE 4 & 5: BLOOMING VELVET ROSES & FLOWERS */}
      {stage >= 4 &&
        flowers.map((_, i) => {
          const angle = (i / flowers.length) * Math.PI * 2;
          const rx = 46 + (i % 3) * 8;
          const ry = 36 + (i % 2) * 6;
          const cx = 198 + Math.cos(angle) * rx;
          const cy = 105 + Math.sin(angle) * ry;
          const petalColor = ['#e91e63', '#d81b60', '#c2185b', '#f06292', '#ff4081', '#d4af7a'][i % 6];
          return (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <circle cx={cx} cy={cy} r={8} fill={petalColor} filter="url(#glow)" />
              <circle cx={cx} cy={cy} r={4} fill="#fff9c4" />
            </motion.g>
          );
        })}

      {/* STAGE 5: ROMANTIC WILLOW ARCH & BENCH */}
      {stage >= 4 && (
        <g opacity={0.9}>
          {/* Bench */}
          <rect x={55} y={225} width={4} height={18} rx={2} fill="#4e342e" />
          <rect x={95} y={225} width={4} height={18} rx={2} fill="#4e342e" />
          <rect x={50} y={222} width={52} height={6} rx={2} fill="#6d4c41" />
          <rect x={50} y={208} width={52} height={5} rx={2} fill="#5d4037" />
          <rect x={50} y={202} width={52} height={5} rx={2} fill="#6d4c41" />
        </g>
      )}

      {/* Butterflies (Day) */}
      {!night && stage >= 2 && (
        <>
          <Butterfly x={80} y={150} delay={0} color="#f06292" />
          <Butterfly x={140} y={130} delay={4} color="#ce93d8" />
          {stage >= 4 && <Butterfly x={270} y={140} delay={7} color="#ffd54f" />}
        </>
      )}

      {/* Fireflies (Night) */}
      {night && stage >= 2 && (
        <>
          {[60, 110, 170, 240, 310, 360].map((fx, i) => (
            <Firefly key={i} x={fx} y={170 + (i % 3) * 15} delay={i * 0.6} />
          ))}
        </>
      )}

      {/* Watering Effect Particles */}
      {isWatering && (
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.ellipse
              key={`drop-${i}`}
              cx={180 + (i % 5) * 10}
              cy={120}
              rx={2.5}
              ry={4}
              fill="url(#waterDropGrad)"
              filter="url(#glow)"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.8, delay: i * 0.08, repeat: Infinity }}
            />
          ))}
        </g>
      )}

      {/* Hidden Easter Egg Flower */}
      <circle
        cx={38}
        cy={195}
        r={9}
        fill={found ? '#e3706a' : 'transparent'}
        onClick={onFoundFlower}
        className="cursor-pointer"
        aria-label="Secret flower"
      />
      {found && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <circle cx={38} cy={195} r={8} fill="#e3706a" filter="url(#glow)" />
          <circle cx={38} cy={195} r={3.5} fill="#fff9c4" />
        </motion.g>
      )}
    </svg>
  );
}

export default function Garden() {
  const water = useProgressStore((s) => s.waterGarden);
  const waterCount = useProgressStore((s) => s.gardenWaterCount);
  const playSound = useSound();
  const [night, setNight] = useState(() => {
    const h = new Date().getHours();
    return h < 6 || h >= 19;
  });
  const [isWatering, setIsWatering] = useState(false);
  const [found, setFound] = useState(false);

  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const stage = gardenStageFrom(daysTogether, waterCount);

  const doWater = () => {
    haptic('success');
    playSound('bloom');
    setIsWatering(true);
    water();
    setTimeout(() => setIsWatering(false), 2200);
  };

  const handleFoundFlower = () => {
    if (!found) {
      setFound(true);
      haptic('unlock');
      playSound('sparkle');
    }
  };

  const stageProgress = Math.min(100, (daysTogether / 365) * 100 + waterCount * 2);

  return (
    <PageShell
      eyebrow="Living Ecosystem"
      title="The Garden of Us"
      subtitle="A living sanctuary of our love. It blossoms with our days together and every drop of care you give."
      bleed
    >
      <div className="px-5">
        <GlassCard className="relative mb-5 overflow-hidden p-0 shadow-glass-lg border border-rosegold-400/30">
          {/* SVG Garden Canvas */}
          <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden">
            <GardenScene
              stage={stage}
              night={night}
              isWatering={isWatering}
              found={found}
              onFoundFlower={handleFoundFlower}
            />

            <div className="pointer-events-none absolute inset-0 opacity-40">
              <ParticleField kind={night ? 'fireflies' : 'petals'} density={night ? 18 : 12} />
            </div>

            {/* Day / Night Switcher */}
            <button
              type="button"
              onClick={() => {
                haptic('tap');
                setNight((n) => !n);
              }}
              aria-label="Toggle day and night"
              className="tap absolute left-4 top-4 rounded-full border border-rosegold-300/30 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-warmwhite backdrop-blur-md"
            >
              {night ? '☀️ Switch to Day' : '🌙 Switch to Night'}
            </button>

            {/* Stage Indicator Badge */}
            <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-rosegold-500 to-rosegold-700 px-3.5 py-1 text-[0.65rem] font-bold uppercase tracking-luxe text-warmwhite shadow-lg backdrop-blur-md">
              Stage {stage + 1} / 5
            </div>
          </div>

          {/* Garden Info & Controls */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-luxe text-rosegold-400">
                  {STAGE_LABELS[stage]}
                </p>
                <h2 className="mt-1 font-display text-2xl font-medium text-warmwhite">
                  Saxs & Snowpie's Garden
                </h2>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold tabular-nums text-rosegold-400">
                  {daysTogether}
                </p>
                <p className="text-[0.6rem] uppercase tracking-luxe text-rosegold-200/70">days together</p>
              </div>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-rosegold-100/80">{STAGE_DESC[stage]}</p>

            {/* Growth Progress Bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[0.65rem] uppercase tracking-luxe text-rosegold-300">
                <span>Garden Vitality & Growth</span>
                <span>{Math.round(Math.min(100, stageProgress))}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rosegold-400 via-rose-500 to-champagne-400 shadow-[0_0_10px_rgba(227,70,95,0.7)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stageProgress)}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Watering Action Bar */}
            <div className="mt-6 flex items-center gap-3">
              <Button variant="gold" size="lg" className="flex-1 shadow-lg" onClick={doWater}>
                💧 Water Our Garden
              </Button>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-center text-xs text-warmwhite">
                <span className="font-bold text-rosegold-400">{waterCount}×</span>
                <p className="text-[0.55rem] uppercase text-rosegold-200/70">Waters given</p>
              </div>
            </div>

            {found && (
              <motion.p
                className="mt-4 rounded-2xl border border-rosegold-400/40 bg-rosegold-500/20 p-3 text-xs text-warmwhite"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✨ You found the secret garden rose — proof that you notice every little detail about us. ♥
              </motion.p>
            )}

            {/* Garden Milestones Stats */}
            <div className="mt-6 grid grid-cols-3 gap-2.5 text-center">
              {[
                { label: 'Ecosystem', value: `Stage ${stage + 1}` },
                { label: 'Care given', value: `${waterCount} drops` },
                { label: 'Location', value: 'Mbombela 📍' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/5 p-3 border border-white/5">
                  <p className="font-display text-lg font-semibold text-rosegold-400">{stat.value}</p>
                  <p className="text-[0.6rem] uppercase tracking-luxe text-rosegold-200/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
