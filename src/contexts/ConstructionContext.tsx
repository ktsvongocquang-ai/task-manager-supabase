import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Use type-only import above instead of unused ViewState/TabState

interface Task {
  id: string;
  name: string;
  category: string;
  subcontractor: string;
  days: number;
  personnel: number;
  budget: number;
  approved: boolean;
  progress?: number;
  startDate?: string;
  endDate?: string;
  status?: 'Chưa bắt đầu' | 'Đang chờ' | 'Đang thực hiện' | 'Hoàn thành' | 'Trễ hạn';
}

interface Project {
  id: string;
  name: string;
  date: string;
  status: string;
  budget: number;
  actualCost: number;
  startDate?: string;
  hasInputData?: boolean;
}

interface ConstructionContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const initialProjects: Project[] = [
  { id: '1', name: 'Nhà cô Lan', date: '06/05/2024', status: 'ĐANG CHẠY', budget: 150000000, actualCost: 45000000, startDate: '2024-05-06', hasInputData: true },
  { id: '2', name: 'Biệt thự Anh Hùng', date: '15/05/2024', status: 'MỚI', budget: 0, actualCost: 0, startDate: '2024-05-15', hasInputData: false }
];

const initialTasks: Task[] = [
  { id: 't1', name: 'Công tác thiết kế và chuẩn bị hồ sơ', category: 'KHÁC', subcontractor: '', days: 5, personnel: 2, budget: 15000000, approved: true, startDate: '2024-05-06', endDate: '2024-05-10', status: 'Hoàn thành', progress: 0 },
  { id: 't2', name: 'Tháo dỡ - Vận chuyển khỏi căn hộ', category: 'THI CÔNG', subcontractor: 'Hùng (Đào móng)', days: 2, personnel: 4, budget: 5000000, approved: true, startDate: '2024-05-11', endDate: '2024-05-12', status: 'Hoàn thành', progress: 0 },
  { id: 't3', name: 'Thi công hệ thống điện và chiếu sáng', category: 'MEP', subcontractor: 'Công ty Điện Beta (MEP)', days: 10, personnel: 4, budget: 45000000, approved: false, startDate: '2024-05-13', endDate: '2024-05-22', status: 'Đang thực hiện', progress: 0 },
  { id: 't4', name: 'Thi công trang trí mặt tiền', category: 'HOÀN THIỆN', subcontractor: 'Đội Sơn Delta (Hoàn thiện)', days: 12, personnel: 6, budget: 85000000, approved: true, startDate: '2024-05-23', endDate: '2024-06-03', status: 'Chưa bắt đầu', progress: 0 }
];

const ConstructionContext = createContext<ConstructionContextType | undefined>(undefined);

export const ConstructionProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  return (
    <ConstructionContext.Provider value={{
      projects,
      setProjects,
      tasks,
      setTasks,
    }}>
      {children}
    </ConstructionContext.Provider>
  );
};

export const useConstruction = () => {
  const context = useContext(ConstructionContext);
  if (context === undefined) {
    throw new Error('useConstruction must be used within a ConstructionProvider');
  }
  return context;
};
