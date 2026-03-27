import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Calendar, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ProjectModal from './components/ProjectModal';

const initialMockProjects = [
  {
    id: 1,
    name: 'Biệt thự Vườn Củ Chi',
    client: 'Anh Minh',
    progress: 75,
    status: 'Đang thi công',
    deadline: '15/04/2026',
    team: ['KTS. Hùng', 'GS. Tuấn'],
    contractStatus: 'Đã ký HĐ Thi công',
    payments: [1, 2, 3],
    designChecklist: ['survey', 'contract', 'concept', '3d_v1', '3d_final', 'technical'],
    feedbackRounds: 2,
    activityLog: [
      { date: '09/03/2026 10:00', content: 'Đổ bê tông sàn lầu 1.' }
    ],
    actual_start_date: '2026-03-01',
    design_days: 15,
    rough_construction_days: 30,
    finishing_days: 20,
    interior_days: 15,
    handover_date: '2026-05-20',
    shooting_milestones: [
      { id: 'm1', milestone_date: '2026-03-15', content: 'Quay chốt thiết kế 3D', status: 'completed' },
      { id: 'm2', milestone_date: '2026-04-10', content: 'Quay xong phần thô', status: 'pending' },
      { id: 'm3', milestone_date: '2026-05-15', content: 'Quay hoàn thiện nội thất', status: 'pending' }
    ]
  },
  {
    id: 2,
    name: 'Căn hộ 3PN Vinhomes',
    client: 'Chị Lan',
    progress: 30,
    status: 'Đang thiết kế',
    deadline: '20/03/2026',
    team: ['KTS. Mai'],
    contractStatus: 'Đang thiết kế',
    payments: [1],
    designChecklist: ['survey', 'contract', 'concept'],
    feedbackRounds: 1,
    activityLog: [
      { date: '10/03/2026 14:00', content: 'Gửi phương án mặt bằng 2D lần 1.' }
    ],
    actual_start_date: '2026-03-10',
    design_days: 20,
    rough_construction_days: 0,
    finishing_days: 0,
    interior_days: 0,
    handover_date: '2026-06-15',
    shooting_milestones: [
      { id: 'm4', milestone_date: '2026-03-25', content: 'Quay concept thiết kế', status: 'pending' }
    ]
  },
  {
    id: 3,
    name: 'Nhà phố 4 tầng Tân Bình',
    client: 'Cô Hoa',
    progress: 100,
    status: 'Hoàn thành',
    deadline: '28/02/2026',
    team: ['KTS. Hùng', 'GS. Tuấn', 'KT. Linh'],
    contractStatus: 'Bàn giao Hồ sơ',
    payments: [1, 2, 3],
    designChecklist: ['survey', 'contract', 'concept', '3d_v1', '3d_final', 'technical', 'handover'],
    feedbackRounds: 3,
    activityLog: [
      { date: '28/02/2026 09:00', content: 'Bàn giao hồ sơ thiết kế hoàn chỉnh.' }
    ],
    actual_start_date: '2026-01-15',
    design_days: 30,
    rough_construction_days: 45,
    finishing_days: 30,
    interior_days: 20,
    handover_date: '2026-05-20',
    shooting_milestones: []
  }
];

export default function Projects() {
  const [projects, setProjects] = useState(initialMockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.newProjectFromCustomer) {
      const customer = location.state.newProjectFromCustomer;
      setEditingProject({
        name: `Dự án ${customer.propertyType} - ${customer.namePhone.split('-')[0].trim()}`,
        client: customer.namePhone,
        contractStatus: 'Đang soạn HĐ',
        payments: [],
        designChecklist: [],
        feedbackRounds: 0,
        activityLog: [
          { date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }), content: 'Chuyển từ CRM Khách hàng sang Dự án.' }
        ]
      });
      setIsModalOpen(true);
      
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenModal = (project?: any) => {
    setEditingProject(project || null);
    setIsModalOpen(true);
  };

  const handleSaveProject = (projectData: any) => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...projectData, id: p.id } : p));
    } else {
      setProjects([{ ...projectData, id: Date.now(), progress: 0, status: 'Mới', deadline: '-', team: [] }, ...projects]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Đang thi công': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Đang thiết kế': return <Clock className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-emerald-100 text-emerald-700';
      case 'Đang thi công': return 'bg-blue-100 text-blue-700';
      case 'Đang thiết kế': return 'bg-purple-100 text-purple-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Dự án</h2>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Thêm Dự án
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm dự án, khách hàng..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dự án</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiến độ Thiết kế</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái HĐ</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thanh toán</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân sự</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleOpenModal(project)}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 mb-1">{project.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-gray-400">#{project.id.toString().padStart(4, '0')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{project.client}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                        <span>{project.progress}%</span>
                        {project.feedbackRounds > 0 && (
                          <span className="text-orange-600">FB: {project.feedbackRounds}</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${project.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.contractStatus || project.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden w-24">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${((project.payments?.length || 0) / 4) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{project.payments?.length || 0}/4</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{project.team.join(', ') || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </div>
  );
}
