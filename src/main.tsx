import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

// registerType: 'autoUpdate' means a detected update is activated and the
// page reloaded automatically — no user prompt. We additionally poll for
// updates so tabs left open for a long time still pick up new deploys
// instead of only checking on the next full navigation/reload.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version detected! Reloading to apply latest Vercel build...');
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    // Check for new Vercel deployments every 15 seconds
    setInterval(() => { registration.update(); }, 15 * 1000);
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
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map(k => caches.delete(k)))
          }
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (const reg of registrations) {
              await reg.unregister()
            }
          }
        } catch(e) {}
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now()
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
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('[DQH App] Render call completed.')
} catch (e) {
  console.error('[DQH App] Fatal render error:', e)
  document.getElementById('root')!.innerHTML = `<div style="padding:40px;font-family:sans-serif"><h1 style="color:red">Lỗi khởi động ứng dụng</h1><pre>${e}</pre></div>`
}
