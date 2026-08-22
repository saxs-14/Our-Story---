/**
 * The Memory Timeline — Real confirmed moments for Saxs🥹❤️🔥 & Snowpie ❄️✨.
 * Love at first sight: 04 August 2026
 * Dating started: 11 August 2026
 * Both partners add their moments live through the Timeline compose form.
 */
import relationship from '@/config/relationship';

export type MemoryType = 'friendship' | 'relationship' | 'milestone' | 'future';

export interface MemoryEvent {
  id: string;
  date: string; // ISO YYYY-MM-DD
  title: string;
  description: string;
  type: MemoryType;
  emoji: string;
  place?: string;
  lat?: number;
  lng?: number;
  mediaUrls?: string[];
}

const { her, him, origin, firstSight, relationshipStart } = relationship;

export const MEMORIES: MemoryEvent[] = [
  {
    id: 'm-snowpie-bday',
    date: her.birthday,
    title: `${her.nickname}'s Birthday 🎂`,
    description: '06 August 2003 — The day God created the most precious and beautiful soul in the universe.',
    type: 'milestone',
    emoji: '❄️',
    place: origin.place,
  },
  {
    id: 'm-saxs-bday',
    date: him.birthday,
    title: `${him.nickname}'s Birthday 🔥`,
    description: '14 June 2005 — The day the boy who loves you with all his heart was born.',
    type: 'milestone',
    emoji: '🔥',
    place: origin.place,
  },
  {
    id: 'm-first-sight',
    date: firstSight,
    title: 'Love at First Sight 💘',
    description:
      '04 August 2026 — The unforgettable moment Phathu first saw Lihle. One look, and his heart was completely hers forever.',
    type: 'friendship',
    emoji: '💘',
    place: origin.place,
    lat: origin.lat,
    lng: origin.lng,
  },
  {
    id: 'm-official',
    date: relationshipStart,
    title: 'The Day It Became Us ❤️',
    description:
      '11 August 2026 — The day we officially became boyfriend and girlfriend. The start of our forever love story.',
    type: 'relationship',
    emoji: '❤️',
    place: origin.place,
    lat: origin.lat,
    lng: origin.lng,
  },
];

export function memoriesByType(type: MemoryType): MemoryEvent[] {
  return MEMORIES.filter((m) => m.type === type);
}

export const MAPPED_MEMORIES = MEMORIES.filter((m) => m.lat != null && m.lng != null);
export const TOTAL_MEMORIES = MEMORIES.length;
