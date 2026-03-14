import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Rocket, 
  Key, 
  Send, 
  LogOut, 
  HardHat, 
  ListTodo, 
  FolderOpen, 
  LayoutDashboard, 
  Heart, 
  History, 
  Users,
  RefreshCw,
  Plus,
  Bell,
  MessageSquare,
  Menu,
  X,
  LayoutTemplate,
  Video
} from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Công việc', icon: ListTodo, path: '/tasks' },
    { name: 'Marketing', icon: Video, path: '/marketing' },
    { name: 'Moodboard', icon: LayoutTemplate, path: '/moodboard' },
    { name: 'Thi Công', icon: HardHat, path: '/construction' },
    { name: 'Dự án', icon: FolderOpen, path: '/projects' },
    { name: 'Thống kê (Dashboard)', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Chăm sóc KH', icon: Heart, path: '/customers' },
    { name: 'Lịch sử', icon: History, path: '/history' },
    { name: 'Người dùng', icon: Users, path: '/users' },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith('/customers')) return 'Chăm sóc Khách hàng';
    const item = menuItems.find(i => location.pathname.startsWith(i.path));
    return item ? item.name : 'DQH App';
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-800 leading-tight">DQH</h1>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">QUẢN LÝ NÂNG TẦM</p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <div className="font-bold text-gray-900">Admin</div>
                <div className="text-sm text-orange-500 font-medium">Admin</div>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đổi mật khẩu</span>
                <span className="sm:hidden">Đổi MK</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                <Send className="w-3.5 h-3.5" />
                Telegram ID
              </button>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 py-2 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 hidden lg:block">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <div className="font-bold text-gray-900 text-sm mb-1">App QLDA DQH</div>
            <div className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full mb-3">
              version 1.0
            </div>
            <div className="text-[10px] text-gray-400 font-medium">
              © 2026 dqharchitects.vn
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={toggleSidebar}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-xs">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button className="flex items-center gap-1 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">Tạo mới</span>
            </button>
            
            <button className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-yellow-50 text-yellow-600 relative hover:bg-yellow-100 transition-colors">
              <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-[9px] lg:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                1
              </span>
            </button>
            
            <button className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 relative hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-blue-500 text-white text-[9px] lg:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                0
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-gray-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
