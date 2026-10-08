import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Chemins relatifs : le site fonctionne quel que soit le nom du dépôt GitHub Pages.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
