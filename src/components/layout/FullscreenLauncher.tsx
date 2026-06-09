import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Users, FileText, ChevronRight, Banknote, Kanban } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useAuthStore } from '../../store/authStore';

interface FullscreenLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenLauncher: React.FC<FullscreenLauncherProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isRendered, setIsRendered] = useState(false);
  const { profile } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      navigate(path);
    }, 200);
  };

  const modules = [
    {
      id: 'projects',
      name: 'Quản lý Dự án',
      icon: FolderOpen,
      path: '/projects',
      desc: 'Danh sách công trình & hợp đồng',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'kanban',
      name: 'Tiến độ Kanban',
      icon: Kanban,
      path: '/kanban',
      desc: 'Công việc theo luồng quy trình',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      id: 'construction',
      name: 'Nhân sự công trường',
      icon: Users,
      path: '/construction',
      desc: 'Khoán việc, thầu phụ, nhật ký',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'customers',
      name: 'Chăm sóc khách hàng',
      icon: Users,
      path: '/customers',
      desc: 'Leads, Báo giá, Chăm sóc',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      id: 'marketing',
      name: 'Marketing Workflow',
      icon: FileText,
      path: '/marketing',
      desc: 'Quy chuẩn, Content, Videos',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: 'finance',
      name: 'Tài chính & Công nợ',
      icon: Banknote,
      path: '/dashboard',
      desc: 'Dashboard thống kê, Thu chi',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  const getFilteredModules = () => {
      const role = profile?.role?.trim() || 'Thiết kế';
      const dept = profile?.position;
      const isAdmin = role === 'Admin' || role === 'Giám đốc';

      if (isAdmin) return modules;

      const { hasPermission } = useAuthStore.getState();

      return modules.filter(m => {
          if (m.id === 'kanban' || m.id === 'projects') {
              return hasPermission(role, 'Tab Công Việc (Xem)');
          }
          if (m.id === 'marketing') {
              return hasPermission(role, 'Tab Marketing (Xem)');
          }
          if (m.id === 'construction') {
              return hasPermission(role, 'Tab Thi Công (Xem)');
          }
          if (m.id === 'customers') {
              return hasPermission(role, 'Tab Chăm Sóc KH (Xem)');
          }
          if (m.id === 'finance') {
              return role === 'Quản lý Sale' || dept === 'Sale';
          }
          return false;
      });
  };

  const filteredModules = getFilteredModules();

  if (!isRendered) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Tất Cả Phân Hệ">
        <div className="flex flex-col gap-2.5 pb-2">
          {filteredModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleNavigate(mod.path)}
              className="group flex items-center text-left bg-[#222] p-3 sm:p-4 rounded-2xl border border-[#333] shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 w-full"
            >
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 duration-300 shrink-0 ${mod.color}`}>
                <mod.icon size={20} strokeWidth={2.5} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 text-[14px] sm:text-base leading-tight group-hover:text-indigo-600 transition-colors truncate">{mod.name}</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 sm:mt-1 truncate opacity-80">{mod.desc}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1c1c1c] text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0 ml-2">
                <ChevronRight size={16} strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>
    </BottomSheet>
  );
};
