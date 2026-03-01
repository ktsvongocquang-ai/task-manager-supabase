import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    GanttChart,
    FolderKanban,
    Users,
    LogOut,
    Rocket,
    MessageSquare,
    Send,
    MessageCircle,
    FolderPlus,
    PlusCircle,
    UserPlus,
    RefreshCw,
    Plus,
    KeyRound,
    Menu,
    Bell, // Added Bell icon
    History as HistoryIcon,
    Kanban as KanbanIcon,
    CalendarDays,
    ListTodo,
    X
} from 'lucide-react'
import { getUnreadNotificationCount, checkScheduledNotifications } from '../../services/notifications'
import { NotificationsDropdown } from './NotificationsDropdown'

const viewTitles: Record<string, string> = {
    '/dashboard': 'Thống kê',
    '/kanban': 'Kanban',
    '/gantt': 'Sơ đồ Gantt',
    '/projects': 'Quản lý Dự án',
    '/tasks': 'Danh sách',
    '/schedule': 'Lịch Trình',
    '/history': 'Lịch sử Hoạt động',
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
    const [isNotifOpen, setIsNotifOpen] = useState(false) // Added state for notifications
    const [unreadNotifCount, setUnreadNotifCount] = useState(0) // Added state for unread notification count

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (profile?.id) {
                try {
                    // Check scheduled tasks first
                    await checkScheduledNotifications(profile.id)

                    const count = await getUnreadNotificationCount(profile.id)
                    setUnreadNotifCount(count)
                } catch (error) {
                    console.error('Error fetching unread notification count:', error)
                }
            }
        }

        fetchUnreadCount()
    }, [profile?.id])

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                console.error('Lỗi đổi mật khẩu:', error);
                alert(`Lỗi đổi mật khẩu: ${error.message}`);
            } else {
                alert('Đổi mật khẩu thành công!');
                setIsPasswordModalOpen(false);
                setNewPassword('');
            }
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        } finally {
            setIsChangingPassword(false);
        }
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
        { name: 'Thống kê', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Kanban', path: '/kanban', icon: KanbanIcon },
        { name: 'Danh sách', path: '/tasks', icon: ListTodo },
        { name: 'Lịch trình', path: '/schedule', icon: CalendarDays },
        { name: 'Gantt', path: '/gantt', icon: GanttChart },
        { name: 'Dự án', path: '/projects', icon: FolderKanban },
    ]

    if (profile?.role !== 'Nhân viên') {
        navItems.push({ name: 'Lịch sử', path: '/history', icon: HistoryIcon })
    }

    if (profile?.role === 'Admin') {
        navItems.push({ name: 'Người dùng', path: '/users', icon: Users })
    }

    const getRoleBrand = (role?: string) => {
        if (role === 'Admin') return { color: 'bg-admin', text: 'text-admin', badge: 'bg-orange-50 text-admin' }
        if (role === 'Quản lý') return { color: 'bg-manager', text: 'text-manager', badge: 'bg-blue-50 text-manager' }
        return { color: 'bg-employee', text: 'text-employee', badge: 'bg-green-50 text-employee' }
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
            <aside className={`fixed left-0 top-0 h-full w-64 bg-sidebar-bg border-r border-border-main z-50 transform transition-transform duration-300 ease-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-border-main">
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
                    <div className="bg-gray-50 rounded-xl p-4 border border-border-main mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${getRoleBrand(profile?.role).color} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}>
                                {getInitials(profile?.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-main truncate">{profile?.full_name || 'Người dùng'}</p>
                                <p className={`text-xs ${getRoleBrand(profile?.role).text}`}>{profile?.role || 'Nhân viên'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white text-xs font-semibold text-gray-700 rounded-lg border border-border-main hover:bg-gray-100 transition-colors">
                                <KeyRound size={14} /> Đổi mật khẩu
                            </button>
                            <button onClick={handleSignOut} className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white text-xs font-semibold text-gray-700 rounded-lg border border-border-main hover:bg-gray-100 transition-colors">
                                <LogOut size={14} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} size={18} />
                                    <span>{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-6">
                    <div className="glass-card p-4 text-center flex flex-col items-center justify-center gap-1 hover:bg-white/60 transition-colors">
                        <div className="text-sm font-bold text-slate-700 tracking-tight">App QLDA DQH</div>
                        <div className="text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">version 1.0</div>
                        <div className="text-[10px] text-slate-400 mt-2 font-medium">
                            © 2026 <a href="https://dqharchitects.vn" className="text-slate-500 font-bold hover:text-indigo-600 hover:underline transition-colors" target="_blank" rel="noreferrer">dqharchitects.vn</a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative bg-app-bg">
                {/* Header */}
                <header className="sticky top-0 bg-white border-b border-border-main z-40 px-6 py-4">
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
                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                className={`p-2.5 rounded-xl bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm border border-slate-100 ${isRefreshing ? 'animate-spin' : ''}`}
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw size={18} strokeWidth={2.5} />
                            </button>

                            {/* Quick Add Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                    className="flex items-center px-5 py-2.5 bg-gradient-to-r from-[#3a31d8] to-[#6366f1] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200/50 hover:scale-105 active:scale-95 transition-all gap-2"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    <span>Tạo mới</span>
                                </button>

                                {isQuickAddOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsQuickAddOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-56 glass-card shadow-2xl z-20 animate-in fade-in zoom-in duration-200 origin-top-right py-2 overflow-hidden border border-white/40">
                                            <div onClick={() => { setIsQuickAddOpen(false); navigate('/projects'); }} className="quick-add-item mx-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                                                    <FolderPlus className="text-purple-600" size={18} />
                                                </div>
                                                <span className="font-bold text-slate-700">Dự án mới</span>
                                            </div>
                                            <div onClick={() => { setIsQuickAddOpen(false); navigate('/tasks'); }} className="quick-add-item mx-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
                                                    <PlusCircle className="text-emerald-600" size={18} />
                                                </div>
                                                <span className="font-bold text-slate-700">Nhiệm vụ mới</span>
                                            </div>
                                            {(profile?.role === 'Admin' || profile?.role === 'Quản lý') && (
                                                <div onClick={() => { setIsQuickAddOpen(false); navigate('/users'); }} className="quick-add-item mx-2">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-3">
                                                        <UserPlus className="text-amber-600" size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-700">Nhân viên mới</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsNotifOpen(!isNotifOpen);
                                        if (isChatOpen) setIsChatOpen(false);
                                    }}
                                    className="relative p-2.5 rounded-xl bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 transition-all border border-slate-200/50"
                                >
                                    <Bell size={18} strokeWidth={2.5} className="text-yellow-500 fill-yellow-500/20" />
                                    {unreadNotifCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-black ring-2 ring-white shadow-sm">
                                            {unreadNotifCount}
                                        </span>
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)}></div>
                                        <NotificationsDropdown
                                            userId={profile?.id}
                                            onClose={() => setIsNotifOpen(false)}
                                            onCountChange={setUnreadNotifCount}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Global Chat Button */}
                            <button
                                onClick={() => {
                                    setIsChatOpen(!isChatOpen);
                                    if (isNotifOpen) setIsNotifOpen(false);
                                }}
                                className="relative p-2.5 rounded-xl bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 transition-all border border-slate-200/50"
                            >
                                <MessageSquare size={18} strokeWidth={2.5} />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-blue-500 to-cyan-500 text-white text-[10px] rounded-full flex items-center justify-center font-black ring-2 ring-white shadow-sm">0</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Dropdown logic (Absolute positioned relative to header) */}
                {isChatOpen && (
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsChatOpen(false)}>
                        <div
                            className="absolute right-6 top-20 w-[400px] glass-card shadow-2xl z-[70] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col max-h-[600px] border border-white/40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/80">
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">Chat chung</h3>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Kênh thảo luận nội bộ</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter">Sắp ra mắt</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] flex items-center justify-center bg-slate-50/30 backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <MessageCircle className="text-blue-300" size={32} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-10">Kênh chat đang được hoàn thiện</p>
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100/50 bg-white/80">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        disabled
                                        className="flex-1 text-xs px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed font-medium"
                                        placeholder="Nhập tin nhắn..."
                                    />
                                    <button disabled className="p-3 bg-blue-50 text-blue-300 rounded-xl cursor-not-allowed">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page View */}
                <div className="p-6 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>

            {/* Password Change Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">Đổi Mật Khẩu</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium mb-4"
                                placeholder="Nhập mật khẩu mới..."
                            />
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className={`w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 ${isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isChangingPassword ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
