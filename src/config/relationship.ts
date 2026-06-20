/**
 * Our Story — single source of truth for the relationship.
 *
 * Everything in the app reads from here, so the experience can be re-pointed
 * at a different couple, anniversary, or set of names by editing ONE file.
 * All dates are ISO `YYYY-MM-DD` (local midnight) unless noted.
 */

export interface Person {
  /** Full legal / given name */
  name: string;
  /** What we lovingly call them */
  nickname: string;
  /** Single-letter monogram used in the crystal heart and seals */
  initial: string;
  /** ISO birthday */
  birthday: string;
  /** Pronoun used in a few generated lines */
  pronoun: 'he' | 'she' | 'they';
}

export interface RelationshipConfig {
  /** The person this app is *for* (the one opening it) */
  her: Person;
  /** The person who built it */
  him: Person;
  /** ~When the friendship began */
  friendshipStart: string;
  /** When you became official */
  relationshipStart: string;
  /** Where it all began — used by the Memory Map & Timeline */
  origin: {
    place: string;
    lat: number;
    lng: number;
  };
  /** Shown on the cinematic intro and share cards */
  tagline: string;
  /** A short love-letter signature */
  signature: string;
}

export const relationship: RelationshipConfig = {
  her: {
    name: 'Ayanda Silinda',
    nickname: 'Ayanda',
    initial: 'A',
    birthday: '2005-03-04',
    pronoun: 'she',
  },
  him: {
    name: 'Phathutshedzo Mamagau',
    nickname: 'Phathu',
    initial: 'P',
    birthday: '2005-06-14',
    pronoun: 'he',
  },
  // "Approximately February 2024" — anchored to the 1st for the counters.
  friendshipStart: '2024-02-01',
  relationshipStart: '2026-05-08',
  origin: {
    place: 'Mbombela, Mpumalanga, South Africa',
    lat: -25.4653,
    lng: 30.9858,
  },
  tagline: 'Every moment matters.',
  signature: 'Always & in all ways,\nPhathu',
};

/** "P ❤️ A" — the monogram living inside the crystal heart. */
export const monogram = `${relationship.him.initial} ❤️ ${relationship.her.initial}`;

/** "Ayanda ❤️ Phathutshedzo" — intro order (her first). */
export const introNames = `${relationship.her.nickname} ❤️ ${relationship.him.nickname}`;

/** "Phathutshedzo Mamagau ❤️ Ayanda Silinda" — formal full pairing. */
export const fullPairing = `${relationship.him.name} ❤️ ${relationship.her.name}`;

export default relationship;
