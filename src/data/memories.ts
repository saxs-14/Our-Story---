/**
 * The Memory Timeline & Memory Map source.
 * Events are typed (friendship / relationship / milestone / future) and may
 * carry coordinates for the stylised map. Dates are configurable anchors.
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
    id: 'm-firstlaugh',
    date: '2024-03-10',
    title: 'The first real laugh',
    description: 'The kind that goes on too long and changes the temperature of a friendship.',
    type: 'friendship',
    emoji: '😂',
  },
  {
    id: 'm-latenight',
    date: '2024-05-22',
    title: 'The conversation that ran late',
    description: 'Neither of us wanted to be the one to say goodnight. So we didn’t, for hours.',
    type: 'friendship',
    emoji: '🌙',
  },
  {
    id: 'm-herbday-24',
    date: '2024-03-04',
    title: `${her.nickname}’s birthday`,
    description: 'The day the world quietly celebrates the best thing it ever did.',
    type: 'milestone',
    emoji: '🎂',
  },
  {
    id: 'm-trust',
    date: '2024-08-14',
    title: 'When we started to trust',
    description: 'The first time something private was shared and held with care.',
    type: 'friendship',
    emoji: '🤝',
  },
  {
    id: 'm-realising',
    date: '2025-02-14',
    title: 'The realising',
    description: 'A slow, certain understanding that this was more than friendship now.',
    type: 'milestone',
    emoji: '💭',
  },
  {
    id: 'm-himbday',
    date: him.birthday,
    title: `${him.nickname}’s birthday`,
    description: 'Another year of the person lucky enough to love you.',
    type: 'milestone',
    emoji: '🎈',
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
    title: 'One month of us',
    description: 'Our very first monthiversary — small number, enormous feeling.',
    type: 'relationship',
    emoji: '🥂',
  },
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
    description: 'Somewhere with a sunset worth the wait. We’ll get there.',
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
