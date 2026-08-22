import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

interface RoseAnimationProps {
  progress?: number;
  stage: number; // 0: seed, 1: stem/leaves, 2: tight bud, 3: blooming, 4: majestic full bloom
}

/**
 * Real rose petals are never identical twins — each one differs slightly in
 * size, curl and lean. These hand-tuned per-petal offsets (not Math.random,
 * so the bloom never reshuffles between renders) break the perfectly radial
 * "computed" symmetry that reads as fake, and the per-petal translateZ gives
 * genuine depth instead of relying on rotateX foreshortening alone.
 */
const OUTER_JITTER = [
  { scale: 1, rotateY: -7, tilt: -2, z: 10 },
  { scale: 0.9, rotateY: 5, tilt: 3, z: -8 },
  { scale: 1.08, rotateY: -4, tilt: -1, z: 14 },
  { scale: 0.94, rotateY: 8, tilt: 4, z: -6 },
  { scale: 1.05, rotateY: -6, tilt: -3, z: 8 },
  { scale: 0.88, rotateY: 3, tilt: 2, z: -10 },
];
const MID_JITTER = [
  { scale: 1.06, rotateY: 6, tilt: 2, z: 7 },
  { scale: 0.92, rotateY: -5, tilt: -2, z: -6 },
  { scale: 1, rotateY: 7, tilt: 3, z: 9 },
  { scale: 0.95, rotateY: -8, tilt: -3, z: -5 },
  { scale: 1.04, rotateY: 4, tilt: 1, z: 6 },
  { scale: 0.9, rotateY: -6, tilt: -2, z: -8 },
];
const INNER_JITTER = [
  { scale: 1.05, rotateY: -5, tilt: -2, z: 5 },
  { scale: 0.93, rotateY: 6, tilt: 2, z: -4 },
  { scale: 1, rotateY: -3, tilt: 1, z: 6 },
  { scale: 0.96, rotateY: 5, tilt: -1, z: -5 },
  { scale: 1.03, rotateY: -6, tilt: 2, z: 4 },
  { scale: 0.91, rotateY: 4, tilt: -2, z: -6 },
];
/** Natural, slightly-overshooting spring — reads as physical motion, not eased CSS. */
const BLOOM_SPRING = { type: 'spring' as const, stiffness: 110, damping: 13, mass: 1 };

