# Chat Reply & Long-Press Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flaky swipe-to-reply gesture with a single reliable long-press action
menu offering Reply, React, and Background — fixing all three user-reported symptoms by
removing the pointer-handler race condition that caused them.

**Architecture:** All changes are within `src/pages/Chat.tsx`. `ReactionPicker` is replaced
by a new `MessageActionMenu` component; `MessageBubble`'s pointer handlers are simplified to
drop swipe/drag tracking; the call site swaps the `onSwipeReply` prop for `onReply` and adds
`onBackground`.

**Tech Stack:** React 18 + TypeScript, Framer Motion, Tailwind CSS.

## Global Constraints

- No test framework in this repo — verification is `npm run typecheck` / `npm run build` /
  `npm run lint` plus live manual verification (dev server / real device for touch gestures).
- Do not touch `useChatStore.ts` — the reply data path is already correct per the design doc.
- Do not touch `WallpaperModal` or its existing header trigger button — only add a second
  entry point to the same `showWallpaperModal` state.

---

### Task 1: Replace `ReactionPicker` with `MessageActionMenu`

**Files:**
- Modify: `src/pages/Chat.tsx:359-389` (replace `ReactionPicker` function)

**Interfaces:**
- Produces: `MessageActionMenu(props: { onReact: (emoji: string) => void; onReply: () => void; onBackground: () => void; onClose: () => void })`

- [ ] **Step 1: Read current code**

```
Read src/pages/Chat.tsx lines 355-390
```

- [ ] **Step 2: Replace the `ReactionPicker` function with `MessageActionMenu`**

Replace lines 359-389 with:

```tsx
function MessageActionMenu({
  onReact,
  onReply,
  onBackground,
  onClose,
}: {
  onReact: (emoji: string) => void;
  onReply: () => void;
  onBackground: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="glass-strong absolute -top-24 left-2 z-30 flex flex-col gap-1.5 rounded-2xl border border-rosegold-400/40 p-2 shadow-2xl backdrop-blur-xl"
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <div className="flex items-center gap-1.5 px-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              haptic('tap');
              onReact(emoji);
              onClose();
            }}
            className="tap text-lg transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t border-white/10 pt-1.5">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            onReply();
            onClose();
          }}
          className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-warmwhite hover:bg-white/10"
        >
          <span aria-hidden="true">↩️</span> Reply
        </button>
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            onBackground();
            onClose();
          }}
          className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium text-warmwhite hover:bg-white/10"
        >
          <span aria-hidden="true">🖼️</span> Background
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: will still show errors from `MessageBubble` referencing the old `ReactionPicker`
name until Task 2 is done — that's expected mid-refactor. Proceed to Task 2 before
verifying green.

- [ ] **Step 4: Commit is deferred to the end of Task 2** (these two tasks land as one
  commit since Task 1 alone doesn't compile — `ReactionPicker`'s call site is updated in
  Task 2).

---

### Task 2: Simplify `MessageBubble` to long-press-only, wire up the new menu

**Files:**
- Modify: `src/pages/Chat.tsx:515-712` (`MessageBubble` component)
- Modify: `src/pages/Chat.tsx:1054-1074` (`MessageBubble` call site)

**Interfaces:**
- Consumes: `MessageActionMenu` from Task 1.
- Produces: `MessageBubble` props change — `onSwipeReply: (m: ChatMessage) => void`
  becomes `onReply: (m: ChatMessage) => void`; new prop `onBackground: () => void` added.

- [ ] **Step 1: Read current code**

```
Read src/pages/Chat.tsx lines 515-712
```

- [ ] **Step 2: Replace the whole `MessageBubble` function**

Replace lines 515-712 (from `const REPLY_SWIPE_THRESHOLD = 64;` through the closing `}` of
`MessageBubble`) with:

```tsx
/**
 * Long-press a message to open the action menu (React / Reply / Background).
 * Previously this also handled swipe-to-reply on the same pointer handlers,
 * racing a hold-timer against a movement threshold to tell the two gestures
 * apart — on real touchscreens that race frequently resolved to neither,
 * which is why reply felt unreliable. Long-press-only removes the race
 * entirely instead of tuning its thresholds.
 */
