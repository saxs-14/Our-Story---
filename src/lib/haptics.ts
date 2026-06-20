/** Gentle haptic feedback for taps & celebrations (no-op where unsupported). */

type Pattern = 'tap' | 'soft' | 'success' | 'celebrate' | 'unlock';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  soft: 14,
  success: [10, 40, 18],
  celebrate: [12, 30, 12, 30, 40],
  unlock: [20, 60, 20, 60, 80],
};

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function haptic(pattern: Pattern = 'tap') {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
