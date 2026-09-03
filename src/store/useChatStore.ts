/**
 * Real-time WhatsApp-style chat via Firebase Firestore.
 * Works offline (IndexedDB persistence) and syncs seamlessly when online.
 * Supports text, images, videos, voice notes, audio messages, typing indicators, and reactions.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTask,
} from 'firebase/storage';
import { db, storage, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';
import { partnerOf } from '@/store/useAuthStore';
import { saveMedia, getMedia, getMediaURL, type MediaRecord } from '@/lib/idb';

export interface ReplyPreview {
  id: string;
  text: string;
  senderId: PersonId;
  senderName: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: PersonId;
  senderName: string;
  timestamp: number; // ms epoch
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  audioDuration?: number; // seconds for voice notes
  /** Server-transcoded AAC fallback for voice notes recorded in a format the
   *  original mediaUrl's browser can't play (e.g. Safari can't decode the
   *  WebM/Opus another browser recorded) — filled in a few seconds after
   *  send by onVoiceNoteUploaded in functions/index.js, not present at
   *  first. See VoiceNoteBubble's onError fallback. */
  audioUrlAac?: string;
  reactions?: Record<string, string>; // e.g. { 'her': '❤️', 'him': '🔥' }
  read: boolean;
  replyTo?: ReplyPreview;
  isCallEvent?: boolean; // missed/completed call summary — rendered as a centered pill, not a bubble
  local?: boolean; // optimistic echo — not a real Firestore doc yet
  pending?: boolean; // real Firestore doc, but not yet acknowledged by the server (offline/in-flight)
  /** The real Firestore write failed (not just offline-queued — a genuine
   *  rejection, e.g. a stale auth session or a rules error). Previously
   *  these were left indistinguishable from "still sending" forever, with
   *  no way to know they'd failed or to resend. See retryFailedMessage. */
  failed?: boolean;
  /** IndexedDB id of a media message's locally-saved file. Set for every
   *  media message from the moment it's picked/recorded (before any upload
   *  attempt), so the photo/video/voice note is visible immediately even
   *  fully offline, and so a queued or failed upload can be retried later
   *  by re-reading the actual bytes from IndexedDB — the original File/Blob
   *  object itself doesn't survive a page reload, only this id does (it's
   *  part of the persisted messages array). */
  localMediaId?: string;
  /** A media message saved locally but not yet uploaded because the upload
   *  attempt hit a network-shaped failure — distinct from `failed` (a real,
   *  non-network rejection needing a manual retry tap). Retried
   *  automatically on reconnect; see retryQueuedMedia. */
  mediaQueued?: boolean;
}

export type PartnerActivity = 'typing' | 'recording' | null;

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  uploading: boolean;
  uploadProgress: number;
  /** Set when a media send genuinely fails (upload or the message write) —
   *  cleared at the start of the next attempt. null when there's nothing
   *  to show. See sendMedia; surfaced in Chat.tsx as a dismissible banner. */
  mediaError: string | null;
  partnerActivity: PartnerActivity;

  /** Subscribe to Firestore messages & typing indicators */
  subscribe: (currentUserId: PersonId) => Unsubscribe | null;
  /** Send a text message */
  sendMessage: (
    text: string,
    senderId: PersonId,
    senderName: string,
    replyTo?: ReplyPreview,
  ) => Promise<void>;
  /** Upload media (photo / video / voice note) + send message */
  sendMedia: (
    file: Blob | File,
    senderId: PersonId,
    senderName: string,
    caption?: string,
    audioDuration?: number,
    replyTo?: ReplyPreview,
  ) => Promise<void>;
  /** Re-attempt a message previously marked failed=true — removes the
   *  failed stub and resends it as a fresh optimistic message. */
  retryFailedMessage: (id: string) => Promise<void>;
  /** Re-attempt every mediaQueued=true message (saved locally, waiting for
   *  connectivity). Called automatically on reconnect and on chat mount —
   *  not normally something UI code needs to call directly. */
  retryQueuedMedia: () => void;
  clearMediaError: () => void;
  /** Add reaction to a message */
  reactToMessage: (messageId: string, userId: PersonId, emoji: string) => Promise<void>;
  /** Update typing/recording activity status in Firestore */
  setActivity: (userId: PersonId, activity: PartnerActivity) => void;
  /** Mark all messages as read */
  markRead: (currentUserId: PersonId) => void;
  clearUnread: () => void;
}

