import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The base path is configurable so the same build can ship to a custom domain
// or Netlify ("/") and to GitHub Pages ("/<repo>/"). Set VITE_BASE at build time.
const base = process.env.VITE_BASE ?? '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'robots.txt',
        'offline.html',
      ],
      manifest: {
        name: 'Our Story ❤️',
        short_name: 'Our Story',
        description:
          'A private digital world for Phathutshedzo & Ayanda — letters, memories, reasons, and a living garden of love.',
        theme_color: '#1a0f1a',
        background_color: '#1a0f1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        lang: 'en',
        categories: ['lifestyle', 'personalization'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Daily Note',
            short_name: 'Daily',
            url: `${base}#/`,
            description: "Today's love note",
          },
          {
            name: 'Open When Vault',
            short_name: 'Vault',
            url: `${base}#/vault`,
            description: 'Open a letter for how you feel',
          },
          {
            name: 'Our Wrapped',
            short_name: 'Wrapped',
            url: `${base}#/wrapped`,
            description: 'Replay our story',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json,webmanifest}'],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              ['image', 'audio', 'video', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'our-story-media',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
        },
      },
    },
  },
});
