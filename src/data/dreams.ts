/**
 * Joint Dreams & Vision Board for Phathu (Saxs🥹❤️🔥) & Lihle (Snowpie ❄️✨).
 * No fake templates — only real dreams and milestones added by both partners.
 */

export type DreamCategory =
  | 'Bucket List'
  | 'Places to Visit'
  | 'Our Future Home'
  | 'Audi Dream Drives 🚗'
  | 'Date Nights'
  | 'Milestones';

export interface Dream {
  id: string;
  category: DreamCategory;
  title: string;
  note: string;
  emoji: string;
}

export const DREAM_CATEGORIES: DreamCategory[] = [
  'Bucket List',
  'Places to Visit',
  'Our Future Home',
  'Audi Dream Drives 🚗',
  'Date Nights',
  'Milestones',
];

// Pure empty board — Saxs and Snowpie add their real dreams live
export const DREAMS: Dream[] = [];

export const TOTAL_DREAMS = DREAMS.length;
