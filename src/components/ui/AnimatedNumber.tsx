import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Counts up to `value` when scrolled into view (instant under reduced motion). */
export function AnimatedNumber({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !inView) {
      el.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, duration, inView, reduce]);

  return <span ref={ref}>{reduce ? value.toLocaleString() : '0'}</span>;
}
