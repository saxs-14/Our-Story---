# Live Location Tracking — Design

**Status:** Approved by user 2026-08-24 (via two rounds of clarifying questions). Item 6 —
last and largest item of the six-item batch.

## Request

"Must be able to give the exact location of the person and notify when there is
movement."

## Decisions made with the user

1. **Foreground-only tracking** — location updates only while the app is open on screen.
   No Android "Allow all the time" background-location permission, no persistent
   foreground-service notification, no background-service battery drain. This app is a
   sideloaded personal APK, not Play Store-distributed, so Google's background-location
   policy review doesn't apply here regardless — but foreground-only is still the right
   call on its own merits (dramatically simpler, dramatically less battery impact, no
   native plugin dependency needed since the standard Web Geolocation API inside the
   Capacitor WebView already covers this case, same as `useLiveWeather.ts` already does).
2. **Movement notification: on meaningful movement** (>500m from the last-notified
   point), not geofenced places, not silent map-only.
3. **New dedicated page** (`/location`, added to the "More" nav grid), with an explicit,
   visible, mutual **on/off toggle** — sharing is off by default, and turning it off is
   immediately visible to the other partner (no silent/stale tracking).
4. **Coordinates + "Open in Maps" link**, not a reverse-geocoded address — zero new paid
   API, zero new API key to manage and potentially leak.

## Architecture

### Data model
New Firestore doc per person: `locations/{personId}` — `{ lat, lng, accuracy, sharing,
updatedAt, lastNotifiedLat, lastNotifiedLng, lastNotifiedAt }`. No new Firestore rules
needed: `firestore.rules` already scopes `{document=**}` to the two partner accounts via
`isPartner()`, which automatically covers this new collection.

Only the *current* position is stored (each write overwrites via `merge: true`) — there is
no location history log. This is a deliberate scope decision: the request asked for live
"exact location," not a movement trail, and not storing history means there's nothing
sensitive to leak if the Firestore project is ever compromised beyond the current moment,
which is a meaningfully smaller blast radius than an accumulating trail would be.

### Client — `src/lib/geo.ts` (new)
`haversineMeters(lat1, lng1, lat2, lng2)` and `formatDistance(meters)` — shared by both
the write-throttle logic below and the Location page's "X km apart" display.

### Client — `src/store/useLocationStore.ts` (new, mirrors `usePresenceStore.ts`'s
module-level start/stop pattern)
- `sharingOn: boolean` — persisted locally (zustand persist), the user's own toggle state.
- `myLocation` / `partnerLocation` — live state.
- `start(userId, partnerId)` — called once from `App.tsx`'s existing `userId` effect,
  alongside presence/profile/content sync. Always live-subscribes to the partner's
  `locations/{partnerId}` doc (so you can see them regardless of your own toggle); if
  `sharingOn` was already true from a previous session, resumes your own
  `navigator.geolocation.watchPosition` watch too.
- `stop()` — clears the watch and the partner subscription.
- `setSharing(userId, on)` — the toggle itself. `on: true` starts
  `watchPosition`; `on: false` stops it and writes `{ sharing: false }` to Firestore so
  the partner's UI immediately stops showing your (now stale) coordinates.
- **Write throttle**: a position callback only writes to Firestore if it's moved >50m
  from the last *written* point or 60s have elapsed since the last write — bounds both
  Firestore write cost and battery/network use during continuous foreground tracking
  (e.g. someone driving with the app open).

### Client — `src/pages/Location.tsx` (new)
- Toggle with a one-line explanation ("Updates while the app is open on your screen").
- Your status (on/off, last write time).
- Partner's status: if `sharing: true` and `updatedAt` is recent (<30 min old), shows
  coordinates, distance apart (via `haversineMeters`), and an "Open in Maps" button
  (`https://www.google.com/maps?q=lat,lng`). Otherwise shows "Not currently sharing" —
  never displays stale coordinates as if they were live.

### Server — `functions/index.js`: new `onLocationUpdate` (Firestore `onDocumentWritten`
on `locations/{personId}`)
- Bails immediately if the write is the function's *own* prior merge (before.lat/lng ===
  after.lat/lng, only lastNotified* changed) — without this guard, the function's own
  `set(..., {merge:true})` on the same document would re-trigger itself in an infinite
  loop. Caught this while designing, not left for testing to find.
