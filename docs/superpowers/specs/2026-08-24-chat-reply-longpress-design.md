# Chat Reply & Long-Press Menu — Design

**Status:** Approved by user 2026-08-24. Item 3 of the six-item batch (see
`2026-08-24-image-fit-and-notification-fix-design.md` for items 1-2, already shipped).

## Problem

User-reported symptoms, all confirmed to trace back to ONE root cause:
- Swipe-to-reply doesn't trigger reliably.
- Reply preview/send is broken.
- Long-press only shows reactions, not reply.

**Root cause (found by reading `src/pages/Chat.tsx`'s `MessageBubble`, not guessed):**
long-press-to-react and swipe-to-reply share the same pointer handlers
(`startPress`/`movePress`/`endPress`), racing a 420ms hold timer against a 10px movement
threshold to decide which gesture the user meant. On a real touchscreen (finger jitter,
imprecise gesture starts) that race frequently resolves to neither — the interaction gets
silently cancelled. The reply *data path* itself (`ReplyPreview` type, `sendMessage`/
`sendMedia`'s `replyTo` parameter, Firestore write, `m.replyTo` rendering) was checked in
`useChatStore.ts` and found correct — there is no separate "reply is broken" bug beyond
the flaky trigger.

## Design

Replace the dual-purpose gesture with a single reliable one:

1. **Remove swipe-to-reply entirely** from `MessageBubble` — the `x` motion value,
   `replyIconOpacity`, `swipeMax`, `draggingRef`, and the horizontal/vertical
   disambiguation logic in `movePress`/`endPress`. Long-press (hold ~420ms without
   moving more than a small tolerance) becomes the only gesture, eliminating the race
   condition that caused the flakiness rather than patching around it.
2. **Unified long-press action menu** (`MessageActionMenu`, replacing the
   reactions-only `ReactionPicker` popup): same emoji quick-react row as today
   (`QUICK_EMOJIS`), plus two new buttons:
   - **↩️ Reply** — sets `replyTarget` (same effect swipe used to have) and focuses the
     input.
   - **🖼️ Background** — opens the existing `WallpaperModal` (already implemented,
     already triggered from a header button — this just adds a second, more
     discoverable entry point to the same modal/state).
3. Props on `MessageBubble` change: `onSwipeReply` → `onReply` (same signature,
   `(m: ChatMessage) => void`, called from the menu instead of a drag-release), and a new
   `onBackground: () => void` prop wired to `setShowWallpaperModal(true)` at the call site.

## Out of scope

- No changes to `useChatStore.ts` (reply data path already correct).
- No changes to `WallpaperModal` itself or its existing header trigger.
- No changes to reaction storage/rendering — only how the picker is reached.

## Testing plan

`npm run typecheck` / `npm run build` / `npm run lint` (no test framework in this repo).
Live verification: user to confirm on a real touchscreen device that long-press
consistently opens the menu, Reply sets the reply preview and sends correctly, and
Background opens the wallpaper modal.
