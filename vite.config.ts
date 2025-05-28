import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dice/',  // Set base path for deployment at website.com/dice
  build: {
    outDir: 'dist',  // Output directory
  },
})
