/// <reference lib="webworker" />
/**
 * Custom service worker (vite-plugin-pwa injectManifest strategy).
 *
 * This replaces the auto-generated Workbox SW with one we author directly,
 * because Firebase Cloud Messaging's background push handler needs to run
 * inside the SAME service worker as the app's offline caching — two
 * separate service workers both registered at the root scope fight over
 * which one controls fetch/push events. Precaching config here mirrors
 * exactly what the previous `workbox.*` generateSW options did.
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/],
  }),
);

registerRoute(
  ({ request }) => ['image', 'audio', 'video', 'font'].includes(request.destination),
  new CacheFirst({
    cacheName: 'our-story-media',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// ── Firebase Cloud Messaging — background push (app closed / backgrounded) ──
// Config is public (client-side identifiers, not secrets) and safe to embed
// directly since a service worker can't read import.meta.env at runtime the
// way the main app does, but Vite's build still statically replaces these
// at build time same as any other module, so this stays in sync with .env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Single shared tag for every chat-push notification shown by this service
// worker. Same tag means the OS/browser replaces an existing shown
// notification instead of stacking a second one alongside it, which is the
// safety net if the platform's own auto-display (triggered by the FCM
// payload's `notification` field) fires in addition to this explicit call.
const CHAT_NOTIFICATION_TAG = 'our-story-chat';

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // This is the ONLY push-display path in this service worker. A previous
  // version also had a raw `self.addEventListener('push', ...)` "fallback"
  // handler that showed a second notification for the same push (different
  // tag, so it didn't replace this one — it stacked). This app only ever
  // sends FCM-shaped pushes from functions/index.js's onNewMessage, which
  // onBackgroundMessage already fully covers, so the fallback caught
  // nothing real and only duplicated. Do not re-add a second listener here.
  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title || (payload.data?.title as string) || 'Our Story ❤️';
    const body = payload.notification?.body || (payload.data?.body as string) || 'New message from your partner';
    void self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: CHAT_NOTIFICATION_TAG,
      renotify: true,
      data: payload.data || { url: '/chat' },
    } as NotificationOptions & { vibrate?: number[] });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = (event.notification.data?.url as string) || '/';
  // The app uses HashRouter, which only ever reads the URL's #fragment — a
  // bare path like "/chat" opens with an empty hash and lands on Home, not
  // Chat. Every navigation here needs the #-prefixed form.
  const hashUrl = `${self.location.origin}/#${path}`;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c) as WindowClient | undefined;
      if (existing) {
        // Previously only called .focus() here — that brings an
        // already-open tab to the front but never navigates it, so tapping
        // a notification while the app was merely backgrounded (the common
        // case — most people don't force-quit a PWA) left the user on
        // whatever page they'd last been viewing instead of Chat.
        await existing.focus();
        if ('navigate' in existing) {
          try {
            await existing.navigate(hashUrl);
          } catch {
            // Same-origin navigate() can be rejected by some engines —
            // the tab is still focused at this point, just not routed;
            // better than throwing and leaving notificationclick unhandled.
          }
        }
        return;
      }
      return self.clients.openWindow(hashUrl);
    }),
  );
});
