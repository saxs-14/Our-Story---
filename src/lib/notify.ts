/**
 * Cross-platform notification helper for chat messages and garden watering reminders.
 *
 * • Android app (Capacitor)  → @capacitor/local-notifications (system shade, works when locked/outside app)
 * • Desktop / Android browser → Web Notification API + Service Worker
 * • In-app romantic toasts   → Fallback and immediate celebration
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
      const n = new Notification(title, {
        body,
        icon,
        tag: 'our-story-chat',
        renotify: true,
      } as NotificationOptions);
      n.onclick = () => {
        window.focus?.();
        window.location.hash = '#/chat';
        n.close();
      };
    } catch {
      /* ignore */
    }
  }
}

/** Post or schedule a garden reminder notification (e.g. "Your garden needs water 🌱") */
export async function showGardenNotification(title: string, body: string, delaySeconds = 0): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') return;

      const at = delaySeconds > 0 ? new Date(Date.now() + delaySeconds * 1000) : undefined;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title,
            body,
            schedule: at ? { at } : undefined,
            extra: { route: '/garden' },
          },
        ],
      });
    } catch {
      /* ignore */
    }
    return;
  }

  if (hasWebNotif() && Notification.permission === 'granted') {
    const trigger = () => {
      try {
        const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
        const n = new Notification(title, {
          body,
          icon,
          tag: 'our-story-garden',
        } as NotificationOptions);
        n.onclick = () => {
          window.focus?.();
          window.location.hash = '#/garden';
          n.close();
        };
      } catch {
        /* ignore */
      }
    };

    if (delaySeconds > 0) {
      setTimeout(trigger, delaySeconds * 1000);
    } else {
      trigger();
    }
  }
}

/** On native, route to appropriate page when a notification is tapped. */
export function registerNotificationTap(onTap: (route?: string) => void): void {
  if (!isNative() || tapRegistered) return;
  tapRegistered = true;
  import('@capacitor/local-notifications')
    .then(({ LocalNotifications }) => {
      void LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const route = notification.notification?.extra?.route as string | undefined;
        onTap(route);
      });
    })
    .catch(() => {
      tapRegistered = false;
    });
}
