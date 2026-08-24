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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
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
          'A private digital world for Phathutshedzo & Lihle — letters, memories, reasons, and a living garden of love.',
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
        // Vite 8 (via Rolldown) dropped the object form of manualChunks —
        // https://vite.dev/guide/migration "The object form output.manualChunks
        // option is not supported anymore." Rewritten as the function form,
        // matching on the exact node_modules/<pkg>/ path segment (not a bare
        // substring check) so e.g. 'react' doesn't also swallow 'react-dom' or
        // '@react-three/fiber' — same chunk membership as the old object form.
        manualChunks(id) {
          if (
            id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/fiber/') ||
            id.includes('node_modules/@react-three/drei/')
          ) {
            return 'three';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/zustand/')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
});
