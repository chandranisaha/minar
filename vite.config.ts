import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // precache the whole build output so the game works offline after the first visit
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { name: 'Money Mohalla', short_name: 'Mohalla', start_url: '/', display: 'standalone', background_color: '#F8EBCB', theme_color: '#92C9D3' },
      workbox: { globPatterns: ['**/*.{js,css,html,webp,png,svg,json,woff2}'], maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
    }),
  ],
  build: { chunkSizeWarningLimit: 700 },
  // unit tests for the pure progress/happy logic and the store; no DOM needed
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
