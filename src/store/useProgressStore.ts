/** The living record of the relationship's interactions (persisted). */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

const addUnique = (arr: string[], id: string) => (arr.includes(id) ? arr : [...arr, id]);

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
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

      registerVisit: () => set((s) => ({ visits: s.visits + 1 })),
      checkWeather: () => set((s) => ({ weatherChecked: s.weatherChecked + 1 })),
      toggleFavorite: (id) => set((s) => ({ favorites: toggle(s.favorites, id) })),
      markLetterRead: (id) => set((s) => ({ lettersRead: addUnique(s.lettersRead, id) })),
      toggleBookmark: (id) => set((s) => ({ letterBookmarks: toggle(s.letterBookmarks, id) })),
      openVault: (id) => set((s) => ({ vaultOpened: addUnique(s.vaultOpened, id) })),
      toggleDream: (id) => set((s) => ({ dreamsChecked: toggle(s.dreamsChecked, id) })),
      waterGarden: () => set((s) => ({ gardenWaterCount: s.gardenWaterCount + 1 })),
      unlockSecret: () => set({ secretUnlocked: true }),
      markWrappedViewed: () => set({ wrappedViewed: true }),
      unlockAchievements: (ids) =>
        set((s) => ({
          achievementsUnlocked: Array.from(new Set([...s.achievementsUnlocked, ...ids])),
        })),
      markAchievementsSeen: (ids) =>
        set((s) => ({
          achievementsSeen: Array.from(new Set([...s.achievementsSeen, ...ids])),
        })),
      addCapsule: (c) =>
        set((s) => ({
          capsules: [
            ...s.capsules,
            { ...c, id: `capsule-${Date.now()}`, opened: false },
          ],
        })),
      openCapsule: (id) =>
        set((s) => ({
          capsules: s.capsules.map((c) => (c.id === id ? { ...c, opened: true } : c)),
        })),
      resetAll: () =>
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
        }),
    }),
    {
      name: 'our-story:progress',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Garden growth derived from time together + watering. 0..4 */
export function gardenStageFrom(daysTogether: number, waterCount: number): number {
  const base = daysTogether >= 365 ? 3 : daysTogether >= 100 ? 2 : daysTogether >= 30 ? 1 : 0;
  const bonus = waterCount >= 25 ? 1 : 0;
  return Math.min(4, base + bonus);
}