const MESSAGES_COLLECTION = 'messages';
const TYPING_COLLECTION = 'typing';
const MESSAGES_LIMIT = 250;

/**
 * Firestore rejects any write containing an explicit `undefined` field
 * value (throws client-side, before the write even reaches the network) —
 * `ReplyPreview.mediaType` is optional, so replying to a plain text message
 * (no mediaType at all) put a literal `undefined` into replyTo.mediaType,
 * making the send fail instantly and every retry fail identically forever,
 * since retryFailedMessage resends the exact same replyTo object. Rebuilding
 * the field explicitly here guarantees no property is ever undefined,
 * regardless of what shape the caller's ReplyPreview happens to have.
 */
function sanitizeReplyTo(replyTo: ReplyPreview | undefined | null) {
  if (!replyTo) return null;
  return {
    id: replyTo.id,
    text: replyTo.text,
    senderId: replyTo.senderId,
    senderName: replyTo.senderName,
    mediaType: replyTo.mediaType ?? null,
  };
}

let typingTimeout: number | null = null;

type SetChatState = (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void;

/** IDs of messages currently being retried — guards against a second
 *  concurrent retry attempt for the same message (e.g. the 'online' event
 *  and a fresh subscribe() call both firing around the same moment). */
const mediaRetriesInFlight = new Set<string>();

/**
 * Firebase Storage has no automatic offline queue the way Firestore does —
 * uploadBytesResumable() genuinely fails with no network, it doesn't defer
 * itself. This decides whether that failure should be queued for automatic
 * retry (network-shaped: no connection, a timeout, an unknown transient
 * error) versus shown as a real failure needing the user's attention
 * (a small, well-known set of non-network Storage error codes). Defaults to
 * "retry" for anything not explicitly recognized as non-network — an
 * unexpected error is safer to queue-and-retry than to dead-end the user on
 * with a message they can't act on.
 */
function isNetworkLikeStorageError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  if (!code) return true;
  return !['storage/unauthorized', 'storage/unauthenticated', 'storage/invalid-argument'].includes(code);
}

/**
 * Shared upload + Firestore-write logic used by the initial sendMedia
 * attempt, retryQueuedMedia (automatic, on reconnect), and
 * retryFailedMessage (manual tap) for media messages — one code path so all
 * three stay in sync rather than three copies drifting apart.
 */
async function performMediaUpload(
  set: SetChatState,
  tmpId: string,
  rec: MediaRecord,
  senderId: PersonId,
  senderName: string,
  caption: string,
  audioDuration: number | undefined,
  replyTo: ReplyPreview | undefined,
): Promise<void> {
  if (!FIREBASE_CONFIGURED || !storage || !db) return;
  try {
    const path = `chat/${senderId}/${Date.now()}_${rec.name}`;
    const sRef = ref(storage, path);
    const mediaType = rec.kind;

    // Voice notes only: pre-generate this message's Firestore doc id and
    // tag the Storage upload with it — see onVoiceNoteUploaded in
    // functions/index.js, unchanged from the original single-attempt flow.
    const messageRef = mediaType === 'audio' ? doc(collection(db, MESSAGES_COLLECTION)) : null;
    const task: UploadTask = uploadBytesResumable(
      sRef,
      rec.blob,
      messageRef ? { customMetadata: { messageId: messageRef.id } } : undefined,
    );

    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          set({ uploadProgress: pct });
        },
        reject,
        resolve,
      );
    });

    const mediaUrl = await getDownloadURL(sRef);
    const payload = {
      text: caption,
      senderId,
      senderName,
      mediaUrl,
      mediaType,
      audioDuration: audioDuration || null,
      read: false,
      replyTo: sanitizeReplyTo(replyTo),
      timestamp: serverTimestamp(),
    };
    if (messageRef) {
      await setDoc(messageRef, payload, { merge: true });
    } else {
      await addDoc(collection(db, MESSAGES_COLLECTION), payload);
    }
    set((s) => ({ messages: s.messages.filter((m) => m.id !== tmpId), uploading: false, uploadProgress: 0 }));
  } catch (err) {
    if (isNetworkLikeStorageError(err)) {
      // Keep the local preview visible, tagged as queued — retryQueuedMedia
      // will pick this up automatically once the app detects it's online.
      set((s) => ({
        messages: s.messages.map((m) => (m.id === tmpId ? { ...m, mediaQueued: true, local: false } : m)),
        uploading: false,
        uploadProgress: 0,
      }));
    } else {
      console.error('sendMedia failed', err);
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === tmpId ? { ...m, mediaQueued: false, local: false, failed: true } : m,
        ),
        uploading: false,
        uploadProgress: 0,
        mediaError: "Couldn't send — check your connection and try again.",
      }));
    }
  }
}

