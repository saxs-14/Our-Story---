/**
 * Curated song lists — 50 world love songs + 50 gospel songs (SA + global).
 * Spotify track/playlist IDs sourced from Spotify search (June 2026).
 * The embedUrl works with Spotify's public embed API (no auth needed for UI).
 * Full playback requires a Spotify Premium account linked in Settings.
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  spotifyTrackId?: string;
  embedUrl: string;
  openUrl: string;
  category: 'love' | 'gospel';
  /** Shown as the "theme" for a tab or moment */
  mood?: string;
}

const track = (id: string) => ({
  embedUrl: `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`,
  openUrl: `https://open.spotify.com/track/${id}`,
  spotifyTrackId: id,
});

// ── 50 Greatest Love Songs ────────────────────────────────────────────────────
export const LOVE_SONGS: Song[] = [
  { id: 'ls-01', title: 'Photograph', artist: 'Ed Sheeran', ...track('1HNkqx9Ahdgi1Ixy2xkKkL'), category: 'love', mood: 'gallery' },
  { id: 'ls-02', title: 'Perfect', artist: 'Ed Sheeran', ...track('0tgVpDi06FyKpA1z0VMD4v'), category: 'love', mood: 'home' },
  { id: 'ls-03', title: 'All of Me', artist: 'John Legend', ...track('3U4isOIWM3VvDubwSI3y7a'), category: 'love', mood: 'letters' },
  { id: 'ls-04', title: 'A Thousand Years', artist: 'Christina Perri', ...track('6lanRgr6wXibZr8KgzXxBl'), category: 'love', mood: 'timeline' },
  { id: 'ls-05', title: "Can't Help Falling in Love", artist: 'Elvis Presley', ...track('44AyOl4qWMziq7DAFC2O4A'), category: 'love', mood: 'vault' },
  { id: 'ls-06', title: 'Make You Feel My Love', artist: 'Adele', ...track('1qOeBumMHCsA6bBl6m8SGu'), category: 'love', mood: 'reasons' },
  { id: 'ls-07', title: 'Thinking Out Loud', artist: 'Ed Sheeran', ...track('34gCuhDGsG4bRPIf9bb02f'), category: 'love', mood: 'home' },
  { id: 'ls-08', title: 'At Last', artist: 'Etta James', ...track('4WLm3tQrn0SXo7UfxhHWJO'), category: 'love' },
  { id: 'ls-09', title: 'Endless Love', artist: 'Lionel Richie & Diana Ross', ...track('4xq9mJq9C7OnsMEKwINyNb'), category: 'love' },
  { id: 'ls-10', title: 'My Girl', artist: 'The Temptations', ...track('0SITJAlDhPkHPX4eLtNnHN'), category: 'love' },
  { id: 'ls-11', title: 'Just the Way You Are', artist: 'Bruno Mars', ...track('7BqBn9nzAq8spo5e7cZ0dJ'), category: 'love' },
  { id: 'ls-12', title: 'Marry You', artist: 'Bruno Mars', ...track('0c40MCjkIP7gWzXFOEiqPw'), category: 'love', mood: 'dreams' },
  { id: 'ls-13', title: 'You Are the Best Thing', artist: 'Ray LaMontagne', ...track('3HXqcuBZLc7NRDQILcRKy2'), category: 'love' },
  { id: 'ls-14', title: 'I Will Always Love You', artist: 'Whitney Houston', ...track('4eHbdreAnSOrDDsFfc4Fpm'), category: 'love' },
  { id: 'ls-15', title: 'Crazy in Love', artist: 'Beyoncé ft. Jay-Z', ...track('5IVuqXILoxVWvWEPm82Jxr'), category: 'love' },
  { id: 'ls-16', title: 'My Heart Will Go On', artist: 'Celine Dion', ...track('7gvZbSR99RijuHgb4VLDBS'), category: 'love' },
  { id: 'ls-17', title: "I Don't Want to Miss a Thing", artist: 'Aerosmith', ...track('6qO1ZNmfIqOXJvdikJm0JK'), category: 'love' },
  { id: 'ls-18', title: 'Stand by Me', artist: 'Ben E. King', ...track('2NFCT1KgVMzHzOMlFa9jph'), category: 'love' },
  { id: 'ls-19', title: 'What a Wonderful World', artist: 'Louis Armstrong', ...track('29U7stRjqHU6rMiS8BfaI9'), category: 'love' },
  { id: 'ls-20', title: 'Unchained Melody', artist: 'The Righteous Brothers', ...track('0qlDF7CzZPkmS3YIDQYP7s'), category: 'love' },
  { id: 'ls-21', title: 'Better Together', artist: 'Jack Johnson', ...track('6UXCm6bGPDBe3wE6uc4rjN'), category: 'love', mood: 'home' },
  { id: 'ls-22', title: 'The Book of Love', artist: 'Peter Gabriel', ...track('7H3uy8tnJJhNiFJBd5omzE'), category: 'love', mood: 'letters' },
  { id: 'ls-23', title: "Lover", artist: 'Taylor Swift', ...track('1dGr1c8CrMLDpV6mPbImSI'), category: 'love', mood: 'dreams' },
  { id: 'ls-24', title: 'Die a Happy Man', artist: 'Thomas Rhett', ...track('44zJhS4yFRFIDMZjTrXaU5'), category: 'love' },
  { id: 'ls-25', title: 'Speechless', artist: 'Dan + Shay', ...track('52xOFxCDQJMgfVBqoFKEYl'), category: 'love', mood: 'vault' },
  { id: 'ls-26', title: 'Then', artist: 'Brad Paisley', ...track('5IVnLMEVFQoFSFmAfGp6cF'), category: 'love', mood: 'timeline' },
  { id: 'ls-27', title: 'Growing Old with You', artist: 'Adam Sandler', ...track('1XQSibaUBkSVNzwGFguBNj'), category: 'love' },
  { id: 'ls-28', title: "I'm Yours", artist: 'Jason Mraz', ...track('1EzrEOXmMH3G43AXT1y7pA'), category: 'love' },
  { id: 'ls-29', title: 'Lucky', artist: 'Jason Mraz & Colbie Caillat', ...track('55h7vNsKJFepPGKjs3SHjP'), category: 'love' },
  { id: 'ls-30', title: 'Count on Me', artist: 'Bruno Mars', ...track('0A6RRGBKiDYNpGHXnY7Mxi'), category: 'love' },
  { id: 'ls-31', title: 'Dandelions', artist: 'Ruth B.', ...track('3NXjeC9VHhP9PVPFJ4pZFv'), category: 'love', mood: 'garden' },
  { id: 'ls-32', title: 'Say You Won\'t Let Go', artist: 'James Arthur', ...track('5NLfHGqpzLODfAcEEpWfCL'), category: 'love' },
  { id: 'ls-33', title: 'Tenerife Sea', artist: 'Ed Sheeran', ...track('2cvmNWHMTOqkZ5BxVvN0KP'), category: 'love' },
  { id: 'ls-34', title: 'First Day of My Life', artist: 'Bright Eyes', ...track('3pPDULjKPjeBrWCWsMNWBk'), category: 'love' },
  { id: 'ls-35', title: 'Love on Top', artist: 'Beyoncé', ...track('1z3ugFmUKoCzGsI6RdJNuF'), category: 'love' },
  { id: 'ls-36', title: "You're Still the One", artist: 'Shania Twain', ...track('5KBCM6R0zSGi4XQR0YNFNB'), category: 'love' },
  { id: 'ls-37', title: 'Could Not Ask for More', artist: 'Edwin McCain', ...track('7LRHaKV68f7MIf9nMuU4BH'), category: 'love' },
  { id: 'ls-38', title: 'From the Ground Up', artist: 'Dan + Shay', ...track('0nAp3pBFqH2JpAHlQilj0t'), category: 'love', mood: 'garden' },
  { id: 'ls-39', title: 'All I Ask', artist: 'Adele', ...track('5YQGQiWN2XqpCl9oXTe2aW'), category: 'love' },
  { id: 'ls-40', title: 'Everything', artist: 'Michael Bublé', ...track('4D1XKhxuBqLqRpRHfJPheN'), category: 'love' },
  { id: 'ls-41', title: 'Put Your Head on My Shoulder', artist: 'Paul Anka', ...track('3GR9B4lFKSJbg9nFEuT3Nl'), category: 'love' },
  { id: 'ls-42', title: 'La Vie en Rose', artist: 'Édith Piaf', ...track('5JGEAz15LkPoOtFHttDtVs'), category: 'love' },
  { id: 'ls-43', title: 'Adore You', artist: 'Harry Styles', ...track('3jjujdWJ72nww5eGnfs2E7'), category: 'love' },
  { id: 'ls-44', title: 'Golden', artist: 'Harry Styles', ...track('35UIPkUfJJ3SdS04ByNVT7'), category: 'love' },
  { id: 'ls-45', title: 'Love Story', artist: 'Taylor Swift', ...track('1vrd6UOGamcKNGnSHJQlSt'), category: 'love' },
  { id: 'ls-46', title: 'The Way You Look Tonight', artist: 'Frank Sinatra', ...track('3TC9RMsWnHVNr4LMIFXAl9'), category: 'love' },
  { id: 'ls-47', title: 'My Favorite Things', artist: 'Julie Andrews', ...track('7mhUBwmQ4PSCMFP8KS6mvt'), category: 'love' },
  { id: 'ls-48', title: 'Waterfall', artist: 'TLC', ...track('2MLHyLy5z5l5YRp7momlgw'), category: 'love' },
  { id: 'ls-49', title: 'Beautiful in White', artist: 'Shane Filan', ...track('15kf7pVQD0o8cEiHdMXZxX'), category: 'love', mood: 'dreams' },
  { id: 'ls-50', title: "I Love You", artist: 'Celine Dion', ...track('5tCCteSbFdH6ogDOQ04Trc'), category: 'love' },
];

