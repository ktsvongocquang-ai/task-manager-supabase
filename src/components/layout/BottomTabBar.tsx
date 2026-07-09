import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Kanban, User, HardHat, HeartHandshake, Folder, Calendar, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { canAccessRoute } from '../../utils/permissions';

// Tab slot definition
type TabDef = { name: string; path: string; icon: React.ElementType; exact?: boolean };

const tabLinkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-w-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`;

export const BottomTabBar = () => {
    const { profile } = useAuthStore();
    useAuthStore(state => state.systemPermissions); // Trigger re-render on permission change
    const role = profile?.role?.trim() || '';

    // ── Build tab list based on role ──────────────────────────────
    const buildTabs = (): TabDef[] => {
        // Giám sát: chỉ cần Thi Công + Lịch + Báo cáo
        if (role === 'Giám Sát') {
            return [
                { name: 'Tổng quan', path: '/dashboard', icon: Home },
                { name: 'Thi Công', path: '/construction', icon: HardHat },
                { name: 'Lịch', path: '/schedule', icon: Calendar },
                { name: 'Việc của tôi', path: '/mytasks', icon: User },
                { name: 'Tài khoản', path: '/profile', icon: User },
            ];
        }

        // Admin / Quản lý thi công / Quản lý thiết kế → có cả Thi Công & Tài chính
        const hasConstruction = canAccessRoute(role, '/construction');
        const hasFinance = canAccessRoute(role, '/finance');
        if (hasConstruction && hasFinance) {
            return [
                { name: 'Tổng quan', path: '/dashboard', icon: Home },
                { name: 'Thi Công', path: '/construction', icon: HardHat },
                { name: 'Tài chính', path: '/finance', icon: DollarSign },
                { name: 'Lịch', path: '/schedule', icon: Calendar },
                { name: 'Tài khoản', path: role === 'Admin' ? '/users' : '/profile', icon: User },
            ];
        }

        // Sale → CRM nổi bật
        if (role === 'Sale') {
            return [
                { name: 'Tổng quan', path: '/dashboard', icon: Home },
                { name: 'CRM', path: '/customers', icon: HeartHandshake },
                { name: 'Lịch', path: '/schedule', icon: Calendar },
                { name: 'Dự án', path: '/projects', icon: Folder },
                { name: 'Tài khoản', path: '/profile', icon: User },
            ];
        }

        // Marketing
        if (role === 'Marketing') {
            return [
                { name: 'Tổng quan', path: '/marketing?tab=dashboard', icon: Home },
                { name: 'Kanban', path: '/marketing?tab=kanban', icon: Kanban },
                { name: 'Lịch', path: '/schedule', icon: Calendar },
                { name: 'Bài đăng', path: '/marketing?tab=posts', icon: Folder },
                { name: 'Tài khoản', path: '/profile', icon: User },
            ];
        }

        // Default: Thiết kế / nhân viên
        return [
            { name: 'Tổng quan', path: '/dashboard', icon: Home },
            { name: 'Công việc', path: '/tasks', icon: Kanban },
            { name: 'Lịch', path: '/schedule', icon: Calendar },
            { name: 'Dự án', path: '/projects', icon: Folder },
            { name: 'Tài khoản', path: '/profile', icon: User },
        ];
    };

    const tabs = buildTabs();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-[60] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.07)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-stretch h-16 px-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            end={tab.exact}
                            className={({ isActive }) => tabLinkClass(isActive || (tab.path.includes('?') && window.location.href.includes(tab.path.split('?')[1] || '')))}
                        >
                            {({ isActive }) => {
                                const active = isActive || (tab.path.includes('?') && window.location.href.includes(tab.path.split('?')[1] || ''));
                                return (
                                    <>
                                        <div className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all ${active ? 'bg-indigo-50' : ''}`}>
                                            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                        </div>
                                        <span className="text-[9px] font-bold leading-none truncate max-w-[56px] text-center">{tab.name}</span>
                                    </>
                                );
                            }}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};
