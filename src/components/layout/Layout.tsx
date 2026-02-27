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
    KeyRound
} from 'lucide-react'

const viewTitles: Record<string, string> = {
    '/dashboard': 'Tổng Quan',
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
        if (path === '/dashboard') return `${base} - ${profile?.role || 'User'}`
        return base
    }

    const navItems = [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard, color: 'text-white' },
        { name: 'Sơ đồ Gantt', path: '/gantt', icon: GanttChart, color: 'text-indigo-300' },
        { name: 'Dự án', path: '/projects', icon: FolderKanban, color: 'text-slate-300' },
        { name: 'Nhiệm vụ', path: '/tasks', icon: CheckSquare, color: 'text-emerald-300' },
    ]

    if (profile?.role === 'Admin' || profile?.role === 'Quản lý') {
        navItems.push({ name: 'Người dùng', path: '/users', icon: Users, color: 'text-rose-300' })
    }

    const getInitials = (name?: string) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    const getRoleColor = () => {
        if (profile?.role === 'Admin') return 'bg-orange-500'
        if (profile?.role === 'Quản lý') return 'bg-emerald-500'
        return 'bg-blue-500'
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar for Desktop - Dark Navy */}
            <aside className="hidden md:flex w-56 bg-slate-800 flex-col fixed inset-y-0 z-10 shadow-xl">
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-slate-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/20">
                        <FolderKanban size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="font-black text-sm text-white block leading-tight tracking-tighter uppercase italic">QUẢN LÝ DỰ ÁN</span>
                        <span className="text-[9px] text-slate-500 leading-none font-bold tracking-widest uppercase">Quản lý nâng tầm</span>
                    </div>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full ${getRoleColor()} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                            {getInitials(profile?.full_name)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Người dùng'}</p>
                            <p className="text-xs text-slate-400 truncate">{profile?.role || 'Nhân viên'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                    <button onClick={() => { }} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-blue-300 hover:text-blue-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <KeyRound size={11} /> Đổi mật khẩu
                    </button>
                    <button onClick={handleSignOut} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-red-300 hover:text-red-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <LogOut size={11} /> Đăng xuất
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm relative ${isActive
                                    ? 'bg-indigo-600/80 text-white shadow-md'
                                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full -ml-3"></div>}
                                    <item.icon size={18} className={`mr-3 ${isActive ? 'text-white' : item.color}`} />
                                    {item.name}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-56 min-w-0">

                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-slate-800 flex items-center justify-between px-4 sticky top-0 z-20 shadow-md">
                    <div className="flex items-center">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mr-2.5">
                            <FolderKanban size={14} className="text-white" />
                        </div>
                        <span className="text-base font-bold text-white">Quản Lý Dự Án</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-slate-300 hover:text-white rounded-lg"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-30 bg-slate-800 flex flex-col pt-14">
                        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-4 rounded-xl transition-colors font-medium text-base ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 active:bg-slate-700'
                                        }`
                                    }
                                >
                                    <item.icon size={22} className="mr-4" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-700">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-xl transition-colors"
                            >
                                <LogOut size={18} className="mr-3" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}

                {/* Topbar */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 hidden md:flex justify-between items-center shadow-sm z-10">
                    <h2 className="text-base font-semibold text-slate-800">{currentTitle()}</h2>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => navigate('/projects')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Tạo mới
                        </button>
                        {/* User avatar in topbar */}
                        <div className={`w-8 h-8 rounded-full ${getRoleColor()} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                            {getInitials(profile?.full_name)}
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 overflow-x-hidden bg-slate-50">
                    <Outlet />
                </main>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>Hỗ trợ kỹ thuật</span>
                        <span className="text-indigo-500 font-medium">(Phiên bản 4.1)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    </div>
                    <span>© 2025 chaolongqua.com</span>
                </div>
            </div>
        </div>
    )
}
