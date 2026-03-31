import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useClientData } from './useClientData'
import { Lock, BarChart3, TrendingUp, FileText, DollarSign, Loader2, Building2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

// Import the internal views
import { ClientCountdown, DailyLogView, PaymentHistory, ContractorProgressChart } from '../construction/views'
import { ProjectManagementAIModule } from '../construction/ProjectManagement'
import type { ViewTab } from '../construction/types'

type ViewState = 'loading' | 'not_found' | 'gate' | 'authed'

export const ClientView = () => {
  const { token = '' } = useParams<{ token: string }>()
  const { project, tasks, logs, milestones, payments, loading, error } = useClientData(token)
  const SESSION_KEY = `ca_${token}`

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [activeTab, setActiveTab] = useState<ViewTab>('DASHBOARD')
  const [pass, setPass] = useState('')
  const [wrong, setWrong] = useState(false)
  const [shake, setShake] = useState(false)

  // Determine initial state
  useEffect(() => {
    if (loading) { setViewState('loading'); return }
    if (error || !project) { setViewState('not_found'); return }

    // If no password set by manager, it's public
    if (!project.client_password) {
      setViewState('authed'); return
    }

    // Check session
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === project.client_password) {
      setViewState('authed')
    } else {
      setViewState('gate')
    }
  }, [loading, error, project, SESSION_KEY])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    if (pass === project.client_password) {
      sessionStorage.setItem(SESSION_KEY, pass)
      setViewState('authed')
      setWrong(false)
    } else {
      setWrong(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  if (viewState === 'loading') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Đang kết nối dự án...</p>
    </div>
  )

  if (viewState === 'not_found') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner">
          <Building2 size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy dự án</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">Đường dẫn không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ DQH để được cấp lại.</p>
      </div>
    </div>
  )

  if (viewState === 'gate') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Lock size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{project?.name || 'Dự Án DQH'}</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-2">XÁC THỰC KHÁCH HÀNG</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
            <input
              type="password"
              placeholder="Nhập mã bí mật..."
              value={pass} onChange={e => { setPass(e.target.value); setWrong(false); }}
              className={`w-full bg-slate-50 border-2 rounded-xl px-5 py-4 text-center font-bold tracking-widest text-xl focus:outline-none transition-all placeholder-slate-300 ${wrong ? 'border-rose-400 text-rose-600 bg-rose-50' : 'border-slate-100 focus:border-indigo-400 focus:bg-white text-slate-700'}`}
              autoFocus
            />
          </motion.div>
          {wrong && <p className="text-center text-xs text-rose-500 font-bold">✕ Mã truy cập không chính xác</p>}
          <button type="submit" disabled={!pass}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50">
            Truy Cập Tiến Độ
          </button>
        </form>
      </motion.div>
    </div>
  )

  // AUTHTED VIEW (Matches Internal App exactly)
  if (!project) return null

  const VIEW_TABS = [
    { id: 'DASHBOARD', label: 'Nhà của tôi', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'AI_GANTT', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
    { id: 'PAYMENTS', label: 'Thanh toán', icon: <DollarSign className="w-4 h-4" /> },
  ] as const

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
      <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Header - Matches Construction.tsx */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản lý Thi công</h1>
            <p className="text-sm text-slate-400 mt-0.5 uppercase">{project.name} • {project.address}</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition-all pointer-events-none">
                Chủ nhà
             </button>
             <button className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 transition-all pointer-events-none opacity-50">Kỹ sư</button>
             <button className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 transition-all pointer-events-none opacity-50">Quản lý</button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto w-full">
          {VIEW_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ViewTab)} className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-1 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
               {/* Homeowner Dashboard */}
               {activeTab === 'DASHBOARD' && (
                 <ClientCountdown project={project} milestones={milestones} dailyLogs={logs} phases={[]} tasks={tasks} />
               )}
               
               {/* Gantt Timeline */}
               {activeTab === 'AI_GANTT' && (
                 <ProjectManagementAIModule
                   projectId={project.id}
                   externalTasks={tasks}
                   readOnly={true}
                 />
               )}
               
               {/* Diary */}
               {activeTab === 'DIARY' && (
                 <DailyLogView
                   logs={logs}
                   canEdit={false}
                 />
               )}

               {/* Payments */}
               {activeTab === 'PAYMENTS' && (
                 <div className="space-y-6">
                   <PaymentHistory payments={payments} />
                   <ContractorProgressChart subcontractors={[]} />
                 </div>
               )}
             </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
