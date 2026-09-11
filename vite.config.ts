import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The glob below already includes every icon; avoid duplicate entries.
      includeManifestIcons: false,
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
        manifestTransforms: [async entries => {
          const bytes = entries.reduce((sum, entry) => sum + entry.size, 0);
          if (entries.some(entry => entry.url.startsWith('audio/'))) {
            throw new Error('Audio must remain on demand; remove it from the offline precache.');
          }
          if (bytes > 2_500_000) {
            throw new Error(`Offline download is ${(bytes / 1_000_000).toFixed(2)} MB, above the 2.5 MB budget. Optimize assets before publishing.`);
          }
          return { manifest: entries, warnings: [] };
        }],
      }
    })
  ],
})
