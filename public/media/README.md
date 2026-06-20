# Your real moments go here 💞

This folder is for the personal media that makes _Our Story_ truly yours.
Everything is optional — the app ships looking beautiful without it, using
designed gradient art and a generative soundscape. Drop files in and they take
over automatically.

## Photos

Put images anywhere under `public/media/` and reference them in
`src/data/gallery.ts` by adding a `src` to any photo, e.g.:

```ts
{ id: 'photo-1', album: 'dating', caption: 'Our first date', emoji: '🌹',
  src: '/media/gallery/first-date.jpg', gradient: ['#f7d9d9', '#e8d2a6', '#c9c2e8'] }
```

If `src` is present it shows the photo; if not, the elegant gradient art is used.
Use optimised `.webp`/`.jpg` (≈1200px) for fast, offline-friendly loading.

## Voice notes & video

Add `voice` / `video` paths to a vault letter in `src/data/vault.ts`:

```ts
media: { voice: '/media/voice/goodnight.mp3', video: '/media/clips/us.mp4' }
```

## Music

Give a vault letter's song a real source, or extend the ambient player:

```ts
media: { song: { title: 'Our song', artist: 'Someone', src: '/media/music/our-song.mp3' } }
```

Files in this folder are precached by the service worker, so they work offline
once the app has been opened with a connection.
