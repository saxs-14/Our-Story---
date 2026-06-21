/**
 * Cross-platform notification helper for chat messages.
 *
 * • Android app (Capacitor)  → @capacitor/local-notifications (system shade)
 * • Desktop / Android browser → Web Notification API
 * • iPhone PWA / unsupported  → no-ops here; the in-app banner (ChatNotifier)
 *   is the fallback, since iOS Safari blocks the Notification API without a
 *   push service.
 *
 * These fire while the app is open or alive in the background. A fully
 * swiped-closed app can't notify without FCM push (intentionally out of scope).
 */
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();
const hasWebNotif = () => typeof window !== 'undefined' && 'Notification' in window;

let tapRegistered = false;
let notifId = 1;

/** Ask the user to allow notifications. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted';
    } catch {
      return false;
    }
  }
  if (hasWebNotif()) {
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      return (await Notification.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

/** Post a notification for an incoming chat message. */
export async function showMessageNotification(title: string, body: string): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId++,
            title,
            body,
            extra: { route: '/chat' },
          },
        ],
      });
    } catch {
      /* ignore */
    }
    return;
  }

  if (hasWebNotif() && Notification.permission === 'granted') {
    try {
      const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
      const n = new Notification(title, { body, icon, tag: 'our-story-chat', renotify: true } as NotificationOptions);
      n.onclick = () => {
        window.focus?.();
        window.location.hash = '#/chat';
        n.close();
      };
    } catch {
      /* iOS Safari may throw — the in-app banner covers this */
    }
  }
}

/** On native, route to chat when a notification is tapped. Registers once. */
export function registerNotificationTap(onTap: () => void): void {
  if (!isNative() || tapRegistered) return;
  tapRegistered = true;
  import('@capacitor/local-notifications')
    .then(({ LocalNotifications }) => {
      void LocalNotifications.addListener('localNotificationActionPerformed', () => onTap());
    })
    .catch(() => {
      tapRegistered = false;
    });
}
