import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// VITE_APP_MODE=public: bản landing công khai, không cần PWA.
const IS_PUBLIC = process.env.VITE_APP_MODE === 'public'

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
      disable: IS_PUBLIC,
      // 'prompt' + đăng ký thủ công trong main.tsx: tự quyết lúc nào an toàn để tải lại.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'DQH Quản Lý',
        short_name: 'DQH App',
        description: 'Quản lý công việc và dự án DQH',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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
          '**/assets/BarChart-*.js',
          '**/assets/PieChart-*.js',
          '**/assets/xlsx-*.js',
          '**/assets/Construction-*.js',
          '**/assets/MyTasks-*.js',
          '**/assets/TrainingHub-*.js',
          '**/assets/Finance-*.js',
          '**/assets/Customers-*.js',
          '**/assets/InteriorQuote-*.js',
          '**/assets/QuoteGenerator-*.js',
          '**/assets/proxy-*.js',
        ],
        maximumFileSizeToCacheInBytes: 5000000,
        skipWaiting: false, // chờ main.tsx cho phép (khi app đang ẩn) mới kích hoạt bản mới
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Không cho service worker trả trang app (index.html) khi mở trực tiếp các link
        // API (vd link PDF khái toán /api/khai-toan/...pdf gửi khách) hay công cụ Khái toán.
        navigateFallbackDenylist: [/^\/khai-toan\//, /^\/api\//]
      }
    })
  ],
})
