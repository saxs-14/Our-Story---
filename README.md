# Our Story ❤️

A private, installable digital world built around one relationship —
**Phathutshedzo Mamagau ❤️ Ayanda Silinda**. Part Apple Journal, part Spotify
Wrapped, part luxury scrapbook and time capsule. It works fully offline, installs
to the home screen, and is designed to make Ayanda feel loved every time she opens it.

> _"Every moment matters."_

---

## ✨ What's inside

- **Cinematic intro** — an Apple-keynote-style opening sequence.
- **3D crystal heart** (Three.js / R3F) — beats, glows, emits sparkles, reacts to
  touch & cursor, holds the **P ❤️ A** monogram, over a galaxy of stars.
- **Live relationship counter** — years · months · weeks · days · hours · minutes · seconds.
- **Love Weather engine** — hundreds of tasteful, generated forecasts.
- **365 daily notes** — a unique, non-repeating note for every day of the year.
- **Open When vault** — 10 sealed letters with a 3D envelope-opening animation.
- **500 reasons I love you** — searchable, categorised, favouritable, shareable.
- **50 letters** — reading mode, handwritten mode, bookmarks, reading progress.
- **Memory Timeline** — friendship → relationship → milestones → future dreams.
- **Gallery** — albums in grid / polaroid / scrapbook modes, lightbox & slideshow
  (designed art now; drop in real photos any time).
- **Living Garden** — grows with your time together; day/night, butterflies, watering,
  a hidden flower.
- **Dreams / Vision board** — 50 shared dreams to check off together.
- **Statistics** — animated counters, garden growth, badges, and a **Time Capsule**.
- **Relationship Wrapped** — a swipeable, animated story of your year.
- **Secret area** — tap the hidden heart 5× to unlock 20 private notes.
- **Achievements** that unlock live, **Celebration mode** (auto confetti on
  anniversaries / monthiversaries / birthdays), and an offline **ambient music** mode.
- **Settings** — day/dusk theme, reduced-motion, high-contrast, sound, haptics.

Everything personal you do (favourites, reading progress, unlocks, capsules) is
stored privately on the device via `localStorage`. There is **no backend**.

---

## 🧱 Tech stack

React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · Framer Motion · Three.js +
@react-three/fiber + drei · Zustand · React Router (hash) · vite-plugin-pwa (Workbox).
Fonts are self-hosted via `@fontsource` for true offline support.

---

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Build & preview production:

```bash
npm run build      # type-checks, regenerates icons, builds to /dist
npm run preview
```

Other scripts: `npm run typecheck`, `npm run lint`, `npm run icons`
(regenerates the PWA icon set from `scripts/generate-icons.mjs`).

---

## 💝 Make it yours

Open **`src/config/relationship.ts`** — names, nicknames, initials, birthdays,
the friendship & relationship start dates, the origin place (for the map), the
tagline and signature all live there. Change them and the whole app updates:
counters, intro, celebrations, generated content and share cards.

To add real **photos, voice notes, video or music**, see
[`public/media/README.md`](public/media/README.md).

---

## 📱 Install as an app (PWA)

- **Android / Chrome:** open the site → menu → _Install app_ / _Add to Home screen_.
- **iPhone / Safari:** Share → _Add to Home Screen_.
- **Desktop:** click the install icon in the address bar.

It then launches full-screen and works offline.

---

## 🌐 Deploy

### Netlify
Connect the repo (config is in [`netlify.toml`](netlify.toml)) — or drag the
`dist` folder into Netlify. Build command `npm run build`, publish `dist`.

### GitHub Pages
Push to `main`. The included workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds with the
correct base path (`/<repo>/`) and deploys. Enable **Settings → Pages → Source:
GitHub Actions** once.

For a manual Pages build locally:

```bash
VITE_BASE="/your-repo-name/" npm run build
```

### Any static host
`npm run build` → upload `dist/`. The base path defaults to `/`; override with the
`VITE_BASE` environment variable if serving from a sub-path.

---

## ♿ Accessibility & performance

- WCAG-AA tuned colour tokens, visible focus rings, semantic landmarks, `aria`
  labels on icon controls, screen-reader live regions for toasts.
- Full **reduced-motion** support (system pref + in-app toggle) and a **high-contrast** mode.
- 44px+ touch targets, safe-area aware layout, bottom nav limited to 5 with a
  discoverable "More" menu.
- Route-level code splitting, lazy-loaded Three.js, capped particle framerates,
  Workbox precaching + runtime caching for media. Built for Lighthouse 95+.

---

Made with love, for Ayanda. — Phathu
