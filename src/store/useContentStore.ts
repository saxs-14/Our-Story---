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
  pullCollection,
} from '@/lib/firestoreSync';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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

  addLetter: (l: Omit<UserLetter, 'id' | 'createdAt'>) => void;
  updateLetter: (id: string, patch: Partial<UserLetter>) => void;
  deleteLetter: (id: string) => void;

  addDream: (d: Omit<UserDream, 'id' | 'createdAt'>) => void;
  deleteDream: (id: string) => void;

  addMemory: (m: Omit<UserMemory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;

  addGalleryItem: (g: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  deleteGalleryItem: (id: string) => void;

  /** Upload a file to Firebase Storage and return the download URL */
  uploadMedia: (file: File, path: string) => Promise<string | null>;

  /**
   * Pull content from Firestore and merge with local state.
   * Called after login so both partners see each other's content on any device.
   * Local items always win over cloud items (preserves any offline writes).
   */
  pullFromFirestore: () => Promise<void>;
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      profiles: { her: {}, him: {} },
      letters: [],
      dreams: [],
      memories: [],
      gallery: [],

      setProfilePhoto: (id, mediaId, url) =>
        set((s) => ({
          profiles: { ...s.profiles, [id]: { ...s.profiles[id], photoMediaId: mediaId, photoUrl: url } },
        })),

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

      pullFromFirestore: async () => {
        const state = get();
        const localLetterIds = new Set(state.letters.map((l) => l.id));
        const localDreamIds = new Set(state.dreams.map((d) => d.id));
        const localMemoryIds = new Set(state.memories.map((m) => m.id));
        const localGalleryIds = new Set(state.gallery.map((g) => g.id));

        const [cloudLetters, cloudDreams, cloudMemories, cloudGallery] = await Promise.all([
          pullCollection<UserLetter>('letters'),
          pullCollection<UserDream>('dreams'),
          pullCollection<UserMemory>('memories'),
          pullCollection<GalleryItem>('gallery'),
        ]);

        // Add cloud items missing locally (local version wins when both exist)
        set((s) => ({
          letters: [
            ...s.letters,
            ...cloudLetters.filter((l) => !localLetterIds.has(l.id)),
          ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          dreams: [
            ...s.dreams,
            ...cloudDreams.filter((d) => !localDreamIds.has(d.id)),
          ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          memories: [
            ...s.memories,
            ...cloudMemories.filter((m) => !localMemoryIds.has(m.id)),
          ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          gallery: [
            ...s.gallery,
            ...cloudGallery.filter((g) => !localGalleryIds.has(g.id)),
          ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        }));
      },
    }),
    {
      name: 'our-story:content',
      storage: createJSONStorage(() => localStorage),
      version: 3,
    },
  ),
);

// Helper for components that don't import the full store
export function getUploadPath(userId: PersonId, filename: string) {
  return `media/${userId}/${Date.now()}_${filename}`;
}
