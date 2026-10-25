import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { RoleGuard } from './components/RoleGuard'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { ConstructionProvider } from './contexts/ConstructionContext'

// Global fallback for full-page Suspense (public routes)
export const GlobalLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen w-full bg-slate-50">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

// Safe lazy import wrapper to automatically recover from outdated deployment chunk hashes
const safeLazy = <T extends React.ComponentType<Record<string, unknown>>>(importFn: () => Promise<{ default: T }>) => {
  return lazy(async () => {
    try {
      const component = await importFn();
      sessionStorage.removeItem('retry_lazy_reload');
      return component;
    } catch (error: unknown) {
      console.warn("Outdated chunk detected, refreshing page automatically...", error);
      const isRefreshed = sessionStorage.getItem('retry_lazy_reload');
      if (!isRefreshed) {
        sessionStorage.setItem('retry_lazy_reload', 'true');
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch {
            void 0;
          }
        }
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem('retry_lazy_reload');
      throw error;
    }
  });
};

// --- Lazy loaded components ---
const ClientView = safeLazy(() => import('./pages/client/ClientView').then(m => ({ default: m.ClientView })))
const LandingPageV2 = safeLazy(() => import('./pages/portfolio/lp/LandingPageV2').then(m => ({ default: m.LandingPageV2 })))
const AdminLanding = safeLazy(() => import('./pages/portfolio/admin/AdminLanding').then(m => ({ default: m.AdminLanding })))
const AdminContent = safeLazy(() => import('./pages/portfolio/admin/AdminContent').then(m => ({ default: m.AdminContent })))
const AdminSegments = safeLazy(() => import('./pages/portfolio/admin/AdminSegments').then(m => ({ default: m.AdminSegments })))
const AdminProjectsLP = safeLazy(() => import('./pages/portfolio/admin/AdminProjectsLP').then(m => ({ default: m.AdminProjectsLP })))
const AdminStyles = safeLazy(() => import('./pages/portfolio/admin/AdminStyles').then(m => ({ default: m.AdminStyles })))
const AdminRatesLP = safeLazy(() => import('./pages/portfolio/admin/AdminRatesLP').then(m => ({ default: m.AdminRatesLP })))
const AdminSales = safeLazy(() => import('./pages/portfolio/admin/AdminSales').then(m => ({ default: m.AdminSales })))
const AdminLeads = safeLazy(() => import('./pages/portfolio/admin/AdminLeads').then(m => ({ default: m.AdminLeads })))
const AdminReports = safeLazy(() => import('./pages/portfolio/admin/AdminReports').then(m => ({ default: m.AdminReports })))

const Dashboard = safeLazy(() => import('./pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const Projects = safeLazy(() => import('./pages/projects/Projects').then(m => ({ default: m.Projects })))
const PrototypeBoard = safeLazy(() => import('./pages/projects/PrototypeBoard').then(m => ({ default: m.PrototypeBoard })))
const Tasks = safeLazy(() => import('./pages/tasks/Tasks').then(m => ({ default: m.Tasks })))
const Users = safeLazy(() => import('./pages/users/Users').then(m => ({ default: m.Users })))
const Profile = safeLazy(() => import('./pages/users/Profile').then(m => ({ default: m.Profile })))
const Gantt = safeLazy(() => import('./pages/gantt/Gantt').then(m => ({ default: m.Gantt })))
const History = safeLazy(() => import('./pages/history/History').then(m => ({ default: m.History })))
const Kanban = safeLazy(() => import('./pages/kanban/Kanban').then(m => ({ default: m.Kanban })))
const Schedule = safeLazy(() => import('./pages/schedule/Schedule').then(m => ({ default: m.Schedule })))
const Construction = safeLazy(() => import('./pages/construction/Construction').then(m => ({ default: m.Construction })))
const Finance = safeLazy(() => import('./pages/finance/Finance').then(m => ({ default: m.Finance })))
const Customers = safeLazy(() => import('./pages/customers/Customers').then(m => ({ default: m.Customers })))
const QuoteGenerator = safeLazy(() => import('./pages/customers/QuoteGenerator'))

const MyTasks = safeLazy(() => import('./pages/mytasks/MyTasks'))
const MarketingApp = safeLazy(() => import('./pages/marketing/MarketingApp'))
const InteriorQuote = safeLazy(() => import('./pages/baogia/InteriorQuote'))
const TrainingHub = safeLazy(() => import('./pages/training/TrainingHub'))

function App() {
  // Right-click (or long-press on touch devices) any date input to copy its value —
  // native <input type="date"> doesn't support selecting/copying its displayed text normally.
  const [copyFeedback, setCopyFeedback] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement && target.type === 'date' && target.value) {
        e.preventDefault()
        const [year, month, day] = target.value.split('-')
        const formatted = `${day}/${month}/${year}`
        navigator.clipboard.writeText(formatted).then(() => {
          setCopyFeedback({ text: `Đã copy: ${formatted}`, x: e.clientX, y: e.clientY })
          setTimeout(() => setCopyFeedback(null), 1500)
        }).catch(() => {})
      }
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <ConstructionProvider>
      {copyFeedback && (
        <div
          className="fixed z-[9999] px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ left: copyFeedback.x + 12, top: copyFeedback.y - 12 }}
        >
          {copyFeedback.text}
        </div>
      )}
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Public client landing page — NO auth required */}
          <Route path="/c/:token" element={
            <Suspense fallback={<GlobalLoadingFallback />}>
              <ClientView />
            </Suspense>
          } />
          
          {/* Public Landing page bán hàng — LP v2 */}
          <Route path="/p/:token" element={
            <Suspense fallback={<GlobalLoadingFallback />}>
              <LandingPageV2 />
            </Suspense>
          } />

          {/* Protected Routes (Suspense handled inside Layout for nested routes) */}
          <Route path="/" element={<AuthGuard><RoleGuard><Layout /></RoleGuard></AuthGuard>}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gantt" element={<Gantt />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id/board" element={<PrototypeBoard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="history" element={<History />} />
            <Route path="construction" element={<Construction />} />
            <Route path="finance" element={<Finance />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/quotes/new" element={<QuoteGenerator />} />
            <Route path="marketing" element={<MarketingApp />} />
            <Route path="mytasks" element={<MyTasks />} />
            <Route path="bao-gia" element={<InteriorQuote />} />
            <Route path="training" element={<TrainingHub />} />
            <Route path="portfolio" element={<LandingPageV2 />} />
            <Route path="admin/landing" element={<AdminLanding />}>
              <Route index element={<Navigate to="content" replace />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="segments" element={<AdminSegments />} />
              <Route path="projects" element={<AdminProjectsLP />} />
              <Route path="styles" element={<AdminStyles />} />
              <Route path="rates" element={<AdminRatesLP />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConstructionProvider>
  )
}

export default App
