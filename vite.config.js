import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind on all interfaces so localhost + 127.0.0.1 both work on Windows
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    }
  }
})
