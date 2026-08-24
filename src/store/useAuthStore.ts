/**
 * Identity store — local-first with optional Firebase Auth sync.
 * Login: pick name → enter birthday as password.
 *   - Phathu (Saxs🥹❤️🔥): 14 June 2005
 *   - Lihle (Snowpie ❄️✨): 06 August 2003
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signInWithCustomToken, signOut as fbSignOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import relationship from '@/config/relationship';
import { auth, functions, FIREBASE_CONFIGURED } from '@/lib/firebase';

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
 * Signs into the real Firebase account for cloud sync, without any static
 * password ever shipping in the client bundle. This app deploys to public
 * URLs (GitHub Pages, Vercel) as well as a private native build — anything
 * baked into a build-time env var is extractable by anyone who loads a
 * public deployment and opens dev tools, no matter how random the value is.
 * There's no way to keep a client-side secret secret on a public web build.
 *
 * So instead: the birthday the person just typed (already checked locally
 * by `verify()` for instant UI feedback) is sent to the signInAsPartner
 * Cloud Function, which re-checks it server-side — where the real secret
 * boundary actually lives, Admin SDK credentials that never leave Google's
 * infrastructure — and if correct, mints a short-lived custom sign-in token.
 */
async function signIntoFirebase(personId: PersonId, typedAnswer: string): Promise<boolean> {
  if (!FIREBASE_CONFIGURED || !auth || !functions) return false;
  try {
    const claim = httpsCallable<{ personId: PersonId; answer: string }, { token: string }>(
      functions,
      'signInAsPartner',
    );
    const result = await claim({ personId, answer: typedAnswer });
    await signInWithCustomToken(auth, result.data.token);
    return true;
  } catch {
    // Offline, function unreachable, or (shouldn't happen — verify() already
    // checked this exact answer) rejected.
    return false;
  }
}

interface AuthState {
  userId: PersonId | null;
  /** Persons who have signed into the real Firebase account on this device
   *  at least once — lets them keep using their own cached data offline
   *  afterward, without treating every future offline open as suspect. */
  verifiedPersons: Partial<Record<PersonId, boolean>>;
  verify: (personId: PersonId, password: string) => boolean;
  /** Resolves false if this device has never verified with the server for
   *  this person AND couldn't reach it right now — login is refused rather
   *  than silently entering with no cloud data. */
  login: (personId: PersonId, typedAnswer: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      verifiedPersons: {},

      verify: (personId, password) => {
        const accepted = new Set([...acceptablePasswords(personId)].map(normalize));
        return accepted.has(normalize(password));
      },

      login: async (userId, typedAnswer) => {
        const signedIn = FIREBASE_CONFIGURED ? await signIntoFirebase(userId, typedAnswer) : false;
        const alreadyVerifiedOnThisDevice = Boolean(get().verifiedPersons[userId]);

        // A server exists (FIREBASE_CONFIGURED) but couldn't be reached or
        // rejected the token this time, and this device has never actually
        // proven itself to that server before — refuse rather than let
        // someone in to a permanently-empty, never-syncing session.
        if (FIREBASE_CONFIGURED && !signedIn && !alreadyVerifiedOnThisDevice) {
          return false;
        }

        if (signedIn) {
          set((s) => ({ verifiedPersons: { ...s.verifiedPersons, [userId]: true } }));
        }

        set({ userId });
        const [{ useProgressStore }, { useAppStore }] = await Promise.all([
          import('@/store/useProgressStore'),
          import('@/store/useAppStore'),
        ]);
        // useContentStore's letters/dreams/memories/gallery now sync live via
        // startContentSync() (called from App.tsx's userId effect) instead of
        // a one-shot pull here — a live listener's first callback already
        // delivers the full initial contents, so a separate pull is redundant.
        void useProgressStore.getState().pullFromFirestore();
        void useAppStore.getState().pullWallpaperFromFirestore();
        return true;
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
      version: 4,
      // Without this, zustand refuses to load any persisted state whose
      // version doesn't match and silently resets to defaults (userId: null)
      // — i.e. every version bump would log everyone out. v4 adds
      // verifiedPersons; default it in for anyone persisted at an older version.
      migrate: (persisted) => {
        const p = persisted as Partial<AuthState> | undefined;
        return { ...p, verifiedPersons: p?.verifiedPersons ?? {} } as AuthState;
      },
    },
  ),
);

export function personById(id: PersonId) {
  return id === 'her' ? relationship.her : relationship.him;
}

export function partnerOf(id: PersonId): PersonId {
  return id === 'her' ? 'him' : 'her';
}
