/** App-wide settings & preferences (persisted). */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setHapticsEnabled } from '@/lib/haptics';

export type ThemeName = 'day' | 'dusk';
export type MotionPref = 'system' | 'on' | 'off';

interface AppState {
  theme: ThemeName;
  motion: MotionPref;
  highContrast: boolean;
  soundOn: boolean;
  hapticsOn: boolean;
  ambientOn: boolean;
  musicVolume: number; // 0..1
  introSeen: boolean;
  lastVisit: string | null;

  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setMotion: (m: MotionPref) => void;
  setHighContrast: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setAmbient: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  markIntroSeen: () => void;
  touchVisit: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'day',
      motion: 'system',
      highContrast: false,
      soundOn: false,
      hapticsOn: true,
      ambientOn: true,
      musicVolume: 0.5,
      introSeen: false,
      lastVisit: null,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'day' ? 'dusk' : 'day' })),
      setMotion: (motion) => set({ motion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setSound: (soundOn) => set({ soundOn }),
      setHaptics: (hapticsOn) => {
        setHapticsEnabled(hapticsOn);
        set({ hapticsOn });
      },
      setAmbient: (ambientOn) => set({ ambientOn }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      markIntroSeen: () => set({ introSeen: true }),
      touchVisit: () => set({ lastVisit: new Date().toISOString() }),
    }),
    {
      name: 'our-story:settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
