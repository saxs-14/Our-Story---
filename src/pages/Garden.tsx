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
const STAGE_DESC = [
  'Something beautiful has been planted. Every great love begins just like this.',
  'The first signs of life — delicate, hopeful, reaching for the light.',
  'Roots are deepening. The stems grow tall and the leaves reach wide.',
  'A strong, sheltering tree. Its shade is a place you can always come back to.',
  'In full bloom — petals open, fragrance everywhere, and love at its most alive.',
];

function Cloud({ x, y, size, speed }: { x: number; y: number; size: number; speed: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      initial={{ x }}
      animate={reduce ? {} : { x: [x, x + 60, x] }}
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
      cx={x} cy={y} r={1.2}
      fill="white"
      opacity={0.85}
      animate={reduce ? {} : { opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function Butterfly({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.text
      x={x} y={y}
      fontSize={14}
      textAnchor="middle"
      initial={{ x, y }}
      animate={{ x: [x, x + 80, x + 30, x + 120, x + 10, x], y: [y, y - 40, y + 10, y - 20, y + 5, y] }}
      transition={{ duration: 20, delay, repeat: Infinity, ease: 'easeInOut' }}
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
      cx={x} cy={y} r={2}
      fill="#ffe566"
      animate={{ cx: [x, x + 30, x - 20, x + 15, x], cy: [y, y - 25, y + 15, y - 10, y], opacity: [0, 1, 0.6, 1, 0] }}
      transition={{ duration: 5 + delay, delay: delay * 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/** Full realistic SVG garden scene */
function GardenScene({ stage, night, found, onFoundFlower }: {
  stage: number;
  night: boolean;
  found: boolean;
  onFoundFlower: () => void;
}) {
  const reduce = useReducedMotion();
  const flowers = useMemo(() => Array.from({ length: Math.min(16, stage * 4) }), [stage]);
  const stars = useMemo(() => Array.from({ length: 28 }).map((_, i) => ({
    x: 15 + (i * 37 % 370),
    y: 8 + (i * 23 % 80),
    delay: i * 0.3,
  })), []);

  const skyTop = night ? '#0d0620' : '#87ceeb';
  const skyBot = night ? '#3a2060' : '#ffecd2';
  const groundTop = night ? '#1a3510' : '#4caf50';
  const groundBot = night ? '#0d1f08' : '#2e7d32';

  return (
    <svg
      viewBox="0 0 400 280"
      className="h-full w-full"
      aria-label={`Garden: ${STAGE_LABELS[stage]}`}
      role="img"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={groundTop} />
          <stop offset="100%" stopColor={groundBot} />
        </linearGradient>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5d4037" />
          <stop offset="50%" stopColor="#8d6e63" />
          <stop offset="100%" stopColor="#5d4037" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff9c4" />
          <stop offset="60%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#ff8f00" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8eaf6" />
          <stop offset="100%" stopColor="#9fa8da" stopOpacity={0} />
        </radialGradient>
        <filter id="leafShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width={400} height={220} fill="url(#sky)" />

      {/* Stars (night) */}
      {night && stars.map((s, i) => <Star key={i} x={s.x} y={s.y} delay={s.delay} />)}

      {/* Sun / Moon */}
      {!night && (
        <motion.g animate={reduce ? {} : { y: [0, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={340} cy={45} r={26} fill="url(#sunGlow)" filter="url(#glow)" />
          <circle cx={340} cy={45} r={18} fill="#ffd54f" />
        </motion.g>
      )}
      {night && (
        <motion.g animate={reduce ? {} : { y: [0, -3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx={340} cy={40} r={22} fill="url(#moonGlow)" filter="url(#glow)" opacity={0.9} />
          <circle cx={348} cy={34} r={14} fill="#0d0620" /> {/* crescent cut */}
        </motion.g>
      )}

      {/* Clouds (day only) */}
      {!night && (
        <>
          <Cloud x={20} y={80} size={30} speed={18} />
          <Cloud x={50} y={220} size={22} speed={24} />
        </>
      )}

      {/* Ground with grass texture */}
      <rect x={0} y={200} width={400} height={80} fill="url(#ground)" />

      {/* Grass blades — 20 realistic blades */}
      {Array.from({ length: 30 }).map((_, i) => {
        const bx = 10 + i * 13;
        const h = 14 + (i * 7 % 10);
        const lean = (i % 3 === 0) ? 1 : (i % 3 === 1 ? -1 : 0);
        return (
          <motion.path
            key={i}
            d={`M${bx},200 Q${bx + lean * 5},${204 - h} ${bx + lean * 8},${200 - h}`}
            stroke={night ? '#2d5a1b' : '#66bb6a'}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            animate={reduce ? {} : { d: [`M${bx},200 Q${bx + lean * 5},${204 - h} ${bx + lean * 8},${200 - h}`, `M${bx},200 Q${bx - lean * 3},${204 - h} ${bx - lean * 4},${200 - h}`, `M${bx},200 Q${bx + lean * 5},${204 - h} ${bx + lean * 8},${200 - h}`] }}
            transition={{ duration: 3 + (i % 3), delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}

      {/* Cobblestone path */}
      <ellipse cx={200} cy={240} rx={30} ry={12} fill={night ? '#2c2c2c' : '#9e9e9e'} opacity={0.6} />
      <ellipse cx={200} cy={258} rx={22} ry={9} fill={night ? '#2c2c2c' : '#9e9e9e'} opacity={0.45} />

      {/* ── The Plant (grows by stage) ──────────────────────────────── */}

      {/* Stage 0 — seed in soil */}
      {stage === 0 && (
        <motion.g animate={reduce ? {} : { y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <ellipse cx={200} cy={210} rx={12} ry={8} fill="#8d6e63" />
          <ellipse cx={200} cy={207} rx={7} ry={5} fill="#a1887f" />
          <text x={200} y={230} textAnchor="middle" fontSize={10} fill={night ? '#c8e6c9' : '#2e7d32'} fontFamily="serif" opacity={0.7}>
            a love in seed
          </text>
        </motion.g>
      )}

      {/* Stage 1+ — trunk */}
      {stage >= 1 && (
        <motion.path
          d="M196,212 C196,185 197,160 198,130"
          stroke="url(#trunkGrad)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      {stage >= 2 && (
        <motion.path
          d="M198,155 C198,165 202,175 198,185"
          stroke="url(#trunkGrad)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Stage 2+ — leaves */}
      {stage >= 2 && (
        <>
          {/* Left branch */}
          <motion.path
            d="M197,170 C175,155 158,140 168,128 C180,125 197,155 197,170"
            fill={night ? '#2e7d32' : '#43a047'}
            filter="url(#leafShadow)"
            initial={{ scale: 0, transformOrigin: '197px 170px' }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 14 }}
          />
          {/* Right branch */}
          <motion.path
            d="M198,155 C220,140 240,128 232,115 C220,112 198,140 198,155"
            fill={night ? '#388e3c' : '#4caf50'}
            filter="url(#leafShadow)"
            initial={{ scale: 0, transformOrigin: '198px 155px' }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 140, damping: 12 }}
          />
          {/* Mini left leaf */}
          <motion.path
            d="M196,145 C180,135 170,122 178,115 C188,113 196,135 196,145"
            fill={night ? '#1b5e20' : '#66bb6a'}
            initial={{ scale: 0, transformOrigin: '196px 145px' }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9 }}
          />
        </>
      )}

      {/* Stage 3+ — full canopy */}
      {stage >= 3 && (
        <>
          <motion.ellipse
            cx={198} cy={112} rx={52} ry={45}
            fill={night ? '#1b5e20' : '#388e3c'}
            filter="url(#leafShadow)"
            initial={{ scale: 0, transformOrigin: '198px 112px' }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.4 }}
          />
          <ellipse cx={170} cy={120} rx={36} ry={32} fill={night ? '#2e7d32' : '#43a047'} />
          <ellipse cx={228} cy={118} rx={34} ry={30} fill={night ? '#2e7d32' : '#4caf50'} />
          <ellipse cx={198} cy={95} rx={40} ry={28} fill={night ? '#388e3c' : '#66bb6a'} />
        </>
      )}

      {/* Stage 4 — blossoms + hanging flowers */}
      {stage >= 4 && flowers.map((_, i) => {
        const angle = (i / flowers.length) * Math.PI * 2;
        const rx = 44 + (i % 3) * 6;
        const ry = 36 + (i % 2) * 5;
        const cx = 198 + Math.cos(angle) * rx;
        const cy = 112 + Math.sin(angle) * ry;
        const petal = ['#f48fb1', '#f06292', '#ce93d8', '#ffcc80', '#ef9a9a'][i % 5];
        return (
          <motion.g key={i}>
            <motion.circle
              cx={cx} cy={cy} r={7}
              fill={petal}
              filter="url(#glow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.04, type: 'spring', stiffness: 220 }}
            />
            <circle cx={cx} cy={cy} r={3.5} fill="#fff9c4" />
          </motion.g>
        );
      })}

      {/* Ground flowers — small wildflowers in the grass */}
      {stage >= 2 && (
        <>
          {[50, 100, 150, 250, 300, 345].map((fx, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <circle cx={fx} cy={196} r={5} fill={['#f06292', '#ce93d8', '#ffb74d', '#4fc3f7', '#aed581', '#ff8a65'][i % 6]} />
              <circle cx={fx} cy={196} r={2.5} fill="#fff9c4" />
              <line x1={fx} y1={200} x2={fx} y2={208} stroke={night ? '#2d5a1b' : '#388e3c'} strokeWidth={1.5} />
            </motion.g>
          ))}
        </>
      )}

      {/* Butterflies (day) */}
      {!night && stage >= 2 && (
        <>
          <Butterfly x={80} y={160} delay={0} color="#b76e79" />
          <Butterfly x={130} y={140} delay={4} color="#9575cd" />
          {stage >= 4 && <Butterfly x={260} y={150} delay={8} color="#f06292" />}
        </>
      )}

      {/* Fireflies (night) */}
      {night && stage >= 2 && (
        <>
          {[60, 120, 175, 240, 310, 360].map((fx, i) => (
            <Firefly key={i} x={fx} y={170 + (i % 3) * 15} delay={i * 0.7} />
          ))}
        </>
      )}

      {/* Garden bench */}
      {stage >= 3 && (
        <g opacity={0.85}>
          {/* bench legs */}
          <rect x={55} y={215} width={4} height={18} rx={2} fill={night ? '#4e342e' : '#795548'} />
          <rect x={91} y={215} width={4} height={18} rx={2} fill={night ? '#4e342e' : '#795548'} />
          {/* bench seat planks */}
          <rect x={50} y={213} width={50} height={5} rx={2} fill={night ? '#6d4c41' : '#8d6e63'} />
          <rect x={52} y={210} width={48} height={4} rx={1.5} fill={night ? '#5d4037' : '#795548'} />
          {/* bench back */}
          <rect x={50} y={200} width={50} height={4} rx={2} fill={night ? '#6d4c41' : '#8d6e63'} />
          <rect x={50} y={195} width={50} height={4} rx={2} fill={night ? '#5d4037' : '#795548'} />
          <rect x={53} y={195} width={4} height={18} rx={2} fill={night ? '#4e342e' : '#795548'} />
          <rect x={89} y={195} width={4} height={18} rx={2} fill={night ? '#4e342e' : '#795548'} />
        </g>
      )}

      {/* Hidden flower Easter egg */}
      <circle
        cx={38} cy={190} r={8}
        fill={found ? '#e3706a' : 'transparent'}
        stroke={found ? 'none' : 'transparent'}
        onClick={onFoundFlower}
        style={{ cursor: 'pointer' }}
        aria-label="Hidden flower"
      />
      {found && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <circle cx={38} cy={190} r={7} fill="#e3706a" filter="url(#glow)" />
          <circle cx={38} cy={190} r={3} fill="#fff9c4" />
        </motion.g>
      )}

      {/* Day/night label */}
      <text x={8} y={20} fontSize={9} fill="white" opacity={0.7} fontFamily="system-ui">
        {night ? '🌙 Night' : '☀️ Day'} · Mbombela
      </text>
    </svg>
  );
}

export default function Garden() {
  const water = useProgressStore((s) => s.waterGarden);
  const waterCount = useProgressStore((s) => s.gardenWaterCount);
  const playSound = useSound();
  const [night, setNight] = useState(() => { const h = new Date().getHours(); return h < 6 || h >= 19; });
  const [found, setFound] = useState(false);

  const daysTogether = Math.max(0, daysBetween(relationship.relationshipStart));
  const stage = gardenStageFrom(daysTogether, waterCount);

  const doWater = () => {
    haptic('soft');
    playSound('bloom');
    water();
  };

  const handleFoundFlower = () => {
    if (!found) {
      setFound(true);
      haptic('unlock');
      playSound('sparkle');
    }
  };

  const stageProgress = Math.min(100, (daysTogether / 365) * 100);

  return (
    <PageShell
      eyebrow="Our living garden"
      title="The Garden"
      subtitle="It grows with our time together — and a little with every drop of love you give it."
      bleed
    >
      <div className="px-5">
        <GlassCard className="relative mb-5 overflow-hidden p-0">
          {/* Realistic SVG Garden */}
          <div className="relative h-[50vh] min-h-[300px] w-full overflow-hidden">
            <GardenScene
              stage={stage}
              night={night}
              found={found}
              onFoundFlower={handleFoundFlower}
            />

            {/* Particle overlay for atmosphere */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <ParticleField kind={night ? 'fireflies' : 'petals'} density={night ? 18 : 12} />
            </div>

            {/* Day/night toggle */}
            <button
              type="button"
              onClick={() => { haptic('tap'); setNight((n) => !n); }}
              aria-label="Toggle day and night"
              className="absolute left-4 top-4 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-[color:var(--ink-strong)]"
            >
              {night ? '☀️ Switch to Day' : '🌙 Switch to Night'}
            </button>

            {/* Stage badge */}
            <div className="absolute right-4 top-4 rounded-full bg-rosegold-500/80 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-luxe text-warmwhite backdrop-blur-sm">
              Stage {stage + 1} / 5
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-luxe text-rosegold-500">
                  {STAGE_LABELS[stage]}
                </p>
                <h2 className="mt-1 font-display text-2xl text-[color:var(--ink-strong)]">
                  Our Garden
                </h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-semibold text-rosegold-600">
                  {daysTogether}
                </p>
                <p className="text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">days together</p>
              </div>
            </div>

            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{STAGE_DESC[stage]}</p>

            {/* Stage progress bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">
                <span>Growth</span>
                <span>{Math.round(stageProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-warmwhite/40">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rosegold-400 to-champagne-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${stageProgress}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button variant="primary" onClick={doWater}>
                💧 Water our garden
              </Button>
              <div className="text-xs text-[color:var(--ink-soft)]">
                <span className="font-semibold text-rosegold-600">{waterCount}</span> waters given
              </div>
            </div>

            {found && (
              <motion.p
                className="mt-4 rounded-2xl bg-rosegold-50/80 p-3 text-sm text-rosegold-700"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✨ You found the hidden flower — you really do look closely at the details. ♥
              </motion.p>
            )}

            {/* Garden facts */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Stage', value: `${stage + 1}/5` },
                { label: 'Watered', value: `${waterCount}×` },
                { label: 'Location', value: 'Mbombela' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-warmwhite/40 p-3">
                  <p className="font-display text-lg font-semibold text-rosegold-600">{stat.value}</p>
                  <p className="text-[0.6rem] uppercase tracking-luxe text-[color:var(--ink-soft)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
