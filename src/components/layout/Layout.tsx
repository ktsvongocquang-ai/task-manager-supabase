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
    Rocket,
    MessageSquare,
    Youtube,
    ChevronDown,
    Send,
    MessageCircle,
    FolderPlus,
    PlusCircle,
    UserPlus,
    RefreshCw,
    Plus,
    KeyRound,
    Menu
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
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(false)

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
                        <div className="text-sm font-bold text-gray-700 mb-2">Hỗ trợ kỹ thuật
                            <span className="text-[11px] font-normal text-gray-400 ml-1">(Version: 4.1)</span></div>
                        <div className="flex justify-center space-x-4">
                            <a href="https://zalo.me/0399971179" target="_blank" rel="noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200">
                                <MessageCircle className="text-blue-600" size={14} />
                            </a>
                            <a href="https://www.youtube.com/@sheetkhoinghiep" target="_blank" rel="noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200">
                                <Youtube className="text-red-600" size={14} />
                            </a>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-2 italic">
                            © 2025 <a href="https://sheetkhoinghiep.com" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">sheetkhoinghiep.com</a>
                        </div>
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

                        <div className="flex items-center space-x-4">
                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                className={`p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw size={18} />
                            </button>

                            {/* Quick Add Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus size={18} className="mr-2" />
                                    <span>Tạo mới</span>
                                    <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isQuickAddOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isQuickAddOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsQuickAddOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-52 glass-card shadow-xl z-20 animate-in fade-in zoom-in duration-200 origin-top-right py-2">
                                            <div onClick={() => { setIsQuickAddOpen(false); navigate('/projects'); }} className="quick-add-item">
                                                <FolderPlus className="text-purple-600" size={18} />
                                                <span>Dự án mới</span>
                                            </div>
                                            <div onClick={() => { setIsQuickAddOpen(false); navigate('/tasks'); }} className="quick-add-item">
                                                <PlusCircle className="text-emerald-600" size={18} />
                                                <span>Nhiệm vụ mới</span>
                                            </div>
                                            {(profile?.role === 'Admin' || profile?.role === 'Quản lý') && (
                                                <div onClick={() => { setIsQuickAddOpen(false); navigate('/users'); }} className="quick-add-item">
                                                    <UserPlus className="text-amber-600" size={18} />
                                                    <span>Nhân viên mới</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chat Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className="relative p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <MessageSquare size={18} />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">0</span>
                                </button>

                                {isChatOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsChatOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-[400px] glass-card shadow-xl z-20 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col max-h-[500px]">
                                            <div className="p-4 border-b border-gray-100/50 flex justify-between items-center">
                                                <h3 className="font-bold text-gray-900">Chat chung</h3>
                                                <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase">Sắp ra mắt</div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] flex items-center justify-center bg-slate-50/50">
                                                <div className="text-center">
                                                    <MessageCircle className="mx-auto text-gray-300 mb-2" size={32} />
                                                    <p className="text-sm text-gray-500">Kênh chat chung đang được phát triển</p>
                                                </div>
                                            </div>
                                            <div className="p-4 border-t border-gray-100/50">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        disabled
                                                        className="flex-1 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed"
                                                        placeholder="Nhập tin nhắn..."
                                                    />
                                                    <button disabled className="p-2 bg-blue-100 text-blue-400 rounded-lg cursor-not-allowed">
                                                        <Send size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
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
