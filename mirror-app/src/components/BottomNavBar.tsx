import React from 'react';
import { Layers, Clock, List, BookOpen, User } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'projects' | 'progress' | 'notifications' | 'profile';
  onTabChange: (tab: 'projects' | 'progress' | 'notifications' | 'profile') => void;
  onActionClick: () => void;
  activeRole?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange, onActionClick, activeRole }) => {
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
                onClick={onActionClick}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-600 to-orange-600 rounded-full border-2 border-rose-400/30 shadow-lg shadow-rose-500/20 text-white hover:from-rose-500 hover:to-orange-500 transition-all active:scale-95 cursor-pointer"
              >
                <List size={20} />
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
