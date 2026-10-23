import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The NestJS API serves its routes at the root (/auth, /users, /people, /roles).
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/people': 'http://localhost:3000',
      '/roles': 'http://localhost:3000',
      '/platform': 'http://localhost:3000',
      '/me': 'http://localhost:3000',
    },
  },
})
