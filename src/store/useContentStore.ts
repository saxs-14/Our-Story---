/**
 * User-authored content — the part of Our Story that *you two* write.
 * Letters, dreams and real timeline moments authored by either partner, plus
 * profile portraits. Persisted locally (media lives in IndexedDB by id).
 * Phase 4 syncs these documents to MongoDB Atlas via the content API.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PersonId } from '@/store/useAuthStore';
import type { LetterCategory } from '@/data/letters';
import type { DreamCategory } from '@/data/dreams';

export interface UserLetter {
  id: string;
  authorId: PersonId;
  to: PersonId;
  title: string;
  body: string; // paragraphs separated by blank lines
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
  date: string; // ISO day the thing happened
  title: string;
  description: string;
  emoji: string;
  mediaIds: string[];
  createdAt: string;
}

interface ProfileData {
  photoMediaId?: string;
}

interface ContentState {
  profiles: Record<PersonId, ProfileData>;
  letters: UserLetter[];
  dreams: UserDream[];
  memories: UserMemory[];

  setProfilePhoto: (id: PersonId, mediaId: string | undefined) => void;

  addLetter: (l: Omit<UserLetter, 'id' | 'createdAt'>) => void;
  updateLetter: (id: string, patch: Partial<UserLetter>) => void;
  deleteLetter: (id: string) => void;

  addDream: (d: Omit<UserDream, 'id' | 'createdAt'>) => void;
  deleteDream: (id: string) => void;

  addMemory: (m: Omit<UserMemory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      profiles: { her: {}, him: {} },
      letters: [],
      dreams: [],
      memories: [],

      setProfilePhoto: (id, mediaId) =>
        set((s) => ({ profiles: { ...s.profiles, [id]: { ...s.profiles[id], photoMediaId: mediaId } } })),

      addLetter: (l) => set((s) => ({ letters: [{ ...l, id: uid('uletter'), createdAt: new Date().toISOString() }, ...s.letters] })),
      updateLetter: (id, patch) => set((s) => ({ letters: s.letters.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLetter: (id) => set((s) => ({ letters: s.letters.filter((l) => l.id !== id) })),

      addDream: (d) => set((s) => ({ dreams: [{ ...d, id: uid('udream'), createdAt: new Date().toISOString() }, ...s.dreams] })),
      deleteDream: (id) => set((s) => ({ dreams: s.dreams.filter((d) => d.id !== id) })),

      addMemory: (m) => set((s) => ({ memories: [{ ...m, id: uid('umem'), createdAt: new Date().toISOString() }, ...s.memories] })),
      deleteMemory: (id) => set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),
    }),
    {
      name: 'our-story:content',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
