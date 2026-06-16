import React from 'react';
import { Layers, Clock, BookOpen, User, Camera } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'projects' | 'progress' | 'notifications' | 'profile';
  onTabChange: (tab: 'projects' | 'progress' | 'notifications' | 'profile') => void;
  onActionClick: () => void;
  onCaptureClick: () => void;
  activeRole?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange, onActionClick, onCaptureClick, activeRole }) => {
  const tabs = [
    { id: 'projects' as const, label: 'Dự án', icon: Layers },
    { id: 'progress' as const, label: 'Tiến độ', icon: Clock },
    { id: 'notifications' as const, label: 'Tra cứu', icon: BookOpen },
    { id: 'profile' as const, label: 'Cá nhân', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-around px-1 z-50">
      {tabs.map((tab, idx) => (
        <React.Fragment key={tab.id}>
          {idx === 2 && (
            <div className="relative -top-4 flex justify-center w-14">
              <button 
                onClick={onCaptureClick}
                className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-full border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/30 text-white hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-95 cursor-pointer"
                aria-label="Chụp lỗi nhanh"
              >
                <Camera size={22} strokeWidth={2.5} />
              </button>
            </div>
          )}
          <button
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-all cursor-pointer ${
              currentTab === tab.id 
                ? 'text-indigo-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon 
              size={18} 
              strokeWidth={currentTab === tab.id ? 2.5 : 1.8} 
              className={currentTab === tab.id ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' : ''}
            />
            <span className={`text-[9px] font-bold tracking-tight ${currentTab === tab.id ? 'text-indigo-300' : ''}`}>
              {tab.label}
            </span>
            {currentTab === tab.id && (
              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
