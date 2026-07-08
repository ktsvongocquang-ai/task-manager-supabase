import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'DQH Quản Lý',
        short_name: 'DQH App',
        description: 'Quản lý công việc và dự án DQH',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Rarely-visited routes: skip background precaching on first load to cut
        // data usage. They still load normally (uncached) when a user opens them.
        globIgnores: [
          '**/assets/MarketingApp-*.js',
          '**/assets/PortfolioLanding-*.js',
          '**/assets/PrototypeBoard-*.js',
        ],
        maximumFileSizeToCacheInBytes: 5000000,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      }
    })
  ],
})
