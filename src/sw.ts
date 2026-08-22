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

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'Our Story';
    const body = payload.notification?.body ?? '';
    void self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c) as WindowClient | undefined;
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
