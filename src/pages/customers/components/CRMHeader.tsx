
import { Bell, Search, Settings, User, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface CRMHeaderProps {
  toggleSidebar?: () => void;
}

export default function CRMHeader({ toggleSidebar }: CRMHeaderProps) {
  const location = useLocation();
  
  const tabs = [
    { name: 'Khách hàng', path: '/customers/list' },
    { name: 'Báo cáo', path: '/customers' },
    { name: 'Nhắc việc', path: '/customers/tasks' },
    { name: 'Lịch sử', path: '/customers/history' },
    { name: 'Cài đặt', path: '/customers/settings' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          onClick={toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-indigo-600 hidden sm:block">CRM Master</h1>
        
        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === tab.path || (tab.path === '/customers' && location.pathname === '/customers')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none w-48 lg:w-64"
          />
        </div>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 hidden sm:block">
          <Settings className="w-5 h-5" />
        </button>
        
        <button className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium ml-1 md:ml-2">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
