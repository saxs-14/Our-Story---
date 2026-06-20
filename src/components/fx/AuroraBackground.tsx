import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

/**
 * The living aurora behind everything: drifting gradient orbs over a soft
 * radial base, themed via CSS variables. Cheap (transform/opacity only) and
 * static when reduced motion is requested.
 */
export function AuroraBackground({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
      style={{ background: 'var(--aurora-bg)' }}
    >
      <div
        className={cn(
          'absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-70 blur-3xl',
          !reduce && 'animate-aurora',
        )}
        style={{
          background: 'radial-gradient(circle, var(--aurora-1), transparent 60%)',
        }}
      />
      <div
        className={cn(
          'absolute -right-1/4 top-1/3 h-[60vmax] w-[60vmax] rounded-full opacity-60 blur-3xl',
          !reduce && 'animate-aurora',
        )}
        style={{
          background: 'radial-gradient(circle, var(--aurora-3), transparent 60%)',
          animationDelay: '-6s',
        }}
      />
      <div
        className={cn(
          'absolute bottom-[-20%] left-1/4 h-[55vmax] w-[55vmax] rounded-full opacity-50 blur-3xl',
          !reduce && 'animate-aurora',
        )}
        style={{
          background: 'radial-gradient(circle, var(--aurora-4), transparent 60%)',
          animationDelay: '-12s',
        }}
      />
      {/* Fine grain to avoid banding on the gradients */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
