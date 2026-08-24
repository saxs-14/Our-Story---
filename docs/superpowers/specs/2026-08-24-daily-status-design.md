# Daily Status → Timeline — Design

**Status:** Approved by user 2026-08-24. Item 5 of the six-item batch.

## Request

"Add a feature — daily status which posts what one did that exact day and how they feel,
and automatically it must go to timeline."

## Design

Timeline already has everything needed except the entry point: `useContentStore`'s
`addMemory({authorId, date, title, description, emoji, mediaIds})` writes a `UserMemory`
that Timeline renders immediately (and, since item 4, syncs live to the other partner too)
— no new collection, no new Firestore rules, no new Timeline rendering code needed.
"Daily status" is a lightweight, focused composer built on top of that existing path,
not a new content type.

- **Placement:** a new "How was your day?" `GlassCard` on the Home screen (between the
  Compliment chip and Quick Links sections, `Home.tsx` around line 210), since a daily
  habitual prompt is most effective where it's seen every time the app opens — consistent
  with the "note for today" card already living on Home.
- **Fields:** a short text input ("What did you do today?") + a dedicated mood picker
  (NOT the existing romantic-occasion emoji set, which doesn't answer "how do you feel"):
  😊 Happy, 🥰 Loved, 😌 Peaceful, 🥱 Tired, 😢 Sad, 😤 Stressed, 🙏 Grateful, 🤩 Excited.
- **Submit:** calls `addMemory({ authorId: userId, date: today, title: <mood label>,
  description: <what-I-did text>, emoji: <mood emoji>, mediaIds: [] })`. Renders on
  Timeline exactly like any other moment card — no new visual variant, no dedup/rate
  limiting on multiple posts per day (not requested, and timezone edge cases would add
  fragile complexity for no asked-for benefit).
- **No media attachment** on this composer (text + mood only) — the full "Add a Moment"
  composer already covers photo/video moments; this stays focused on the quick daily
  check-in as described.

## Out of scope

- No new Firestore collection/rules — reuses `memories`.
- No feed/history view of past statuses on Home — Timeline is already that view.
- No "already posted today" restriction.

## Testing plan

`npm run typecheck` / `npm run build` / `npm run lint`. Live verification: post a status,
confirm it appears on Timeline with the chosen mood emoji and text.
