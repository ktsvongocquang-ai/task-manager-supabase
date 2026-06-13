import React, { useMemo } from 'react';
import { Project, FloorPlan, MarkerNote } from '../types';
import { LayoutGrid, BookOpen, RefreshCw, X, HardHat, CheckCircle2, Bell, Search, ChevronDown, List, Plus, Star, AlertCircle, Check, MoreVertical, Edit3, Eye, Trash2, Folder } from 'lucide-react';

interface DarkDashboardProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  favoriteProjectIds: string[];
  dbSearchQuery: string;
  setDbSearchQuery: (q: string) => void;
  dashboardLayout: 'grid' | 'list';
  setDashboardLayout: (l: 'grid' | 'list') => void;
  setShowNewProjectModal: (s: boolean) => void;
  toggleFavoriteProject: (id: string) => void;
  handleDeleteProject: (id: string) => void;
  onEnterBoard: (projectId: string) => void;
  onRefresh: () => void;
  onOpenLessonsModal: () => void;
}

export default function DarkDashboard({
  projects,
  floorPlans,
  markerNotes,
  favoriteProjectIds,
  dbSearchQuery,
  setDbSearchQuery,
  dashboardLayout,
  setDashboardLayout,
  setShowNewProjectModal,
  toggleFavoriteProject,
  handleDeleteProject,
  onEnterBoard,
  onRefresh,
  onOpenLessonsModal
}: DarkDashboardProps) {
  
  const sortedAndFiltered = useMemo(() => {
    return projects.filter(p => {
      const q = dbSearchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.leader?.toLowerCase().includes(q) || 
             p.client?.toLowerCase().includes(q) ||
             p.address?.toLowerCase().includes(q);
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [projects, dbSearchQuery]);

  const statusCounts = useMemo(() => {
    let thiCong = 0;
    let hoanThanh = 0;
    projects.forEach(p => {
      if (p.progress >= 100 || p.status === 'Hoàn thành') hoanThanh++;
      else if (p.status === 'active' || p.status === 'Thi công' || p.progress < 100) thiCong++;
    });
    return { 'Thi công': thiCong, 'Hoàn thành': hoanThanh };
  }, [projects]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto min-h-screen text-[#F4F4F5] bg-[#0A0A0B] pb-24" style={{
        '--bg': '#0A0A0B',
        '--card': '#161619',
        '--card2': '#1F1F24',
        '--bd': 'rgba(255,255,255,0.09)',
        '--tx': '#F4F4F5',
        '--tx2': '#9B9BA1',
        '--tx3': '#646469',
        '--grn': '#3FD07E',
        '--grnb': 'rgba(63,208,126,0.13)',
        '--red': '#FF5C6C',
        '--redb': 'rgba(255,92,108,0.13)',
        '--amb': '#E7A33C',
        '--ambb': 'rgba(231,163,60,0.13)'
    } as React.CSSProperties}>
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 pt-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-xl bg-[var(--card2)] flex items-center justify-center border border-[var(--bd)] shadow-sm">
                    <LayoutGrid size={20} className="text-[var(--tx)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-[var(--tx)] leading-tight">Site Board</h1>
                    <div className="text-[10px] tracking-widest text-[var(--tx3)] uppercase font-semibold mt-0.5">DQH Architects</div>
                </div>
                <div className="flex items-center gap-2">
                    <div onClick={onOpenLessonsModal} className="flex items-center gap-1.5 border border-[var(--bd)] rounded-full px-3 py-1.5 text-[var(--tx2)] text-xs font-medium bg-[var(--card)] cursor-pointer hover:text-white">
                        <BookOpen size={14} /> Mẫu lỗi
                    </div>
                    <div className="flex items-center gap-1.5 border border-[var(--bd)] rounded-full px-3 py-1.5 text-[var(--tx2)] text-xs font-medium bg-[var(--card)] cursor-pointer hover:text-white" onClick={onRefresh}>
                        <RefreshCw size={14} />
                    </div>
                </div>
            </div>
        </div>

        <div className="px-4 mt-2">
            {/* Global Notification (Mock) */}
            <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 mb-6 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[var(--redb)] flex items-center justify-center shrink-0">
                    <X size={16} className="text-[var(--red)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--tx)] font-semibold truncate">Cập nhật hệ thống</div>
                    <div className="text-[11px] text-[var(--tx2)] mt-0.5">Vừa đồng bộ dữ liệu mới nhất từ IndexedDB</div>
                </div>
            </div>

            <div className="text-[11px] font-bold text-[var(--tx3)] tracking-wider mb-2 px-1">HOẠT ĐỘNG NHÓM</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--grn)] transition-colors cursor-pointer" onClick={() => setDbSearchQuery('')}>
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={16} className="text-[var(--tx2)]" />
                        <span className="text-xl font-bold text-[var(--tx)]">{projects.length}</span>
                    </div>
                    <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Tổng dự án</div>
                </div>
                <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--amb)] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                        <HardHat size={16} className="text-[var(--amb)]" />
                        <span className="text-xl font-bold text-[var(--amb)]">{statusCounts['Thi công']}</span>
                    </div>
                    <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Đang thi công</div>
                </div>
                <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--grn)] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[var(--grn)]" />
                        <span className="text-xl font-bold text-[var(--tx)]">{statusCounts['Hoàn thành']}</span>
                    </div>
                    <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Đã hoàn thành</div>
                </div>
                <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-[var(--tx2)]" />
                        <span className="text-xl font-bold text-[var(--tx)]">0</span>
                    </div>
                    <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Thông báo chưa đọc</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--bd)] rounded-xl px-3 py-2.5 mb-3 shadow-sm focus-within:border-[var(--grn)] transition-colors">
                <Search size={16} className="text-[var(--tx3)]" />
                <input
                    type="text"
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    placeholder="Tìm dự án, mã dự án..."
                    className="bg-transparent border-none outline-none text-sm text-[var(--tx)] w-full placeholder-[var(--tx3)] font-medium"
                />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--bd)] rounded-lg px-3 py-2 text-xs text-[var(--tx2)] font-medium cursor-pointer hover:bg-[var(--card2)] transition-colors">
                    Mới nhất <ChevronDown size={14} className="text-[var(--tx3)]" />
                </div>
                <div className="flex border border-[var(--bd)] rounded-lg overflow-hidden shrink-0">
                    <div className={`p-2 cursor-pointer transition-colors ${dashboardLayout === 'grid' ? 'bg-[var(--card2)]' : 'bg-[var(--card)] hover:bg-[var(--card2)]'}`} onClick={() => setDashboardLayout('grid')}>
                        <LayoutGrid size={16} className={dashboardLayout === 'grid' ? 'text-[var(--tx)]' : 'text-[var(--tx3)]'} />
                    </div>
                    <div className={`p-2 cursor-pointer transition-colors ${dashboardLayout === 'list' ? 'bg-[var(--card2)]' : 'bg-[var(--card)] hover:bg-[var(--card2)]'}`} onClick={() => setDashboardLayout('list')}>
                        <List size={16} className={dashboardLayout === 'list' ? 'text-[var(--tx)]' : 'text-[var(--tx3)]'} />
                    </div>
                </div>
                <div className="flex-1"></div>
                <button onClick={() => setShowNewProjectModal(true)} className="flex items-center gap-1.5 bg-[var(--tx)] text-[#0A0A0B] rounded-full px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                    <Plus size={16} /> Tạo dự án
                </button>
            </div>

            <div className="h-px bg-[var(--bd)] my-4 w-full"></div>

            {/* Project Cards View */}
            {dashboardLayout === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedAndFiltered.map(project => {
                        const isStarred = favoriteProjectIds.includes(project.id);
                        
                        // Calculate task stats
                        const fpIds = floorPlans.filter(fp => fp.projectId === project.id).map(fp => fp.id);
                        const pMarkers = markerNotes.filter(m => fpIds.includes(m.floorPlanId));
                        const activeTasks = pMarkers.filter(m => !m.tags || m.tags[0] !== 'Đã duyệt').length;
                        const doneTasks = pMarkers.filter(m => m.tags && m.tags[0] === 'Đã duyệt').length;

                        return (
                            <div key={project.id} onClick={() => onEnterBoard(project.id)} className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 flex flex-col shadow-sm hover:border-[var(--tx3)] transition-colors relative group cursor-pointer">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="text-[10px] tracking-widest uppercase text-[var(--tx3)] font-bold flex items-center gap-2 truncate">
                                        KTS · {project.leader || 'CHƯA PHÂN BỔ'}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavoriteProject(project.id); }}>
                                        <Star size={16} className={isStarred ? "text-[var(--amb)] fill-[var(--amb)]" : "text-[var(--tx3)]"} />
                                    </button>
                                </div>
                                
                                <div className="text-base font-bold text-[var(--tx)] mb-3 leading-snug">{project.name}</div>
                                
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {activeTasks > 0 ? (
                                        <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--ambb)] text-[var(--amb)] font-semibold border border-[var(--ambb)]">
                                            <AlertCircle size={12} /> {activeTasks} lỗi cần theo dõi
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--card2)] text-[var(--tx2)] font-semibold border border-[var(--bd)]">
                                            <CheckCircle2 size={12} /> Không có lỗi tồn
                                        </span>
                                    )}
                                    {doneTasks > 0 && (
                                        <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--grnb)] text-[var(--grn)] font-semibold border border-[var(--grnb)]">
                                            <Check size={12} /> Đã xử lý {doneTasks}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Progress */}
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="text-[11px] text-[var(--tx2)] font-medium w-12">Tiến độ</span>
                                    <div className="flex-1 h-1.5 bg-[var(--card2)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--tx)] rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-[var(--tx)] w-8 text-right">{project.progress}%</span>
                                </div>
                                
                                <div className="mt-auto pt-2 flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEnterBoard(project.id); }}
                                        className="flex-1 bg-[var(--card2)] border border-[var(--bd)] hover:bg-[var(--bd)] hover:text-white transition-colors text-[var(--tx)] rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                                    >
                                        <LayoutGrid size={16} /> Vào Board
                                    </button>
                                    
                                    {/* Actions */}
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }} className="w-10 h-10 border border-[var(--bd)] rounded-full flex items-center justify-center text-[var(--tx3)] hover:text-[var(--red)] hover:bg-[var(--redb)] transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* List View */}
            {dashboardLayout === 'list' && (
                <div className="bg-[var(--card)] rounded-xl border border-[var(--bd)] overflow-hidden shadow-sm">
                    {sortedAndFiltered.length === 0 ? (
                        <div className="p-8 text-center text-[var(--tx3)] text-sm">Không tìm thấy dự án nào</div>
                    ) : sortedAndFiltered.map(project => {
                        return (
                            <div key={project.id} onClick={() => onEnterBoard(project.id)} className="border-b border-[var(--bd)] last:border-0 p-4 hover:bg-[var(--card2)] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer">
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--card2)] border border-[var(--bd)] flex items-center justify-center shrink-0">
                                        <Folder size={18} className="text-[var(--tx2)]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[var(--tx)] mb-1 flex items-center gap-2">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-[var(--tx3)] font-medium flex items-center gap-3">
                                            <span>Quản lý: {project.leader || 'Chưa gán'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full sm:w-auto">
                                    <div className="flex-1 sm:w-32 flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-[var(--tx2)] font-semibold">
                                            <span>Tiến độ</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[var(--card)] border border-[var(--bd)] rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--tx)]" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEnterBoard(project.id); }}
                                        className="px-4 py-2 bg-[var(--tx)] text-[#0A0A0B] rounded-full text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        <LayoutGrid size={14} /> Board
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }} 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--tx3)] hover:text-[var(--red)] hover:bg-[var(--redb)] transition-colors ml-2"
                                        title="Xóa dự án"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
  );
}
