import { fileURLToPath, URL } from "node:url";

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'ag-grid-react': fileURLToPath(
        new URL('./src/stubs/ag-grid-react', import.meta.url),
      ),
      'ag-grid-community': fileURLToPath(
        new URL('./src/stubs/ag-grid-community', import.meta.url),
      ),
    },
  },
})
