import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
// Bản công khai (VITE_APP_MODE=public) chỉ nạp PublicApp; app nội bộ nạp App.
const IS_PUBLIC = import.meta.env.VITE_APP_MODE === 'public'
const Root = IS_PUBLIC ? React.lazy(() => import('./PublicApp')) : React.lazy(() => import('./App.tsx'))
import './index.css'
import { startA11yHelpers } from './utils/a11y'
startA11yHelpers()

// Cập nhật bản mới KHÔNG làm gián đoạn người đang làm việc:
// - kiểm tra bản mới 5 phút/lần và mỗi lần quay lại app (không còn 15 giây/lần tốn mạng 4G ở công trường);
// - có bản mới thì chỉ tải lại khi app đang ẩn (chuyển sang app khác, khoá màn hình) — không bao giờ
//   tải lại giữa lúc đang điền nhật ký hay phiếu.
let updatePending = false;
const applyUpdateIfSafe = () => { if (updatePending && document.visibilityState === 'hidden') updateSW(true); };
const updateSW = IS_PUBLIC ? (() => Promise.resolve()) as unknown as ReturnType<typeof registerSW> : registerSW({
  immediate: true,
  onNeedRefresh() {
    updatePending = true;
    applyUpdateIfSafe();
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => { registration.update(); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
      applyUpdateIfSafe();
    });
  },
});

// Global Error Boundary to catch and display crashes instead of white screen
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    if (error.message?.includes('Failed to fetch dynamically imported module') || error.message?.includes('Importing a module script failed')) {
      const lastReload = sessionStorage.getItem('chunk_reload_time');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
        sessionStorage.setItem('chunk_reload_time', now.toString());
        if ('caches' in window) {
          caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
        }
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
      }
    }
  }
  render() {
    if (this.state.hasError) {
      const handleForceReload = async () => {
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const reg of registrations) {
              await reg.unregister()
            }
          }
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map(k => caches.delete(k)))
          }
          // Unregistering a service worker doesn't instantly release control of
          // the current page - reloading in the same tick can still be served
          // by the outgoing worker. Give the browser a beat to hand back control.
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch(e) {}
        window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now())
      }

      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#fff0f0', minHeight: '100vh' }}>
          <h1 style={{ color: '#c00' }}>⚠️ Ứng dụng đang dùng bản lưu cũ (Cache)</h1>
          <p style={{ color: '#333' }}>Trình duyệt của bạn đang giữ bản lưu cache cũ của trang. Vui lòng bấm nút bên dưới để xóa cache và tải bản mới nhất.</p>
          <pre style={{ background: '#1a1a2e', color: '#e94560', padding: 20, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
            {this.state.error?.message}{'\n'}{this.state.error?.stack}
          </pre>
          <button onClick={handleForceReload} style={{ marginTop: 16, padding: '12px 28px', background: '#7A1216', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
            🔄 Xóa bộ nhớ đệm & Tải lại bản mới nhất
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Global event listener to allow copying and pasting dd/MM/yyyy into any date input
document.addEventListener('paste', (e) => {
    const target = e.target as HTMLInputElement;
    if (target && target.tagName === 'INPUT' && target.type === 'date') {
        const text = e.clipboardData?.getData('text/plain');
        if (!text) return;
        
        const parts = text.trim().split(/[\/\-\.]/);
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (y.length === 2) y = `20${y}`;
            if (d.length === 1) d = `0${d}`;
            if (m.length === 1) m = `0${m}`;
            const iso = `${y}-${m}-${d}`;
            if (!isNaN(Date.parse(iso))) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                nativeInputValueSetter?.call(target, iso);
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
                e.preventDefault();
            }
        }
    }
});

console.log('[DQH App] Starting render...', { env: import.meta.env.MODE })

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <React.Suspense fallback={null}><Root /></React.Suspense>
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('[DQH App] Render call completed.')
} catch (e) {
  console.error('[DQH App] Fatal render error:', e)
  document.getElementById('root')!.innerHTML = `<div style="padding:40px;font-family:sans-serif"><h1 style="color:red">Lỗi khởi động ứng dụng</h1><pre>${e}</pre></div>`
}
