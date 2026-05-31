import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/options-drill/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Options Drill',
        short_name: 'OptionsDrill',
        description: 'オプション取引フラッシュカード学習アプリ',
        theme_color: '#0e0e0f',
        background_color: '#0e0e0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/options-drill/',
        start_url: '/options-drill/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
