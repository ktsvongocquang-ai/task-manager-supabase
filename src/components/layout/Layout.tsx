import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    GanttChart,
    FolderKanban,
    CheckSquare,
    Users,
    LogOut,
    Menu,
    X,
    RefreshCw,
    Plus,
    KeyRound,
    Settings
} from 'lucide-react'

const viewTitles: Record<string, string> = {
    '/dashboard': 'Tổng Quan - ',
    '/gantt': 'Sơ đồ Gantt',
    '/projects': 'Quản lý Dự án',
    '/tasks': 'Quản lý Nhiệm vụ',
    '/users': 'Quản lý Nhân viên',
}

export const Layout = () => {
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        window.location.reload()
    }

    const currentTitle = () => {
        const path = location.pathname
        const base = viewTitles[path] || 'Quản Lý Dự Án'
        if (path === '/dashboard') return `${base}${profile?.role || 'User'}`
        return base
    }

    const navItems = [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Sơ đồ Gantt', path: '/gantt', icon: GanttChart },
        { name: 'Dự án', path: '/projects', icon: FolderKanban },
        { name: 'Nhiệm vụ', path: '/tasks', icon: CheckSquare },
    ]

    if (profile?.role === 'Admin' || profile?.role === 'Quản lý') {
        navItems.push({ name: 'Người dùng', path: '/users', icon: Users })
    }

    const getInitials = (name?: string) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-10 shadow-sm">
                <div className="h-16 flex items-center px-5 border-b border-slate-200 bg-indigo-50/50">
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                        <FolderKanban size={18} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-base text-slate-800 tracking-tight block leading-tight">Quản Lý Dự Án</span>
                        <span className="text-[10px] text-slate-400 leading-none">Quản lý thông minh</span>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {getInitials(profile?.full_name)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name || 'Người dùng'}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.role || 'Nhân viên'}</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <button onClick={() => navigate('/login')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                        <KeyRound size={12} /> Đổi mật khẩu
                    </button>
                    <button onClick={handleSignOut} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <LogOut size={12} /> Đăng xuất
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                }`
                            }
                        >
                            <item.icon size={20} className="mr-3" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-64 min-w-0">

                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-lg flex items-center justify-center mr-3 font-bold text-white">
                            <FolderKanban size={16} />
                        </div>
                        <span className="text-lg font-bold text-slate-800">Quản Lý Dự Án</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-10 bg-slate-900 text-white flex flex-col pt-16">
                        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-4 rounded-xl transition-colors font-medium text-base ${isActive ? 'bg-indigo-600 text-white' : 'active:bg-slate-800'
                                        }`
                                    }
                                >
                                    <item.icon size={22} className="mr-4" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-800">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-slate-800 active:bg-slate-700 rounded-xl transition-colors"
                            >
                                <LogOut size={20} className="mr-3" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}

                {/* Topbar */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 hidden md:flex justify-between items-center shadow-sm z-10">
                    <h2 className="text-lg font-semibold text-slate-800">{currentTitle()}</h2>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 p-2 rounded-lg"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => navigate('/projects')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Tạo mới
                        </button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* Page Content Rendering Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}
