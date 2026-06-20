/**
 * Identity store — local-first with optional Firebase Auth sync.
 * Login: pick name → enter dating start date as password.
 * When Firebase is configured, also signs into Firebase so Firestore chat works.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import relationship from '@/config/relationship';
import { auth, FIREBASE_CONFIGURED, firebaseEmail } from '@/lib/firebase';

export type PersonId = 'her' | 'him';

/** Digits-only forms of the dating date we'll accept as the password. */
function acceptablePasswords(): Set<string> {
  const iso = relationship.relationshipStart; // YYYY-MM-DD
  const [y, m, d] = iso.split('-');
  return new Set([
    iso,
    `${d}${m}${y}`,
    `${y}${m}${d}`,
    `${d}/${m}/${y}`,
    `${d}-${m}-${y}`,
    `${Number(d)}/${Number(m)}/${y}`,
  ]);
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

/** The canonical Firebase password for both partners = dating date digits */
function firebasePassword(): string {
  const iso = relationship.relationshipStart; // YYYY-MM-DD e.g. 2026-05-08
  const [y, m, d] = iso.split('-');
  return `${d}${m}${y}`; // e.g. 08052026
}

async function signIntoFirebase(personId: PersonId): Promise<void> {
  if (!FIREBASE_CONFIGURED || !auth) return;
  const email = firebaseEmail(personId);
  const password = firebasePassword();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      // First time — create the account
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch {
        // Account already exists or creation failed — not critical
      }
    }
  }
}

interface AuthState {
  userId: PersonId | null;
  verify: (personId: PersonId, password: string) => boolean;
  login: (personId: PersonId) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,

      verify: (_personId, password) => {
        const accepted = new Set([...acceptablePasswords()].map(normalize));
        return accepted.has(normalize(password));
      },

      login: async (userId) => {
        set({ userId });
        await signIntoFirebase(userId);
        // Pull cloud content in the background after Firebase auth completes
        const { useContentStore } = await import('@/store/useContentStore');
        void useContentStore.getState().pullFromFirestore();
      },

      logout: async () => {
        set({ userId: null });
        if (FIREBASE_CONFIGURED && auth) {
          await fbSignOut(auth).catch(() => {});
        }
      },
    }),
    {
      name: 'our-story:auth',
      storage: createJSONStorage(() => localStorage),
      version: 2,
    },
  ),
);

export function personById(id: PersonId) {
  return id === 'her' ? relationship.her : relationship.him;
}

export function partnerOf(id: PersonId): PersonId {
  return id === 'her' ? 'him' : 'her';
}
