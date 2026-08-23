/**
 * Identity store — local-first with optional Firebase Auth sync.
 * Login: pick name → enter birthday as password.
 *   - Phathu (Saxs🥹❤️🔥): 14 June 2005
 *   - Lihle (Snowpie ❄️✨): 06 August 2003
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

/** Generates all acceptable representations of a date. */
function dateVariants(iso: string): string[] {
  const [y, m, d] = iso.split('-');
  const dayNum = String(Number(d));
  const monthNum = String(Number(m));
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthName = months[Number(m) - 1] ?? '';
  const monthShort = monthName.slice(0, 3);

  return [
    iso,
    `${d}${m}${y}`,
    `${y}${m}${d}`,
    `${d}/${m}/${y}`,
    `${d}-${m}-${y}`,
    `${dayNum}/${monthNum}/${y}`,
    `${dayNum}-${monthNum}-${y}`,
    `${d} ${monthName} ${y}`,
    `${dayNum} ${monthName} ${y}`,
    `${d} ${monthShort} ${y}`,
    `${dayNum} ${monthShort} ${y}`,
    `${monthName} ${d} ${y}`,
    `${monthName} ${dayNum} ${y}`,
    `${monthShort} ${d} ${y}`,
    `${monthShort} ${dayNum} ${y}`,
    `${d} ${monthName}`,
    `${dayNum} ${monthName}`,
  ];
}

function acceptablePasswords(personId: PersonId): Set<string> {
  const person = personById(personId);
  const variants = [
    ...dateVariants(person.birthday),
    ...dateVariants(relationship.relationshipStart),
    ...dateVariants(relationship.firstSight),
  ];

  if (personId === 'her') {
    variants.push(
      '06 August 2003',
      '6 August 2003',
      '06/08/2003',
      '06082003',
      '2003-08-06',
      '06-08-2003',
      '6/8/2003',
      '06 Aug 2003',
      '6 Aug 2003'
    );
  } else {
    variants.push(
      '14 June 2005',
      '14/06/2005',
      '14062005',
      '2005-06-14',
      '14-06-2005',
      '14/6/2005',
      '14 Jun 2005',
      '14 June'
    );
  }

  return new Set(variants);
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The real Firebase Auth credential — intentionally NOT derived from the
 * birthday. This repo is public, and relationship.birthday is committed in
 * plaintext, so a password computed from it is a password anyone reading
 * GitHub can compute too. These come from env vars that are never derived
 * from repo contents and never committed (see .env.example).
 */
function firebasePassword(personId: PersonId): string {
  return personId === 'her'
    ? import.meta.env.VITE_FIREBASE_HER_PASSWORD
    : import.meta.env.VITE_FIREBASE_HIM_PASSWORD;
}

async function signIntoFirebase(personId: PersonId): Promise<void> {
  if (!FIREBASE_CONFIGURED || !auth) return;
  const email = firebaseEmail(personId);
  const password = firebasePassword(personId);
  if (!password) return; // Cloud sync env var not set — app still works locally
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
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

      verify: (personId, password) => {
        const accepted = new Set([...acceptablePasswords(personId)].map(normalize));
        return accepted.has(normalize(password));
      },

      login: async (userId) => {
        set({ userId });
        await signIntoFirebase(userId);
        const [{ useContentStore }, { useProgressStore }, { useAppStore }] = await Promise.all([
          import('@/store/useContentStore'),
          import('@/store/useProgressStore'),
          import('@/store/useAppStore'),
        ]);
        void useContentStore.getState().pullFromFirestore();
        void useProgressStore.getState().pullFromFirestore();
        void useAppStore.getState().pullWallpaperFromFirestore();
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
      version: 3,
      // Without this, zustand refuses to load any persisted state whose
      // version doesn't match and silently resets to defaults (userId: null)
      // — i.e. every version bump would log everyone out. Login state has
      // no shape that needs transforming between versions, so just pass it through.
      migrate: (persisted) => persisted as AuthState,
    },
  ),
);

export function personById(id: PersonId) {
  return id === 'her' ? relationship.her : relationship.him;
}

export function partnerOf(id: PersonId): PersonId {
  return id === 'her' ? 'him' : 'her';
}
