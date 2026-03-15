import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import {
    Users,
    LogOut,
    Rocket,
    MessageSquare,
    RefreshCw,
    KeyRound,
    Bell, // Added Bell icon
    History as HistoryIcon,
    Kanban as KanbanIcon,
    X,
    Send,
    HardHat,
    LayoutTemplate,
    HeartHandshake,
    Video,
    ChevronDown,
    List,
    Calendar,
    BarChart2,
    Folder,
    PieChart
} from 'lucide-react'
import { getUnreadNotificationCount, checkScheduledNotifications } from '../../services/notifications'
import { NotificationsDropdown } from './NotificationsDropdown'
import { GlobalModals } from '../modals/GlobalModals'
import { GlobalChat } from '../chat/GlobalChat'
import { BottomTabBar } from './BottomTabBar'
import { FullscreenLauncher } from './FullscreenLauncher'

const viewTitles: Record<string, string> = {
    '/dashboard': 'Thống kê',
    '/kanban': 'Kanban',
    '/gantt': 'Sơ đồ Gantt',
    '/projects': 'Quản lý Dự án',
    '/tasks': 'Danh sách',
    '/schedule': 'Lịch Trình',
    '/history': 'Lịch sử Hoạt động',
    '/users': 'Quản lý Nhân viên',
    '/construction': 'Quản lý Thi công',
    '/moodboard': 'Tạo Moodboard',
    '/customers': 'CRM',
    '/marketing': 'Marketing',
}

