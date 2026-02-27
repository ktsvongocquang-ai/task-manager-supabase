import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    MessageSquare,
    Users,
    LogOut,
    Menu,
    X
} from 'lucide-react'

export const Layout = () => {
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const navItems = [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Dự án', path: '/projects', icon: FolderKanban },
        { name: 'Nhiệm vụ', path: '/tasks', icon: CheckSquare },
        { name: 'Thảo luận', path: '/chat', icon: MessageSquare },
    ]

    // Only show Staff for Admins or specific roles if needed
    if (profile?.role === 'Admin') {
        navItems.push({ name: 'Nhân sự', path: '/staff', icon: Users })
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col fixed inset-y-0 z-10 transition-transform">
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 font-bold text-white shadow-lg">T</div>
                    <span className="text-lg font-bold text-white tracking-wide">Task Manager</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} className="mr-3" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Người dùng'}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.role || 'Nhân viên'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} className="mr-3" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-64 min-w-0">

                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 font-bold text-white">T</div>
                        <span className="text-lg font-bold text-slate-800">Task Manager</span>
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

                {/* Page Content Rendering Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}
