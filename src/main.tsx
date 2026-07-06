import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

// registerType: 'autoUpdate' means a detected update is activated and the
// page reloaded automatically — no user prompt. We additionally poll for
// updates so tabs left open for a long time still pick up new deploys
// instead of only checking on the next full navigation/reload.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => { registration.update() }, 60 * 60 * 1000)
  },
})

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
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#fff0f0', minHeight: '100vh' }}>
          <h1 style={{ color: '#c00' }}>⚠️ Ứng dụng gặp lỗi</h1>
          <p style={{ color: '#333' }}>Vui lòng liên hệ quản trị viên.</p>
          <pre style={{ background: '#1a1a2e', color: '#e94560', padding: 20, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
            {this.state.error?.message}{'\n'}{this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', background: '#7A1216', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Tải lại trang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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
