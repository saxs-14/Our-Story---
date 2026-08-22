/**
 * The living record of the relationship's interactions.
 * Local-first (localStorage) with cloud sync to a single shared Firestore
 * document, so the garden/achievements/capsules stay the same for both
 * partners no matter which device they open.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncSingleDoc, pullSingleDoc } from '@/lib/firestoreSync';

export interface TimeCapsule {
  id: string;
  message: string;
  createdAt: string; // ISO
  unlockAt: string; // ISO
  opened: boolean;
}

interface ProgressState {
  visits: number;
  weatherChecked: number;

  favorites: string[]; // reason ids
  lettersRead: string[]; // letter ids
  letterBookmarks: string[]; // letter ids
  vaultOpened: string[]; // vault ids
  dreamsChecked: string[]; // dream ids

  gardenWaterCount: number;
  secretUnlocked: boolean;
  wrappedViewed: boolean;

  achievementsUnlocked: string[]; // achievement ids ever unlocked
  achievementsSeen: string[]; // for "new!" toasts

  capsules: TimeCapsule[];

  // actions
  registerVisit: () => void;
  checkWeather: () => void;
  toggleFavorite: (id: string) => void;
  markLetterRead: (id: string) => void;
  toggleBookmark: (id: string) => void;
  openVault: (id: string) => void;
  toggleDream: (id: string) => void;
  waterGarden: () => void;
  unlockSecret: () => void;
  markWrappedViewed: () => void;
  unlockAchievements: (ids: string[]) => void;
  markAchievementsSeen: (ids: string[]) => void;
  addCapsule: (c: Omit<TimeCapsule, 'id' | 'opened'>) => void;
  openCapsule: (id: string) => void;
  resetAll: () => void;
  /** Pull the shared cloud progress doc and merge it into local state. */
  pullFromFirestore: () => Promise<void>;
}

/** The subset of ProgressState that's persisted/synced (no action functions). */
type ProgressData = Omit<
  ProgressState,
  | 'registerVisit'
  | 'checkWeather'
  | 'toggleFavorite'
  | 'markLetterRead'
  | 'toggleBookmark'
  | 'openVault'
  | 'toggleDream'
  | 'waterGarden'
  | 'unlockSecret'
  | 'markWrappedViewed'
  | 'unlockAchievements'
  | 'markAchievementsSeen'
  | 'addCapsule'
  | 'openCapsule'
  | 'resetAll'
  | 'pullFromFirestore'
>;

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

const addUnique = (arr: string[], id: string) => (arr.includes(id) ? arr : [...arr, id]);
const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

