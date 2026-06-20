/**
 * The Memory Timeline — only REAL confirmed moments.
 * Fake or guessed entries have been removed.
 * Add new entries here as Phathu or Ayanda share what actually happened.
 * Users add their own moments live via the Timeline page compose form.
 */
import relationship from '@/config/relationship';

export type MemoryType = 'friendship' | 'relationship' | 'milestone' | 'future';

export interface MemoryEvent {
  id: string;
  date: string; // ISO
  title: string;
  description: string;
  type: MemoryType;
  emoji: string;
  /** Optional map pin */
  place?: string;
  lat?: number;
  lng?: number;
}

const { friendshipStart, relationshipStart, her, him, origin } = relationship;

export const MEMORIES: MemoryEvent[] = [
  // ── Real confirmed moments ────────────────────────────────────────────────
  {
    id: 'm-friendship',
    date: friendshipStart,
    title: 'Where it all began',
    description:
      'Two people who were only meant to be friends started talking — and somehow never really stopped.',
    type: 'friendship',
    emoji: '🌱',
    place: origin.place,
    lat: origin.lat,
    lng: origin.lng,
  },
  {
    id: 'm-herbday-25',
    date: '2025-03-04',
    title: `${her.nickname}'s birthday 2025`,
    description: 'The day the world quietly celebrates the best thing it ever did.',
    type: 'milestone',
    emoji: '🎂',
    place: origin.place,
  },
  {
    id: 'm-himbday-25',
    date: '2025-06-14',
    title: `${him.nickname}'s birthday 2025`,
    description: 'Another year of the person lucky enough to love you.',
    type: 'milestone',
    emoji: '🎈',
    place: origin.place,
  },
  {
    id: 'm-official',
    date: relationshipStart,
    title: 'The day it became us',
    description:
      'The friendship finally became the thing it had been growing into. 08 May — the start of our story.',
    type: 'relationship',
    emoji: '❤️',
    place: origin.place,
    lat: origin.lat,
    lng: origin.lng,
  },
  {
    id: 'm-firstmonth',
    date: '2026-06-08',
    title: 'One month of us 🥂',
    description: 'Our very first monthiversary — small number, enormous feeling.',
    type: 'relationship',
    emoji: '🥂',
    place: origin.place,
  },
  {
    id: 'm-herbday-26',
    date: '2026-03-04',
    title: `${her.nickname}'s birthday 2026`,
    description: 'Celebrating the most important person.',
    type: 'milestone',
    emoji: '🎂',
    place: origin.place,
  },

  // ── Future aspirations (clearly marked) ───────────────────────────────────
  {
    id: 'm-future-anniv',
    date: '2027-05-08',
    title: 'Our first year',
    description: 'A whole year of choosing each other. The first of so many.',
    type: 'future',
    emoji: '🌟',
  },
  {
    id: 'm-future-trip',
    date: '2027-12-20',
    title: 'The trip we keep talking about',
    description: "Somewhere with a sunset worth the wait. We'll get there.",
    type: 'future',
    emoji: '✈️',
  },
  {
    id: 'm-future-forever',
    date: '2030-05-08',
    title: 'Still choosing you',
    description: 'A marker for the future — proof we planned to keep going, and did.',
    type: 'future',
    emoji: '💍',
  },
];

export function memoriesByType(type: MemoryType): MemoryEvent[] {
  return MEMORIES.filter((m) => m.type === type);
}

export const MAPPED_MEMORIES = MEMORIES.filter((m) => m.lat != null && m.lng != null);
export const TOTAL_MEMORIES = MEMORIES.length;
