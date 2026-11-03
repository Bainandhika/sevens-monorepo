import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * @interface PWAManifestConfig
 * @property {'7-an (Tujuhan Tactical)'} name
 * @property {'7-an'} short_name
 * @property {'#FFE600'} theme_color
 * @property {'#F5F0EA'} background_color
 * @property {'standalone'} display
 * @property {'portrait'} orientation
 */

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'game.wasm', 'wasm_exec.js', 'robots.txt'],
      manifest: {
        name: '7-an (Tujuhan Tactical)',
        short_name: '7-an',
        description: 'Multiplayer & AI Sevens Card Game (Neo-Brutalism Tujuhan Tactical with Go WebAssembly)',
        theme_color: '#FFE600',
        background_color: '#F5F0EA',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to accommodate game.wasm (~4.6MB)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
})
