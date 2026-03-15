import { NavLink } from 'react-router-dom';
import { Home, Kanban, User, HardHat, HeartHandshake, LayoutTemplate, Folder, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const BottomTabBar = () => {
    const { profile } = useAuthStore();

    const getDynamicActionTab = () => {
        const role = profile?.role?.trim();

        if (role === 'Sale') {
            return { name: 'CRM', path: '/customers', icon: HeartHandshake };
        }
        if (role === 'Giám Sát') {
            return { name: 'Thi Công', path: '/construction', icon: HardHat };
        }
        if (role === 'Marketing') {
            return { name: 'Ds công việc', path: '/marketing', icon: Kanban };
        }
        if (role === 'Thiết Kế') {
            return { name: 'Ý tưởng', path: '/moodboard', icon: LayoutTemplate };
        }
        
        // Default to Tasks for normal employees/admins/managers
        return { name: 'Công việc', path: '/tasks', icon: Kanban };
    };

    const getDynamicProjectTab = () => {
        const role = profile?.role?.trim();
        if (role === 'Marketing') {
            return { name: 'Tiến độ dự án', path: '/marketing?tab=posts', icon: Folder };
        }
        
        return { name: 'Dự án', path: '/projects', icon: Folder };
    };

    const actionTab = getDynamicActionTab();
    const projectTab = getDynamicProjectTab();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] lg:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 px-2">
                {/* 1. Dashboard / Home Tab */}
                <NavLink 
                    to={profile?.role?.trim() === 'Marketing' ? '/marketing?tab=guidelines' : '/dashboard'} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive || (profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=guidelines')) ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => {
                        const isMarketingHomeMatch = profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=guidelines');
                        return (
                            <>
                                <Home size={22} strokeWidth={isActive || isMarketingHomeMatch ? 2.5 : 2} />
                                <span className="text-[10px] font-bold truncate">
                                    {profile?.role?.trim() === 'Marketing' ? 'TH bài đăng' : 'Tổng quan'}
                                </span>
                            </>
                        )
                    }}
                </NavLink>

                {/* 2. Dynamic Action Tab (Công việc / CRM / Thi công...) */}
                <NavLink 
                    to={actionTab.path} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${(isActive && !window.location.search.includes('tab=')) || (profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=kanban')) ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => {
                        const isMarketingActionMatch = profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=kanban');
                        return (
                            <>
                                <actionTab.icon size={22} strokeWidth={isActive || isMarketingActionMatch ? 2.5 : 2} />
                                <span className="text-[10px] font-bold truncate">{actionTab.name}</span>
                            </>
                        )
                    }}
                </NavLink>

                {/* 3. Dynamic Project Tab (Dự án / Tổng hợp bài đăng...) */}
                <NavLink 
                    to={projectTab.path} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive || (profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=posts')) ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => {
                        const isMarketingProjectMatch = profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=posts');
                        return (
                            <>
                                <projectTab.icon size={22} strokeWidth={isActive || isMarketingProjectMatch ? 2.5 : 2} />
                                <span className="text-[10px] font-bold truncate">{projectTab.name}</span>
                            </>
                        )
                    }}
                </NavLink>

                {/* 4. Profile / Calendar Tab */}
                <NavLink 
                    to={profile?.role?.trim() === 'Marketing' ? '/marketing?tab=calendar' : (profile?.role === 'Admin' ? '/users' : '/profile')} 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive || (profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=calendar')) ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => {
                        const isMarketingProfileMatch = profile?.role?.trim() === 'Marketing' && window.location.search.includes('tab=calendar');
                        const Icon = profile?.role?.trim() === 'Marketing' ? Calendar : User;
                        return (
                            <>
                                <Icon size={22} strokeWidth={isActive || isMarketingProfileMatch ? 2.5 : 2} />
                                <span className="text-[10px] font-bold truncate">
                                    {profile?.role?.trim() === 'Marketing' ? 'Quy chuẩn' : 'Tài khoản'}
                                </span>
                            </>
                        )
                    }}
                </NavLink>
            </div>
        </nav>
    );
};
