import React from 'react';
import { Layers, CircleDashed, ArrowDownToLine, Bell, User } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'projects' | 'progress' | 'notifications' | 'profile';
  onTabChange: (tab: 'projects' | 'progress' | 'notifications' | 'profile') => void;
  onActionClick: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange, onActionClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-around px-2 z-50">
      <button 
        onClick={() => onTabChange('projects')}
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'projects' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
      >
        <Layers size={20} strokeWidth={currentTab === 'projects' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Dự án</span>
      </button>

      <button 
        onClick={() => onTabChange('progress')}
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'progress' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
      >
        <CircleDashed size={20} strokeWidth={currentTab === 'progress' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Tiến độ</span>
      </button>

      {/* Center Action Button */}
      <div className="relative -top-4 flex justify-center w-16">
        <button 
          onClick={onActionClick}
          className="flex items-center justify-center w-12 h-12 bg-[#2a2a2a] rounded-full border border-[#444] shadow-lg text-white hover:bg-[#333] transition-colors"
        >
          <ArrowDownToLine size={20} />
        </button>
      </div>

      <button 
        onClick={() => onTabChange('notifications')}
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'notifications' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
      >
        <Bell size={20} strokeWidth={currentTab === 'notifications' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Thông báo</span>
      </button>

      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${currentTab === 'profile' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
      >
        <User size={20} strokeWidth={currentTab === 'profile' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Cá nhân</span>
      </button>
    </div>
  );
};
