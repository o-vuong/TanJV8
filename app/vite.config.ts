import { defineConfig } from 'vite'
import { TanStackStartVite } from '@tanstack/start/vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    TanStackStartVite(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
})
