import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/dashboard/Dashboard'

// Placeholder Pages
const Projects = () => <div className="p-4"><h1 className="text-2xl font-bold">Dự án</h1><p className="mt-2 text-slate-500">Đang xây dựng Tính năng Quản lý Dự án...</p></div>
const Tasks = () => <div className="p-4"><h1 className="text-2xl font-bold">Nhiệm vụ</h1><p className="mt-2 text-slate-500">Đang xây dựng Tính năng Quản lý Nhiệm vụ...</p></div>
const Chat = () => <div className="p-4"><h1 className="text-2xl font-bold">Thảo luận</h1><p className="mt-2 text-slate-500">Đang xây dựng Tính năng Nhắn tin...</p></div>
const Staff = () => <div className="p-4"><h1 className="text-2xl font-bold">Nhân sự</h1><p className="mt-2 text-slate-500">Đang xây dựng Tính năng Quản lý Nhân sự...</p></div>

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
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat />} />
          <Route path="staff" element={<Staff />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