/** Writes a call-summary system message (missed or completed) into the chat, WhatsApp-style. */
export async function logCallEvent(
  callerId: PersonId,
  callerName: string,
  callType: 'voice' | 'video',
  outcome: 'missed' | 'completed',
  durationSeconds = 0,
): Promise<void> {
  if (!FIREBASE_CONFIGURED || !db) return;
  const icon = callType === 'video' ? '📹' : '📞';
  const label = callType === 'video' ? 'Video call' : 'Voice call';
  const text =
    outcome === 'missed'
      ? `${icon} Missed ${label.toLowerCase()}`
      : `${icon} ${label} · ${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`;

  await addDoc(collection(db, MESSAGES_COLLECTION), {
    text,
    senderId: callerId,
    senderName: callerName,
    read: false,
    isCallEvent: true,
    timestamp: serverTimestamp(),
  }).catch(() => {});
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      unreadCount: 0,
      uploading: false,
      uploadProgress: 0,
      mediaError: null,
      partnerActivity: null,

      subscribe: (currentUserId) => {
        if (!FIREBASE_CONFIGURED || !db) return null;

        // Catches anything left mediaQueued from a previous session (app
        // was closed while offline, reopened once back online — the
        // 'online' listener below only fires for a transition that happens
        // while the app is already running).
        get().retryQueuedMedia();

        const partnerId = partnerOf(currentUserId);

        // 1. Message listener
        const q = query(
          collection(db, MESSAGES_COLLECTION),
          orderBy('timestamp', 'asc'),
          limit(MESSAGES_LIMIT),
        );

        // includeMetadataChanges so a write's hasPendingWrites flag flipping
        // from true -> false (local cache -> actually acknowledged by the
        // server) re-fires this listener even though the document's own
        // fields didn't change — that transition is exactly what "really
        // sent" means, and it's Firestore's own signal for it rather than a
        // guess based on how long addDoc() took to resolve (which, with
        // offline persistence enabled, can resolve from the local cache
        // alone and not actually reflect server delivery).
        const unsubMessages = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
          const msgs: ChatMessage[] = snapshot.docs.map((d) => {
            const data = d.data();
            const ts = data.timestamp as Timestamp | null;
            return {
              id: d.id,
              text: data.text ?? '',
              senderId: data.senderId as PersonId,
              senderName: data.senderName ?? '',
              timestamp: ts ? ts.toMillis() : Date.now(),
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType,
              audioDuration: data.audioDuration,
              audioUrlAac: data.audioUrlAac ?? undefined,
              reactions: data.reactions ?? {},
              read: data.read ?? false,
              replyTo: data.replyTo ?? undefined,
              isCallEvent: data.isCallEvent ?? false,
              pending: d.metadata.hasPendingWrites,
            };
          });

          const prev = get().messages;
          const newFromPartner = msgs.filter(
            (m) =>
              m.senderId !== currentUserId &&
              !m.read &&
              !prev.find((p) => p.id === m.id && p.read),
          );

          set({ messages: msgs, unreadCount: newFromPartner.length });
        });

        // 2. Typing/recording activity listener
        const typingDocRef = doc(db, TYPING_COLLECTION, partnerId);
        const unsubTyping = onSnapshot(typingDocRef, (snap) => {
          const data = snap.data();
          const fresh = Date.now() - (data?.updatedAt || 0) < 5000;
          const activity: PartnerActivity = fresh ? (data?.activity ?? null) : null;
          set({ partnerActivity: activity });
        });

        return () => {
          unsubMessages();
          unsubTyping();
        };
      },

      sendMessage: async (text, senderId, senderName, replyTo) => {
        if (!text.trim()) return;

        // Optimistic update
        const tmpId = `local-${Date.now()}`;
        const optimistic: ChatMessage = {
          id: tmpId,
          text,
          senderId,
          senderName,
          timestamp: Date.now(),
          read: false,
          replyTo,
          local: true,
        };
        set((s) => ({ messages: [...s.messages, optimistic] }));

        if (FIREBASE_CONFIGURED && db) {
          try {
            await addDoc(collection(db, MESSAGES_COLLECTION), {
              text,
              senderId,
              senderName,
              read: false,
              replyTo: sanitizeReplyTo(replyTo),
              timestamp: serverTimestamp(),
            });
            set((s) => ({ messages: s.messages.filter((m) => m.id !== tmpId) }));
          } catch {
            // A genuinely offline write resolves fine from Firestore's own
            // IndexedDB cache (tracked via the pending/hasPendingWrites flag
            // in the subscribe() listener above) and never reaches this
            // catch at all — this only fires for a real, fast rejection
            // (stale auth session, a rules error, quota). Previously this
            // left the optimistic message indistinguishable from "still
            // sending" forever, with no way to know it failed or to resend
            // it — mark it failed instead so the UI can show that and offer
            // a retry (see retryFailedMessage below).
            set((s) => ({
              messages: s.messages.map((m) => (m.id === tmpId ? { ...m, local: false, failed: true } : m)),
            }));
          }
        }
      },

      retryFailedMessage: async (id) => {
        const msg = get().messages.find((m) => m.id === id);
        if (!msg || !msg.failed) return;
        if (msg.localMediaId) {
          // Media message: re-fetch the actual bytes from IndexedDB (the
          // original File/Blob can't survive a reload) and retry the same
          // upload+write path a fresh send would use.
          const mediaId = msg.localMediaId;
          set((s) => ({
            messages: s.messages.map((m) => (m.id === id ? { ...m, failed: false, local: true } : m)),
          }));
          const rec = await getMedia(mediaId);
          if (!rec) {
            set((s) => ({
              messages: s.messages.map((m) => (m.id === id ? { ...m, failed: true, local: false } : m)),
            }));
            return;
          }
          await performMediaUpload(set, id, rec, msg.senderId, msg.senderName, msg.text, msg.audioDuration, msg.replyTo);
          return;
        }
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
        await get().sendMessage(msg.text, msg.senderId, msg.senderName, msg.replyTo);
      },

      retryQueuedMedia: () => {
        const queued = get().messages.filter((m) => m.mediaQueued && m.localMediaId);
        for (const m of queued) {
          if (mediaRetriesInFlight.has(m.id)) continue;
          mediaRetriesInFlight.add(m.id);
          void (async () => {
            try {
              const rec = await getMedia(m.localMediaId!);
              if (!rec) {
                // The locally-saved blob is gone (e.g. browser storage was
                // cleared) — nothing left to retry with.
                set((s) => ({
                  messages: s.messages.map((msg) =>
                    msg.id === m.id ? { ...msg, mediaQueued: false, local: false, failed: true } : msg,
                  ),
                }));
                return;
              }
              await performMediaUpload(set, m.id, rec, m.senderId, m.senderName, m.text, m.audioDuration, m.replyTo);
            } finally {
              mediaRetriesInFlight.delete(m.id);
            }
          })();
        }
      },

      clearMediaError: () => set({ mediaError: null }),

      sendMedia: async (file, senderId, senderName, caption = '', audioDuration, replyTo) => {
        if (!FIREBASE_CONFIGURED || !storage || !db) return;

        set({ uploading: true, uploadProgress: 0, mediaError: null });

        // Saved locally FIRST, unconditionally — this is what makes the
        // photo/video/voice note visible immediately even with zero
        // connectivity, and gives retryQueuedMedia/retryFailedMessage real
        // bytes to work with later (the File object itself won't survive a
        // page reload, only this IndexedDB id does).
        //
        // A voice-note Blob has no .name/extension of its own — derived from
        // the real mimetype subtype rather than hardcoded 'webm', since
        // Safari actually records audio/mp4 regardless of what you ask for
        // (see Chat.tsx's startRecording).
        const ext = file.type.includes('audio')
          ? file.type.split('/')[1]?.split(';')[0] || 'webm'
          : file.type.includes('video')
          ? 'mp4'
          : 'jpg';
        const filename = (file as File).name || `voice-note-${Date.now()}.${ext}`;
        const rec = await saveMedia(file, filename);
        const localUrl = await getMediaURL(rec.id);
        const tmpId = `local-${Date.now()}`;
        const optimistic: ChatMessage = {
          id: tmpId,
          text: caption,
          senderId,
          senderName,
          timestamp: Date.now(),
          mediaUrl: localUrl || undefined,
          mediaType: rec.kind,
          audioDuration,
          read: false,
          replyTo,
          local: true,
          localMediaId: rec.id,
        };
        set((s) => ({ messages: [...s.messages, optimistic] }));

        await performMediaUpload(set, tmpId, rec, senderId, senderName, caption, audioDuration, replyTo);
      },

      reactToMessage: async (messageId, userId, emoji) => {
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = { ...(m.reactions || {}) };
            if (reactions[userId] === emoji) {
              delete reactions[userId];
            } else {
              reactions[userId] = emoji;
            }
            return { ...m, reactions };
          }),
        }));

        if (FIREBASE_CONFIGURED && db) {
          const docRef = doc(db, MESSAGES_COLLECTION, messageId);
          const currentMsg = get().messages.find((m) => m.id === messageId);
          if (currentMsg) {
            await updateDoc(docRef, { reactions: currentMsg.reactions }).catch(() => {});
          }
        }
      },

      setActivity: (userId, activity) => {
        if (!FIREBASE_CONFIGURED || !db) return;

        if (typingTimeout) clearTimeout(typingTimeout);

        const typingDocRef = doc(db, TYPING_COLLECTION, userId);
        void setDoc(typingDocRef, {
          activity,
          updatedAt: Date.now(),
        });

        if (activity) {
          typingTimeout = window.setTimeout(() => {
            void setDoc(typingDocRef, { activity: null, updatedAt: Date.now() });
          }, 3500);
        }
      },

      markRead: (currentUserId) => {
        const { messages } = get();
        if (!FIREBASE_CONFIGURED || !db) return;
        messages
          .filter((m) => m.senderId !== currentUserId && !m.read)
          .forEach((m) => {
            updateDoc(doc(db!, MESSAGES_COLLECTION, m.id), { read: true }).catch(() => {});
          });
        set({ unreadCount: 0 });
      },

      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'our-story:chat',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (s) => ({ messages: s.messages.slice(-80) }),
      // See useAuthStore.ts — without a migrate fn, a version bump with no
      // matching persisted version silently wipes this store back to empty.
      migrate: (persisted) => persisted as Partial<ChatState>,
    },
  ),
);

// Module-level (not inside a component) so a queued photo/video/voice note
// still retries the moment connectivity returns even if the user has
// navigated away from the Chat page entirely — subscribe()'s own retry call
// only covers "app/chat just opened", not "was already open and offline".
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useChatStore.getState().retryQueuedMedia();
  });
}
