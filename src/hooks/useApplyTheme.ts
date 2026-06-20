import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** Reflects theme + contrast preferences onto <html> data attributes. */
export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.theme);
  const highContrast = useAppStore((s) => s.highContrast);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    const color = theme === 'dusk' ? '#160b16' : '#f8f1e9';
    if (meta) meta.setAttribute('content', color);
  }, [theme, highContrast]);
}
