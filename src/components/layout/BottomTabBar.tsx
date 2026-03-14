import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, FileText, User } from 'lucide-react';

export const BottomTabBar = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] md:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 px-2">
                <NavLink 
                    to="/kanban" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Tổng quan</span>
                        </>
                    )}
                </NavLink>
                <NavLink 
                    to="/projects" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <FolderOpen size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Dự án</span>
                        </>
                    )}
                </NavLink>
                <NavLink 
                    to="/documents" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <FileText size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Tài liệu</span>
                        </>
                    )}
                </NavLink>
                <NavLink 
                    to="/users" 
                    className={({ isActive }) => `flex flex-col items-center justify-center w-1/4 h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    {({ isActive }) => (
                        <>
                            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Cá nhân</span>
                        </>
                    )}
                </NavLink>
            </div>
        </nav>
    );
};