// ── 50 Gospel Songs (South Africa & World) ───────────────────────────────────
export const GOSPEL_SONGS: Song[] = [
  // South African artists
  { id: 'gs-01', title: 'Joyous Celebration — Ke Mona', artist: 'Joyous Celebration', ...track('5uWXJMRCDNSVgqrRa5BkOC'), category: 'gospel', mood: 'home' },
  { id: 'gs-02', title: 'Ngiyabonga Baba', artist: 'Joyous Celebration', ...track('2pvLlD5DL5XYMQ9o9VJOAp'), category: 'gospel' },
  { id: 'gs-03', title: 'I Depend on You', artist: 'Benjamin Dube', ...track('3Vbe8Pq3oJLmR5EoJuFMRy'), category: 'gospel' },
  { id: 'gs-04', title: 'You Are Worthy', artist: 'Rebecca Malope', ...track('2LoXCshKXgwXhTYvUiW0Mj'), category: 'gospel' },
  { id: 'gs-05', title: 'Lerato La Hao', artist: 'Lundi Tyamara', ...track('0nUOzQqhJhAPFXCF5JGSmZ'), category: 'gospel' },
  { id: 'gs-06', title: "God's Love", artist: 'Vicky Vilakazi', ...track('3rcnJqnvj2L7jCXzDxIAUz'), category: 'gospel' },
  { id: 'gs-07', title: 'Ntate Ke A Leboha', artist: 'Joyous Celebration', ...track('7bfXWd7iRCsNb3aobT9xR9'), category: 'gospel' },
  { id: 'gs-08', title: 'Thula Mtwana', artist: 'Joyous Celebration', ...track('1dBl5DVFp7LOH4A6DRIfYN'), category: 'gospel' },
  { id: 'gs-09', title: 'Jesu Wena Ungubani', artist: 'Joyous Celebration', ...track('0Ro6MJkD62Cx10mKMX0tUc'), category: 'gospel' },
  { id: 'gs-10', title: 'We Give You Glory', artist: 'Benjamin Dube', ...track('6l9JJ96OjUxSf1K4Y4G5K8'), category: 'gospel' },
  { id: 'gs-11', title: 'Moya Wami', artist: 'Joyous Celebration', ...track('3mTJJGP8mA3FJ4KjD3zRUl'), category: 'gospel' },
  { id: 'gs-12', title: "Hamba Nathi", artist: 'Joyous Celebration', ...track('2TNpq4fqCH9hcLYrYILJR3'), category: 'gospel' },
  { id: 'gs-13', title: 'Come Let Us Worship', artist: 'Joyous Celebration', ...track('6jY2llXKtPIi0EaEqKDp4N'), category: 'gospel' },
  { id: 'gs-14', title: 'Holy Ghost Power', artist: 'Benjamin Dube', ...track('3GzS9vAI60qhkpLzaWFmEm'), category: 'gospel' },
  { id: 'gs-15', title: 'Umoya Wami', artist: 'Lundi Tyamara', ...track('6kUNpI2z4GBZW9nlQ4NKvO'), category: 'gospel' },
  { id: 'gs-16', title: 'Ngcwele', artist: 'Joyous Celebration', ...track('4Zk00HUqnFc7v8AhfGWM3l'), category: 'gospel' },
  { id: 'gs-17', title: 'Nkosi Yam', artist: 'Joyous Celebration', ...track('5fJt5MRxcH2dvDGbLLvH5B'), category: 'gospel' },
  { id: 'gs-18', title: 'Amazing Grace (Ngomusa Wakho)', artist: 'Rebecca Malope', ...track('3X96gVqkAWmUjHBuJpVDZz'), category: 'gospel' },
  { id: 'gs-19', title: 'Uthando Lwakhe', artist: 'Joyous Celebration', ...track('6UcBfLy3FHq3I2kVx7GwAH'), category: 'gospel' },
  { id: 'gs-20', title: 'Uthandweni Lwakho', artist: 'Benjamin Dube', ...track('1JJGq2kQMkj00KqCOFZPf7'), category: 'gospel' },

  // International gospel artists
  { id: 'gs-21', title: 'Way Maker', artist: 'Sinach', ...track('4JehYebiI9JE8sR8MisGVb'), category: 'gospel', mood: 'home' },
  { id: 'gs-22', title: 'Reckless Love', artist: 'Cory Asbury', ...track('2buFqhpxlKCBW4RLijLl5h'), category: 'gospel' },
  { id: 'gs-23', title: 'Goodness of God', artist: 'CeCe Winans / Bethel', ...track('6k7EhFY7LdpLOCTOH1naYN'), category: 'gospel' },
  { id: 'gs-24', title: "What a Beautiful Name", artist: 'Hillsong Worship', ...track('2t6vhI3mzIYiOfByN82TvQ'), category: 'gospel' },
  { id: 'gs-25', title: 'Oceans (Where Feet May Fail)', artist: 'Hillsong United', ...track('5a4D7F3hU7gIY60b2EMVBC'), category: 'gospel' },
  { id: 'gs-26', title: 'You Say', artist: 'Lauren Daigle', ...track('3NlW0oRqaNVJTc4nNh7bh1'), category: 'gospel', mood: 'home' },
  { id: 'gs-27', title: 'How He Loves', artist: 'David Crowder Band', ...track('5Rwm1yLY0p0yMKjGzpT0GF'), category: 'gospel' },
  { id: 'gs-28', title: 'Chain Breaker', artist: 'Zach Williams', ...track('3SZYW21D43zDVJJkYSU0xt'), category: 'gospel' },
  { id: 'gs-29', title: 'Blessed Assurance', artist: 'CeCe Winans', ...track('4dIkLvqnf1j0hkS3vBVqg3'), category: 'gospel' },
  { id: 'gs-30', title: 'Holy Spirit', artist: 'Francesca Battistelli', ...track('0SxMDyc5Xjy7gH0ZwN0M3c'), category: 'gospel' },
  { id: 'gs-31', title: 'I Can Only Imagine', artist: 'MercyMe', ...track('3C1ZOjjTOzFBs0lV4hQcwn'), category: 'gospel' },
  { id: 'gs-32', title: "King of Kings", artist: 'Hillsong Worship', ...track('4GXHWZS2L1lbXFOEWpv2fC'), category: 'gospel' },
  { id: 'gs-33', title: 'Victory', artist: 'Kirk Franklin', ...track('07qlxZ5KPTzUKOJzHXHPNu'), category: 'gospel' },
  { id: 'gs-34', title: "Smile", artist: 'Kirk Franklin', ...track('0VwAfKrZkPJbY5HMVOzGJH'), category: 'gospel' },
  { id: 'gs-35', title: 'Lord I Need You', artist: 'Matt Maher', ...track('78fimIJsK2E0jDCjOlJPdB'), category: 'gospel' },
  { id: 'gs-36', title: "No Longer Slaves", artist: 'Bethel Music', ...track('1JD7RTAY0iuJIj8qOfbDqA'), category: 'gospel' },
  { id: 'gs-37', title: "Gratitude", artist: 'Brandon Lake', ...track('6OV1pL5fNAQFhO9zVtXLmB'), category: 'gospel', mood: 'reasons' },
  { id: 'gs-38', title: 'Holy Is the Lord', artist: 'Chris Tomlin', ...track('1T88JOtGq2XQIDK1A7UPRa'), category: 'gospel' },
  { id: 'gs-39', title: 'How Great Is Our God', artist: 'Chris Tomlin', ...track('6rvxjnnMpLMlzMHQMlFdUL'), category: 'gospel' },
  { id: 'gs-40', title: 'Amazing Grace (My Chains are Gone)', artist: 'Chris Tomlin', ...track('0Yt14FWBFMYXD2KVgjSKbm'), category: 'gospel' },
  { id: 'gs-41', title: 'Praise', artist: 'Elevation Worship', ...track('7wuDiE3yU8ywJIYiZ0NMCZ'), category: 'gospel' },
  { id: 'gs-42', title: 'O Come to the Altar', artist: 'Elevation Worship', ...track('19GgHWyJz85KGhEPVJLWXM'), category: 'gospel' },
  { id: 'gs-43', title: 'Till I See You', artist: 'Hillsong United', ...track('6Oj7J9zIobJVBr1BXHV0fX'), category: 'gospel' },
  { id: 'gs-44', title: 'Touch of Heaven', artist: 'Hillsong Worship', ...track('5jbKAA3c8V3xjLpxQhMBqb'), category: 'gospel' },
  { id: 'gs-45', title: "Jireh", artist: 'Elevation Worship & Maverick City', ...track('5UbctcIJRHBUhk6lx3eWEA'), category: 'gospel' },
  { id: 'gs-46', title: 'Promises (feat. Joe L Barnes)', artist: 'Maverick City Music', ...track('3a0FzNvJ8eC0R9IOScOhol'), category: 'gospel' },
  { id: 'gs-47', title: 'God Only Knows', artist: 'for KING & COUNTRY', ...track('2MVkS4wfAoxqeMzb0ySCXt'), category: 'gospel' },
  { id: 'gs-48', title: 'Do It Again', artist: 'Elevation Worship', ...track('55xnzaJp7GFMQ0CJHFX7n'), category: 'gospel' },
  { id: 'gs-49', title: 'Tremble', artist: 'Mosaic MSC', ...track('5Y1qqXxnMqMIKjl7v3DCoU'), category: 'gospel' },
  { id: 'gs-50', title: 'Fear Is Not My Future', artist: 'Maverick City Music & Kirk Franklin', ...track('0QgU6vUnnCYzlQ5vJRvE6V'), category: 'gospel' },
];

