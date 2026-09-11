import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Motamot - Apprendre le français',
        short_name: 'Motamot',
        description: 'Application pour apprendre le vocabulaire français',
        theme_color: '#2d4a3e',
        background_color: '#2d4a3e',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'icons/motamot-bubble-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/motamot-bubble-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/motamot-bubble-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Recordings load only on demand, not as part of the offline app install.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
      }
    })
  ],
})
