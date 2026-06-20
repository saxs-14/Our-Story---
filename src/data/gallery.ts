/**
 * Photo gallery model. Until real photos are dropped into /public/media,
 * each item renders as elegant, deterministic gradient art with a caption —
 * so the gallery looks intentional and beautiful out of the box. Add a `src`
 * (e.g. "/media/gallery/first-date.jpg") to show a real photo instead.
 */
import { rngFromSeed } from '@/lib/random';

export type AlbumId =
  | 'journey'
  | 'friendship'
  | 'dating'
  | 'funny'
  | 'dreams'
  | 'special';

export interface Photo {
  id: string;
  album: AlbumId;
  caption: string;
  date?: string;
  emoji: string;
  /** Optional real image path under /public */
  src?: string;
  /** Generated gradient stops when no src is present */
  gradient: [string, string, string];
}

export interface Album {
  id: AlbumId;
  title: string;
  blurb: string;
}

export const ALBUMS: Album[] = [
  { id: 'journey', title: 'Our Journey', blurb: 'The whole story, one frame at a time' },
  { id: 'friendship', title: 'Friendship', blurb: 'Before it had a name' },
  { id: 'dating', title: 'Dating', blurb: 'The chapter that changed everything' },
  { id: 'funny', title: 'Funny Moments', blurb: 'The laughs that hurt our cheeks' },
  { id: 'dreams', title: 'Dreams', blurb: 'Places we’ll frame for real one day' },
  { id: 'special', title: 'Special Days', blurb: 'The ones we circled on the calendar' },
];

const PALETTES: [string, string, string][] = [
  ['#f7d9d9', '#e8d2a6', '#c9c2e8'],
  ['#f6c9a8', '#f6b6b1', '#d4af7a'],
  ['#c9c2e8', '#f6b6b1', '#f6c9a8'],
  ['#e8d2a6', '#dustyrose', '#c9c2e8'],
  ['#f6b6b1', '#d4af7a', '#a99ed6'],
  ['#ddd6f3', '#f7d9d9', '#e4c47e'],
];

const CAPTIONS: Record<AlbumId, string[]> = {
  journey: ['Where it all began', 'The look that started it', 'Us, becoming us', 'Golden hour, golden us', 'A quiet, perfect ordinary day'],
  friendship: ['Just friends (for now)', 'The endless conversation', 'Laughing at nothing', 'The first inside joke', 'Late-night talks'],
  dating: ['Our first real date', 'Hands finally held', 'The first slow dance', 'A walk that ran long', 'Dressed up for each other'],
  funny: ['The face you made', 'Caught mid-laugh', 'Absolute nonsense', 'The blurry one we kept', 'You, being ridiculous (I love it)'],
  dreams: ['Somewhere by the sea', 'The city we’ll visit', 'Our future kitchen', 'Under the northern lights', 'The little garden'],
  special: ['Your birthday', 'Our anniversary', 'The day we made it official', 'A celebration just because', 'Festive season, together'],
};

const EMOJIS: Record<AlbumId, string> = {
  journey: '💞', friendship: '🌱', dating: '🌹', funny: '😂', dreams: '✨', special: '🎉',
};

function buildPhotos(): Photo[] {
  const out: Photo[] = [];
  let n = 0;
  for (const album of ALBUMS) {
    const caps = CAPTIONS[album.id];
    for (let i = 0; i < caps.length; i++) {
      const rng = rngFromSeed(`${album.id}-${i}`);
      const pal = PALETTES[Math.floor(rng() * PALETTES.length)].map((c) =>
        c === '#dustyrose' ? '#c98b8b' : c,
      ) as [string, string, string];
      out.push({
        id: `photo-${++n}`,
        album: album.id,
        caption: caps[i],
        emoji: EMOJIS[album.id],
        gradient: pal,
      });
    }
  }
  return out;
}

export const PHOTOS: Photo[] = buildPhotos();
export const TOTAL_PHOTOS = PHOTOS.length;

export function photosByAlbum(album: AlbumId): Photo[] {
  return PHOTOS.filter((p) => p.album === album);
}
