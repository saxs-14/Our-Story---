# Image Fit & Notification Dedup — Design

**Status:** Approved by user 2026-08-24. First two items of a six-item feature/fix batch
(order: image fit → notifications → chat reply/long-press → real-time upload sync → daily
status→timeline → live location tracking). This spec covers items 1 and 2 only.

## 1. Image fit (Gallery lightbox + chat image bubbles)

**Problem:** Two real cropping bugs, found by reading the current markup:

- `Gallery.tsx`'s fullscreen lightbox wraps `ItemDisplay` (which hardcodes
  `object-cover`) in a fixed `max-h-[60vh]` box — tall/wide memory photos get chunks
  cropped off instead of shown in full when the user taps to view them big.
- `Chat.tsx`'s inline image bubble (`<img ... className="max-h-60 w-full object-cover">`)
  force-crops to a fixed 240px-tall box — portrait photos can lose heads/feet.

**Not in scope (confirmed correct as-is, user approved leaving alone):**
- Gallery grid/polaroid/scrapbook thumbnails (`object-cover` in fixed square/3:4 tiles) —
  standard, intentional treatment for a photo-grid.
- Round profile-photo avatars (`object-cover` in a circle) — standard avatar treatment.

**Fix:**
- Gallery lightbox: switch `ItemDisplay`'s image to `object-contain` when rendered inside
  the lightbox (pass a className override so grid/polaroid/scrapbook keep `object-cover`),
  and let the container size to the image (e.g. `max-h-[75vh] w-auto`) rather than forcing
  a filled box.
- Chat image bubble: replace the fixed `max-h-60 w-full object-cover` with sizing that
  respects the image's real aspect ratio (WhatsApp-style) — cap width to the bubble's max
  width and height to a reasonable ceiling (e.g. `max-h-80`), using `object-contain` or
  intrinsic sizing (`h-auto`) so the photo is never force-cropped.

**Out of scope:** any change to upload/storage, access rules, or thumbnails/avatars.

## 2. Notification dedup + tap-to-chat

**Problem:** `src/sw.ts` registers two independent handlers for the same incoming FCM
push — `onBackgroundMessage(...)` (tag `our-story-bg`) and a separate raw
`self.addEventListener('push', ...)` "fallback" (tag `our-story-push`). Different tags
mean the OS/browser treats them as two separate notifications instead of collapsing into
one; this app only ever sends FCM-shaped pushes (from `functions/index.js`'s
`onNewMessage`), so the raw-push "fallback" catches nothing real and only duplicates.
A plausible third source: the Cloud Function payload includes a top-level `notification`
field, which some browsers/Android may auto-display in addition to our own explicit
`showNotification()` calls.

**Fix (safe/incremental, approved by user):**
- Delete the redundant raw `push` event listener in `sw.ts` entirely.
- Use one shared notification `tag` constant across every `showNotification()` call tied
  to a chat message, so if the OS still auto-displays on top of our own call, same-tag
  causes a replace instead of a stack.
- Tap-to-chat navigation is already correct on every path (`notificationclick` in the SW,
  `registerPushTap`/`registerNotificationTap` on native) — no change needed there.

**Explicitly deferred (not done now):** switching the Cloud Function's FCM payload to
data-only (removing the top-level `notification` field) for guaranteed single-display.
This is the more aggressive fix but risks weakening closed-app (fully killed process)
delivery reliability on Android, which currently depends on that `notification` field for
OS-level auto-display. Only pursue this if duplicates persist after testing the safe fix
on a real rebuilt APK.

## Testing plan
- `npm run build` / `tsc --noEmit` for type safety (no device for live SW/push testing in
  this environment).
- User to rebuild + reinstall the APK and manually verify: (a) photos in Gallery lightbox
  and chat bubbles show uncropped, (b) sending one message produces exactly one system
  notification, (c) tapping it opens Chat.
