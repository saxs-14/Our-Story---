/**
 * Relationship identity & dates configuration.
 * Exclusively for Phathu (Saxs🥹❤️🔥) and Lihle (Snowpie ❄️✨).
 */

export interface PersonConfig {
  id: 'her' | 'him';
  name: string;
  nickname: string;
  shortName: string;
  initial: string;
  birthday: string; // ISO YYYY-MM-DD
  avatarPlaceholder: string;
  favoriteCarBrand?: string;
}

export interface RelationshipConfig {
  her: PersonConfig;
  him: PersonConfig;
  /** Love at first sight for Phathu — 04 August 2026 */
  firstSight: string;
  /** Official relationship start date — 11 August 2026 */
  relationshipStart: string;
  /** Friendship started */
  friendshipStart: string;
  origin: {
    city: string;
    province: string;
    country: string;
    place: string;
    lat: number;
    lng: number;
  };
  monogram: string;
  tagline: string;
  signature: string;
  sharedPassions: string[];
}

export const relationship: RelationshipConfig = {
  her: {
    id: 'her',
    name: 'Lihle',
    nickname: 'Snowpie ❄️✨',
    shortName: 'Lihle',
    initial: 'L',
    birthday: '2003-08-06', // 06 August 2003
    avatarPlaceholder: '❄️',
    favoriteCarBrand: 'Audi',
  },
  him: {
    id: 'him',
    name: 'Phathu',
    nickname: 'Saxs🥹❤️🔥',
    shortName: 'Phathu',
    initial: 'P',
    birthday: '2005-06-14', // 14 June 2005
    avatarPlaceholder: '🔥',
    favoriteCarBrand: 'Audi',
  },
  firstSight: '2026-08-04',       // 04 August 2026 — Love at first sight for Phathu
  relationshipStart: '2026-08-11',// 11 August 2026 — Official Dating Anniversary
  friendshipStart: '2026-08-04',  // 04 August 2026
  origin: {
    city: 'Mbombela',
    province: 'Mpumalanga',
    country: 'South Africa',
    place: 'Mbombela, Mpumalanga',
    lat: -25.4753,
    lng: 30.9694,
  },
  monogram: 'P ❤️ L',
  tagline: 'Saxs & Snowpie · Forever & Always',
  signature: 'Phathu & Lihle',
  sharedPassions: ['Audi Cars 🚗💨', 'Late Night Talks 🌙', 'Gospel & Amapiano 🎵', 'Road Trips 🛣️'],
};

export default relationship;

export const fullPairing = `${relationship.him.nickname} & ${relationship.her.nickname}`;
export const namesPairing = `${relationship.him.shortName} & ${relationship.her.shortName}`;
export const introNames = fullPairing;
export const monogram = relationship.monogram;