function MessageBubble({
  m,
  isMe,
  partnerOnline,
  isSelected,
  onSelect,
  onReact,
  onReply,
  onBackground,
  onViewMedia,
}: {
  m: ChatMessage;
  isMe: boolean;
  partnerOnline: boolean;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onReact: (emoji: string) => void;
  onReply: (m: ChatMessage) => void;
  onBackground: () => void;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
}) {
  const pressRef = useRef<{ x: number; y: number; timer: number; fired: boolean } | null>(null);
  const MOVE_TOLERANCE = 10;

  const startPress = (px: number, py: number) => {
    pressRef.current = {
      x: px,
      y: py,
      fired: false,
      timer: window.setTimeout(() => {
        haptic('soft');
        onSelect(m.id);
        if (pressRef.current) pressRef.current.fired = true;
      }, 420),
    };
  };
  const movePress = (px: number, py: number) => {
    if (!pressRef.current || pressRef.current.fired) return;
    const dx = px - pressRef.current.x;
    const dy = py - pressRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  };
  const endPress = () => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onDoubleClick={() => onSelect(m.id)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startPress(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => movePress(e.clientX, e.clientY)}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          'relative max-w-[82%] px-3.5 py-2 text-sm shadow-md transition-all [touch-action:pan-y]',
          isMe
            ? 'rounded-2xl rounded-tr-xs bg-[#005c4b] text-warmwhite shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
            : 'rounded-2xl rounded-tl-xs bg-[#202c33] text-warmwhite shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
        )}
      >
        <AnimatePresence>
          {isSelected && (
            <MessageActionMenu
              onReact={onReact}
              onReply={() => onReply(m)}
              onBackground={onBackground}
              onClose={() => onSelect(null)}
            />
          )}
        </AnimatePresence>

        {m.replyTo && (
          <div
            className={cn(
              'mb-1.5 rounded-lg border-l-[3px] px-2 py-1 text-xs opacity-80',
              isMe ? 'border-emerald-300 bg-black/15' : 'border-rosegold-300 bg-black/20',
            )}
          >
            <p className="font-semibold">{m.replyTo.senderName}</p>
            <p className="truncate">
              {m.replyTo.mediaType === 'image'
                ? '📷 Photo'
                : m.replyTo.mediaType === 'video'
                ? '🎬 Video'
                : m.replyTo.mediaType === 'audio'
                ? '🎙️ Voice note'
                : m.replyTo.text}
            </p>
          </div>
        )}

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
        {m.mediaUrl && m.mediaType === 'video' && (
          <button
            type="button"
            aria-label="View video"
            onClick={() => onViewMedia(m.mediaUrl!, 'video')}
            className="tap group/video relative mb-1.5 block w-full overflow-hidden rounded-2xl border border-white/10"
          >
            <video src={m.mediaUrl} className="max-h-60 w-full object-cover" preload="metadata" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover/video:bg-black/30">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-warmwhite">▶</span>
            </span>
          </button>
        )}

        {m.mediaUrl && m.mediaType === 'audio' ? (
          <VoiceNoteBubble audioUrl={m.mediaUrl} duration={m.audioDuration} isMe={isMe} />
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
        )}

        <div className="mt-1 flex items-center justify-end gap-1 text-[0.62rem] text-white/60">
          <span>{formatTime(m.timestamp)}</span>
          {isMe && <MessageTicks read={m.read} partnerOnline={partnerOnline} pending={m.local || m.pending} />}
        </div>

        {m.reactions && Object.keys(m.reactions).length > 0 && (
          <div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 rounded-full bg-[#111b21] px-2 py-0.5 text-xs shadow-md border border-white/10">
            {Object.values(m.reactions).map((r, ri) => (
              <span key={ri}>{r}</span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

Note what was dropped versus the original: the `x`/`useMotionValue`, `replyIconOpacity`/
`useTransform`, `draggingRef`, `swipeMax`, the reply-arrow `<motion.span>` indicator, the
`animate` import usage for spring-back, and `REPLY_SWIPE_THRESHOLD`. If `animate` and
`useMotionValue`/`useTransform` are no longer used anywhere else in `Chat.tsx` after this
change, remove their now-unused imports too (check with a search across the file before
removing — `animate` in particular may still be used elsewhere for e.g. the reaction
picker's own entrance, so verify before deleting the import).

- [ ] **Step 3: Update the `MessageBubble` call site**

Read current code first:
```
Read src/pages/Chat.tsx lines 1050-1076
```
(line numbers will have shifted slightly after Task 1/Step 2's edit — search for
`onSwipeReply` to relocate it.)

Change:
```tsx
                    onSwipeReply={(target) => {
                      setReplyTarget({
                        id: target.id,
                        text: target.text,
                        senderId: target.senderId,
                        senderName: target.senderName,
                        mediaType: target.mediaType,
                      });
                      inputRef.current?.focus();
                    }}
```
to:
```tsx
                    onReply={(target) => {
                      setReplyTarget({
                        id: target.id,
                        text: target.text,
                        senderId: target.senderId,
                        senderName: target.senderName,
                        mediaType: target.mediaType,
                      });
                      inputRef.current?.focus();
                    }}
                    onBackground={() => setShowWallpaperModal(true)}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors (including no unused-import errors for anything removed in
Step 2).

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: exits 0 — this repo's `eslint` config includes
`report-unused-disable-directives --max-warnings 0`, so any now-unused import from the
swipe removal would surface here too.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Live-verify in a browser**

Start the dev server (`npm run dev`) if not already running, open Chat, long-press a
message: confirm the menu opens with emoji row + Reply + Background buttons. Tap Reply →
confirm the reply preview appears above the input and sending attaches it correctly to the
new message. Tap Background → confirm the existing wallpaper modal opens. Note: true
long-press touch reliability can only be fully confirmed on a real touchscreen device —
flag this to the user for their own device test after this ships.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Chat.tsx
git commit -m "fix: replace flaky swipe-to-reply with reliable long-press action menu"
```

---

## Post-plan verification

- [ ] `npm run lint` — exits 0.
- [ ] `npm run build` — exits 0.
