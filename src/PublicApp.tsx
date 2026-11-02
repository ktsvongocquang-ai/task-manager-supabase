// Bản công khai (landing, portfolio, link khách xem tiến độ) — build riêng khi VITE_APP_MODE=public.
// Không có đăng nhập, không có app nội bộ, không service worker: khách lạ vào nhanh, lỗi app nội bộ không kéo sập trang này.
import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

const PortfolioLanding = lazy(() => import('./pages/portfolio/PortfolioLanding').then(m => ({ default: m.PortfolioLanding })))
const ClientView = lazy(() => import('./pages/client/ClientView').then(m => ({ default: m.ClientView })))

const Loading = () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui' }}>Đang tải…</div>

export default function PublicApp() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<PortfolioLanding isPreview={true} />} />
          <Route path="/p" element={<PortfolioLanding isPreview={true} />} />
          <Route path="/p/:token" element={<PortfolioLanding />} />
          <Route path="/c/:token" element={<ClientView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
