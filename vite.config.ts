import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 700 },
  // unit tests for the pure progress/happy logic and the store; no DOM needed
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
