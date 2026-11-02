// Thanh nút dưới cùng trên điện thoại — đổi theo khu làm việc (Thiết kế / Thi công) và vai trò.
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { bottomTabs, workspaceOfPath, workspacesFor, isNavActive } from '../../utils/workspaces';

export const BottomTabBar = () => {
    const { profile } = useAuthStore();
    useAuthStore(state => state.systemPermissions); // re-render khi đổi quyền
    const loc = useLocation();
    const role = profile?.role?.trim() || '';
    if (!workspacesFor(role).length) return null;
    const ws = workspaceOfPath(loc.pathname, role);
    const tabs = bottomTabs(ws, role);
    const accent = ws === 'construction' ? 'text-[#7A1216]' : 'text-indigo-600';
    const pill = ws === 'construction' ? 'bg-red-50' : 'bg-indigo-50';

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-[60] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.07)] print:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-stretch h-16 px-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isNavActive(tab, loc.pathname, loc.search);
                    return (
                        <Link key={tab.to} to={tab.to} replace={tab.to.startsWith('/construction') && loc.pathname === '/construction'}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-w-0 ${active ? accent : 'text-slate-500'}`}>
                            <div className={`relative flex items-center justify-center w-11 h-8 rounded-xl transition-all ${active ? pill : ''}`}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                            </div>
                            <span className="text-[10px] font-bold leading-none truncate max-w-[64px] text-center">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
