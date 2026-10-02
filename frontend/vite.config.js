import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules') && /react|react-dom|react-router|scheduler/.test(id)) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.js'],
    include: ['src/test/**/*.test.js'],
    globals: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
