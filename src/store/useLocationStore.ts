/**
 * Foreground-only live location sharing. Tracking only runs while the app
 * is open on screen — no background service, no persistent notification,
 * no special Android "allow all the time" permission. Off by default;
 * turning it off immediately stops showing your position to your partner
 * (no silent/stale trail left behind).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, onSnapshot, setDoc, serverTimestamp, Timestamp, type Unsubscribe } from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';
import { haversineMeters } from '@/lib/geo';

const LOCATIONS_COLLECTION = 'locations';
// A watchPosition callback can fire every few seconds while moving — only
// write to Firestore when it's actually meaningful, to bound write cost,
// battery, and Cloud Function invocations.
const MIN_WRITE_METERS = 50;
const MIN_WRITE_INTERVAL_MS = 60_000;
// A partner's last-known position older than this is treated as stale and
// not shown as if it were current.
const STALE_MS = 30 * 60_000;

export interface MyLocation {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: number;
}

export interface PartnerLocation {
  lat: number;
  lng: number;
  updatedAt: number;
  sharing: boolean;
}

interface LocationState {
  sharingOn: boolean;
  myLocation: MyLocation | null;
  partnerLocation: PartnerLocation | null;
  geoError: string | null;
  start: (userId: PersonId, partnerId: PersonId) => void;
  stop: () => void;
  setSharing: (userId: PersonId, on: boolean) => void;
}

let watchId: number | null = null;
let unsubPartner: Unsubscribe | null = null;
let lastWritten: { lat: number; lng: number; ts: number } | null = null;

function writeLocation(userId: PersonId, sharing: boolean, coords?: GeolocationCoordinates) {
  if (!FIREBASE_CONFIGURED || !db) return;
  const data: Record<string, unknown> = { sharing, updatedAt: serverTimestamp() };
  if (coords) {
    data.lat = coords.latitude;
    data.lng = coords.longitude;
    data.accuracy = coords.accuracy;
  }
  void setDoc(doc(db, LOCATIONS_COLLECTION, userId), data, { merge: true }).catch(() => {});
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      sharingOn: false,
      myLocation: null,
      partnerLocation: null,
      geoError: null,

      start: (userId, partnerId) => {
        get().stop();
        if (!FIREBASE_CONFIGURED || !db) return;

        unsubPartner = onSnapshot(doc(db, LOCATIONS_COLLECTION, partnerId), (snap) => {
          const data = snap.data();
          if (!data || !data.sharing) {
            set({ partnerLocation: null });
            return;
          }
          const updatedAt = (data.updatedAt as Timestamp | undefined)?.toMillis?.() ?? Date.now();
          set({
            partnerLocation: {
              lat: data.lat,
              lng: data.lng,
              updatedAt,
              sharing: Date.now() - updatedAt < STALE_MS,
            },
          });
        });

        if (get().sharingOn) get().setSharing(userId, true);
      },

      stop: () => {
        if (watchId !== null && typeof navigator !== 'undefined') {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (unsubPartner) {
          unsubPartner();
          unsubPartner = null;
        }
        lastWritten = null;
        set({ myLocation: null, partnerLocation: null });
      },

      setSharing: (userId, on) => {
        set({ sharingOn: on, geoError: null });

        if (!on) {
          if (watchId !== null && typeof navigator !== 'undefined') {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          lastWritten = null;
          set({ myLocation: null });
          writeLocation(userId, false);
          return;
        }

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ geoError: 'Location is not available on this device.', sharingOn: false });
          return;
        }

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            set({ myLocation: { lat: latitude, lng: longitude, accuracy, updatedAt: Date.now() } });

            const shouldWrite =
              !lastWritten ||
              Date.now() - lastWritten.ts > MIN_WRITE_INTERVAL_MS ||
              haversineMeters(latitude, longitude, lastWritten.lat, lastWritten.lng) > MIN_WRITE_METERS;
            if (!shouldWrite) return;

            lastWritten = { lat: latitude, lng: longitude, ts: Date.now() };
            writeLocation(userId, true, pos.coords);
          },
          () => {
            set({ geoError: "Couldn't get your location — check the permission was granted.", sharingOn: false });
          },
          { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
        );
      },
    }),
    {
      name: 'our-story:location',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Never resume tracking silently from a persisted flag without the OS
      // permission prompt happening again in this session's context — only
      // persist the user's own toggle *preference*; start() re-applies it
      // through setSharing(), which re-requests via watchPosition itself.
      partialize: (state) => ({ sharingOn: state.sharingOn }),
    },
  ),
);
