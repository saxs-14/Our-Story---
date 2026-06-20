import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Resolves the effective "reduce motion" decision from the OS preference and
 * the in-app override (Settings → Motion). Components gate heavy animation and
 * the Three.js scene on this.
 */
export function useReducedMotion(): boolean {
  const motion = useAppStore((s) => s.motion);
  const [systemReduce, setSystemReduce] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setSystemReduce(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (motion === 'on') return false;
  if (motion === 'off') return true;
  return systemReduce;
}
