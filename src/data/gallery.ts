/**
 * Photo & Video Gallery Configuration for Saxs🥹❤️🔥 & Snowpie ❄️✨.
 * Only real content uploaded by Phathu & Lihle.
 */

export type AlbumId =
  | 'journey'
  | 'dating'
  | 'funny'
  | 'special'
  | 'travel';

export interface Album {
  id: AlbumId;
  title: string;
  blurb: string;
  emoji: string;
}

export const ALBUMS: Album[] = [
  { id: 'journey', title: 'Our Journey', blurb: 'Every chapter of us', emoji: '💖' },
  { id: 'dating', title: 'Dating & Dates', blurb: 'The sweetest times together', emoji: '🌹' },
  { id: 'funny', title: 'Funny Moments', blurb: 'Laughs that hurt our cheeks', emoji: '😂' },
  { id: 'special', title: 'Special Days', blurb: 'Birthdays & celebrations', emoji: '🎉' },
  { id: 'travel', title: 'Adventures & Trips', blurb: 'Every place we go together', emoji: '✈️' },
];

export function albumById(id: AlbumId): Album | undefined {
  return ALBUMS.find((a) => a.id === id);
}
