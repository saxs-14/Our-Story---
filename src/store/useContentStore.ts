/**
 * User-authored content -- letters, dreams, real timeline moments, profiles.
 * Primary storage: localStorage (offline-first).
 * Cloud sync: Firebase Firestore (syncs automatically, even across offline gaps).
 * Media files: Firebase Storage (photos/videos/audio uploads).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PersonId } from '@/store/useAuthStore';
import type { LetterCategory } from '@/data/letters';
import type { DreamCategory } from '@/data/dreams';
import {
  syncLetter,
  syncDream,
  syncMemory,
  syncGalleryItem,
  removeFromFirestore,
  subscribeCollection,
  syncProfilePhoto,
  subscribeProfilePhoto,
} from '@/lib/firestoreSync';
import type { Unsubscribe } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, FIREBASE_CONFIGURED } from '@/lib/firebase';

export interface UserLetter {
  id: string;
  authorId: PersonId;
  to: PersonId;
  title: string;
  body: string;
  category: LetterCategory;
  createdAt: string;
}

export interface UserDream {
  id: string;
  authorId: PersonId;
  title: string;
  note: string;
  emoji: string;
  category: DreamCategory;
  createdAt: string;
}

export interface UserMemory {
  id: string;
  authorId: PersonId;
  date: string;
  title: string;
  description: string;
  emoji: string;
  mediaIds: string[];   // IndexedDB keys for offline
  mediaUrls: string[];  // Firebase Storage URLs (cloud)
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  authorId: PersonId;
  caption: string;
  mediaId?: string;    // IndexedDB key
  mediaUrl?: string;   // Firebase Storage URL
  album: string;
  createdAt: string;
}

interface ProfileData {
  photoMediaId?: string;
  photoUrl?: string; // Firebase Storage URL
}

interface ContentState {
  profiles: Record<PersonId, ProfileData>;
  letters: UserLetter[];
  dreams: UserDream[];
  memories: UserMemory[];
  gallery: GalleryItem[];

  setProfilePhoto: (id: PersonId, mediaId: string | undefined, url?: string) => void;
  /** Start live-syncing both partners' profile photos so a change either of
   *  you makes shows up for the other immediately. Call once after login. */
  startProfileSync: () => void;
  stopProfileSync: () => void;

  addLetter: (l: Omit<UserLetter, 'id' | 'createdAt'>) => void;
  updateLetter: (id: string, patch: Partial<UserLetter>) => void;
  deleteLetter: (id: string) => void;

  addDream: (d: Omit<UserDream, 'id' | 'createdAt'>) => void;
  deleteDream: (id: string) => void;

  addMemory: (m: Omit<UserMemory, 'id' | 'createdAt' | 'mediaUrls'>) => void;
  deleteMemory: (id: string) => void;

  addGalleryItem: (g: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  deleteGalleryItem: (id: string) => void;

  /** Upload a file to Firebase Storage and return the download URL */
  uploadMedia: (file: File, path: string) => Promise<string | null>;
  /** Best-effort delete of a previously-uploaded file, so replacing it (e.g.
   *  changing a profile photo) doesn't leak storage forever. Safe to call
   *  with any URL — failures (already gone, not a Storage URL) are ignored. */
  deleteUploadedMedia: (url: string) => Promise<void>;

  /**
   * Start live-syncing letters/dreams/memories/gallery so an item either
   * partner adds or edits shows up for the other immediately, on any
   * device — no reload or re-login needed. Call once after login. Cloud
   * data is authoritative for any id already in Firestore (so edits
   * propagate too); local items not yet synced are kept until they land.
   */
  startContentSync: () => void;
  stopContentSync: () => void;
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let profileUnsubs: Unsubscribe[] = [];
let contentUnsubs: Unsubscribe[] = [];

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      profiles: { her: {}, him: {} },
      letters: [],
      dreams: [],
      memories: [],
      gallery: [],

      setProfilePhoto: (id, mediaId, url) => {
        set((s) => ({
          profiles: { ...s.profiles, [id]: { ...s.profiles[id], photoMediaId: mediaId, photoUrl: url } },
        }));
        void syncProfilePhoto(id, url ?? null);
      },

      startProfileSync: () => {
        get().stopProfileSync();
        (['her', 'him'] as PersonId[]).forEach((id) => {
          profileUnsubs.push(
            subscribeProfilePhoto(id, (photoUrl) => {
              set((s) => ({
                profiles: { ...s.profiles, [id]: { ...s.profiles[id], photoUrl: photoUrl ?? undefined } },
              }));
            }),
          );
        });
      },
      stopProfileSync: () => {
        profileUnsubs.forEach((unsub) => unsub());
        profileUnsubs = [];
      },

      addLetter: (l) => {
        const letter: UserLetter = { ...l, id: uid('uletter'), createdAt: new Date().toISOString() };
        set((s) => ({ letters: [letter, ...s.letters] }));
        void syncLetter(letter);
      },
      updateLetter: (id, patch) =>
        set((s) => {
          const letters = s.letters.map((l) => (l.id === id ? { ...l, ...patch } : l));
          const updated = letters.find((l) => l.id === id);
          if (updated) void syncLetter(updated);
          return { letters };
        }),
      deleteLetter: (id) => {
        set((s) => ({ letters: s.letters.filter((l) => l.id !== id) }));
        void removeFromFirestore('letters', id);
      },

      addDream: (d) => {
        const dream: UserDream = { ...d, id: uid('udream'), createdAt: new Date().toISOString() };
        set((s) => ({ dreams: [dream, ...s.dreams] }));
        void syncDream(dream);
      },
      deleteDream: (id) => {
        set((s) => ({ dreams: s.dreams.filter((d) => d.id !== id) }));
        void removeFromFirestore('dreams', id);
      },

      addMemory: (m) => {
        const memory: UserMemory = { ...m, mediaUrls: [], id: uid('umem'), createdAt: new Date().toISOString() };
        set((s) => ({ memories: [memory, ...s.memories] }));
        void syncMemory(memory);
      },
      deleteMemory: (id) => {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
        void removeFromFirestore('memories', id);
      },

      addGalleryItem: (g) => {
        const item: GalleryItem = { ...g, id: uid('ugallery'), createdAt: new Date().toISOString() };
        set((s) => ({ gallery: [item, ...s.gallery] }));
        void syncGalleryItem(item);
      },
      deleteGalleryItem: (id) => {
        set((s) => ({ gallery: s.gallery.filter((g) => g.id !== id) }));
        void removeFromFirestore('gallery', id);
      },

      uploadMedia: async (file, path) => {
        if (!FIREBASE_CONFIGURED || !storage) return null;
        try {
          const sRef = storageRef(storage, path);
          const task = uploadBytesResumable(sRef, file);
          await new Promise<void>((resolve, reject) => task.on('state_changed', null, reject, resolve));
          return getDownloadURL(sRef);
        } catch {
          return null;
        }
      },

      deleteUploadedMedia: async (url) => {
        if (!FIREBASE_CONFIGURED || !storage) return;
        await deleteObject(storageRef(storage, url)).catch(() => {});
      },

      startContentSync: () => {
        get().stopContentSync();

        // Cloud is authoritative for any id already in Firestore (so an
        // edit by either partner propagates too, not just new additions);
        // local-only items (not yet synced — e.g. just added, write still
        // in flight) are kept appended so they don't flicker away before
        // their own write round-trips back through this same listener.
        const mergeCloud =
          <T extends { id: string; createdAt: string }>(key: 'letters' | 'dreams' | 'memories' | 'gallery') =>
          (cloudItems: T[]) => {
            set((s) => {
              const cloudIds = new Set(cloudItems.map((c) => c.id));
              const localOnly = (s[key] as unknown as T[]).filter((item) => !cloudIds.has(item.id));
              const merged = [...cloudItems, ...localOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              return { [key]: merged } as unknown as Partial<ContentState>;
            });
          };

        contentUnsubs.push(subscribeCollection<UserLetter>('letters', mergeCloud('letters')));
        contentUnsubs.push(subscribeCollection<UserDream>('dreams', mergeCloud('dreams')));
        contentUnsubs.push(subscribeCollection<UserMemory>('memories', mergeCloud('memories')));
        contentUnsubs.push(subscribeCollection<GalleryItem>('gallery', mergeCloud('gallery')));
      },
      stopContentSync: () => {
        contentUnsubs.forEach((unsub) => unsub());
        contentUnsubs = [];
      },
    }),
    {
      name: 'our-story:content',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // See useAuthStore.ts — without a migrate fn, a version bump with no
      // matching persisted version silently wipes this store back to empty.
      migrate: (persisted) => persisted as ContentState,
    },
  ),
);

// Helper for components that don't import the full store
export function getUploadPath(userId: PersonId, filename: string) {
  return `media/${userId}/${Date.now()}_${filename}`;
}
