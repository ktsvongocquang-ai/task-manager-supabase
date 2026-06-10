import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { RoleGuard } from './components/RoleGuard'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/dashboard/Dashboard'
import { Projects } from './pages/projects/Projects'
import { Tasks } from './pages/tasks/Tasks'
import { Users } from './pages/users/Users'
import { Profile } from './pages/users/Profile'
import { Gantt } from './pages/gantt/Gantt'
import { History } from './pages/history/History'
import { Kanban } from './pages/kanban/Kanban'
import { Schedule } from './pages/schedule/Schedule'
import { Construction } from './pages/construction/Construction'
import { Customers } from './pages/customers/Customers'
import MyTasks from './pages/mytasks/MyTasks'

import MarketingApp from './pages/marketing/MarketingApp'
import QuoteGenerator from './pages/customers/QuoteGenerator'
import InteriorQuote from './pages/baogia/InteriorQuote'
import TrainingHub from './pages/training/TrainingHub'
import { ConstructionProvider } from './contexts/ConstructionContext'
import { ClientView } from './pages/client/ClientView'
import { PortfolioLanding } from './pages/portfolio/PortfolioLanding'
import { PortfolioManager } from './pages/portfolio/PortfolioManager'
import { PrototypeBoard } from './pages/projects/PrototypeBoard'

function App() {
  return (
    <ConstructionProvider>
      <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Public client landing page — NO auth required */}
        <Route path="/c/:token" element={<ClientView />} />
        
        {/* Public Portfolio Landing page */}
        <Route path="/p/:token" element={<PortfolioLanding />} />

        {/* Protected Routes */}
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
          {/* Moodboard removed */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/quotes/new" element={<QuoteGenerator />} />
          <Route path="marketing" element={<MarketingApp />} />
          <Route path="mytasks" element={<MyTasks />} />
          <Route path="bao-gia" element={<InteriorQuote />} />
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
