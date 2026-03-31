import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useClientData } from './useClientData'
import {
  HardHat, Lock, BarChart2, BookOpen, CreditCard, Flag,
  X, ZoomIn, AlertCircle
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

// ─── Helpers ────────────────────────────────────────────────
const fmtDate = (d: string | null) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const diffDays = (a: string | null, b: string | null) => {
  if (!a || !b) return null
  return Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

const fmtMoney = (n: number | null) => {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`
  return n.toLocaleString('vi-VN') + ' đ'
}

const riskColors: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
  'Thấp': 'text-emerald-600 bg-emerald-50',
  'Trung bình': 'text-amber-600 bg-amber-50',
  'Cao': 'text-red-600 bg-red-50',
}

// ─── Progress Ring ───────────────────────────────────────────
const ProgressRing = ({ pct }: { pct: number }) => {
  const r = 40; const stroke = 7
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={100} height={100} className="drop-shadow-lg">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle cx={50} cy={50} r={r} fill="none" stroke="url(#pg)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <text x={50} y={50} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={18} fontWeight={800}>{pct}%</text>
    </svg>
  )
}


// ─── MAIN COMPONENT ──────────────────────────────────────────
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <X size={18} className="text-white" />
      </button>
      <motion.img
        src={src} alt="Photo"
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="max-w-full max-h-[85vh] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />
    </motion.div>
  </AnimatePresence>
)

// ─── MAIN COMPONENT ──────────────────────────────────────────
type ViewState = 'loading' | 'not_found' | 'gate' | 'authed'
type Tab = 'overview' | 'logs' | 'payment' | 'milestones'

export const ClientView = () => {
  const { token = '' } = useParams<{ token: string }>()
  const { project, tasks, logs, milestones, payments, loading, error } = useClientData(token)
  const SESSION_KEY = `ca_${token}`

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [tab, setTab] = useState<Tab>('overview')
  const [pass, setPass] = useState('')
  const [wrong, setWrong] = useState(false)
  const [shake, setShake] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Determine initial state
  useEffect(() => {
    if (loading) { setViewState('loading'); return }
    if (error || !project) { setViewState('not_found'); return }
    // Check sessionStorage for persisted auth
    if (sessionStorage.getItem(SESSION_KEY) === '1') { setViewState('authed'); return }
    setViewState('gate')
  }, [loading, error, project])

  const handleLogin = () => {
    if (!project?.client_password) {
      // No password set — allow free access
      sessionStorage.setItem(SESSION_KEY, '1')
      setViewState('authed')
      return
    }
    if (pass === project.client_password) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setViewState('authed')
    } else {
      setWrong(true); setShake(true)
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setWrong(false), 3000)
      setPass('')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setViewState('gate')
    setPass('')
  }

  const today = new Date().toISOString().split('T')[0]
  const daysLeft = project ? diffDays(project.handover_date, today) : null
  const daysElapsed = project ? diffDays(today, project.start_date) : null
  const pct = project?.progress ?? 0

  // ── LOADING ──
  if (viewState === 'loading') return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm font-medium">Đang tải thông tin công trình...</p>
      </div>
    </div>
  )

  // ── NOT FOUND ──
  if (viewState === 'not_found') return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Không tìm thấy công trình</h2>
        <p className="text-white/50 text-sm">Mã QR không hợp lệ hoặc công trình đã bị xóa.</p>
      </div>
    </div>
  )

  // ── PASSWORD GATE ──
  if (viewState === 'gate' && project) return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4"
      style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <div className={`w-full max-w-sm ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
        `}</style>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-xl">
              <span className="text-[#7A1216] font-black text-xl tracking-tight">DQH</span>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex justify-center mb-5">
            <ProgressRing pct={pct} />
          </div>

          {/* Project info */}
          <div className="text-center mb-7">
            <h1 className="text-white font-black text-xl leading-snug">{project.name}</h1>
            {project.address && <p className="text-white/45 text-xs mt-1">{project.address}</p>}
            {project.handover_date && (
              <p className="text-indigo-300/80 text-xs mt-2 font-medium">
                🏗 Dự kiến bàn giao: {fmtDate(project.handover_date)}
              </p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-3">
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Nhập mã truy cập ••••••"
              className="w-full bg-white/12 border border-white/20 text-white text-center text-lg tracking-[0.4em] rounded-2xl py-4 outline-none focus:border-indigo-400/60 placeholder:text-white/30 placeholder:tracking-normal transition-all"
              autoComplete="one-time-code"
            />
            {wrong && (
              <p className="text-red-400 text-xs text-center font-medium animate-in fade-in">
                Mã không đúng, vui lòng thử lại
              </p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/25"
            >
              Xem tiến độ công trình →
            </button>
          </div>

          {/* Footer */}
          <p className="text-white/25 text-[10px] text-center mt-5">
            Được cung cấp bởi DQH Architects • Dành riêng cho chủ công trình
          </p>
        </div>
      </div>
    </div>
  )

  // ── AUTHED DASHBOARD ──
  if (viewState === 'authed' && project) {
    const tabs = [
      { id: 'overview' as Tab, label: 'Tổng quan', icon: BarChart2 },
      { id: 'logs' as Tab, label: 'Nhật ký', icon: BookOpen },
      { id: 'payment' as Tab, label: 'Thanh toán', icon: CreditCard },
      { id: 'milestones' as Tab, label: 'Mốc tiến độ', icon: Flag },
    ]

    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7A1216] to-red-700 rounded-xl flex items-center justify-center shrink-0">
                <HardHat size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#7A1216] leading-none">DQH</p>
                <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                project.status === 'completed' || project.status === 'Hoàn thành'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {project.status === 'completed' ? 'Hoàn thành' : project.status || 'Đang thi công'}
              </span>
              <button onClick={handleLogout}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                title="Thoát">
                <Lock size={15} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto scrollbar-hide border-t border-slate-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap shrink-0 border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-4 py-5"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 80px)' }}>

          {/* ── TAB: TỔNG QUAN ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Countdown hero */}
              <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
                <p className="text-xs font-bold text-indigo-200 mb-1 uppercase tracking-wider">Còn lại đến bàn giao</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-6xl font-black">{daysLeft !== null && daysLeft >= 0 ? daysLeft : '—'}</span>
                  <span className="text-lg font-bold text-indigo-200">ngày</span>
                </div>
                {project.handover_date && <p className="text-indigo-200/70 text-xs">{fmtDate(project.handover_date)}</p>}
              </div>

              {/* Progress bar */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">Tiến độ tổng thể</p>
                  <span className="text-indigo-600 font-black text-lg">{pct}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ngày đã thi công', val: daysElapsed !== null && daysElapsed >= 0 ? `${daysElapsed} ngày` : '—', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Mức rủi ro', val: project.risk_level || 'Thấp', color: riskColors[project.risk_level || 'Thấp']?.split(' ')[0] || 'text-emerald-600', bg: riskColors[project.risk_level || 'Thấp']?.split(' ')[1] || 'bg-emerald-50' },
                  { label: 'Giá trị HĐ', val: fmtMoney(project.contract_value), color: 'text-violet-600', bg: 'bg-violet-50' },
                  { label: 'Đã giải ngân', val: fmtMoney(project.spent), color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
                    <p className="text-[11px] text-slate-500 font-medium mb-1">{s.label}</p>
                    <p className={`text-base font-black ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Tasks summary */}
              {tasks.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm font-bold text-slate-700 mb-3">Hạng mục ({tasks.length})</p>
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 truncate flex-1 mr-2">{t.name || t.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'IN_PROGRESS' || t.status === 'DOING' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{t.status === 'DONE' ? 'Xong' : t.status === 'IN_PROGRESS' || t.status === 'DOING' ? 'Đang làm' : 'Chờ'}</span>
                      </div>
                    ))}
                    {tasks.length > 5 && <p className="text-[11px] text-slate-400 text-center mt-1">+{tasks.length - 5} hạng mục khác</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: NHẬT KÝ ── */}
          {tab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có nhật ký thi công</p>
                </div>
              ) : logs.map((log: any, i: number) => {
                const photos: string[] = log.photo_urls || log.photos || []
                return (
                  <div key={log.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-800">{fmtDate(log.date || log.log_date)}</p>
                      {log.weather && <span className="text-[11px] text-slate-400">{log.weather}</span>}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {log.content || log.notes || ''}
                    </p>
                    {photos.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {photos.slice(0, 4).map((url: string, j: number) => (
                          <button key={j} onClick={() => setLightbox(url)}
                            className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-100">
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            {j === 3 && photos.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">+{photos.length - 4}</span>
                              </div>
                            )}
                          </button>
                        ))}
                        <button onClick={() => setLightbox(photos[0])}
                          className="shrink-0 w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                          <ZoomIn size={16} className="text-slate-400" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TAB: THANH TOÁN ── */}
          {tab === 'payment' && (
            <div className="space-y-3">
              {payments.length === 0 && milestones.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có dữ liệu thanh toán</p>
                </div>
              ) : (payments.length > 0 ? payments : milestones).map((item: any, i: number) => {
                const isPaid = item.status === 'paid' || item.status === 'Đã thu' || item.paid
                return (
                  <div key={item.id || i} className={`rounded-2xl p-4 border shadow-sm ${isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{item.name || item.description || item.milestone_name || `Đợt ${i + 1}`}</p>
                        {item.date && <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(item.date)}</p>}
                        {(item.amount || item.value) && (
                          <p className="text-base font-black text-slate-800 mt-1">{fmtMoney(item.amount || item.value)}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isPaid ? '✓ Đã thu' : '⏱ Chờ'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TAB: MỐC TIẾN ĐỘ ── */}
          {tab === 'milestones' && (
            <div>
              {milestones.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Flag size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có mốc tiến độ</p>
                </div>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
                  {milestones.map((m: any, i: number) => {
                    const done = m.status === 'done' || m.status === 'Hoàn thành' || m.completed
                    const active = m.status === 'doing' || m.status === 'Đang làm'
                    return (
                      <div key={m.id || i} className="relative mb-5 last:mb-0">
                        {/* Node */}
                        <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${
                          done ? 'bg-emerald-500 border-emerald-500' :
                          active ? 'bg-amber-400 border-amber-400' :
                          'bg-white border-slate-300'
                        } shadow-sm`} />
                        {/* Card */}
                        <div className={`rounded-xl p-3.5 border shadow-sm ${
                          done ? 'bg-emerald-50 border-emerald-200' :
                          active ? 'bg-amber-50 border-amber-200' :
                          'bg-white border-slate-100'
                        }`}>
                          <p className="text-sm font-bold text-slate-800">{m.name || m.milestone_name}</p>
                          {m.target_date && <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(m.target_date || m.date)}</p>}
                          <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            done ? 'bg-emerald-600 text-white' :
                            active ? 'bg-amber-500 text-white' :
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {done ? '✓ Hoàn thành' : active ? '⚡ Đang thực hiện' : '○ Sắp tới'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    )
  }

  return null
}
