import React, { Suspense, lazy } from 'react'
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

// --- Lazy loaded components ---
const ClientView = lazy(() => import('./pages/client/ClientView').then(m => ({ default: m.ClientView })))
const PortfolioLanding = lazy(() => import('./pages/portfolio/PortfolioLanding').then(m => ({ default: m.PortfolioLanding })))

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const Projects = lazy(() => import('./pages/projects/Projects').then(m => ({ default: m.Projects })))
const PrototypeBoard = lazy(() => import('./pages/projects/PrototypeBoard').then(m => ({ default: m.PrototypeBoard })))
const Tasks = lazy(() => import('./pages/tasks/Tasks').then(m => ({ default: m.Tasks })))
const Users = lazy(() => import('./pages/users/Users').then(m => ({ default: m.Users })))
const Profile = lazy(() => import('./pages/users/Profile').then(m => ({ default: m.Profile })))
const Gantt = lazy(() => import('./pages/gantt/Gantt').then(m => ({ default: m.Gantt })))
const History = lazy(() => import('./pages/history/History').then(m => ({ default: m.History })))
const Kanban = lazy(() => import('./pages/kanban/Kanban').then(m => ({ default: m.Kanban })))
const Schedule = lazy(() => import('./pages/schedule/Schedule').then(m => ({ default: m.Schedule })))
const Construction = lazy(() => import('./pages/construction/Construction').then(m => ({ default: m.Construction })))
const Finance = lazy(() => import('./pages/finance/Finance').then(m => ({ default: m.Finance })))
const Customers = lazy(() => import('./pages/customers/Customers').then(m => ({ default: m.Customers })))
const QuoteGenerator = lazy(() => import('./pages/customers/QuoteGenerator'))

const MyTasks = lazy(() => import('./pages/mytasks/MyTasks'))
const MarketingApp = lazy(() => import('./pages/marketing/MarketingApp'))
const InteriorQuote = lazy(() => import('./pages/baogia/InteriorQuote'))
const PriceBook = lazy(() => import('./pages/pricebook/PriceBook'))
const TrainingHub = lazy(() => import('./pages/training/TrainingHub'))

function App() {
  return (
    <ConstructionProvider>
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
          
          {/* Public Portfolio Landing page */}
          <Route path="/p/:token" element={
            <Suspense fallback={<GlobalLoadingFallback />}>
              <PortfolioLanding />
            </Suspense>
          } />

          {/* Protected Routes (Suspense handled inside Layout for nested routes) */}
          <Route path="/" element={<AuthGuard><RoleGuard><Layout /></RoleGuard></AuthGuard>}>
            <Route index element={<Navigate to="/tasks" replace />} />
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
            <Route path="price-book" element={<PriceBook />} />
            <Route path="training" element={<TrainingHub />} />
            <Route path="portfolio" element={<PortfolioLanding isPreview={true} />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConstructionProvider>
  )
}

export default App
