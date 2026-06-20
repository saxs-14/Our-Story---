/**
 * Local-first identity. The two of you sign in by name; the password is the
 * date you started dating. This gate is a private-keepsake lock (not hardened
 * security) — Phase 4 swaps `verify` for Firebase Auth without touching callers.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import relationship from '@/config/relationship';

export type PersonId = 'her' | 'him';

/** Digits-only forms of the dating date we'll accept as the password. */
function acceptablePasswords(): Set<string> {
  const iso = relationship.relationshipStart; // YYYY-MM-DD
  const [y, m, d] = iso.split('-');
  return new Set([
    iso,
    `${d}${m}${y}`, // ddmmyyyy
    `${y}${m}${d}`, // yyyymmdd
    `${d}/${m}/${y}`,
    `${d}-${m}-${y}`,
    `${Number(d)}/${Number(m)}/${y}`,
  ]);
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

interface AuthState {
  userId: PersonId | null;
  verify: (personId: PersonId, password: string) => boolean;
  login: (personId: PersonId) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      verify: (_personId, password) => {
        const accepted = new Set([...acceptablePasswords()].map(normalize));
        return accepted.has(normalize(password));
      },
      login: (userId) => set({ userId }),
      logout: () => set({ userId: null }),
    }),
    {
      name: 'our-story:auth',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function personById(id: PersonId) {
  return id === 'her' ? relationship.her : relationship.him;
}

export function partnerOf(id: PersonId): PersonId {
  return id === 'her' ? 'him' : 'her';
}
