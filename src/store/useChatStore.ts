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
  reactions?: Record<string, string>; // e.g. { 'her': '❤️', 'him': '🔥' }
  read: boolean;
  replyTo?: ReplyPreview;
  isCallEvent?: boolean; // missed/completed call summary — rendered as a centered pill, not a bubble
  local?: boolean; // optimistic / unsent
}

export type PartnerActivity = 'typing' | 'recording' | null;

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  uploading: boolean;
  uploadProgress: number;
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

let typingTimeout: number | null = null;

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
      partnerActivity: null,

      subscribe: (currentUserId) => {
        if (!FIREBASE_CONFIGURED || !db) return null;

        const partnerId = partnerOf(currentUserId);

        // 1. Message listener
        const q = query(
          collection(db, MESSAGES_COLLECTION),
          orderBy('timestamp', 'asc'),
          limit(MESSAGES_LIMIT),
        );

        const unsubMessages = onSnapshot(q, (snapshot) => {
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
              reactions: data.reactions ?? {},
              read: data.read ?? false,
              replyTo: data.replyTo ?? undefined,
              isCallEvent: data.isCallEvent ?? false,
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
              replyTo: replyTo ?? null,
              timestamp: serverTimestamp(),
            });
            set((s) => ({ messages: s.messages.filter((m) => m.id !== tmpId) }));
          } catch {
            // Keep optimistic message marked as local for offline retry
          }
        }
      },

      sendMedia: async (file, senderId, senderName, caption = '', audioDuration, replyTo) => {
        if (!FIREBASE_CONFIGURED || !storage || !db) return;

        set({ uploading: true, uploadProgress: 0 });
        const ext = file.type.includes('audio') ? 'webm' : file.type.includes('video') ? 'mp4' : 'jpg';
        const filename = (file as File).name || `voice-note-${Date.now()}.${ext}`;
        const path = `chat/${senderId}/${Date.now()}_${filename}`;
        const sRef = ref(storage, path);
        const task: UploadTask = uploadBytesResumable(sRef, file);

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
        const mediaType: 'image' | 'video' | 'audio' = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'audio';

        await addDoc(collection(db, MESSAGES_COLLECTION), {
          text: caption,
          senderId,
          senderName,
          mediaUrl,
          mediaType,
          audioDuration: audioDuration || null,
          read: false,
          replyTo: replyTo ?? null,
          timestamp: serverTimestamp(),
        });

        set({ uploading: false, uploadProgress: 0 });
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
