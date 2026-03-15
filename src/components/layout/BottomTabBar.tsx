import { NavLink } from 'react-router-dom';
import { Home, Kanban, User, Video, HardHat, HeartHandshake, LayoutTemplate, Folder } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const BottomTabBar = () => {
    const { profile } = useAuthStore();

    const getDynamicActionTab = () => {
        const role = profile?.role;
        const dept = profile?.position; // Position often maps to department in this app

        if (role === 'Quản lý Sale' || dept === 'Sale') {
            return { name: 'CRM', path: '/customers', icon: HeartHandshake };
        }
        if (role === 'Giám sát - Quản lý' || dept === 'Thi công') {
            return { name: 'Thi Công', path: '/construction', icon: HardHat };
        }
        if (role === 'Quản lý Marketing' || dept === 'Marketing') {
            return { name: 'Marketing', path: '/marketing', icon: Video };
        }
        if (role === 'Nhân viên Thiết kế' || dept === 'Thiết kế') {
            return { name: 'Ý tưởng', path: '/moodboard', icon: LayoutTemplate };
        }
        
        // Default to Tasks for normal employees/admins
        return { name: 'Công việc', path: '/tasks', icon: Kanban };
    };

    const actionTab = getDynamicActionTab();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] lg:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 px-2">
                <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold truncate">Tổng quan</span>
                        </>
                    )}
                </NavLink>

                {/* Dynamic Role Tab */}
                <NavLink 
                    to={actionTab.path} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <actionTab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold truncate">{actionTab.name}</span>
                        </>
                    )}
                </NavLink>

                <NavLink 
                    to="/projects" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <Folder size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold truncate">Dự án</span>
                        </>
                    )}
                </NavLink>

                {/* Keep profile tab if admin, otherwise simple search/account toggle */}
                <NavLink 
                    to={profile?.role === 'Admin' ? '/users' : '/history'} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold truncate">Tài khoản</span>
                        </>
                    )}
                </NavLink>
            </div>
        </nav>
    );
};
