/**
 * Web Push (Firebase Cloud Messaging) — lets the app notify about new
 * messages/calls even when it's closed or the phone is locked, on
 * platforms that support it (Android/desktop Chrome/Firefox/Edge; iOS only
 * when installed to the home screen, iOS 16.4+).
 *
 * No-ops safely wherever push isn't configured (VITE_FIREBASE_VAPID_KEY
 * unset) or unsupported by the browser — the rest of the app doesn't
 * depend on this working.
 */
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let messaging: Messaging | null = null;

export async function isPushSupported(): Promise<boolean> {
  if (!FIREBASE_CONFIGURED || !VAPID_KEY || !app) return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export function currentNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Request permission, register for push, and save the device token so the
 * other partner's messages/calls can reach this device in the background. */
export async function enablePushNotifications(
  userId: PersonId,
): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!(await isPushSupported()) || !app || !db) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  try {
    if (!messaging) messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (token) {
      await setDoc(doc(db, 'presence', userId), { fcmToken: token }, { merge: true });
    }
    // Foreground messages are already covered by ChatNotifier/CallModal's
    // live Firestore listeners — registering this just satisfies the SDK's
    // expectation that foreground pushes have a handler.
    onMessage(messaging, () => {});
    return 'granted';
  } catch {
    return 'unsupported';
  }
}
