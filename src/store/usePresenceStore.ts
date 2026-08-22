/**
 * Real online/offline presence — "online" means the partner's app is
 * actually open and foregrounded right now, not just that the device exists.
 *
 * Firestore has no true onDisconnect (that's an RTDB-only feature), so this
 * uses two complementary signals:
 *  1. Explicit writes on visibilitychange/pagehide — fast and accurate for
 *     the common case (switching apps, closing the tab).
 *  2. A staleness check on the watching side — if the partner's heartbeat
 *     hasn't updated in a while, treat them as offline regardless of what
 *     their doc says (covers crashes, force-quits, lost connectivity).
 */
import { create } from 'zustand';
import { doc, onSnapshot, setDoc, serverTimestamp, Timestamp, type Unsubscribe } from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';

const PRESENCE_COLLECTION = 'presence';
const STALE_MS = 45_000;
const HEARTBEAT_MS = 20_000;

interface PresenceState {
  partnerOnline: boolean;
  partnerLastActive: number | null;
  start: (userId: PersonId, partnerId: PersonId) => void;
  stop: () => void;
}

let heartbeatTimer: number | null = null;
let staleTimer: number | null = null;
let unsubWatch: Unsubscribe | null = null;
let visibilityHandler: (() => void) | null = null;
let unloadHandler: (() => void) | null = null;
let activeUserId: PersonId | null = null;

function writePresence(userId: PersonId, online: boolean) {
  if (!FIREBASE_CONFIGURED || !db) return;
  void setDoc(
    doc(db, PRESENCE_COLLECTION, userId),
    { online, lastActive: serverTimestamp() },
    { merge: true },
  ).catch(() => {});
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  partnerOnline: false,
  partnerLastActive: null,

  start: (userId, partnerId) => {
    get().stop();
    if (!FIREBASE_CONFIGURED || !db) return;

    activeUserId = userId;

    const goOnline = () => {
      if (document.visibilityState === 'visible') writePresence(userId, true);
    };
    const goOffline = () => writePresence(userId, false);

    goOnline();
    heartbeatTimer = window.setInterval(goOnline, HEARTBEAT_MS);

    visibilityHandler = () => {
      if (document.visibilityState === 'visible') goOnline();
      else goOffline();
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    unloadHandler = () => goOffline();
    window.addEventListener('pagehide', unloadHandler);
    window.addEventListener('beforeunload', unloadHandler);

    unsubWatch = onSnapshot(doc(db, PRESENCE_COLLECTION, partnerId), (snap) => {
      const data = snap.data();
      const lastActive = (data?.lastActive as Timestamp | undefined)?.toMillis?.() ?? null;
      set({
        partnerOnline: Boolean(data?.online) && (lastActive === null || Date.now() - lastActive < STALE_MS),
        partnerLastActive: lastActive,
      });
    });

    staleTimer = window.setInterval(() => {
      const { partnerOnline, partnerLastActive } = get();
      if (partnerOnline && partnerLastActive && Date.now() - partnerLastActive > STALE_MS) {
        set({ partnerOnline: false });
      }
    }, 10_000);
  },

  stop: () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (staleTimer) clearInterval(staleTimer);
    if (unsubWatch) unsubWatch();
    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    if (unloadHandler) {
      window.removeEventListener('pagehide', unloadHandler);
      window.removeEventListener('beforeunload', unloadHandler);
    }
    if (activeUserId) writePresence(activeUserId, false);

    heartbeatTimer = null;
    staleTimer = null;
    unsubWatch = null;
    visibilityHandler = null;
    unloadHandler = null;
    activeUserId = null;
    set({ partnerOnline: false, partnerLastActive: null });
  },
}));
