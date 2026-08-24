# Image Fit & Notification Dedup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two real bugs found by reading the code: (1) Gallery lightbox and chat image
bubbles crop photos instead of showing them whole, (2) one chat message produces multiple
system notifications because `sw.ts` has two independent handlers both displaying it.

**Architecture:** Both are small, self-contained diffs in existing files — no new files,
no store/schema changes, no dependency changes. Item 1 touches `Gallery.tsx` and
`Chat.tsx` (pure JSX/className changes). Item 2 touches `sw.ts` only (delete a redundant
event listener, unify a notification tag constant).

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Workbox service worker
(`vite-plugin-pwa` injectManifest), Firebase Cloud Messaging.

## Global Constraints

- Repo has no test framework installed (no jest/vitest/testing-library in
  `package.json`) — verification is `npm run typecheck`, `npm run lint`, `npm run build`,
  plus live manual verification in a browser (Gallery/Chat) or on a rebuilt APK
  (notifications), matching this project's existing established pattern (see
  `TECHNICAL_DOCUMENTATION.md` §5 and prior session memory — this codebase live-verifies
  UI/gesture changes rather than writing unit tests).
- Do not touch chat video bubbles, Gallery grid/polaroid/scrapbook thumbnails, or profile
  avatars — confirmed correct as `object-cover` and explicitly out of scope per the
  approved design (`docs/superpowers/specs/2026-08-24-image-fit-and-notification-fix-design.md`).
- Do not change the Cloud Function's FCM payload shape (`functions/index.js`) — that's the
  deferred "nuclear" fix, not part of this plan.

---

### Task 1: Gallery lightbox shows full (uncropped) photos

**Files:**
- Modify: `src/pages/Gallery.tsx:114-134` (`ItemDisplay` component)
- Modify: `src/pages/Gallery.tsx:383-385` (lightbox usage of `ItemDisplay`)

**Interfaces:**
- Produces: `ItemDisplay(props: { item: GalleryItem; className?: string; fit?: 'cover' | 'contain' })` — `fit` defaults to `'cover'` (preserves current behavior for grid/polaroid/scrapbook call sites, which pass no `fit` prop and are unaffected).

- [ ] **Step 1: Add a `fit` prop to `ItemDisplay` so grid/polaroid/scrapbook keep `object-cover` and only the lightbox switches to `object-contain`**

Read current code first:
```
Read src/pages/Gallery.tsx lines 114-134
```

Replace the `ItemDisplay` function (lines 114-134) with:

```tsx
function ItemDisplay({
  item,
  className,
  fit = 'cover',
}: {
  item: GalleryItem;
  className?: string;
  fit?: 'cover' | 'contain';
}) {
  const url = useMediaUrl(item.mediaId);
  const finalSrc = item.mediaUrl || url;

  if (!finalSrc) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-rosegold-900/30', className)}>
        <span className="text-2xl">🌹</span>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={item.caption}
      loading="lazy"
      className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover', className)}
    />
  );
}
```

Note: `fit` is applied as its own single class (`object-contain` XOR `object-cover`), not
appended alongside a hardcoded `object-cover` — Tailwind's generated stylesheet order (not
JSX prop order) decides which same-specificity utility wins, so two present-at-once
`object-*` classes would be unreliable. This way exactly one is ever emitted.

- [ ] **Step 2: Pass `fit="contain"` at the lightbox call site only**

Read current code first:
```
Read src/pages/Gallery.tsx lines 376-389
```

Change line 384 from:
```tsx
              <div className="max-h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl">
                <ItemDisplay item={list[index]} />
              </div>
```
to:
```tsx
              <div className="max-h-[60vh] w-full overflow-hidden rounded-3xl shadow-2xl">
                <ItemDisplay item={list[index]} fit="contain" />
              </div>
```

Leave the three thumbnail call sites (`mode === 'polaroid'`, `mode === 'grid'`,
`mode === 'scrapbook'`) untouched — they pass no `fit` prop, so they keep `object-cover`
via the default.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 4: Live-verify in a browser**

