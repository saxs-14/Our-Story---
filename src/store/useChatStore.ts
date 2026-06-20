/**
 * Real-time chat via Firebase Firestore.
 * Works offline (IndexedDB persistence) and syncs when online.
 * Falls back to local-only mode when Firebase is not configured.
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

export interface ChatMessage {
  id: string;
  text: string;
  senderId: PersonId;
  senderName: string;
  timestamp: number; // ms epoch
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  read: boolean;
  local?: boolean; // optimistic / unsent
}

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  uploading: boolean;
  uploadProgress: number;

  /** Subscribe to Firestore — call once on app mount, unsubscribe on logout */
  subscribe: (currentUserId: PersonId) => Unsubscribe | null;
  /** Send a text message */
  sendMessage: (text: string, senderId: PersonId, senderName: string) => Promise<void>;
  /** Upload media + send message */
  sendMedia: (file: File, senderId: PersonId, senderName: string, caption?: string) => Promise<void>;
  /** Mark all messages as read for this session */
  markRead: (currentUserId: PersonId) => void;
  clearUnread: () => void;
}

const MESSAGES_COLLECTION = 'messages';
const MESSAGES_LIMIT = 200;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      unreadCount: 0,
      uploading: false,
      uploadProgress: 0,

      subscribe: (currentUserId) => {
        if (!FIREBASE_CONFIGURED || !db) return null;

        const q = query(
          collection(db, MESSAGES_COLLECTION),
          orderBy('timestamp', 'asc'),
          limit(MESSAGES_LIMIT),
        );

        const unsub = onSnapshot(q, (snapshot) => {
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
              read: data.read ?? false,
            };
          });

          const prev = get().messages;
          const newFromPartner = msgs.filter(
            (m) => m.senderId !== currentUserId && !m.read &&
              !prev.find((p) => p.id === m.id && p.read),
          );

          set({ messages: msgs, unreadCount: newFromPartner.length });
        });

        return unsub;
      },

      sendMessage: async (text, senderId, senderName) => {
        if (!text.trim()) return;

        // Optimistic update
        const tmpId = `local-${Date.now()}`;
        const optimistic: ChatMessage = {
          id: tmpId, text, senderId, senderName,
          timestamp: Date.now(), read: false, local: true,
        };
        set((s) => ({ messages: [...s.messages, optimistic] }));

        if (FIREBASE_CONFIGURED && db) {
          try {
            await addDoc(collection(db, MESSAGES_COLLECTION), {
              text, senderId, senderName, read: false, timestamp: serverTimestamp(),
            });
            // Firestore snapshot will replace the optimistic message
            set((s) => ({ messages: s.messages.filter((m) => m.id !== tmpId) }));
          } catch {
            // Keep optimistic message marked as local (will retry when online)
          }
        }
      },

      sendMedia: async (file, senderId, senderName, caption = '') => {
        if (!FIREBASE_CONFIGURED || !storage || !db) return;

        set({ uploading: true, uploadProgress: 0 });
        const path = `chat/${senderId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        const task: UploadTask = uploadBytesResumable(storageRef, file);

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

        const mediaUrl = await getDownloadURL(storageRef);
        const mediaType: 'image' | 'video' | 'audio' = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'audio';

        await addDoc(collection(db, MESSAGES_COLLECTION), {
          text: caption, senderId, senderName, mediaUrl, mediaType,
          read: false, timestamp: serverTimestamp(),
        });

        set({ uploading: false, uploadProgress: 0 });
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
      version: 1,
      partialize: (s) => ({ messages: s.messages.slice(-50) }), // keep last 50 for offline
    },
  ),
);
