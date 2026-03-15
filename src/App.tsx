import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/dashboard/Dashboard'
import { Projects } from './pages/projects/Projects'
import { Tasks } from './pages/tasks/Tasks'
import { Users } from './pages/users/Users'
import { Gantt } from './pages/gantt/Gantt'
import { History } from './pages/history/History'
import { Kanban } from './pages/kanban/Kanban'
import { Schedule } from './pages/schedule/Schedule'
import { Construction } from './pages/construction/Construction'
import { Customers } from './pages/customers/Customers'
import { Moodboard } from './pages/moodboard/Moodboard'
import MarketingApp from './pages/marketing/MarketingApp'
import QuoteGenerator from './pages/customers/QuoteGenerator'
import { ConstructionProvider } from './contexts/ConstructionContext'

function App() {
  return (
    <ConstructionProvider>
      <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/kanban" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gantt" element={<Gantt />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="users" element={<Users />} />
          <Route path="history" element={<History />} />
          <Route path="construction" element={<Construction />} />
          <Route path="moodboard" element={<Moodboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/quotes/new" element={<QuoteGenerator />} />
          <Route path="marketing" element={<MarketingApp />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ConstructionProvider>
  )
}

export default App
