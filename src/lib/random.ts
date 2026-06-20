/**
 * Deterministic, seedable randomness.
 *
 * Used so generated content (daily notes, love weather, garden layout, …) is
 * stable for a given seed — the same day always yields the same note, and the
 * garden doesn't reshuffle on every render.
 */

/** FNV-1a string hash → 32-bit seed. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — fast, decent distribution, fully deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: string | number): () => number {
  return mulberry32(typeof seed === 'number' ? seed : hashString(seed));
}

/** Pick one item deterministically from a seed. */
export function pick<T>(items: readonly T[], seed: string | number): T {
  const rng = rngFromSeed(seed);
  return items[Math.floor(rng() * items.length)];
}

/** Fisher–Yates shuffle driven by a seed (non-mutating). */
export function seededShuffle<T>(items: readonly T[], seed: string | number): T[] {
  const arr = items.slice();
  const rng = rngFromSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random int in [min, max] inclusive, from a 0..1 generator. */
export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
export function between(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}