export function RoseAnimation({ stage }: RoseAnimationProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex h-80 w-80 items-center justify-center [perspective:1000px]">
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(227, 70, 95, 0.35) 0%, rgba(212, 175, 122, 0.15) 45%, transparent 70%)',
        }}
        animate={
          reduce
            ? {}
            : {
                scale: stage >= 3 ? [1, 1.15, 1] : [0.8, 1, 0.8],
                opacity: stage >= 3 ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4],
              }
        }
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── STAGE 0: Glowing Seed in Soil ────────────────────────────── */}
      {stage === 0 && (
        <motion.div
          key="seed"
          className="relative flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 1 }}
        >
          {/* Glowing Golden Seed */}
          <div className="relative h-12 w-8 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-b from-amber-200 via-rose-400 to-amber-600 shadow-[0_0_35px_rgba(255,215,0,0.8)]">
            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-white/80 to-transparent" />
            <motion.div
              className="absolute -inset-2 rounded-full border border-amber-300/40"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          {/* Earth Soil Base */}
          <div className="mt-4 h-3 w-28 rounded-full bg-gradient-to-r from-amber-950/20 via-amber-900/60 to-amber-950/20 blur-[1px]" />
          <p className="mt-4 font-serif text-sm italic text-rosegold-300">
            A single seed of love planted in Mbombela…
          </p>
        </motion.div>
      )}

      {/* ── STAGES 1+: Organic Stem & Leaves ─────────────────────────── */}
      {stage >= 1 && (
        <div className="relative flex h-full w-full items-center justify-center">
          {/* Realistic Arching Stem (SVG path for perfect curve + thorns) */}
          <svg
            className="absolute bottom-6 h-56 w-32"
            viewBox="0 0 100 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#1e3a1e" />
                <stop offset="50%" stopColor="#2e6930" />
                <stop offset="100%" stopColor="#43a047" />
              </linearGradient>
              <linearGradient id="leafGradLeft" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4caf50" />
                <stop offset="60%" stopColor="#2e7d32" />
                <stop offset="100%" stopColor="#1b5e20" />
              </linearGradient>
              <linearGradient id="leafGradRight" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#66bb6a" />
                <stop offset="60%" stopColor="#388e3c" />
                <stop offset="100%" stopColor="#1b5e20" />
              </linearGradient>
            </defs>

            {/* Stem Path with organic thickness */}
            <motion.path
              d="M50 200 Q46 120 50 60 Q52 35 50 15"
              stroke="url(#stemGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Left Leaf */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <path
                d="M48 135 C25 125 10 105 15 85 C35 90 45 110 48 135 Z"
                fill="url(#leafGradLeft)"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
              />
              <path d="M48 135 Q30 110 15 85" stroke="#81c784" strokeWidth="1" opacity="0.6" />
              {/* Leaf Dewdrop */}
              <circle cx="28" cy="100" r="2" fill="#fff" opacity="0.9" />
            </motion.g>

            {/* Right Leaf */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <path
                d="M51 105 C75 95 90 75 85 55 C65 60 55 80 51 105 Z"
                fill="url(#leafGradRight)"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
              />
              <path d="M51 105 Q70 80 85 55" stroke="#a5d6a7" strokeWidth="1" opacity="0.6" />
              {/* Leaf Dewdrop */}
              <circle cx="72" cy="72" r="2.2" fill="#fff" opacity="0.9" />
            </motion.g>

            {/* Thorns */}
            <path d="M47 165 L38 160 L48 155 Z" fill="#2e7d32" />
            <path d="M53 145 L62 140 L52 135 Z" fill="#2e7d32" />
          </svg>

          {/* ── REALISTIC CSS 3D BLOOMING ROSE FLOWER HEAD ────────────── */}
          <div className="relative top-[-36px] flex h-48 w-48 items-center justify-center [transform-style:preserve-3d]">
            {/* Green Sepals (Calyx) that peel back when blooming */}
            <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const tilt = [-3, 2, -2, 4, -1][i];
                return (
                  <motion.div
                    key={`sepal-${i}`}
                    className="absolute bottom-1/2 h-14 w-4 origin-bottom rounded-[50%_50%_0_0] bg-gradient-to-t from-[#2e7d32] to-[#1b5e20] shadow-sm"
                    initial={{ rotateX: 0 }}
                    animate={{
                      rotate: angle + tilt,
                      rotateX: stage >= 3 ? 75 + tilt : stage === 2 ? 30 : 10,
                    }}
                    transition={{ ...BLOOM_SPRING, delay: i * 0.05 }}
                  />
                );
              })}
            </div>

            {/* LAYER 1: Outermost Large Velvet Petals (Unfurl Wide in 3D) */}
            {stage >= 2 && (
              <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const j = OUTER_JITTER[i];
                  const rot = angle + j.tilt;
                  const xf = (rx: number, sc: number, ty: number) =>
                    `rotate(${rot}deg) rotateY(${j.rotateY}deg) rotateX(${rx}deg) translateZ(${j.z}px) translateY(${ty}px) scale(${(sc * j.scale).toFixed(3)})`;
                  return (
                    <motion.div
                      key={`outer-${i}`}
                      className="absolute h-24 w-20 origin-bottom rounded-[50%_50%_50%_50%/65%_65%_35%_35%] shadow-[inset_0_-8px_15px_rgba(0,0,0,0.5),0_6px_15px_rgba(136,14,35,0.4)]"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 25%, #ff2a55 0%, #b70932 45%, #6a001a 85%, #3d000f 100%)',
                      }}
                      initial={{ transform: xf(10, 0.6, 0), opacity: 0.8 }}
                      animate={{
                        transform:
                          stage >= 4
                            ? xf(60 + j.tilt, 1.18, -8)
                            : stage === 3
                            ? xf(43, 1, 0)
                            : xf(20, 0.75, 0),
                        opacity: 1,
                      }}
                      transition={{
                        transform: { ...BLOOM_SPRING, delay: i * 0.07 },
                        opacity: { duration: 0.7, delay: i * 0.07 },
                      }}
                    >
                      {/* Petal velvet texture sheen */}
                      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-transparent via-white/10 to-rose-200/20 opacity-70" />
                      {/* Crystal Dewdrop on outer petal */}
                      {i % 2 === 0 && (
                        <div className="absolute left-6 top-4 h-2 w-2 rounded-full bg-white/90 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* LAYER 2: Middle Blooming Petals (Curved in 3D) */}
            {stage >= 2 && (
              <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
                {[30, 90, 150, 210, 270, 330].map((angle, i) => {
                  const j = MID_JITTER[i];
                  const rot = angle + j.tilt;
                  const xf = (rx: number, sc: number, ty: number) =>
                    `rotate(${rot}deg) rotateY(${j.rotateY}deg) rotateX(${rx}deg) translateZ(${j.z}px) translateY(${ty}px) scale(${(sc * j.scale).toFixed(3)})`;
                  return (
                    <motion.div
                      key={`mid-${i}`}
                      className="absolute h-20 w-16 origin-bottom rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[inset_0_-6px_12px_rgba(0,0,0,0.6),0_4px_12px_rgba(136,14,35,0.5)]"
                      style={{
                        background:
                          'radial-gradient(circle at 45% 20%, #ff3b68 0%, #c21840 40%, #7e0420 80%, #4a0011 100%)',
                      }}
                      initial={{ transform: xf(5, 0.5, 0) }}
                      animate={{
                        transform:
                          stage >= 4
                            ? xf(46 + j.tilt, 1.08, -5)
                            : stage === 3
                            ? xf(30, 0.9, 0)
                            : xf(15, 0.7, 0),
                      }}
                      transition={{ ...BLOOM_SPRING, delay: 0.18 + i * 0.06 }}
                    >
                      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-rose-300/15 to-transparent" />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* LAYER 3: Inner Velvet Swirl Petals */}
            {stage >= 2 && (
              <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
                {[15, 75, 135, 195, 255, 315].map((angle, i) => {
                  const j = INNER_JITTER[i];
                  const rot = angle + j.tilt;
                  const xf = (rx: number, sc: number) =>
                    `rotate(${rot}deg) rotateY(${j.rotateY}deg) rotateX(${rx}deg) translateZ(${j.z}px) scale(${(sc * j.scale).toFixed(3)})`;
                  return (
                    <motion.div
                      key={`inner-${i}`}
                      className="absolute h-16 w-12 origin-bottom rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.7)]"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 15%, #ff5277 0%, #d81b47 45%, #8e0024 85%, #580014 100%)',
                      }}
                      initial={{ transform: xf(4, 0.4) }}
                      animate={{
                        transform:
                          stage >= 4
                            ? xf(30 + j.tilt, 1)
                            : stage === 3
                            ? xf(19, 0.85)
                            : xf(9, 0.65),
                      }}
                      transition={{ ...BLOOM_SPRING, delay: 0.34 + i * 0.05 }}
                    />
                  );
                })}
              </div>
            )}

            {/* LAYER 4: The Heart Core / Swirling Rose Center */}
            <motion.div
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_0_20px_rgba(255,75,110,0.6)]"
              style={{
                background:
                  'radial-gradient(circle at 40% 40%, #ff6b8b 0%, #e01140 40%, #80001f 75%, #3d000f 100%)',
              }}
              animate={
                reduce
                  ? {}
                  : {
                      rotate: stage >= 4 ? [0, 360] : [0, 90],
                      scale: stage >= 4 ? [1, 1.05, 1] : [0.8, 0.9, 0.8],
                    }
              }
              transition={{
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              {/* Realistic spiral center curl */}
              <div className="h-6 w-6 rounded-full border-2 border-t-rose-300 border-r-rose-400 border-b-rose-900 border-l-rose-800 opacity-90" />
              {/* Golden stardust spark in heart of rose */}
              <div className="absolute h-2 w-2 rounded-full bg-amber-200 blur-[1px]" />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
