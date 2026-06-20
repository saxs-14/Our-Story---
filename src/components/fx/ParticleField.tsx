import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Kind = 'petals' | 'fireflies' | 'sparkles' | 'stars';

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  hue: number;
  alpha: number;
  twinkle: number;
}

const PALETTE = ['#f6b6b1', '#d4af7a', '#c9c2e8', '#f6c9a8', '#e3706a'];

/**
 * Canvas particle field — petals, fireflies, sparkles or stars drifting gently.
 * Caps its own framerate, pauses when the tab is hidden, and renders a single
 * static frame under reduced-motion.
 */
export function ParticleField({
  kind = 'petals',
  density = 28,
  className,
}: {
  kind?: Kind;
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * devicePixelRatio);
    const count = Math.round((density * width * height) / (1280 * 720 * devicePixelRatio * devicePixelRatio));
    const n = Math.max(10, Math.min(120, count || density));

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    const particles: Particle[] = Array.from({ length: n }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(2, 7) * devicePixelRatio,
      vx: rand(-0.25, 0.25) * devicePixelRatio,
      vy: rand(0.1, 0.6) * devicePixelRatio,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.01, 0.01),
      hue: Math.floor(rand(0, PALETTE.length)),
      alpha: rand(0.3, 0.85),
      twinkle: rand(0, Math.PI * 2),
    }));

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = PALETTE[p.hue];
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawGlow = (p: Particle, t: number) => {
      const a = p.alpha * (0.5 + 0.5 * Math.sin(t * 0.003 + p.twinkle));
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      g.addColorStop(0, PALETTE[p.hue]);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (p: Particle, t: number) => {
      const a = p.alpha * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + p.twinkle)));
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = kind === 'stars' ? '#fff6ef' : PALETTE[p.hue];
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(p.size * 0.4, p.size * 0.4, p.size * 1.6, 0);
        ctx.quadraticCurveTo(p.size * 0.4, -p.size * 0.4, 0, 0);
      }
      ctx.fill();
      ctx.restore();
    };

    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; // ~30fps cap
      last = t;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y - p.size > height) {
          p.y = -p.size;
          p.x = rand(0, width);
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;
        if (kind === 'petals') drawPetal(p);
        else if (kind === 'fireflies') drawGlow(p, t);
        else drawStar(p, t);
      }
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (kind === 'petals') drawPetal(p);
        else if (kind === 'fireflies') drawGlow(p, 0);
        else drawStar(p, 0);
      }
    };

    const onResize = () => {
      width = canvas.width = canvas.offsetWidth * devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduce) renderStatic();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kind, density, reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