let syncTimer: ReturnType<typeof setTimeout> | null = null;
/** Debounced push of the full progress doc so rapid taps (e.g. watering) don't spam Firestore. */
function scheduleSync(data: ProgressData) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncSingleDoc('progress', 'shared', data);
  }, 600);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      visits: 0,
      weatherChecked: 0,
      favorites: [],
      lettersRead: [],
      letterBookmarks: [],
      vaultOpened: [],
      dreamsChecked: [],
      gardenWaterCount: 0,
      secretUnlocked: false,
      wrappedViewed: false,
      achievementsUnlocked: [],
      achievementsSeen: [],
      capsules: [],

      registerVisit: () => {
        set((s) => ({ visits: s.visits + 1 }));
        scheduleSync(get());
      },
      checkWeather: () => {
        set((s) => ({ weatherChecked: s.weatherChecked + 1 }));
        scheduleSync(get());
      },
      toggleFavorite: (id) => {
        set((s) => ({ favorites: toggle(s.favorites, id) }));
        scheduleSync(get());
      },
      markLetterRead: (id) => {
        set((s) => ({ lettersRead: addUnique(s.lettersRead, id) }));
        scheduleSync(get());
      },
      toggleBookmark: (id) => {
        set((s) => ({ letterBookmarks: toggle(s.letterBookmarks, id) }));
        scheduleSync(get());
      },
      openVault: (id) => {
        set((s) => ({ vaultOpened: addUnique(s.vaultOpened, id) }));
        scheduleSync(get());
      },
      toggleDream: (id) => {
        set((s) => ({ dreamsChecked: toggle(s.dreamsChecked, id) }));
        scheduleSync(get());
      },
      waterGarden: () => {
        set((s) => ({ gardenWaterCount: s.gardenWaterCount + 1 }));
        scheduleSync(get());
      },
      unlockSecret: () => {
        set({ secretUnlocked: true });
        scheduleSync(get());
      },
      markWrappedViewed: () => {
        set({ wrappedViewed: true });
        scheduleSync(get());
      },
      unlockAchievements: (ids) => {
        set((s) => ({
          achievementsUnlocked: union(s.achievementsUnlocked, ids),
        }));
        scheduleSync(get());
      },
      markAchievementsSeen: (ids) => {
        set((s) => ({
          achievementsSeen: union(s.achievementsSeen, ids),
        }));
        scheduleSync(get());
      },
      addCapsule: (c) => {
        set((s) => ({
          capsules: [
            ...s.capsules,
            { ...c, id: `capsule-${Date.now()}`, opened: false },
          ],
        }));
        scheduleSync(get());
      },
      openCapsule: (id) => {
        set((s) => ({
          capsules: s.capsules.map((c) => (c.id === id ? { ...c, opened: true } : c)),
        }));
        scheduleSync(get());
      },
      resetAll: () => {
        set({
          visits: 0,
          weatherChecked: 0,
          favorites: [],
          lettersRead: [],
          letterBookmarks: [],
          vaultOpened: [],
          dreamsChecked: [],
          gardenWaterCount: 0,
          secretUnlocked: false,
          wrappedViewed: false,
          achievementsUnlocked: [],
          achievementsSeen: [],
          capsules: [],
        });
        scheduleSync(get());
      },

      pullFromFirestore: async () => {
        const cloud = await pullSingleDoc<ProgressData>('progress', 'shared');
        if (!cloud) return;
        const local = get();
        const localCapsuleIds = new Set(local.capsules.map((c) => c.id));
        set({
          visits: Math.max(local.visits, cloud.visits ?? 0),
          weatherChecked: Math.max(local.weatherChecked, cloud.weatherChecked ?? 0),
          favorites: union(local.favorites, cloud.favorites ?? []),
          lettersRead: union(local.lettersRead, cloud.lettersRead ?? []),
          letterBookmarks: union(local.letterBookmarks, cloud.letterBookmarks ?? []),
          vaultOpened: union(local.vaultOpened, cloud.vaultOpened ?? []),
          dreamsChecked: union(local.dreamsChecked, cloud.dreamsChecked ?? []),
          gardenWaterCount: Math.max(local.gardenWaterCount, cloud.gardenWaterCount ?? 0),
          secretUnlocked: local.secretUnlocked || Boolean(cloud.secretUnlocked),
          wrappedViewed: local.wrappedViewed || Boolean(cloud.wrappedViewed),
          achievementsUnlocked: union(local.achievementsUnlocked, cloud.achievementsUnlocked ?? []),
          achievementsSeen: union(local.achievementsSeen, cloud.achievementsSeen ?? []),
          capsules: [
            ...local.capsules,
            ...(cloud.capsules ?? []).filter((c) => !localCapsuleIds.has(c.id)),
          ],
        });
        scheduleSync(get());
      },
    }),
    {
      name: 'our-story:progress',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted) => persisted as ProgressState,
    },
  ),
);

/** Garden growth derived from time together + watering. 0..4 */
export function gardenStageFrom(daysTogether: number, waterCount: number): number {
  const base = daysTogether >= 365 ? 3 : daysTogether >= 100 ? 2 : daysTogether >= 30 ? 1 : 0;
  const bonus = waterCount >= 25 ? 1 : 0;
  return Math.min(4, base + bonus);
}
