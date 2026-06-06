import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Background update: new service worker installs silently and takes
      // over on next navigation — no reinstall needed, no prompt shown
      registerType: 'autoUpdate',

      // Inject the service worker registration into the app entry point
      injectRegister: 'auto',

      includeAssets: ['favicon.svg', 'icons/*.png'],

      manifest: {
        name: 'AquaBill',
        short_name: 'AquaBill',
        description: 'Water Billing Automation System',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },

      workbox: {
        // Cache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Skip waiting: new SW activates immediately in the background
        // without waiting for the old one to be discarded
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // ── API data caching (NetworkFirst) ──────────────────────────
          // Tries live network first; if that fails within 5s it falls
          // back to the last cached response so pages never go blank.
          // Covers both dev proxy (/api/...) and production same-origin.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/property'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-properties',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/invoice'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-invoices',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: { statuses: [200] }
            }
          },

          // ── Billing & WhatsApp writes: NetworkOnly ───────────────────
          // These must NEVER be served from cache — always hit the server
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/billing'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/whatsapp'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/auth'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
