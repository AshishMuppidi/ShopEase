import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev/preview server runs on port 3000 to match the backend CORS
// allow-list (cors.allowed-origin defaults to http://localhost:3000).
// Running on Vite's default 5173 would cause every API call to be blocked.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
