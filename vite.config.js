import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
    host: 'localhost',
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env': {},
  },
  build: {
    sourcemap: true,
  },
})
