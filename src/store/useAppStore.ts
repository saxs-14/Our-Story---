/**
 * App-wide settings & preferences (persisted locally, wallpaper synced to
 * a shared Firestore doc so both partners see the same chat background).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setHapticsEnabled } from '@/lib/haptics';
import { syncSingleDoc, pullSingleDoc } from '@/lib/firestoreSync';

export type ThemeName = 'day' | 'dusk';
export type MotionPref = 'system' | 'on' | 'off';
export type ChatWallpaperType = 'doodle' | 'velvet' | 'dark' | 'emerald' | 'custom-image' | 'custom-video';

interface WallpaperSync {
  chatWallpaper: ChatWallpaperType;
  chatCustomImageUrl: string | null;
  chatCustomVideoUrl: string | null;
  chatWallpaperBrightness: number;
}

interface AppState {
  theme: ThemeName;
  motion: MotionPref;
  highContrast: boolean;
  soundOn: boolean;
  hapticsOn: boolean;
  ambientOn: boolean;
  notificationsOn: boolean;
  musicVolume: number; // 0..1
  introSeen: boolean;
  lastVisit: string | null;

  // WhatsApp Chat Wallpaper options.
  chatWallpaper: ChatWallpaperType;
  // Durable source of truth: a Firebase Storage download URL (or, for video,
  // an optionally user-pasted hosted URL). Synced across devices/partners.
  chatCustomImageUrl: string | null;
  chatCustomVideoUrl: string | null;
  // Local IndexedDB media ids — resolved instantly via useMediaUrl() so the
  // wallpaper shows immediately on this device while the cloud upload runs
  // (or forever, if Firebase isn't configured).
  chatCustomImageMediaId: string | null;
  chatCustomVideoMediaId: string | null;
  // 0 = fully dimmed (black), 100 = full brightness, no dimming overlay.
  chatWallpaperBrightness: number;

  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setMotion: (m: MotionPref) => void;
  setHighContrast: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
  setAmbient: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  markIntroSeen: () => void;
  touchVisit: () => void;
  setChatWallpaper: (w: ChatWallpaperType) => void;
  setChatCustomImage: (mediaId: string | null, url: string | null) => void;
  setChatCustomVideo: (mediaId: string | null, url: string | null) => void;
  setChatWallpaperBrightness: (v: number) => void;
  /** Pull the shared wallpaper doc so both partners see the same background. */
  pullWallpaperFromFirestore: () => Promise<void>;
}

function syncWallpaper(s: WallpaperSync) {
  void syncSingleDoc('settings', 'wallpaper', {
    chatWallpaper: s.chatWallpaper,
    chatCustomImageUrl: s.chatCustomImageUrl,
    chatCustomVideoUrl: s.chatCustomVideoUrl,
    chatWallpaperBrightness: s.chatWallpaperBrightness,
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'day',
      motion: 'system',
      highContrast: false,
      soundOn: false,
      hapticsOn: true,
      ambientOn: true,
      notificationsOn: true,
      musicVolume: 0.5,
      introSeen: false,
      lastVisit: null,

      chatWallpaper: 'doodle',
      chatCustomImageUrl: null,
      chatCustomVideoUrl: null,
      chatCustomImageMediaId: null,
      chatCustomVideoMediaId: null,
      chatWallpaperBrightness: 70,

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
      setNotifications: (notificationsOn) => set({ notificationsOn }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      markIntroSeen: () => set({ introSeen: true }),
      touchVisit: () => set({ lastVisit: new Date().toISOString() }),
      setChatWallpaper: (chatWallpaper) => {
        set({ chatWallpaper });
        syncWallpaper(get());
      },
      setChatCustomImage: (mediaId, url) => {
        set({
          chatCustomImageMediaId: mediaId,
          chatCustomImageUrl: url,
          chatWallpaper: 'custom-image',
        });
        syncWallpaper(get());
      },
      setChatCustomVideo: (mediaId, url) => {
        set({
          chatCustomVideoMediaId: mediaId,
          chatCustomVideoUrl: url,
          chatWallpaper: 'custom-video',
        });
        syncWallpaper(get());
      },
      setChatWallpaperBrightness: (v) => {
        const chatWallpaperBrightness = Math.max(0, Math.min(100, Math.round(v)));
        set({ chatWallpaperBrightness });
        syncWallpaper(get());
      },
      pullWallpaperFromFirestore: async () => {
        const cloud = await pullSingleDoc<WallpaperSync>('settings', 'wallpaper');
        if (!cloud) return;
        set({
          chatWallpaper: cloud.chatWallpaper,
          chatCustomImageUrl: cloud.chatCustomImageUrl,
          chatCustomVideoUrl: cloud.chatCustomVideoUrl,
          chatWallpaperBrightness: cloud.chatWallpaperBrightness ?? 70,
        });
      },
    }),
    {
      name: 'our-story:settings',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // See useAuthStore.ts — without a migrate fn, a version bump with no
      // matching persisted version silently wipes this store back to defaults.
      migrate: (persisted) => persisted as AppState,
    },
  ),
);
