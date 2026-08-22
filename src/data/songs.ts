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
export const SA_GOSPEL_SONGS: Song[] = [
  { id: 'sag-01', title: 'Ke Mona', artist: 'Joyous Celebration', ...track('5uWXJMRCDNSVgqrRa5BkOC'), category: 'sa-gospel', mood: 'worship' },
  { id: 'sag-02', title: 'I Depend on You', artist: 'Benjamin Dube', ...track('3Vbe8Pq3oJLmR5EoJuFMRy'), category: 'sa-gospel', mood: 'faith' },
  { id: 'sag-03', title: 'Ngiyabonga Baba', artist: 'Joyous Celebration', ...track('2pvLlD5DL5XYMQ9o9VJOAp'), category: 'sa-gospel', mood: 'gratitude' },
  { id: 'sag-04', title: 'Amazing Grace (Ngomusa Wakho)', artist: 'Rebecca Malope', ...track('3X96gVqkAWmUjHBuJpVDZz'), category: 'sa-gospel', mood: 'grace' },
  { id: 'sag-05', title: 'Lerato La Hao', artist: 'Lundi Tyamara', ...track('0nUOzQqhJhAPFXCF5JGSmZ'), category: 'sa-gospel', mood: 'worship' },
  { id: 'sag-06', title: 'Hamba Nathi', artist: 'Joyous Celebration', ...track('2TNpq4fqCH9hcLYrYILJR3'), category: 'sa-gospel', mood: 'faith' },
  { id: 'sag-07', title: 'Holy Ghost Power', artist: 'Benjamin Dube', ...track('3GzS9vAI60qhkpLzaWFmEm'), category: 'sa-gospel', mood: 'praise' },
  { id: 'sag-08', title: 'Uthando Lwakhe', artist: 'Joyous Celebration', ...track('6UcBfLy3FHq3I2kVx7GwAH'), category: 'sa-gospel', mood: 'love' },
];

// ── 2. Makhadzi Favourites ───────────────────────────────────────────────────
export const MAKHADZI_SONGS: Song[] = [
  { id: 'makh-01', title: 'Ghanama (feat. Prince Benza)', artist: 'Makhadzi', ...track('0lSj0U5t7jW5lHnC7P6k7F'), category: 'makhadzi', mood: 'celebration' },
  { id: 'makh-02', title: 'MaGear (feat. Mr Brown)', artist: 'Makhadzi', ...track('3YJ9A2o8n3C3dGfB5xJ3tA'), category: 'makhadzi', mood: 'energy' },
  { id: 'makh-03', title: 'Murahu (feat. Mr Brown)', artist: 'Makhadzi', ...track('5wNqfN4YxW8xR1vL1vG7gX'), category: 'makhadzi', mood: 'joy' },
  { id: 'makh-04', title: 'Zwivhuya (feat. Jon Delinger)', artist: 'Makhadzi', ...track('4kL3p0qX7w6gG1jR2rB5hN'), category: 'makhadzi', mood: 'blessing' },
  { id: 'makh-05', title: 'Dear EX', artist: 'Makhadzi', ...track('2Xl7P6t0K5gH3nF1vJ7bQz'), category: 'makhadzi', mood: 'anthem' },
  { id: 'makh-06', title: 'Matorokisi (feat. DJ Call Me)', artist: 'Makhadzi', ...track('6vG2p3w8xL1vL7jR9rB5gN'), category: 'makhadzi', mood: 'dance' },
];

// ── 3. Top Amapiano Favourites ───────────────────────────────────────────────
export const AMAPIANO_SONGS: Song[] = [
  { id: 'ama-01', title: 'Mnike (feat. Tyler ICU & Tumelo.za)', artist: 'Tyler ICU', ...track('7A9h5M9tW5hX1vL2rB5gN'), category: 'amapiano', mood: 'groove' },
  { id: 'ama-02', title: 'Adiwele (feat. Kabza De Small)', artist: 'Young Stunna', ...track('5vJ9A2o8n3C3dGfB5xJ3tA'), category: 'amapiano', mood: 'vibe' },
  { id: 'ama-03', title: 'Abalele (feat. Kabza De Small & DJ Maphorisa)', artist: 'Kabza De Small', ...track('1HNkqx9Ahdgi1Ixy2xkKkL'), category: 'amapiano', mood: 'sunset' },
  { id: 'ama-04', title: 'Kurhula (feat. Kelvin Momo)', artist: 'Kelvin Momo', ...track('3U4isOIWM3VvDubwSI3y7a'), category: 'amapiano', mood: 'private-school' },
  { id: 'ama-05', title: 'Abo Mvelo (feat. Mellow & Sleazy)', artist: 'Daliwonga', ...track('0tgVpDi06FyKpA1z0VMD4v'), category: 'amapiano', mood: 'celebration' },
];

// ── 4. R&B & Romantic Favourites ─────────────────────────────────────────────
export const RNB_LOVE_SONGS: Song[] = [
  { id: 'rnb-01', title: 'Heartbreak Anniversary', artist: 'Giveon', ...track('3FAJ6O0Nq4ox9jdpTXvEGQ'), category: 'rnb-love', mood: 'rnb' },
  { id: 'rnb-02', title: 'Snooze', artist: 'SZA', ...track('4iZ4mst79LhnG7QXcD7cv0'), category: 'rnb-love', mood: 'love' },
  { id: 'rnb-03', title: 'Best Part (feat. H.E.R.)', artist: 'Daniel Caesar', ...track('1RMJO1F3s5p4N1YwSGBz6P'), category: 'rnb-love', mood: 'home' },
  { id: 'rnb-04', title: 'All of Me', artist: 'John Legend', ...track('3U4isOIWM3VvDubwSI3y7a'), category: 'rnb-love', mood: 'letters' },
  { id: 'rnb-05', title: 'Photograph', artist: 'Ed Sheeran', ...track('1HNkqx9Ahdgi1Ixy2xkKkL'), category: 'rnb-love', mood: 'gallery' },
  { id: 'rnb-06', title: 'Perfect', artist: 'Ed Sheeran', ...track('0tgVpDi06FyKpA1z0VMD4v'), category: 'rnb-love', mood: 'home' },
  { id: 'rnb-07', title: 'Make You Feel My Love', artist: 'Adele', ...track('1qOeBumMHCsA6bBl6m8SGu'), category: 'rnb-love', mood: 'reasons' },
  { id: 'rnb-08', title: 'For Tonight', artist: 'Giveon', ...track('6re33p1P9x4qY2xX1wB5gN'), category: 'rnb-love', mood: 'rnb' },
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
    embedUrl: 'https://open.spotify.com/embed/artist/5c4M6h5e0N1c5eW7g8b9gN?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/artist/5c4M6h5e0N1c5eW7g8b9gN',
  },
  amapiano: {
    name: '🎹 Top Amapiano Grooves',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX5cZuTNLX4Ac?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX5cZuTNLX4Ac',
  },
  rnbLove: {
    name: '🍷 R&B & Love Favourites',
    embedUrl: 'https://open.spotify.com/embed/playlist/0dNg1tuQZ7sR9B4MuMmcZf?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/0dNg1tuQZ7sR9B4MuMmcZf',
  },
} as const;