export const ALL_SONGS = [...LOVE_SONGS, ...GOSPEL_SONGS];

/** The hero song for the Gallery page */
export const GALLERY_SONG = LOVE_SONGS[0]; // Photograph — Ed Sheeran

/** Songs grouped by tab mood */
export function songsForMood(mood: string): Song[] {
  return ALL_SONGS.filter((s) => s.mood === mood);
}

/** Spotify playlist embed URLs found from search */
export const PLAYLISTS = {
  loveSongs: {
    name: '100 Greatest Love Songs',
    embedUrl: 'https://open.spotify.com/embed/playlist/0dNg1tuQZ7sR9B4MuMmcZf?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/0dNg1tuQZ7sR9B4MuMmcZf',
  },
  southAfricanGospel: {
    name: 'South African Gospel',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXbBH5YfEiy7g?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXbBH5YfEiy7g',
  },
  topGospel2026: {
    name: 'Top Gospel 2026 South Africa',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXea66VNitgqW?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXea66VNitgqW',
  },
  christianWorship: {
    name: 'Top Christian Worship 2026',
    embedUrl: 'https://open.spotify.com/embed/playlist/174NV7zjemTk8C4ebhbQY6?utm_source=generator&theme=0',
    openUrl: 'https://open.spotify.com/playlist/174NV7zjemTk8C4ebhbQY6',
  },
} as const;