export const Layout = () => {
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const activeCrmTab = searchParams.get('tab') || 'DASHBOARD'
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false) // Added state for notifications
    const [unreadNotifCount, setUnreadNotifCount] = useState(0) // Added state for unread notification count
    const [isLauncherOpen, setIsLauncherOpen] = useState(false) // Added Fullscreen Launcher state
    
    // Accordion sidebar state
    const [expandedNavs, setExpandedNavs] = useState<Record<string, boolean>>({ 'Công việc': true })

    const toggleNav = (name: string) => {
        setExpandedNavs(prev => ({ ...prev, [name]: !prev[name] }))
    }

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

    const getNavItemsByRole = (userRole?: string, department?: string): any[] => {
        const adminRole = userRole === 'Admin' || userRole === 'Giám đốc';

        // Base items for all users
        const baseItems = [
            { 
                name: 'Công việc', 
                path: '/kanban',
                icon: KanbanIcon, 
                matchPrefix: ['/kanban', '/tasks', '/schedule', '/gantt', '/projects', '/dashboard'],
                mobileChildren: [
                    { name: 'Kanban', path: '/kanban', icon: KanbanIcon },
                    { name: 'Danh sách', path: '/tasks', icon: List },
                    { name: 'Lịch trình', path: '/schedule', icon: Calendar },
                    { name: 'Sơ đồ Gantt', path: '/gantt', icon: BarChart2 },
                    { name: 'Dự án', path: '/projects', icon: Folder },
                    { name: 'Dashboard', path: '/dashboard', icon: PieChart },
                ]
            }
        ];

        // 1. Quản lý Sale / Chăm sóc Khách hàng
        if (userRole === 'Quản lý Sale' || department === 'Sale') {
            return [
                { name: 'Chăm sóc KH', path: '/customers', icon: HeartHandshake, matchPrefix: ['/customers'] },
                ...baseItems,
                { name: 'Lịch sử', path: '/history', icon: HistoryIcon }
            ];
        }

        // 2. Giám sát - Quản lý / Thi Công
        if (userRole === 'Giám sát - Quản lý' || department === 'Thi công') {
            return [
                { name: 'Thi Công', path: '/construction', icon: HardHat, matchPrefix: ['/construction'] },
                ...baseItems,
                { name: 'Lịch sử', path: '/history', icon: HistoryIcon }
            ];
        }

        // 3. Marketing - Quản lý
        if (userRole === 'Quản lý Marketing' || department === 'Marketing') {
            return [
                { name: 'Marketing', path: '/marketing', icon: Video, matchPrefix: ['/marketing'] },
                ...baseItems,
                { name: 'Lịch sử', path: '/history', icon: HistoryIcon }
            ];
        }

        // 4. Nhân viên Thiết kế
        if (userRole === 'Nhân viên Thiết kế' || department === 'Thiết kế') {
            return [
                ...baseItems,
                { name: 'Moodboard', path: '/moodboard', icon: LayoutTemplate, matchPrefix: ['/moodboard'] }
            ];
        }

        // 5. Default Staff (Nếu không thuộc các nhóm trên)
        if (userRole === 'Nhân viên') {
            return [
                ...baseItems,
                { name: 'Thi Công', path: '/construction', icon: HardHat, matchPrefix: ['/construction'] },
                { name: 'Marketing', path: '/marketing', icon: Video, matchPrefix: ['/marketing'] }
            ];
        }

        // Admin, Giám đốc, Quản lý chung nhìn thấy tất cả
        const fullItems = [
            ...baseItems,
            { name: 'Marketing', path: '/marketing', icon: Video, matchPrefix: ['/marketing'] },
            { name: 'Moodboard', path: '/moodboard', icon: LayoutTemplate, matchPrefix: ['/moodboard'] },
            { name: 'Thi Công', path: '/construction', icon: HardHat, matchPrefix: ['/construction'] },
            { name: 'Chăm sóc KH', path: '/customers', icon: HeartHandshake, matchPrefix: ['/customers'] },
            { name: 'Lịch sử', path: '/history', icon: HistoryIcon }
        ];

        if (adminRole) {
            fullItems.push({ name: 'Người dùng', path: '/users', icon: Users });
        }

        return fullItems;
    };

    const navItems = getNavItemsByRole(profile?.role || undefined, profile?.position || undefined);

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
        <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex font-inter overflow-hidden">
            {/* Sidebar - Pro Glassmorphism Style */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-bg border-r border-border-main z-50 transform transition-transform duration-300 ease-out hidden lg:flex flex-col">
                <div className="p-6 border-b border-border-main">
                    <button onClick={() => setIsLauncherOpen(true)} className="flex items-center space-x-3 mb-6 w-full text-left group hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                            <Rocket className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#7A1216] leading-none tracking-tight">DQH</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Quản lý nâng tầm</p>
                        </div>
                    </button>

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
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
                    {navItems.map((item) => {
                        const isMatch = (path: string) => {
                            if (item.matchPrefix) {
                                return item.matchPrefix.some((prefix: string) => path.startsWith(prefix));
                            }
                            return path === item.path;
                        };

                        const linkContent = (
                            <>
                                <item.icon className={`mr-3 ${isMatch(location.pathname) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} size={18} />
                                <span>{item.name}</span>
                            </>
                        );

                        const mainLink = (
                            <NavLink
                                key={item.path || item.name}
                                to={item.path || '#'}
                                className={() =>
                                    `group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isMatch(location.pathname)
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    } ${item.mobileChildren ? 'hidden lg:flex' : 'flex'}`
                                }
                            >
                                {linkContent}
                            </NavLink>
                        );

                        if (item.mobileChildren) {
                            const isExpanded = expandedNavs[item.name]
                            const isAnyChildActive = item.mobileChildren.some((child: any) => {
                                if (child.matchPrefix) {
                                    return child.matchPrefix.some((prefix: string) => location.pathname.startsWith(prefix))
                                }
                                return location.pathname === child.path
                            })

                            return (
                                <div key={item.name} className="contents">
                                    {/* Desktop view: normal link */}
                                    {mainLink}
                                    
                                    {/* Mobile view: accordion */}
                                    <div className="space-y-1 mb-2 lg:hidden">
                                        <button
                                            onClick={() => toggleNav(item.name)}
                                            className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isAnyChildActive && !isExpanded
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className={`mr-3 ${isAnyChildActive && !isExpanded ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} size={18} />
                                                <span>{item.name}</span>
                                            </div>
                                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="pl-3 pr-1 space-y-1 mt-1 border-l-2 border-slate-100 ml-4">
                                                {item.mobileChildren.map((child: any) => {
                                                    const isChildMatch = (path: string) => {
                                                        if (child.matchPrefix) {
                                                            return child.matchPrefix.some((prefix: string) => path.startsWith(prefix))
                                                        }
                                                        return path === child.path
                                                    }

                                                    return (
                                                        <NavLink
                                                            key={child.path}
                                                            to={child.path}
                                                            className={() =>
                                                                `group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isChildMatch(location.pathname)
                                                                    ? 'bg-primary text-white shadow-sm'
                                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                                                }`
                                                            }
                                                        >
                                                            {() => (
                                                                <>
                                                                    <child.icon className={`mr-3 ${isChildMatch(location.pathname) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} size={18} />
                                                                    <span>{child.name}</span>
                                                                </>
                                                            )}
                                                        </NavLink>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return mainLink;
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
            <main className="flex-1 lg:ml-64 flex flex-col h-screen relative bg-app-bg pb-16 md:pb-0">
                {/* Header */}
                <header className="sticky top-0 bg-white border-b border-border-main z-40 px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-3">
                        {/* Top Row: Title & Actions */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button onClick={() => setIsLauncherOpen(true)} className="lg:hidden w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform">
                                    <Rocket className="text-white" size={16} />
                                </button>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{currentTitle()}</h2>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                                {/* Refresh Button */}
                                <button
                                    onClick={handleRefresh}
                                    className={`hidden lg:flex p-2 sm:p-2.5 rounded-xl bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm border border-slate-100 ${isRefreshing ? 'animate-spin' : ''}`}
                                    title="Làm mới dữ liệu"
                                >
                                    <RefreshCw size={18} strokeWidth={2.5} />
                                </button>

                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setIsNotifOpen(!isNotifOpen);
                                            if (isChatOpen) setIsChatOpen(false);
                                        }}
                                        className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 transition-all border border-slate-200/50"
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
                                    className="hidden lg:flex relative p-2 sm:p-2.5 rounded-xl bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 transition-all border border-slate-200/50"
                                >
                                    <MessageSquare size={18} strokeWidth={2.5} />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-blue-500 to-cyan-500 text-white text-[10px] rounded-full flex items-center justify-center font-black ring-2 ring-white shadow-sm">0</span>
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Horizontal Tabs for Task Views (removed and moved to sidebar, hidden on mobile) */}
                        <div className="hidden lg:block">
                            {['/kanban', '/tasks', '/schedule', '/gantt', '/projects', '/dashboard'].includes(location.pathname) && (
                                <div className="flex items-center space-x-2 border border-slate-200 p-1 rounded-xl bg-slate-50 overflow-x-auto w-full scrollbar-hide shrink-0 flex-nowrap snap-x">
                                    <NavLink to="/kanban" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Kanban
                                    </NavLink>
                                    <NavLink to="/tasks" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Danh sách
                                    </NavLink>
                                    <NavLink to="/schedule" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Lịch trình
                                    </NavLink>
                                    <NavLink to="/gantt" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Sơ đồ Gantt
                                    </NavLink>
                                    <NavLink to="/projects" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Dự án
                                    </NavLink>
                                    <NavLink to="/dashboard" className={({ isActive }) => `px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Dashboard
                                    </NavLink>
                                </div>
                            )}
                        </div>

                        {/* Horizontal Tabs for CRM Views (hidden on mobile) */}
                        <div className="hidden lg:block">
                            {location.pathname === '/customers' && (
                                <div className="flex items-center space-x-2 border border-slate-200 p-1 rounded-xl bg-slate-50 overflow-x-auto w-full scrollbar-hide shrink-0 flex-nowrap snap-x">
                                {[
                                    { id: 'DASHBOARD', name: 'Tổng quan' },
                                    { id: 'CUSTOMERS', name: 'Khách hàng' },
                                    { id: 'LEADS', name: 'KH Tiềm năng' },
                                    { id: 'TASKS', name: 'Theo dõi Task' },
                                    { id: 'PROJECTS', name: 'Dự án' },
                                    { id: 'GANTT', name: 'Gantt Chart' },
                                    { id: 'INVOICES', name: 'Hóa đơn' },
                                    { id: 'ACTIVITY_LOG', name: 'Nhật ký' },
                                ].map(item => {
                                    const isActive = activeCrmTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(`/customers?tab=${item.id}`)}
                                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 snap-start ${isActive ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hub & Spoke Launcher */}
                <FullscreenLauncher 
                    isOpen={isLauncherOpen} 
                    onClose={() => setIsLauncherOpen(false)} 
                />

                <GlobalChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    currentUserProfile={profile}
                />

                {/* Page View */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full ${location.pathname.startsWith('/customers') ? '' : 'p-3 sm:p-6'}`}>
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

            <BottomTabBar />
        </div>
    )
}
