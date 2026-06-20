import type { Config } from 'tailwindcss';

/**
 * Our Story design system.
 * Colors are exposed both as Tailwind utilities and as CSS variables
 * (see src/styles/theme.css) so they can be reused in raw CSS, canvas,
 * and the Three.js scenes.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary romantic palette
        rosegold: {
          50: '#fbf1ef',
          100: '#f6dfd9',
          200: '#eec1b7',
          300: '#e2a294',
          400: '#d18573',
          500: '#b76e79', // signature rose gold
          600: '#9c5763',
          700: '#7e4550',
          800: '#5f343c',
          900: '#42242a',
        },
        blush: {
          50: '#fef6f5',
          100: '#fde8e6',
          200: '#fad2cf',
          300: '#f6b6b1',
          400: '#ef928c',
          500: '#e3706a',
        },
        champagne: {
          50: '#fdf9f0',
          100: '#f8eed6',
          200: '#efdcad',
          300: '#e4c47e',
          400: '#d4af7a', // champagne gold
          500: '#c2974f',
        },
        cream: '#f8f1e9',
        warmwhite: '#fffbf7',
        // Secondary
        lavender: {
          200: '#ddd6f3',
          300: '#c9c2e8',
          400: '#a99ed6',
          500: '#8b7dc4',
        },
        peach: {
          200: '#fbe0cc',
          300: '#f6c9a8',
          400: '#f0ac7e',
        },
        dustyrose: {
          300: '#d9a9a9',
          400: '#c98b8b',
          500: '#b46c6c',
        },
        // Deep / night (text on light, backgrounds for 3D)
        plum: {
          500: '#5a3548',
          700: '#3a2230',
          900: '#241019',
        },
        night: {
          800: '#1f1320',
          900: '#160b16',
          950: '#0d060d',
        },
        ink: '#3a2230',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['"Fraunces Variable"', '"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', '"Inter"', 'system-ui', 'sans-serif'],
        hand: ['"Dancing Script"', '"Caveat"', 'cursive'],
        script: ['"Caveat"', '"Dancing Script"', 'cursive'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(58, 34, 48, 0.18)',
        'glass-lg': '0 24px 64px rgba(58, 34, 48, 0.28)',
        glow: '0 0 40px rgba(183, 110, 121, 0.45)',
        'glow-gold': '0 0 48px rgba(212, 175, 122, 0.4)',
        soft: '0 2px 18px rgba(58, 34, 48, 0.12)',
        bloom: '0 0 80px rgba(247, 217, 217, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      letterSpacing: {
        luxe: '0.18em',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'aurora-shift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: '0.75' },
          '50%': { transform: 'translate3d(2%, -3%, 0) rotate(8deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-heart': {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.08)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.06)' },
          '70%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      },
      animation: {
        aurora: 'aurora-shift 18s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        heartbeat: 'pulse-heart 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        twinkle: 'twinkle 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
