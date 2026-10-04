import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Multi-page build: public site (/) + admin (/admin/)
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
})
