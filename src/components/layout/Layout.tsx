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
    RefreshCw,
    Plus,
    KeyRound,
    Rocket,
    MessageSquare,
    Youtube
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
        return base
    }

    const navItems = [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard, bgColor: 'bg-blue-100', iconColor: 'text-blue-600', activeColor: 'bg-blue-600' },
        { name: 'Sơ đồ Gantt', path: '/gantt', icon: GanttChart, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', activeColor: 'bg-indigo-600' },
        { name: 'Dự án', path: '/projects', icon: FolderKanban, bgColor: 'bg-purple-100', iconColor: 'text-purple-600', activeColor: 'bg-purple-600' },
        { name: 'Nhiệm vụ', path: '/tasks', icon: CheckSquare, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600', activeColor: 'bg-emerald-600' },
    ]

    if (profile?.role === 'Admin' || profile?.role === 'Quản lý') {
        navItems.push({ name: 'Người dùng', path: '/users', icon: Users, bgColor: 'bg-amber-100', iconColor: 'text-amber-600', activeColor: 'bg-amber-600' })
    }

    const getInitials = (name?: string) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex font-inter">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar - Pro Glassmorphism Style */}
            <aside className={`fixed left-0 top-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl z-50 transform transition-transform duration-300 ease-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100/50">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Rocket className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent leading-none">QUẢN LÝ DỰ ÁN</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Quản lý nâng tầm</p>
                        </div>
                    </div>

                    {/* User Profile Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50 shadow-sm mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                                {getInitials(profile?.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'Người dùng'}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{profile?.role || 'Nhân viên'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white text-[10px] font-bold text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                                <KeyRound size={12} /> Đổi mật khẩu
                            </button>
                            <button onClick={handleSignOut} className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-red-50 text-[10px] font-bold text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                                <LogOut size={12} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `group flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative ${isActive
                                    ? 'bg-white shadow-lg text-gray-900 ring-1 ring-black/5'
                                    : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-8 h-8 rounded-lg ${isActive ? item.activeColor : item.bgColor} flex items-center justify-center mr-3 transition-colors duration-200 shadow-sm`}>
                                        <item.icon className={isActive ? 'text-white' : item.iconColor} size={16} />
                                    </div>
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-blue-100"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-6">
                    <div className="glass-card p-4 text-center">
                        <p className="text-xs font-bold text-gray-700 mb-2">Hỗ trợ kỹ thuật <span className="text-blue-500 font-normal ml-1">(v4.1)</span></p>
                        <div className="flex justify-center space-x-3 mb-3">
                            <a href="#" className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
                                <MessageSquare size={14} />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                                <Youtube size={14} />
                            </a>
                        </div>
                        <p className="text-[10px] text-gray-400">© 2025 <span className="text-blue-500">chaolongqua.com</span></p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-white/20 z-30 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-600"
                            >
                                <Menu size={20} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">{currentTitle()}</h2>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleRefresh}
                                className={`p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw size={18} />
                            </button>

                            <button
                                onClick={() => navigate('/projects')}
                                className="hidden sm:flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={18} className="mr-2" />
                                Tạo mới
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page View */}
                <div className="p-6 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
