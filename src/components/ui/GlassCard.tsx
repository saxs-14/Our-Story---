import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  glow?: boolean;
}

/** The frosted-glass surface used across the whole app. */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, strong, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'rounded-4xl',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassCard.displayName = 'GlassCard';
