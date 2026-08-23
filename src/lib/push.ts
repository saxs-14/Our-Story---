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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { app, db, auth, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const isNative = () => Capacitor.isNativePlatform();

let messaging: Messaging | null = null;
let nativeListenersRegistered = false;
// The 'registration' listener below is attached once and lives for the
// whole app session; it must not close over a specific userId, or a later
// account switch on the same device (or shared testing device) would keep
// silently writing tokens to the FIRST user's presence doc forever.
let activePushUserId: PersonId | null = null;
// The web path's catch-all used to swallow the real error entirely, which
// makes "why doesn't push work on my iPhone" unanswerable from the outside —
// keep the last one around so the Settings diagnostics panel can show it.
let lastPushError: string | null = null;

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

  activePushUserId = userId;

  if (!nativeListenersRegistered) {
    nativeListenersRegistered = true;
    await PushNotifications.addListener('registration', (token) => {
      if (!db || !activePushUserId) return;
      void setDoc(doc(db, 'presence', activePushUserId), { fcmToken: token.value }, { merge: true }).catch(() => {});
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

/**
 * Platform-aware permission check that never prompts. On native this reads
 * the real OS permission via @capacitor/push-notifications — the web
 * `Notification.permission` API doesn't reliably reflect it inside a
 * Capacitor WebView, which was causing Settings to show "Enable" even when
 * push was already granted on Android.
 */
export async function checkNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (isNative()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { receive } = await PushNotifications.checkPermissions();
      if (receive === 'granted') return 'granted';
      if (receive === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'unsupported';
    }
  }
  return currentNotificationPermission();
}

/** Request permission, register for push, and save the device token so the
 * other partner's messages/calls can reach this device in the background. */
export async function enablePushNotifications(
  userId: PersonId,
): Promise<'granted' | 'denied' | 'unsupported'> {
  lastPushError = null;
  if (!(await isPushSupported())) {
    lastPushError = 'isPushSupported() returned false — see getPushDiagnostics() for why';
    return 'unsupported';
  }
  if (!db) {
    lastPushError = 'Firestore not initialized (FIREBASE_CONFIGURED is false)';
    return 'unsupported';
  }

  if (isNative()) {
    try {
      return await registerNativePush(userId);
    } catch (err) {
      lastPushError = err instanceof Error ? err.message : String(err);
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
    } else {
      lastPushError = 'getToken() resolved with no token';
    }
    // Foreground messages are already covered by ChatNotifier/CallModal's
    // live Firestore listeners — registering this just satisfies the SDK's
    // expectation that foreground pushes have a handler.
    onMessage(messaging, () => {});
    return 'granted';
  } catch (err) {
    // Most commonly, on Safari/iOS: a getToken()/subscribe() failure, or the
    // presence-doc setDoc() being rejected by Firestore rules because this
    // device was never actually signed into Firebase Auth in the first
    // place (see getPushDiagnostics().signedIn).
    lastPushError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return 'unsupported';
  }
}

export function getLastPushError(): string | null {
  return lastPushError;
}

export interface PushDiagnostics {
  platform: 'native' | 'web';
  userAgent: string;
  isIOS: boolean;
  /** Only meaningful on iOS: must be true (installed to Home Screen) for Web Push to be possible at all. */
  isStandalone: boolean;
  firebaseConfigured: boolean;
  vapidKeyConfigured: boolean;
  /** Whether this device currently has a real Firebase Auth session — a missing one silently
   *  breaks push (and all cloud sync) because Firestore rules reject unauthenticated writes. */
  signedIn: boolean;
  signedInAs: string | null;
  serviceWorkerApiPresent: boolean;
  pushManagerApiPresent: boolean;
  notificationApiPresent: boolean;
  pushSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  /** Whether a token is actually saved server-side right now for this account (any device). */
  tokenSavedInFirestore: boolean;
  lastError: string | null;
}

/** Full snapshot of push readiness — built for the Settings diagnostics panel so
 * "does push work on my iPhone" has a concrete, on-screen answer instead of a guess. */
export async function getPushDiagnostics(userId: PersonId | null): Promise<PushDiagnostics> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  let tokenSavedInFirestore = false;
  if (userId && db) {
    try {
      const snap = await getDoc(doc(db, 'presence', userId));
      tokenSavedInFirestore = Boolean(snap.exists() && snap.data()?.fcmToken);
    } catch {
      // Can't read it (e.g. not signed in) — leave as false, signedIn already covers why.
    }
  }

  return {
    platform: isNative() ? 'native' : 'web',
    userAgent: ua,
    isIOS,
    isStandalone,
    firebaseConfigured: FIREBASE_CONFIGURED,
    vapidKeyConfigured: Boolean(VAPID_KEY),
    signedIn: Boolean(auth?.currentUser),
    signedInAs: auth?.currentUser?.email ?? null,
    serviceWorkerApiPresent: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    pushManagerApiPresent: typeof window !== 'undefined' && 'PushManager' in window,
    notificationApiPresent: typeof window !== 'undefined' && 'Notification' in window,
    pushSupported: await isPushSupported(),
    permission: await checkNotificationPermission(),
    tokenSavedInFirestore,
    lastError: lastPushError,
  };
}
