import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  heart: boolean;
}

const COLORS = ['#b76e79', '#d4af7a', '#f6b6b1', '#c9c2e8', '#f6c9a8', '#e3706a', '#fff6ef'];

/** A celebratory burst of hearts & petals. Fires once, then fades out. */
export function Confetti({ duration = 4500 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    const bits: Bit[] = [];
    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        bits.push({
          x: rand(0, w),
          y: rand(-h * 0.4, 0),
          vx: rand(-1.2, 1.2),
          vy: rand(1.5, 4.5),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.15, 0.15),
          size: rand(6, 14),
          color: COLORS[Math.floor(rand(0, COLORS.length))],
          heart: Math.random() > 0.55,
        });
      }
    };
    spawn(140);

    const start = performance.now();
    let raf = 0;
    const drawHeart = (s: number) => {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.4);
      ctx.bezierCurveTo(-s, s * 0.9, 0, s * 1.1, 0, s * 1.4);
      ctx.bezierCurveTo(0, s * 1.1, s, s * 0.9, s, s * 0.4);
      ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3);
      ctx.fill();
    };

    const frame = (t: number) => {
      const elapsed = t - start;
      const fade = Math.max(0, 1 - Math.max(0, elapsed - (duration - 900)) / 900);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = fade;
      for (const b of bits) {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.02;
        b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        if (b.heart) drawHeart(b.size * 0.5);
        else ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.5);
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [duration, reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90]"
      style={{ width: '100vw', height: '100dvh' }}
    />
  );
}
