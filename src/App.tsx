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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gantt" element={<Gantt />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="users" element={<Users />} />
          <Route path="history" element={<History />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
