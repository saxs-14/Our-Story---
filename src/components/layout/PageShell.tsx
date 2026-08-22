import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

interface PageShellProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Remove the default max-width container (e.g. full-bleed Garden/Wrapped). */
  bleed?: boolean;
  className?: string;
}

/** Standard page frame: safe-area header, gentle enter transition, nav padding. */
export function PageShell({ eyebrow, title, subtitle, children, bleed, className }: PageShellProps) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      className={cn('relative min-h-dvh w-full pb-nav pt-[calc(env(safe-area-inset-top)+1.25rem)]', className)}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -12 }}
      transition={{ duration: reduce ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          bleed
            ? 'w-full lg:mx-auto lg:max-w-3xl'
            : 'mx-auto w-full max-w-2xl px-5 lg:max-w-3xl lg:px-8 xl:max-w-4xl',
        )}
      >
        {(eyebrow || title || subtitle) && (
          <header className={cn('mb-7', bleed && 'px-5')}>
            {eyebrow && (
              <p className="mb-1 text-xs font-medium uppercase tracking-luxe text-rosegold-500">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="font-display text-4xl font-medium text-[color:var(--ink-strong)] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 max-w-prose text-[color:var(--ink-soft)] lg:text-lg">{subtitle}</p>
            )}
          </header>
        )}
        {children}
      </div>
    </motion.main>
  );
}
