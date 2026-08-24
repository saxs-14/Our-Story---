# Real-Time Content Sync — Design

**Status:** Approved by user 2026-08-24. Item 4 of the six-item batch.

## Problem

"Whatever is uploaded must be seen by all of us in real time no delay."

**Root cause (found by reading `useContentStore.ts`/`firestoreSync.ts`, not guessed):**
Gallery, Letters, Dreams, and Memories all share the same architecture — writes go to
Firestore via `syncDoc`/`setDoc`, but reads only ever happen via `pullCollection()`, a
one-shot `getDocs()` call invoked exactly once, from `useAuthStore.ts`'s `login()`, right
after sign-in. There is no live listener. If partner A adds a Gallery photo while partner
B already has the app open, B sees nothing until B logs out and back in. Chat
(`useChatStore`'s `subscribe`) and profile photos (`subscribeProfilePhoto`/
`startProfileSync`) already use Firestore `onSnapshot` live listeners and do not have this
problem — this is the pattern to extend.

## Design

1. **New helper** in `src/lib/firestoreSync.ts`: `subscribeCollection<T>(col, onChange)` —
   collection-wide `onSnapshot`, same shape as the existing single-doc
   `subscribeProfilePhoto`.
2. **`useContentStore.ts`**: replace `pullFromFirestore()` (one-shot) with
   `startContentSync()` / `stopContentSync()`, mirroring `startProfileSync`/
   `stopProfileSync`. On each snapshot for a collection, merge: cloud items are
   authoritative for any id present in Firestore (so edits by either partner propagate
   live too, not just new additions), unioned with any local-only items not yet synced
   (covers the brief window between a local add and its write round-tripping, so a
   just-created item doesn't flicker away).
3. **`src/App.tsx`**: call `startContentSync()`/`stopContentSync()` in the existing
   `userId` effect (`App.tsx:94-112`), right alongside `startProfileSync()`/
   `stopProfileSync()` — same lifecycle, same location.
4. **Remove dead code**: `pullFromFirestore` (interface + implementation) from
   `useContentStore.ts`; its call site in `useAuthStore.ts`'s `login()`; `pullCollection`
   from `firestoreSync.ts` (confirmed unused elsewhere — `pullSingleDoc` stays, used by
   wallpaper/progress sync, out of scope).

## Out of scope

- `useProgressStore.ts` and `useAppStore.ts`'s own single-doc pull/sync (progress stats,
  chat wallpaper) — not "uploads" in the sense meant here, untouched.
- Remote-delete propagation: if partner A deletes a Gallery photo, it currently doesn't
  disappear live on partner B's device. Pre-existing gap, not part of "no delay on
  uploads" — explicitly deferred per user confirmation, not silently dropped.

## Testing plan

`npm run typecheck` / `npm run build` / `npm run lint` (no test framework). Live
verification needs two authenticated sessions (both partners' real accounts) to confirm
cross-device propagation — flagged to the user as needing their own two-device test after
this ships, same limitation as the notification fix in item 2.
