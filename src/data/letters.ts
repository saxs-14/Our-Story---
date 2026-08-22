/**
 * Private Letter System for Saxs🥹❤️🔥 & Snowpie ❄️✨.
 * Pure authentic letters written by Phathu & Lihle.
 * No generic templates or fake generators.
 */

export type LetterCategory =
  | 'Deep Love'
  | 'Gratitude'
  | 'Late Night Thoughts'
  | 'Encouragement'
  | 'Special Occasion'
  | 'Just Because';

export interface Letter {
  id: string;
  title: string;
  category: LetterCategory;
  preview: string;
  body: string[];
  signoff: string;
  date?: string;
  readingTime: number;
  photoUrl?: string;
  sealColor?: string;
}

export const LETTER_CATEGORIES: LetterCategory[] = [
  'Deep Love',
  'Gratitude',
  'Late Night Thoughts',
  'Encouragement',
  'Special Occasion',
  'Just Because',
];

// Initial foundational letter for Saxs & Snowpie
export const LETTERS: Letter[] = [
  {
    id: 'letter-foundation',
    title: 'To My Beautiful Snowpie ❄️✨',
    category: 'Deep Love',
    preview: 'From the moment you entered my life, everything changed for the better.',
    body: [
      'My dearest Snowpie ❄️✨,',
      'I built this entire world for you, so that every smile, every inside joke, every song, and every quiet moment we share has a place to live forever.',
      'Loving you is the easiest, sweetest, and most natural thing I have ever known. Thank you for being my peace, my favourite person to talk to, and the girl I want to keep choosing every single day.',
      'Whenever the world feels noisy or heavy, come here. This space is ours and ours alone.',
    ],
    signoff: 'Forever & in every universe,\nSaxs🥹❤️🔥',
    date: '2026-08-11',
    readingTime: 2,
    sealColor: '#e3706a',
  },
];

export const TOTAL_LETTERS = LETTERS.length;

export function letterById(id: string): Letter | undefined {
  return LETTERS.find((l) => l.id === id);
}
