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
      const role = profile?.role;
      const dept = profile?.position;
      const isAdmin = role === 'Admin' || role === 'Giám đốc';

      if (isAdmin) return modules;

      if (role === 'Quản lý Sale' || dept === 'Sale') {
          return modules.filter(m => ['finance', 'kanban', 'customers', 'projects'].includes(m.id));
      }

      if (role === 'Giám sát - Quản lý' || dept === 'Thi công') {
          return modules.filter(m => ['kanban', 'construction', 'projects'].includes(m.id));
      }

      if (role === 'Quản lý Marketing' || dept === 'Marketing') {
          return modules.filter(m => ['kanban', 'marketing', 'projects'].includes(m.id));
      }

      if (role === 'Nhân viên Thiết kế' || dept === 'Thiết kế') {
          // Designers only need Kanban, Projects (maybe), and Moodboard (which isn't a module yet but kanban is enough here)
          return modules.filter(m => ['kanban', 'projects'].includes(m.id));
      }

      // Default
      return modules.filter(m => ['kanban', 'construction', 'marketing', 'projects'].includes(m.id));
  };

  const filteredModules = getFilteredModules();

  if (!isRendered) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Tất Cả Phân Hệ">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-2">
          {filteredModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleNavigate(mod.path)}
              className="group flex flex-col text-left bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-110 duration-300 ${mod.color}`}>
                <mod.icon size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{mod.name}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed opacity-80">{mod.desc}</p>
              
              <div className="mt-auto pt-4 flex justify-end">
                 <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={16} strokeWidth={3} />
                 </div>
              </div>
            </button>
          ))}
        </div>
    </BottomSheet>
  );
};
