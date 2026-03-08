import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    LogOut,
    Rocket,
    MessageSquare,
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
    X,
    Send
} from 'lucide-react'
import { getUnreadNotificationCount, checkScheduledNotifications } from '../../services/notifications'
import { NotificationsDropdown } from './NotificationsDropdown'
import { GlobalModals } from '../modals/GlobalModals'
import { GlobalChat } from '../chat/GlobalChat'

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

    // Global Quick Add state
    const [isGlobalAddProjectOpen, setIsGlobalAddProjectOpen] = useState(false)
    const [isGlobalAddTaskOpen, setIsGlobalAddTaskOpen] = useState(false)

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    // Telegram state
    const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
    const [telegramChatId, setTelegramChatId] = useState(profile?.telegram_chat_id || '')
    const [isUpdatingTelegram, setIsUpdatingTelegram] = useState(false)

    useEffect(() => {
        if (profile?.telegram_chat_id) {
            setTelegramChatId(profile.telegram_chat_id)
        }
    }, [profile?.telegram_chat_id])

    const handleUpdateTelegram = async () => {
        if (!profile?.id) return;
        setIsUpdatingTelegram(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ telegram_chat_id: telegramChatId })
                .eq('id', profile.id);
            if (error) {
                console.error('Lỗi cập nhật Telegram ID:', error);
                alert(`Lỗi cập nhật: ${error.message}`);
            } else {
                alert('Cập nhật Telegram Chat ID thành công!');
                setIsTelegramModalOpen(false);
                useAuthStore.getState().checkSession();
            }
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        } finally {
            setIsUpdatingTelegram(false);
        }
    }

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
        { name: 'Công việc', path: '/kanban', icon: KanbanIcon, matchPrefix: ['/kanban', '/tasks', '/schedule', '/gantt'] },
        { name: 'Dự án', path: '/projects', icon: FolderKanban },
        { name: 'Thống kê (Dashboard)', path: '/dashboard', icon: LayoutDashboard },
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
                            <h1 className="text-2xl font-bold text-[#7A1216] leading-none tracking-tight">DQH</h1>
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
                            <button onClick={() => setIsTelegramModalOpen(true)} className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#0088cc]/10 text-xs font-semibold text-[#0088cc] rounded-lg border border-[#0088cc]/20 hover:bg-[#0088cc]/20 transition-colors">
                                <Send size={14} /> Telegram ID
                            </button>
                        </div>
                        <button onClick={handleSignOut} className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white text-xs font-semibold text-red-600 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                            <LogOut size={14} /> Đăng xuất
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isMatch = (path: string) => {
                            if (item.matchPrefix) {
                                return item.matchPrefix.some(prefix => path.startsWith(prefix));
                            }
                            return path === item.path;
                        };

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() =>
                                    `group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isMatch(location.pathname)
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`
                                }
                            >
                                {() => (
                                    <>
                                        <item.icon className={`mr-3 ${isMatch(location.pathname) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} size={18} />
                                        <span>{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
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
                            <h2 className="text-xl font-bold text-gray-900 min-w-[150px]">{currentTitle()}</h2>

                            {/* Horizontal Tabs for Task Views - Only show if current path is one of the task views */}
                            {['/kanban', '/tasks', '/schedule', '/gantt'].includes(location.pathname) && (
                                <div className="hidden md:flex items-center ml-8 space-x-2 border border-slate-200 p-1 rounded-xl bg-slate-50">
                                    <NavLink to="/kanban" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Kanban
                                    </NavLink>
                                    <NavLink to="/tasks" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Danh sách
                                    </NavLink>
                                    <NavLink to="/schedule" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Lịch trình
                                    </NavLink>
                                    <NavLink to="/gantt" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Sơ đồ Gantt
                                    </NavLink>
                                </div>
                            )}
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
                                            <div onClick={() => { setIsQuickAddOpen(false); setIsGlobalAddProjectOpen(true); }} className="quick-add-item mx-2 cursor-pointer">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                                                    <FolderPlus className="text-purple-600" size={18} />
                                                </div>
                                                <span className="font-bold text-slate-700">Dự án mới</span>
                                            </div>
                                            <div onClick={() => { setIsQuickAddOpen(false); setIsGlobalAddTaskOpen(true); }} className="quick-add-item mx-2 cursor-pointer">
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

                <GlobalChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    currentUserProfile={profile}
                />

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

            {/* Telegram Chat ID Modal */}
            {isTelegramModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Send className="text-[#0088cc]" size={20} />
                                Cài đặt Telegram
                            </h3>
                            <button onClick={() => setIsTelegramModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50/50">
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                Nhận thông báo công việc tức thì qua Telegram.
                                Để lấy ID của bạn, hãy lên Telegram tìm kiếm Bot <strong className="text-[#0088cc]">@JFLOW_Task_Bot</strong> (hoặc bot quản lý của bạn) và bấm <strong>START</strong>.
                            </p>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Telegram Chat ID</label>
                            <input
                                type="text"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] transition-all font-medium mb-4 shadow-inner"
                                placeholder="Ví dụ: 987654321..."
                            />
                            <button
                                onClick={handleUpdateTelegram}
                                disabled={isUpdatingTelegram}
                                className={`w-full px-4 py-2.5 bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white rounded-lg text-sm font-bold shadow-md shadow-[#0088cc]/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${isUpdatingTelegram ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUpdatingTelegram ? 'Đang cập nhật...' : (
                                    <>
                                        <Send size={16} /> Lưu Cài Đặt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Modals Wrapper */}
            <GlobalModals
                isProjectModalOpen={isGlobalAddProjectOpen}
                isTaskModalOpen={isGlobalAddTaskOpen}
                onCloseProjectModal={() => setIsGlobalAddProjectOpen(false)}
                onCloseTaskModal={() => setIsGlobalAddTaskOpen(false)}
            />
        </div>
    )
}