- Bails if `sharing === false` or the doc was deleted.
- First write of a sharing session establishes a `lastNotifiedLat/Lng/At` baseline and
  returns without notifying (no "moved from nothing" alert on enabling).
- Subsequent writes: haversine distance from `lastNotifiedLat/Lng` >500m AND >15 min since
  `lastNotifiedAt` (cooldown, so a continuous drive doesn't spam a notification every time
  it crosses 500m — this mirrors the exact lesson from item 2's notification-dedup fix)
  → updates the baseline and sends one push via the existing `sendPush`/`isActuallyOnline`
  helpers (skips the push if the recipient's app is already open — same pattern as
  `onNewMessage`, since they'd see it live on the Location page anyway).

### Fixing notification tap routing (required for this feature to work correctly)
Found while designing: `ChatNotifier.tsx`'s native tap handlers
(`registerNotificationTap(() => navigate('/chat'))` and
`registerPushTap(() => navigate('/chat'))`) both hardcode `/chat` regardless of what the
notification was actually for — so a location-movement push would currently mis-navigate
to Chat when tapped. `registerNotificationTap` in `notify.ts` already passes the real
`route` through and just isn't being used; `registerPushTap` in `push.ts` needs to extract
`data.url` from the native `pushNotificationActionPerformed` event and pass it through too
(currently discards it). Both call sites in `ChatNotifier.tsx` change to route to whatever
was actually passed, defaulting to `/chat` when absent (preserves existing chat-tap
behavior exactly). The web/service-worker path (`sw.ts`'s `notificationclick`) already
does this correctly since item 2's fix — this closes the same gap on native.

### Native — `android/app/src/main/AndroidManifest.xml`
Add `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` (and
`ACCESS_COARSE_LOCATION`) — currently absent, so `navigator.geolocation` inside the
WebView would silently fail/deny on native Android without it. (Side finding, not fixed
here since it wasn't asked and is a separate feature: this same gap likely means
`useLiveWeather.ts`'s existing geolocation call has been silently falling back to the
Mbombela default on the native APK this whole time — worth flagging to the user
separately, not fixing unprompted as part of this item.)

### Navigation
New `LocationIcon` in `icons.tsx` (map-pin, matching the existing stroke-icon style), new
entry in `NAV_ITEMS`/`MORE_NAV` (`config/navigation.tsx`), new lazy route in `App.tsx`.

## Risk & issue analysis (explicitly requested)

- **Battery**: bounded by foreground-only tracking + write throttling (50m/60s). No
  background service, no persistent notification icon.
- **Consent/trust**: off by default, explicit mutual toggle, visible to both partners,
  turning off immediately stops showing your position (no silent lingering trail). This
  is what keeps it "checking in on each other" rather than one-sided surveillance —
  worth remembering if this is ever extended toward always-on background tracking later,
  since that mode removes the "I can see it's currently on" transparency this design
  relies on.
- **Data exposure**: only current position stored, not history — smaller blast radius if
  the Firebase project is ever compromised. Rules already correctly scoped (verified,
  no changes needed).
- **Notification spam**: bounded by the 500m + 15-min-cooldown gate, learned directly
  from item 2's triple-notification bug in this same session.
- **GPS noise false positives**: typical GPS jitter is 10-50m even stationary; 500m
  threshold is well above that, so drift alone won't trigger false "on the move" alerts.
- **Cost**: Firestore writes/reads bounded by the same throttle; no new paid API
  (coordinates + Maps link, not geocoding).
- **Future risk if extended to true background tracking**: would need
  `@capacitor/geolocation` (or similar native plugin), Android's special background
  permission with its own disclosure prompt, a persistent foreground-service
  notification, and materially more battery drain — explicitly deferred, not implied by
  this build.

## Out of scope

- No location history/trail.
- No geofencing (arrive/leave saved places) — meaningful-movement threshold instead, per
  user's choice.
- No reverse-geocoded address.
- Not fixing `useLiveWeather.ts`'s likely-latent native geolocation permission gap — flag
  to user, don't fix unprompted.

## Testing plan

`npm run typecheck` / `npm run build` / `npm run lint`. Live verification needs two
authenticated sessions plus real GPS movement (or manually editing Firestore data) to
confirm the movement-notification threshold/cooldown — flagged to the user as needing
their own two-device test, same as items 2 and 4.
