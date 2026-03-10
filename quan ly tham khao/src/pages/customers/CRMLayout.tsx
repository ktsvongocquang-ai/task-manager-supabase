import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  CheckSquare, 
  Briefcase, 
  FileText, 
  Clock, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import CRMHeader from './components/CRMHeader';

export default function CRMLayout() {
  const [isCRMSidebarOpen, setIsCRMSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', icon: LayoutDashboard, path: '/customers' },
    { name: 'Khách hàng', icon: Users, path: '/customers/list' },
    { name: 'KH Tiềm năng', icon: Target, path: '/customers/leads' },
    { type: 'divider' },
    { name: 'Theo dõi Task', icon: CheckSquare, path: '/customers/tasks' },
    { name: 'Dự án', icon: Briefcase, path: '/customers/projects' },
    { name: 'Gantt Chart', icon: Clock, path: '/customers/gantt' },
    { name: 'Hóa đơn', icon: FileText, path: '/customers/invoices' },
    { name: 'Nhật ký', icon: Clock, path: '/customers/logs' },
    { type: 'divider' },
    { name: 'Hệ thống', icon: Settings, path: '/customers/system' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden font-sans relative">
      <CRMHeader toggleSidebar={() => setIsCRMSidebarOpen(!isCRMSidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile CRM Sidebar Overlay */}
        {isCRMSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsCRMSidebarOpen(false)}
          />
        )}

        {/* Secondary Sidebar */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isCRMSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Quản Lý</h2>
              <button 
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-md"
                onClick={() => setIsCRMSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu Quản Lý</h2>
            <nav className="space-y-1">
              {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return <div key={`div-${index}`} className="h-px bg-gray-200 my-4" />;
                }
                
                const Icon = item.icon!;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path!}
                    end={item.path === '/customers'}
                    onClick={() => setIsCRMSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
