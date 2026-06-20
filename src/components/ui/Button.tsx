import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

type Variant = 'primary' | 'ghost' | 'glass' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-rosegold-400 to-rosegold-600 text-warmwhite shadow-glow hover:from-rosegold-300 hover:to-rosegold-500',
  gold: 'bg-gradient-to-br from-champagne-300 to-champagne-500 text-plum-900 shadow-glow-gold',
  glass: 'glass-strong text-[color:var(--ink-strong)] hover:border-rosegold/40',
  ghost: 'bg-transparent text-[color:var(--ink)] hover:bg-rosegold/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[0.95rem]',
  lg: 'h-14 px-8 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', onClick, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={cn(
        'tap inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide',
        'transition-colors duration-200 ease-silk focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  ),
);
Button.displayName = 'Button';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, onClick, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={cn(
        'tap inline-flex h-11 w-11 items-center justify-center rounded-full',
        'glass-strong text-[color:var(--ink-strong)] transition-colors hover:border-rosegold/40',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  ),
);
IconButton.displayName = 'IconButton';
