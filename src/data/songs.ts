/**
 * Curated Music Experience for Saxs🥹❤️🔥 & Snowpie ❄️✨.
 * Includes South African Gospel, Makhadzi, Top Amapiano, and R&B / Love Favourites.
 * Uses Spotify embeds for legal, instant playback with zero file hosting.
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  spotifyTrackId?: string;
  embedUrl: string;
  openUrl: string;
  category: 'sa-gospel' | 'makhadzi' | 'amapiano' | 'rnb-love';
  mood?: string;
}

const track = (id: string) => ({
  embedUrl: `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`,
  openUrl: `https://open.spotify.com/track/${id}`,
  spotifyTrackId: id,
});

// ── 1. South African Gospel ──────────────────────────────────────────────────
// NOTE: every track ID below returned HTTP 404 on open.spotify.com (verified 2026-08-25)
// and no confident exact title+artist match could be found on Spotify search either.
// Flagged rather than guessed per data-accuracy pass instructions.
export const SA_GOSPEL_SONGS: Song[] = [
  // TODO: verify this Spotify track ID
  { id: 'sag-01', title: 'Ke Mona', artist: 'Joyous Celebration', ...track('5uWXJMRCDNSVgqrRa5BkOC'), category: 'sa-gospel', mood: 'worship' },
  // TODO: verify this Spotify track ID
  { id: 'sag-02', title: 'I Depend on You', artist: 'Benjamin Dube', ...track('3Vbe8Pq3oJLmR5EoJuFMRy'), category: 'sa-gospel', mood: 'faith' },
  // TODO: verify this Spotify track ID
  { id: 'sag-03', title: 'Ngiyabonga Baba', artist: 'Joyous Celebration', ...track('2pvLlD5DL5XYMQ9o9VJOAp'), category: 'sa-gospel', mood: 'gratitude' },
  // TODO: verify this Spotify track ID
  { id: 'sag-04', title: 'Amazing Grace (Ngomusa Wakho)', artist: 'Rebecca Malope', ...track('3X96gVqkAWmUjHBuJpVDZz'), category: 'sa-gospel', mood: 'grace' },
  // TODO: verify this Spotify track ID
  { id: 'sag-05', title: 'Lerato La Hao', artist: 'Lundi Tyamara', ...track('0nUOzQqhJhAPFXCF5JGSmZ'), category: 'sa-gospel', mood: 'worship' },
  // TODO: verify this Spotify track ID
  { id: 'sag-06', title: 'Hamba Nathi', artist: 'Joyous Celebration', ...track('2TNpq4fqCH9hcLYrYILJR3'), category: 'sa-gospel', mood: 'faith' },
  // TODO: verify this Spotify track ID
  { id: 'sag-07', title: 'Holy Ghost Power', artist: 'Benjamin Dube', ...track('3GzS9vAI60qhkpLzaWFmEm'), category: 'sa-gospel', mood: 'praise' },
  // TODO: verify this Spotify track ID
  { id: 'sag-08', title: 'Uthando Lwakhe', artist: 'Joyous Celebration', ...track('6UcBfLy3FHq3I2kVx7GwAH'), category: 'sa-gospel', mood: 'love' },
];

// ── 2. Makhadzi Favourites ───────────────────────────────────────────────────
export const MAKHADZI_SONGS: Song[] = [
  { id: 'makh-01', title: 'Ghanama (feat. Prince Benza)', artist: 'Makhadzi', ...track('1oxUva1za3I7GoKnjmkpbq'), category: 'makhadzi', mood: 'celebration' },
  { id: 'makh-02', title: 'MaGear (feat. Mr Brown)', artist: 'Makhadzi', ...track('4mAlNjGlX4BBvVw0bWRn2S'), category: 'makhadzi', mood: 'energy' },
  { id: 'makh-03', title: 'Murahu (feat. Mr Brown)', artist: 'Makhadzi', ...track('1Cxp9vIu5MosDsMlTIgRXZ'), category: 'makhadzi', mood: 'joy' },
  { id: 'makh-04', title: 'Zwivhuya (feat. Jon Delinger)', artist: 'Makhadzi', ...track('03DllG5QNE4ltzPer0k0FA'), category: 'makhadzi', mood: 'blessing' },
  { id: 'makh-05', title: 'Dear EX', artist: 'Makhadzi', ...track('0VV6L3vesmvF7TyZniVgkM'), category: 'makhadzi', mood: 'anthem' },
  { id: 'makh-06', title: 'Matorokisi (feat. DJ Call Me)', artist: 'Makhadzi', ...track('4dSjjeSrptsY2QU3RsUot1'), category: 'makhadzi', mood: 'dance' },
];

// ── 3. Top Amapiano Favourites ───────────────────────────────────────────────
export const AMAPIANO_SONGS: Song[] = [
  { id: 'ama-01', title: 'Mnike (feat. Tyler ICU & Tumelo.za)', artist: 'Tyler ICU', ...track('5tpft20jhQvRlG3O7XfwWy'), category: 'amapiano', mood: 'groove' },
  { id: 'ama-02', title: 'Adiwele (feat. Kabza De Small)', artist: 'Young Stunna', ...track('2dTQe0W5KXs6TNVV7yi2oS'), category: 'amapiano', mood: 'vibe' },
  { id: 'ama-03', title: 'Abalele (feat. Kabza De Small & DJ Maphorisa)', artist: 'Kabza De Small', ...track('2qxgejJTaZIHNSHDD22Uhl'), category: 'amapiano', mood: 'sunset' },
  { id: 'ama-04', title: 'Kurhula (feat. Kelvin Momo)', artist: 'Kelvin Momo', ...track('1EiC9mYfQSbgswqvAeEhvl'), category: 'amapiano', mood: 'private-school' },
  { id: 'ama-05', title: 'Abo Mvelo (feat. Mellow & Sleazy)', artist: 'Daliwonga', ...track('0Ek5bneviajgSzZGonWfds'), category: 'amapiano', mood: 'celebration' },
];

// ── 4. R&B & Romantic Favourites ─────────────────────────────────────────────
export const RNB_LOVE_SONGS: Song[] = [
  { id: 'rnb-01', title: 'Heartbreak Anniversary', artist: 'Giveon', ...track('2QfznFotJNZmnIEYFdzE5T'), category: 'rnb-love', mood: 'rnb' },
  { id: 'rnb-02', title: 'Snooze', artist: 'SZA', ...track('4iZ4pt7kvcaH6Yo8UoZ4s2'), category: 'rnb-love', mood: 'love' },
  { id: 'rnb-03', title: 'Best Part (feat. H.E.R.)', artist: 'Daniel Caesar', ...track('1Q7EgiMOuwDcB0PJC6AzON'), category: 'rnb-love', mood: 'home' },
  { id: 'rnb-04', title: 'All of Me', artist: 'John Legend', ...track('3U4isOIWM3VvDubwSI3y7a'), category: 'rnb-love', mood: 'letters' },
  { id: 'rnb-05', title: 'Photograph', artist: 'Ed Sheeran', ...track('1HNkqx9Ahdgi1Ixy2xkKkL'), category: 'rnb-love', mood: 'gallery' },
  { id: 'rnb-06', title: 'Perfect', artist: 'Ed Sheeran', ...track('0tgVpDi06FyKpA1z0VMD4v'), category: 'rnb-love', mood: 'home' },
  { id: 'rnb-07', title: 'Make You Feel My Love', artist: 'Adele', ...track('273QnyCvJB65rScHJ1nPZb'), category: 'rnb-love', mood: 'reasons' },
  { id: 'rnb-08', title: 'For Tonight', artist: 'Giveon', ...track('61Emqg95O9zo1GNOcyxq4Y'), category: 'rnb-love', mood: 'rnb' },
];

export const ALL_SONGS = [
  ...SA_GOSPEL_SONGS,
  ...MAKHADZI_SONGS,
  ...AMAPIANO_SONGS,
  ...RNB_LOVE_SONGS,
];

export const GALLERY_SONG = RNB_LOVE_SONGS[4]; // Photograph — Ed Sheeran

export const PLAYLISTS = {
  saGospel: {
    name: '🇿🇦 South African Gospel',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXbBH5YfEiy7g?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXbBH5YfEiy7g',
  },
  makhadzi: {
    name: '👑 Makhadzi Hits',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1EIZ7sbOne8v7k?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1EIZ7sbOne8v7k',
  },
  amapiano: {
    name: '🎹 Top Amapiano Grooves',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX5mILnBJLA26?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX5mILnBJLA26',
  },
  rnbLove: {
    name: '🍷 R&B & Love Favourites',
    embedUrl: 'https://open.spotify.com/embed/playlist/0dNg1tuQZ7sR9B4MuMmcZf?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/0dNg1tuQZ7sR9B4MuMmcZf',
  },
} as const;
