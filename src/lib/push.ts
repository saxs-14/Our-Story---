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
import { Capacitor } from '@capacitor/core';
import { app, db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const isNative = () => Capacitor.isNativePlatform();

let messaging: Messaging | null = null;
let nativeListenersRegistered = false;

export async function isPushSupported(): Promise<boolean> {
  if (!FIREBASE_CONFIGURED) return false;
  // Native Android goes through @capacitor/push-notifications (real FCM,
  // delivered by the OS even after the app process is killed) instead of
  // Web Push — a WebView-hosted service worker generally can't be woken by
  // push once Android has killed the hosting app's process, so Web Push
  // alone is unreliable for "app fully closed" delivery on the APK.
  if (isNative()) return true;
  if (!VAPID_KEY || !app) return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

async function registerNativePush(userId: PersonId): Promise<'granted' | 'denied'> {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const current = await PushNotifications.checkPermissions();
  let status = current.receive;
  if (status === 'prompt' || status === 'prompt-with-rationale') {
    status = (await PushNotifications.requestPermissions()).receive;
  }
  if (status !== 'granted') return 'denied';

  if (!nativeListenersRegistered) {
    nativeListenersRegistered = true;
    await PushNotifications.addListener('registration', (token) => {
      if (!db) return;
      void setDoc(doc(db, 'presence', userId), { fcmToken: token.value }, { merge: true }).catch(() => {});
    });
    // Errors here just mean this device won't get closed-app push this
    // session — foreground delivery via the Firestore listener still works.
    await PushNotifications.addListener('registrationError', () => {});
  }

  await PushNotifications.register();
  return 'granted';
}

let pushTapRegistered = false;

/** On native, route to the chat when a background push notification is tapped. */
export function registerPushTap(onTap: () => void): void {
  if (!isNative() || pushTapRegistered) return;
  pushTapRegistered = true;
  import('@capacitor/push-notifications')
    .then(({ PushNotifications }) => {
      void PushNotifications.addListener('pushNotificationActionPerformed', onTap);
    })
    .catch(() => {
      pushTapRegistered = false;
    });
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
  if (!(await isPushSupported()) || !db) return 'unsupported';

  if (isNative()) {
    try {
      return await registerNativePush(userId);
    } catch {
      return 'unsupported';
    }
  }

  if (!app) return 'unsupported';
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