Start the dev server (`npm run dev`), open Gallery, add or use an existing non-square
photo, tap it to open the lightbox, and confirm the full photo is visible (letterboxed if
needed) rather than cropped. Then check grid/polaroid/scrapbook thumbnails still crop-fill
as before (unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Gallery.tsx
git commit -m "fix: Gallery lightbox shows full photo instead of cropping to fill"
```

---

### Task 2: Chat image bubbles size to the photo's real aspect ratio

**Files:**
- Modify: `src/pages/Chat.tsx:662-671`

**Interfaces:**
- None — self-contained JSX/className change, no new props or exported symbols.

- [ ] **Step 1: Read current code**

```
Read src/pages/Chat.tsx lines 660-672
```

- [ ] **Step 2: Replace the fixed-crop image bubble with an aspect-ratio-respecting one**

Change:
```tsx
        {m.mediaUrl && m.mediaType === 'image' && (
          <button
            type="button"
            aria-label="View image"
            onClick={() => onViewMedia(m.mediaUrl!, 'image')}
            className="tap mb-1.5 block w-full overflow-hidden rounded-2xl border border-white/10"
          >
            <img src={m.mediaUrl} alt="Attachment" className="max-h-60 w-full object-cover" loading="lazy" />
          </button>
        )}
```
to:
```tsx
        {m.mediaUrl && m.mediaType === 'image' && (
          <button
            type="button"
            aria-label="View image"
            onClick={() => onViewMedia(m.mediaUrl!, 'image')}
            className="tap mb-1.5 inline-block max-w-full overflow-hidden rounded-2xl border border-white/10"
          >
            <img
              src={m.mediaUrl}
              alt="Attachment"
              className="block h-auto max-h-80 w-auto max-w-full object-contain"
              loading="lazy"
            />
          </button>
        )}
```

This drops the forced `w-full`/fixed `max-h-60`/`object-cover` crop in favor of letting
the button and image size themselves to the photo's real proportions, capped at 320px tall
(`max-h-80`) and the bubble's available width (`max-w-full`) — matches the WhatsApp-style
variable-size photo bubble the design calls for. The video bubble immediately below
(`m.mediaType === 'video'`) is untouched — out of scope.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 4: Live-verify in a browser**

Open Chat, send/view a portrait-orientation photo and a landscape one. Confirm both render
at their natural proportions (no forced square/240px crop) and still open the existing
fullscreen media viewer on tap (already `object-contain` there — Task 1/2 don't touch it).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Chat.tsx
git commit -m "fix: chat image bubbles size to photo aspect ratio instead of force-cropping"
```

---

### Task 3: Remove duplicate notification display in the service worker

**Files:**
- Modify: `src/sw.ts:46-114`

**Interfaces:**
- Produces: a single shared string constant `CHAT_NOTIFICATION_TAG = 'our-story-chat'` used
  by the one remaining `showNotification()` call for chat pushes in this file.

- [ ] **Step 1: Read current code**

```
Read src/sw.ts lines 46-127
```

- [ ] **Step 2: Delete the redundant raw `push` event listener and unify the tag**

Replace lines 46-114 (from the `// ── Firebase Cloud Messaging` comment through the end
of the `self.addEventListener('push', ...)` block) with:

```ts
// ── Firebase Cloud Messaging — background push (app closed / backgrounded) ──
// Config is public (client-side identifiers, not secrets) and safe to embed
// directly since a service worker can't read import.meta.env at runtime the
// way the main app does, but Vite's build still statically replaces these
// at build time same as any other module, so this stays in sync with .env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Single shared tag for every chat-push notification shown by this service
// worker. Same tag means the OS/browser replaces an existing shown
// notification instead of stacking a second one alongside it, which is the
// safety net if the platform's own auto-display (triggered by the FCM
// payload's `notification` field) fires in addition to this explicit call.
const CHAT_NOTIFICATION_TAG = 'our-story-chat';

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // This is the ONLY push-display path in this service worker. A previous
  // version also had a raw `self.addEventListener('push', ...)` "fallback"
  // handler that showed a second notification for the same push (different
  // tag, so it didn't replace this one — it stacked). This app only ever
  // sends FCM-shaped pushes from functions/index.js's onNewMessage, which
  // onBackgroundMessage already fully covers, so the fallback caught
  // nothing real and only duplicated. Do not re-add a second listener here.
  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title || (payload.data?.title as string) || 'Our Story ❤️';
    const body = payload.notification?.body || (payload.data?.body as string) || 'New message from your partner';
    void self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: CHAT_NOTIFICATION_TAG,
      renotify: true,
      data: payload.data || { url: '/chat' },
    } as NotificationOptions & { vibrate?: number[] });
  });
}
```

(The `notificationclick` listener further down, lines 116-126 in the original file, is
unchanged — it already reads `event.notification.data?.url` and works with any tag.)

- [ ] **Step 3: Typecheck the service worker**

Run: `npm run typecheck`
Expected: exits 0, no errors (this also runs `tsc -p tsconfig.sw.json --noEmit`, which
covers `sw.ts`).

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: exits 0 — confirms `vite-plugin-pwa`'s injectManifest step still picks up the
edited `sw.ts` without errors.

- [ ] **Step 5: Commit**

```bash
git add src/sw.ts
git commit -m "fix: remove duplicate push notification handler causing multiple alerts per message"
```

- [ ] **Step 6: Note remaining manual verification for the user**

This cannot be live-verified in this environment (no real device receiving a real FCM
push). After this lands, the user needs to rebuild + reinstall the APK and confirm: one
chat message → exactly one system notification → tapping it opens Chat. If duplicates
still occur after this fix, the next-level fix (switching the Cloud Function payload to
data-only, deferred per the design doc) should be revisited.

---

## Post-plan verification (all tasks)

- [ ] Run `npm run lint` — expected: exits 0, no new warnings introduced by these changes.
- [ ] Run `npm run build` — expected: exits 0 (already run in Task 3, but re-run once all
  three tasks are committed to confirm nothing regressed cumulatively).
