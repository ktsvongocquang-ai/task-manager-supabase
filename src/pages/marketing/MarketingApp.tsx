import React, { useState, useEffect, useRef } from 'react';
import { 
  Award,
  Mail,
  Users as UsersIcon,
  ListTodo,
  Plus, 
  Filter, 
  Calendar as CalendarIcon, 
  Video, 
  FileText, 
  AlertCircle,
  LayoutTemplate,
  Target,
  X,
  Archive,
  ChevronDown,
  ChevronRight,
  List,
  Camera,
  ShieldAlert,
  ChevronUp,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Edit,
  Search,
  Flag,
  GripVertical
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isSameWeek, isSameQuarter, isSameYear, parseISO, differenceInDays, isFuture, isToday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSearchParams, useLocation } from 'react-router-dom';
import MarketingRequestModal from './MarketingRequestModal';
// Removed SmartCard import as it is unused
import { BottomSheet } from '../../components/layout/BottomSheet';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import type { Project, Task } from '../../types';
import { MarketingProjectModal } from './MarketingProjectModal';
import { MarketingTaskModal } from './MarketingTaskModal';
import { ProjectGanttBoard } from './components/ProjectGanttBoard';

// Mock Data based on the Google Doc workflow
// @ts-ignore

const InlineDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  renderValue,
  renderOption
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
  renderValue?: (val: string) => React.ReactNode;
  renderOption?: (val: string) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full text-left group" ref={dropdownRef} onClick={e => e.stopPropagation()}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full cursor-pointer min-h-[32px] flex items-center justify-between rounded hover:bg-slate-50 transition-colors px-1"
      >
        <div className="flex-1 truncate">
          {value ? (renderValue ? renderValue(value) : <span className="text-[13px] text-slate-700">{value}</span>) : <span className="text-slate-400 text-xs">- {placeholder} -</span>}
        </div>
        {isOpen && <div className="text-slate-300 w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center transition-colors" onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}><X size={12} /></div>}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[160px] max-h-[250px] overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-100 py-1" style={{ top: '100%', left: 0 }}>
          {options.map((opt) => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className="px-2 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center"
            >
              {renderOption ? renderOption(opt) : <span className="text-[13px] text-slate-700 px-1 py-0.5">{opt}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getProjectStatusColor = (status: string) => {
  if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'Đầy đủ hình ảnh') return 'bg-sky-50 text-sky-700 border-sky-100';
  if (status.includes('Highres')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getProjectEffectColor = (ef: string) => {
  if (!ef) return 'bg-slate-100 text-slate-700';
  const trimEf = ef.trim();
  if (trimEf === 'Minimal') return 'bg-slate-100 text-slate-700';
  if (trimEf === 'Rustic') return 'bg-orange-100 text-orange-700';
  if (trimEf === 'Industrial') return 'bg-zinc-100 text-zinc-700';
  if (trimEf === 'Tropical') return 'bg-emerald-100 text-emerald-700';
  return 'bg-red-50 text-red-700';
};



const COLUMNS = [
  { id: 'COL_IDEA', name: 'Idea', color: 'bg-[#FFFBEB] border-[#FEF08A] text-[#854D0E]', border: 'border-[#FEF08A]' },
  { id: 'COL_CONTENT', name: 'Viết Content', color: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E3A8A]', border: 'border-[#BFDBFE]' },
  { id: 'COL_PROD', name: 'Sản xuất', color: 'bg-[#FDF4FF] border-[#E9D5FF] text-[#86198F]', border: 'border-[#E9D5FF]' },
  { id: 'COL_DONE', name: 'Hoàn thành đăng', color: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]', border: 'border-[#BBF7D0]' }
];

const STATUS_MAP: Record<string, { col: string, name: string, color: string, textColor: string }> = {
  IDEA: { col: 'COL_IDEA', name: 'Idea', color: 'bg-amber-100 text-amber-800 border-amber-200', textColor: 'text-amber-600' },
  CONTENT_EDITING: { col: 'COL_CONTENT', name: 'Viết Content (Đang soạn)', color: 'bg-blue-100 text-blue-800 border-blue-200', textColor: 'text-blue-600' },
  CONTENT_DONE: { col: 'COL_CONTENT', name: 'Viết Content (Chờ duyệt)', color: 'bg-blue-100 text-blue-800 border-blue-200', textColor: 'text-blue-600' },
  PROD_FILMING: { col: 'COL_PROD', name: 'Sản xuất (Đang Quay)', color: 'bg-purple-100 text-purple-800 border-purple-200', textColor: 'text-purple-600' },
  PROD_EDITING: { col: 'COL_PROD', name: 'Sản xuất (Đang Edit)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', textColor: 'text-indigo-600' },
  PROD_DONE: { col: 'COL_PROD', name: 'Sản xuất (Đã xong)', color: 'bg-purple-100 text-purple-800 border-purple-200', textColor: 'text-purple-600' },
  VIDEO_REVIEW: { col: 'COL_DONE', name: 'Gửi qua Phê duyệt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', textColor: 'text-emerald-600' },
  SCHEDULED: { col: 'COL_DONE', name: 'Lên lịch đăng', color: 'bg-gray-100 text-gray-800 border-gray-200', textColor: 'text-gray-600' },
  PUBLISHED: { col: 'COL_DONE', name: 'Hoàn thành đăng', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', textColor: 'text-emerald-600' },
  REJECTED: { col: 'COL_REJECTED', name: 'Từ chối / Để sau', color: 'bg-red-100 text-red-800 border-red-200', textColor: 'text-red-600' }
};



const platformData = [
  { name: 'Facebook', value: 8, color: '#4ade80' },
  { name: 'Tiktok', value: 23, color: '#fbbf24' },
  { name: 'Youtube', value: 6, color: '#c084fc' }
];

const MarketingDashboard = ({ videos }: { videos: any[] }) => {
  const [timeFilter, setTimeFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [formatFilter, setFormatFilter] = useState('Tất cả');

  // Calculate real performance from filtered tasks
  const performanceData = React.useMemo(() => {
    const filteredTasks = videos.filter(v => {
      if (statusFilter !== 'Tất cả' && v.status !== statusFilter) return false;
      if (formatFilter !== 'Tất cả' && v.format !== formatFilter) return false;
      return true;
    });
    
    // Sum metrics from published tasks within the filtered set
    const publishedTasks = filteredTasks.filter(v => v.status === 'PUBLISHED');
    
    // Total posts matches the length of ALL tasks in the filtered set
    const posts = filteredTasks.length;
    
    const views = publishedTasks.reduce((acc, v) => acc + (parseInt(v.views || '0', 10) || 0), 0);
    const interactions = publishedTasks.reduce((acc, v) => acc + (parseInt(v.interactions || '0', 10) || 0), 0);
    const shares = publishedTasks.reduce((acc, v) => acc + (parseInt(v.shares || '0', 10) || 0), 0);
    const saves = publishedTasks.reduce((acc, v) => acc + (parseInt(v.saves || '0', 10) || 0), 0);

    return { posts, views, interactions, shares, saves };
  }, [videos, statusFilter, formatFilter]);

  const currentData = React.useMemo(() => {
    let multiplier = 1;
    if (timeFilter === 'Theo Tuần') multiplier = 0.3;
    if (timeFilter === 'Theo Tháng') multiplier = 1.2;
    if (timeFilter === 'Theo Quý') multiplier = 3.5;
    if (timeFilter === 'Theo Năm') multiplier = 12.0;

    return {
      platforms: platformData.map(p => ({ ...p, value: Math.max(0, Math.floor(p.value * multiplier + (Math.random() * 5 - 2))) })),
      ...performanceData
    };
  }, [timeFilter, statusFilter, formatFilter, performanceData]);

  return (
    <div className="w-full mb-8">
      {/* Filters header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {['Tất cả', 'Theo Tuần', 'Theo Tháng', 'Theo Quý', 'Theo Năm'].map(t => (
            <button 
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-4 py-1.5 text-sm ${timeFilter === t ? 'font-bold bg-white text-slate-800 rounded-md shadow-sm' : 'font-medium text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[180px] bg-white rounded-lg shadow-sm border border-slate-200 px-2 py-0.5 relative z-20">
             <InlineDropdown
               value={statusFilter}
               options={['Tất cả', 'IDEA', 'CONTENT_EDITING', 'CONTENT_DONE', 'PROD_FILMING', 'PROD_EDITING', 'PROD_DONE', 'VIDEO_REVIEW', 'SCHEDULED', 'PUBLISHED', 'REJECTED']}
               onChange={(val) => setStatusFilter(val)}
               placeholder="Trạng thái"
               renderValue={(val) => {
                 if (val === 'Tất cả') return <span className="text-sm font-bold flex gap-1 items-center"><span className="text-slate-400 font-medium">Trạng thái:</span> <span>Tất cả</span></span>;
                 const info = STATUS_MAP[val];
                 return (
                   <span className={`text-sm font-bold flex gap-1 items-center ${info?.textColor || ''}`}>
                     <span className="text-slate-400 font-medium">Trạng thái:</span> 
                     <span className="truncate max-w-[100px]">{info?.name || val}</span>
                   </span>
                 );
               }}
               renderOption={(val) => {
                 if (val === 'Tất cả') return <span className="text-[13px] font-medium text-slate-600">Tất cả</span>;
                 const info = STATUS_MAP[val];
                 return (
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${info?.textColor?.replace('text-', 'bg-') || 'bg-slate-400'}`} />
                     <span className={`text-[13px] font-bold ${info?.textColor || 'text-slate-700'}`}>{info?.name || val}</span>
                   </div>
                 );
               }}
             />
          </div>
          <div className="w-[180px] bg-white rounded-lg shadow-sm border border-slate-200 px-2 py-0.5 relative z-10">
             <InlineDropdown
               value={formatFilter}
               options={['Tất cả', 'Video ngắn', 'Video dài', 'Bài viết mạng xã hội', 'Hình ảnh/Album']}
               onChange={(val) => setFormatFilter(val)}
               placeholder="Định dạng"
               renderValue={(val) => <span className="text-sm font-bold flex gap-1 items-center"><span className="text-slate-400 font-medium">Định dạng:</span> <span className="truncate max-w-[80px]">{val}</span></span>}
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center mb-6">SỐ LƯỢNG CONTENT MỖI NỀN TẢNG</h3>
          <div className="flex-1 min-h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.platforms} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {currentData.platforms.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 w-full">
             <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">HIỆU QUẢ CONTENT</h3>
             <div className="text-right">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">TỔNG BÀI VIẾT</p>
               <p className="text-2xl font-black text-slate-800 leading-none">{currentData.posts}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Views */}
            <div className="border border-indigo-50/60 bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-0.5">SỐ LƯỢT XEM</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{currentData.views.toLocaleString('vi-VN')}</p>
              </div>
            </div>

            {/* Interactions */}
            <div className="border border-indigo-50/60 bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <Target size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-0.5">SỐ LƯỢT TƯƠNG TÁC</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{currentData.interactions.toLocaleString('vi-VN')}</p>
              </div>
            </div>

            {/* Shares */}
            <div className="border border-indigo-50/60 bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-0.5">SỐ LƯỢT CHIA SẺ</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{currentData.shares.toLocaleString('vi-VN')}</p>
              </div>
            </div>

            {/* Saves */}
            <div className="border border-indigo-50/60 bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-0.5">SỐ LƯỢT LƯU LẠI</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{currentData.saves.toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketingApp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const getInitialView = () => {
    switch(initialTab) {
      case 'dashboard': return 'DASHBOARD';
      case 'guidelines': return 'WORKFLOW';
      case 'kanban': return 'KANBAN';
      case 'posts': return 'LIST';
      case 'calendar': return 'CALENDAR';
      case 'progress': return 'TIMELINE';
      case 'archive': return 'ARCHIVE';
      default: return 'KANBAN';
    }
  };

  const [videos, setVideos] = useState<any[]>([]);
  const { profile, hasPermission } = useAuthStore();
  const canEdit = hasPermission(profile?.role?.trim(), 'Tab Marketing (Sửa)');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [archiveSearch, setArchiveSearch] = useState('');

  // New Modals for Project and Task
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: projectsData, error: projErr }, { data: profilesData }] = await Promise.all([
        supabase.from('marketing_projects').select('*'),
        supabase.from('profiles').select('id, full_name, role, email')
      ]);
      
      if (projErr) console.error("Error fetching projects", projErr);
      if (profilesData) setProfiles(profilesData);
      
      let allTasks: Task[] = [];
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map((p: any) => p.id);
        const [
          { data: tasksData, error: taskErr },
          { data: milestonesData },
          { data: logsData }
        ] = await Promise.all([
          supabase.from('marketing_tasks').select('*').in('project_id', projectIds).is('parent_id', null),
          supabase.from('marketing_shooting_milestones').select('*').in('project_id', projectIds),
          supabase.from('marketing_daily_logs').select('*').in('project_id', projectIds).order('log_date', { ascending: false })
        ]);
        
        if (taskErr) console.error("Error fetching tasks", taskErr);
        if (tasksData) allTasks = tasksData as Task[];

        const combinedProjects = projectsData.map((p: any) => ({
            ...p,
            marketing_shooting_milestones: milestonesData?.filter((m: any) => m.project_id === p.id) || [],
            marketing_daily_logs: logsData?.filter((l: any) => l.project_id === p.id) || []
        })) as Project[];
        
        setProjects(combinedProjects);
      } else {
        setProjects([]);
      }
      
      setTasks(allTasks);

      // Map Tasks to the format expected by the MarketingApp UI
      const mappedVideos = allTasks.map(t => {
          let assigneeNames = '';
          if (Array.isArray(t.assignee_id)) {
              assigneeNames = t.assignee_id.map(id => profilesData?.find(p => p.id === id)?.full_name).filter(Boolean).join(', ');
          } else {
              assigneeNames = profilesData?.find(p => p.id === t.assignee_id)?.full_name || '';
          }
          const projectObj = projectsData?.find(p => p.id === t.project_id);
          return {
            ...t, // Keep original task properties for edit modal
            id: t.id,
            title: t.name,
            project: projectObj?.name || t.project_id,
            status: t.status,
            assignee: assigneeNames,
            assignee_id: t.assignee_id,
            dueDate: t.due_date || '',
            format: t.format || 'Khác',
            platform: t.platform || 'Khác',
            category: t.category || 'Khác',
            priority: t.priority || 'Trung bình',
            contentType: 'Khác',
            goal: t.target || '',
            demoDate: '',
            demoTime: '',
            publishTime: t.report_date || '',
            contentDetails: t.description || '',
            hashtags: t.notes || '',
            assetLink: '',
            notes: t.notes || '',
            views: t.views || '0',
            interactions: t.interactions || '0',
            shares: t.shares || '0',
            saves: t.saves || '0'
          };
      });

      // Sort mappedVideos: tasks that need approval at the top, then by created_at descending
      mappedVideos.sort((a, b) => {
          const aPriority = (a.status === 'CONTENT_DONE' || a.status === 'VIDEO_REVIEW') ? -1 : 1;
          const bPriority = (b.status === 'CONTENT_DONE' || b.status === 'VIDEO_REVIEW') ? -1 : 1;
          
          if (aPriority !== bPriority) {
              return aPriority - bPriority;
          }
          
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
      });

      setVideos(mappedVideos);

    } catch (err) {
      console.error('Error fetching marketing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async (formData: any) => {
      try {
          // Convert empty date strings to null to prevent postgres invalid input syntax errors
          const payload = { ...formData };
          if (payload.start_date === '') payload.start_date = null;
          if (payload.end_date === '') payload.end_date = null;
          if (payload.start_date) payload.actual_start_date = payload.start_date;

          if (editingProject) {
              const { error } = await supabase.from('marketing_projects').update(payload).eq('id', editingProject.id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('marketing_projects').insert([payload]);
              if (error) throw error;
          }
          setIsProjectModalOpen(false);
          setEditingProject(null);
          await fetchData();
      } catch (err: any) {
          console.error("Error saving project:", err);
          const msg = err.message || '';
          if (msg.includes('column') && msg.includes('does not exist')) {
              alert(`Lỗi Cơ Sở Dữ Liệu: ${msg}. \n\nBạn chưa chạy file marketing_fields.sql trong Supabase để tạo các cột mới cho Marketing. Vui lòng chạy file đó trước!`);
          } else {
              alert(`Lỗi khi lưu dự án: ${msg}`);
          }
      }
  };

  const handleDeleteProjectFn = async (id: string, name: string) => {
      if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"? Thao tác này không thể hoàn tác.`)) return;
      try {
          const { error } = await supabase.from('marketing_projects').delete().eq('id', id);
          if (error) throw error;
          setIsProjectModalOpen(false);
          setEditingProject(null);
          await fetchData();
      } catch (e: any) {
          console.error(e);
          alert(`Lỗi khi xóa dự án: ${e.message}`);
      }
  };

  const handleArchiveProjectFn = async (id: string, name: string) => {
      if (!confirm(`Bạn có chắc muốn lưu trữ dự án "${name}"? Dự án sẽ được chuyển sang Hủy bỏ / Lưu trữ.`)) return;
      try {
          const { error } = await supabase.from('marketing_projects').update({ status: 'Hủy bỏ' }).eq('id', id);
          if (error) throw error;
          setIsProjectModalOpen(false);
          setEditingProject(null);
          await fetchData();
      } catch (e: any) {
          console.error(e);
          alert(`Lỗi khi lưu trữ dự án: ${e.message}`);
      }
  };

  const updateProjectField = async (projectId: string, field: string, value: string) => {
      try {
          const { error } = await supabase.from('marketing_projects').update({ [field]: value }).eq('id', projectId);
          if (error) throw error;
          await fetchData();
      } catch (err: any) {
          console.error("Error updating project field:", err);
          alert(`Lỗi khi cập nhật dự án: ${err.message || ''}`);
      }
  };

  const updateTask = async (taskId: string, updates: any) => {
      try {
          const { error } = await supabase.from('marketing_tasks').update(updates).eq('id', taskId);
          if (error) throw error;
          await fetchData();
      } catch (err) {
          console.error("Error updating task:", err);
          alert("Lỗi khi cập nhật trạng thái");
      }
  };

  React.useEffect(() => {
    fetchData();
  }, [profile]);

  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('Tất cả');
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Set<string>>(new Set(['COL_IDEA', 'COL_CONTENT']));
  const [view, setView] = useState<'DASHBOARD' | 'WORKFLOW' | 'KANBAN' | 'TIMELINE' | 'CALENDAR' | 'KPI' | 'LIST' | 'ARCHIVE'>(getInitialView());
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // November 2024 to match mock data
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [listTimeFilter, setListTimeFilter] = useState('Tất cả');
  const [formatFilter, setFormatFilter] = useState('Tất cả');
  const [projectStatusFilter, setProjectStatusFilter] = useState('Tất cả');
  const [taskStatusFilter, setTaskStatusFilter] = useState('Tất cả');
  const [showKanbanFilters, setShowKanbanFilters] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState<typeof videos[0] | null>(null);
  const [showArchivePopup, setShowArchivePopup] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Sync view when URL changes
  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setView(getInitialView());
    }
  }, [searchParams]);

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    // Update URL sync mapping
    const tabMap: Record<string, string> = {
      'DASHBOARD': 'dashboard',
      'WORKFLOW': 'guidelines',
      'KANBAN': 'kanban',
      'LIST': 'posts',
      'CALENDAR': 'calendar',
      'TIMELINE': 'progress',
      'ARCHIVE': 'archive'
    };
    if (tabMap[newView]) {
      setSearchParams({ tab: tabMap[newView] }, { replace: true });
    }
  };

  const location = useLocation();
  const pendingOpenRef = useRef<{ taskId?: string | null; projectId?: string | null } | null>(null);

  // Capture navigation state into ref
  useEffect(() => {
    const state = location.state as any;
    if (state?.openTaskId || state?.openProjectId) {
      pendingOpenRef.current = {
        taskId: state.openTaskId,
        projectId: state.openProjectId
      };
      window.history.replaceState({}, '');
    }
  }, [location.key]);

  // Act on pending navigation once data is loaded
  useEffect(() => {
    if (!pendingOpenRef.current || isLoading) return;

    const { taskId, projectId } = pendingOpenRef.current;

    if (taskId) {
      const task = videos.find(v => v.id === taskId);
      if (task) {
        setEditingTask(task);
        setIsTaskModalOpen(true);
        pendingOpenRef.current = null;
      }
    } else if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setEditingProject(project);
        setIsProjectModalOpen(true);
        pendingOpenRef.current = null;
      }
    }
  }, [isLoading, videos, projects]);

  const toggleMobileGroup = (id: string) => {
    const next = new Set(expandedMobileGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMobileGroups(next);
  };

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProjectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProjects(next);
  };

  const updateVideo = (id: string, updates: Partial<typeof videos[0]>) => {
    setVideos(videos.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  return (
    <div className={`flex-1 flex flex-col gap-4 w-full min-h-0 min-w-0 px-1 md:px-4 custom-scrollbar ${view === 'TIMELINE' ? 'overflow-hidden' : 'overflow-y-scroll'}`}>
      {/* Header */}
      <div className="flex flex-col justify-between items-start md:items-center gap-4 shrink-0 px-1 md:px-0 pt-2 pb-1">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-h-[64px] min-w-0">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">Marketing Workflow</h1>
            <p className="text-sm text-gray-500 mt-1 truncate">Quy trình phối hợp DQH & Team Coach Hiếu</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-auto mt-4 md:mt-0 justify-start md:justify-end shrink-0">
            {/* Mobile Dropdown View Selector */}
            <div className="md:hidden w-full relative shrink-0">
              <select 
                value={view}
                onChange={(e) => handleViewChange(e.target.value as any)}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
              >
                <option value="DASHBOARD">Tổng quan</option>
                <option value="WORKFLOW">Tài khoản (Quy chuẩn)</option>
                <option value="KANBAN">Bảng công việc</option>
                <option value="LIST">Tổng hợp bài đăng</option>
                <option value="CALENDAR">Lịch đăng bài</option>
                <option value="TIMELINE">Tiến độ dự án</option>
                <option value="ARCHIVE">Lưu trữ</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Desktop Horizontal Tabs */}
            <div className="hidden md:flex flex-wrap items-center bg-gray-100 p-1 rounded-lg">
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'DASHBOARD' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('DASHBOARD')}
              >
                Tổng quan
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'WORKFLOW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('WORKFLOW')}
              >
                Tài khoản
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'KANBAN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('KANBAN')}
              >
                Công việc
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('LIST')}
              >
                Tổng hợp
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'CALENDAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('CALENDAR')}
              >
                Lịch đăng
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'TIMELINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('TIMELINE')}
              >
                Tiến độ
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'ARCHIVE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('ARCHIVE')}
              >
                Lưu trữ
              </button>
            </div>
            
            {isLoading && (
              <div className="flex items-center justify-center text-sm font-semibold text-indigo-600 ml-4 animate-pulse">
                Đang tải...
              </div>
            )}


            {canEdit && (
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Tạo Task
              </button>
            )}

          </div>
        </div>
        
        {/* Optional Secondary Header for Kanban Filters */}
        {view === 'KANBAN' && (
          <div className="flex flex-col gap-2 min-w-0 w-full mb-2">
            
            {/* Mobile Kanban Header (Lark style) */}
            <div className="md:hidden flex items-center justify-between mt-[-5px] mb-2 px-1 gap-2">
              <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                  <List size={22} />
              </button>
              <div className="flex bg-slate-100/80 rounded-full p-1 flex-1 max-w-[200px] justify-center text-sm shadow-inner overflow-hidden border border-slate-200/50">
                  <button 
                      className={`flex-1 min-w-0 px-2 py-1.5 rounded-full font-bold transition-all duration-300 truncate ${!assigneeFilter ? 'bg-white text-[#5B5FC7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setAssigneeFilter('')}
                  >
                      Tất cả
                  </button>
                  <button 
                      className={`flex-1 min-w-0 px-2 py-1.5 rounded-full font-bold transition-all duration-300 truncate ${assigneeFilter === profile?.id ? 'bg-white text-[#5B5FC7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setAssigneeFilter(profile?.id || '')}
                  >
                      Của tôi
                  </button>
              </div>
              <button 
                  onClick={() => setView('CALENDAR')} 
                  className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-[#5B5FC7] rounded-full hover:bg-indigo-100 transition-colors shadow-sm shrink-0 flex-col gap-0.5"
                  title="Xem lịch đăng"
              >
                  <CalendarIcon size={16} />
                  <span className="text-[7px] font-bold leading-none uppercase">lịch đăng</span>
              </button>
            </div>

            <div className="hidden md:flex justify-end w-full min-w-0">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                <button onClick={() => setShowKanbanFilters(!showKanbanFilters)} className={`flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${showKanbanFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <Filter className="w-3.5 h-3.5" /> Lọc
                </button>
                <button onClick={() => setView('CALENDAR')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap">
                  <CalendarIcon className="w-3.5 h-3.5" /> lịch đăng
                </button>
              </div>
            </div>
            {showKanbanFilters && (
              <div className="hidden md:flex flex-wrap items-center gap-3 pt-2 text-sm min-w-0">
                <div className="inline-flex overflow-x-auto hide-scrollbar bg-white border border-gray-200 p-1 rounded-lg shadow-sm max-w-full">
                  {['Tất cả', 'Theo Tuần', 'Theo Tháng', 'Theo Quý', 'Theo Năm'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setListTimeFilter(filter)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${listTimeFilter === filter ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0">
                   <option value="Tất cả">Định dạng: Tất cả</option>
                   <option value="Video ngắn">Video ngắn</option>
                   <option value="Video dài">Video dài</option>
                   <option value="Bài viết">Bài viết</option>
                   <option value="Ảnh">Ảnh</option>
                </select>
                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0 max-w-[150px] truncate">
                   <option value="Tất cả">Lọc theo dự án</option>
                   {projects.map(p => (
                     <option key={p.id} value={p.name}>{p.name}</option>
                   ))}
                </select>
                {(listTimeFilter !== 'Tất cả' || formatFilter !== 'Tất cả' || projectFilter !== 'Tất cả') && (
                  <button onClick={() => { setListTimeFilter('Tất cả'); setFormatFilter('Tất cả'); setProjectFilter('Tất cả'); }} className="text-xs text-gray-400 hover:text-gray-700 underline shrink-0 whitespace-nowrap">
                    Xóa lộc
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* End Header */}

      {/* Main Content Area */}
      {view === 'KANBAN' ? (
        <>
           {/* Desktop Kanban Board */}
           <div className="hidden md:flex flex-1 gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 md:min-h-[500px]">
              {COLUMNS.map(column => {
                const columnVideos = videos.filter(v => {
                  if (STATUS_MAP[v.status]?.col !== column.id) return false;
                  
                  // Apply filters if they are active
                  if (assigneeFilter && profile && assigneeFilter === profile.id) {
                     // Check if profile.full_name is in the combined string
                     if (!v.assignee.includes(profile.full_name)) return false;
                  }
                  
                  if (listTimeFilter !== 'Tất cả') {
                    if (!v.dueDate) return false;
                    const date = new Date(v.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuần' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                    if (listTimeFilter === 'Theo Tháng' && !isSameMonth(date, today)) return false;
                    if (listTimeFilter === 'Theo Quý' && !isSameQuarter(date, today)) return false;
                    if (listTimeFilter === 'Theo Năm' && !isSameYear(date, today)) return false;
                  }
                  if (formatFilter !== 'Tất cả' && v.format !== formatFilter) return false;
                  if (projectFilter !== 'Tất cả' && v.project !== projectFilter) return false;
                  return true;
                });

                const activeVideos = columnVideos.filter((v: any) => !v.isarchived);
                const archivedVideos = columnVideos.filter((v: any) => v.isarchived);

                return (
                  <div key={column.id} className={`w-[90vw] sm:w-[300px] md:w-[320px] h-full bg-white rounded-2xl border ${column.border} flex flex-col shrink-0 relative max-h-full`}>
                    <div className={`p-4 border-b flex items-center justify-between rounded-t-2xl shadow-sm shrink-0 ${column.color}`}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold uppercase text-[15px] opacity-90">{column.name}</h3>
                        <span className="bg-white text-current px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          {activeVideos.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                const defaultStatus = Object.keys(STATUS_MAP).find(k => STATUS_MAP[k].col === column.id) || 'IDEA';
                                setEditingTask({ status: defaultStatus } as any);
                                setIsTaskModalOpen(true);
                            }}
                            className="bg-white/80 hover:bg-white text-current p-1 rounded transition-colors shadow-sm"
                            title="Thêm Task mới"
                        >
                            <Plus size={16} />
                        </button>
                        {archivedVideos.length > 0 && (
                          <button
                            onClick={() => setShowArchivePopup(showArchivePopup === column.id ? null : column.id)}
                            className="flex items-center gap-1 text-red-600 bg-white border border-red-500 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors shadow-sm"
                            title="Hiển thị lưu trữ"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{archivedVideos.length}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Archive Popup */}
                    {showArchivePopup === column.id && (
                      <div className="absolute top-16 left-2 right-2 z-50 bg-yellow-50/95 backdrop-blur-sm border border-yellow-200 shadow-xl rounded-xl p-3 max-h-[400px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-1"><span className="bg-yellow-100 px-2 py-0.5 rounded text-xs border border-yellow-200">{archivedVideos.length}</span> Đã lưu trữ</h3>
                          <button onClick={() => setShowArchivePopup(null)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200 p-1.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
                        </div>
                        <div className="space-y-3">
                          {archivedVideos.map(video => (
                            <div key={video.id} className="bg-white border border-yellow-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                              <h4 className="text-xs font-bold text-gray-800 mb-1 line-clamp-2">{video.title}</h4>
                              <p className="text-[10px] text-gray-500 mb-2 truncate flex items-center gap-1"><LayoutTemplate className="w-3 h-3"/> {video.project}</p>
                              <div className="flex justify-end border-t border-gray-50 pt-2 mt-2">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isarchived: false } as any); if(archivedVideos.length === 1) setShowArchivePopup(null); }}
                                   className="text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors border border-emerald-100"
                                 >
                                   Khôi phục
                                 </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div 
                      className="flex-1 overflow-y-auto p-3 space-y-3 transition-colors min-h-[150px]"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-indigo-50/50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-indigo-50/50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-indigo-50/50');
                        const taskId = e.dataTransfer.getData('taskId');
                        if (taskId) {
                          // Find default status for this column
                          let newStatus = Object.keys(STATUS_MAP).find(k => STATUS_MAP[k].col === column.id);
                          if (newStatus && taskId) {
                             updateTask(taskId, { status: newStatus, created_at: new Date().toISOString() });
                          }
                        }
                      }}
                    >
                      {activeVideos.map(video => {
                        const task = video;
                        const statusDef = STATUS_MAP[task.status];
                        
                        return (
                            <div 
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('taskId', task.id);
                              }}
                              key={task.id} 
                              onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                              }}
                              className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 relative group"
                            >
                              {/* Header Badges and Actions */}
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border min-h-[22px] flex items-center ${statusDef?.color || 'bg-gray-100 text-gray-800'}`}>
                                    {statusDef?.name || task.status}
                                  </span>
                                  {task.status === 'PROD_FILMING' && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-bold">
                                      {task.start_date ? format(new Date(task.start_date), 'dd/MM') : 'Lên lịch quay'}
                                    </div>
                                  )}
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border min-h-[22px] flex items-center ${task.platform && task.platform !== 'Khác' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {task.platform && task.platform !== 'Khác' ? task.platform : 'Chưa nền tảng'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleCard(task.id, e); }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors ml-1"
                                    title={expandedCards[task.id] ? "Thu gọn" : "Xem chi tiết"}
                                  >
                                    {expandedCards[task.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button className="text-gray-400 hover:text-gray-600 transition-opacity p-1" onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsTaskModalOpen(true); }}>
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Title and Date Row */}
                              <div className="flex justify-between items-center gap-2">
                                <h3 className={`font-bold text-gray-900 text-[14px] leading-tight flex-1 ${!expandedCards[task.id] ? 'line-clamp-2' : ''}`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-1 bg-white text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[11px] shrink-0">
                                  <Clock size={10} className="text-slate-400" />
                                  {task.dueDate ? format(new Date(task.dueDate), 'dd-MM') : '??-??'}
                                </div>
                              </div>

                              {/* Expanded Content */}
                              {expandedCards[task.id] && (task.project || task.notes || task.result_links || task.description) && (
                                <div className="mt-1 flex flex-col gap-2 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 text-[13px]">
                                  {task.project && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                      <span className="text-slate-500 font-medium">Dự án:</span>
                                      <span className="text-gray-900">{task.project}</span>
                                    </div>
                                  )}
                                  {task.notes && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                      <span className="text-slate-500 font-medium">Hook chọn:</span>
                                      <span className="text-gray-900">{task.notes}</span>
                                    </div>
                                  )}
                                  {task.result_links && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                      <span className="text-slate-500 font-medium">Vấn đề:</span>
                                      <span className="text-gray-900">{task.result_links}</span>
                                    </div>
                                  )}
                                  {task.description && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                      <span className="text-slate-500 font-medium">Giải pháp:</span>
                                      <span className="text-gray-900 line-clamp-3">{task.description}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                  {task.status === 'IDEA' && (
                                    <div className="flex gap-2 w-full mt-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 py-1.5 bg-[#ECFDF5] text-[#059669] border border-[#10B981]/20 hover:bg-[#D1FAE5] rounded-lg text-[12px] font-bold transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'REJECTED' }); }}
                                        className="flex-1 py-1.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-[12px] font-bold transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { isarchived: true }); }}
                                        className="flex-1 py-1.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg text-[12px] font-bold transition-colors"
                                      >
                                        Để sau
                                      </button>
                                    </div>
                                  )}
                                  
                                  {task.status === 'CONTENT_EDITING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_DONE' }); }}
                                      className="w-full min-h-[36px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-xl text-[12px] font-bold transition-colors mt-2"
                                    >
                                      Done
                                    </button>
                                  )}
                                  
                                  {task.status === 'CONTENT_DONE' && (
                                    <div className="flex gap-2 w-full mt-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_FILMING' }); }}
                                        className="flex-1 min-h-[36px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 sm:flex-none min-w-[90px] min-h-[36px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  )}

                                  {task.status === 'PROD_FILMING' && (
                                    <div className="flex gap-2 w-full mt-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_EDITING' }); }}
                                        className="flex-1 min-h-[36px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Đã xong quay
                                      </button>
                                    </div>
                                  )}

                                  {task.status === 'PROD_EDITING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_DONE' }); }}
                                      className="w-full min-h-[36px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-[12px] font-bold transition-colors mt-2"
                                    >
                                      Đã xong edit
                                    </button>
                                  )}
                                  {task.status === 'PROD_DOING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_DONE' }); }}
                                      className="w-full min-h-[36px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-[12px] font-bold transition-colors mt-2"
                                    >
                                      Đã xong
                                    </button>
                                  )}

                                  {task.status === 'PROD_DONE' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'VIDEO_REVIEW' }); }}
                                      className="w-full min-h-[36px] bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-xl text-[12px] font-bold transition-colors mt-2"
                                    >
                                      Phê duyệt đăng
                                    </button>
                                  )}

                                  {task.status === 'VIDEO_REVIEW' && (
                                    <div className="flex gap-2 w-full mt-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'SCHEDULED' }); }}
                                        className="flex-1 min-h-[36px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 sm:flex-none min-w-[70px] min-h-[36px] bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  )}

                                  {task.status === 'SCHEDULED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PUBLISHED' }); }}
                                      className="w-full min-h-[36px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Đánh dấu đã đăng
                                    </button>
                                  )}
                                </div>
                            </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Accordion Task List (Lark style) */}
            <div className="md:hidden pb-24 border-y border-slate-200 mt-2 bg-white">
                {COLUMNS.map((column, index) => {
                    const isExpanded = expandedMobileGroups.has(column.id);
                    const isLast = index === COLUMNS.length - 1;
                    
                    const columnVideos = videos.filter(v => {
                        if (STATUS_MAP[v.status]?.col !== column.id) return false;
                        if (assigneeFilter && profile && assigneeFilter === profile.id && !v.assignee.includes(profile.full_name)) return false;
                        if (listTimeFilter !== 'Tất cả') {
                            if (!v.dueDate) return false;
                            const date = new Date(v.dueDate);
                            const today = new Date();
                            if (listTimeFilter === 'Theo Tuần' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                            if (listTimeFilter === 'Theo Tháng' && !isSameMonth(date, today)) return false;
                            if (listTimeFilter === 'Theo Quý' && !isSameQuarter(date, today)) return false;
                            if (listTimeFilter === 'Theo Năm' && !isSameYear(date, today)) return false;
                        }
                        if (formatFilter !== 'Tất cả' && v.format !== formatFilter) return false;
                        return true;
                    });

                    const activeVideos = columnVideos.filter((v: any) => !v.isarchived);

                    return (
                        <div key={column.id} className={`bg-white overflow-hidden flex flex-col ${!isLast ? 'border-b border-slate-100' : ''}`}>
                            {/* Accordion Header */}
                            <div 
                                onClick={() => toggleMobileGroup(column.id)}
                                className={`p-4 flex items-center justify-between bg-white cursor-pointer active:bg-slate-50 transition-colors ${isExpanded ? 'border-b border-slate-100' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-700">{column.name}</h3>
                                    {activeVideos.length > 0 && (
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{activeVideos.length}</span>
                                    )}
                                </div>
                                <span className="text-slate-400 shrink-0">
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </span>
                            </div>
                            
                            {/* Accordion Content */}
                            {isExpanded && (
                                <div className="p-3 space-y-3 bg-[#f8fafc]">
                                    {activeVideos.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-sm italic font-medium bg-transparent">Chưa có bản ghi nào</div>
                                    ) : (
                                        activeVideos.map(video => {
                                            const task = video;
                                            const statusDef = STATUS_MAP[task.status];
                                            const isCardExpanded = expandedCards[task.id];
                                            
                                            // The same card design used in desktop but optimized width
                                            return (
                                              <div 
                                                key={task.id} 
                                                onClick={(e) => toggleCard(task.id, e)}
                                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:border-indigo-300 transition-all cursor-pointer flex flex-col gap-3"
                                              >
                                                <div className="flex justify-between items-start mb-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border min-h-[22px] flex items-center ${statusDef?.color || 'bg-gray-100 text-gray-800'}`}>
                                                      {statusDef?.name || task.status}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border min-h-[22px] flex items-center ${task.platform && task.platform !== 'Khác' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                      {task.platform && task.platform !== 'Khác' ? task.platform : 'Chưa nền tảng'}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); toggleCard(task.id, e); }}
                                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    >
                                                      {isCardExpanded ? <ChevronUp className="w-5 h-5 stroke-[2.5]" /> : <ChevronDown className="w-5 h-5 stroke-[2.5]" />}
                                                    </button>
                                                    <button className="text-gray-400 hover:text-gray-600 transition-opacity p-1" onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsTaskModalOpen(true); }}>
                                                      <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                                
                                                {/* Title and Date Row */}
                                                <div className="flex justify-between items-start gap-2">
                                                  <h3 
                                                    onClick={() => {
                                                      setEditingTask(task);
                                                      setIsTaskModalOpen(true);
                                                    }}
                                                    className={`font-bold text-indigo-700 text-[15px] leading-tight flex-1 ${!isCardExpanded ? 'line-clamp-2' : ''}`}
                                                  >
                                                    {task.title}
                                                  </h3>
                                                  <div className="flex items-center gap-1 bg-white text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[11px] shrink-0">
                                                    <Clock size={10} className="text-slate-400" />
                                                    {task.dueDate ? format(new Date(task.dueDate), 'dd-MM') : '??-??'}
                                                  </div>
                                                </div>
                                                
                                                {isCardExpanded && (
                                                  <div className="mt-2 space-y-2">
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                                                      <LayoutTemplate className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{task.project || 'Không có dự án'}</span>
                                                    </p>
                                                    
                                                    <div className="flex gap-1.5">
                                                      <span className="text-[10px] bg-gray-50 text-slate-500 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                                                        <Video className="w-3 h-3" /> {task.format || 'Khác'}
                                                      </span>
                                                      <span className="text-[10px] bg-gray-50 text-slate-500 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                                                        <UsersIcon className="w-3 h-3" /> {task.platform || '-'}
                                                      </span>
                                                    </div>

                                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-medium text-slate-500">Thực hiện</span>
                                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold" title={task.assignee || 'Chưa gán'}>
                                                          {(task.assignee || '?').substring(0, 2).toUpperCase()}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}

                                                    {/* Action Buttons */}
                                                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                      {task.status === 'IDEA' && (
                                                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_EDITING' }); }}
                                                            className="flex-1 min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center gap-1"
                                                          >
                                                            Phê duyệt
                                                          </button>
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'REJECTED' }); }}
                                                            className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                                          >
                                                            Từ chối
                                                          </button>
                                                        </div>
                                                      )}
                                                      
                                                      {task.status === 'CONTENT_EDITING' && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_DONE' }); }}
                                                          className="w-full min-h-[44px] bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[12px] font-bold transition-colors"
                                                        >
                                                          Done
                                                        </button>
                                                      )}
                                                      
                                                      {task.status === 'CONTENT_DONE' && (
                                                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_FILMING' }); }}
                                                            className="flex-1 min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center gap-1"
                                                          >
                                                            Phê duyệt
                                                          </button>
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'CONTENT_EDITING' }); }}
                                                            className="flex-1 sm:flex-none min-w-[100px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                                          >
                                                            Từ chối
                                                          </button>
                                                        </div>
                                                      )}

                                                      {task.status === 'PROD_DOING' && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_DONE' }); }}
                                                          className="w-full min-h-[44px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[12px] font-bold transition-colors"
                                                        >
                                                          Đã xong
                                                        </button>
                                                      )}

                                                      {task.status === 'PROD_DONE' && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'VIDEO_REVIEW' }); }}
                                                          className="w-full min-h-[44px] bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl text-[12px] font-bold transition-colors"
                                                        >
                                                          Gửi qua Cần Phê Duyệt
                                                        </button>
                                                      )}

                                                      {task.status === 'VIDEO_REVIEW' && (
                                                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'SCHEDULED' }); }}
                                                            className="flex-1 min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                                          >
                                                            Phê duyệt
                                                          </button>
                                                          <button 
                                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PROD_EDITING' }); }}
                                                            className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                                          >
                                                            Từ chối
                                                          </button>
                                                        </div>
                                                      )}

                                                      {task.status === 'SCHEDULED' && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'PUBLISHED' }); }}
                                                          className="w-full min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                                        >
                                                          Đánh dấu đã đăng
                                                        </button>
                                                      )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
      ) : view === 'LIST' ? (
        <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200 mx-1 md:mx-0 flex flex-col min-w-0">
           <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20 rounded-t-xl min-w-0">
             <div className="flex items-center gap-2">
               <ListTodo className="w-5 h-5 text-indigo-600" />
               <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">TỔNG HỢP DỰ ÁN</h2>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-inner gap-1">
                    <div className="min-w-[140px] bg-white rounded-lg shadow-sm border border-slate-200 px-2 py-0.5 relative z-20">
                         <InlineDropdown
                           value={projectStatusFilter}
                           options={['Tất cả', 'Thiết kế', 'Đang thi công', 'Đã bàn giao', 'Đầy đủ hình ảnh', 'Có link Highres']}
                           onChange={(val) => setProjectStatusFilter(val)}
                           placeholder="Dự án"
                           renderValue={(val) => <span className="text-[11px] font-bold flex gap-1 items-center"><span className="text-slate-400 font-medium whitespace-nowrap">Dự án:</span> <span className="truncate max-w-[70px]">{val}</span></span>}
                         />
                    </div>
                    <div className="min-w-[140px] bg-white rounded-lg shadow-sm border border-slate-200 px-1 py-0.5 relative z-20">
                         <InlineDropdown
                           value={taskStatusFilter}
                           options={['Tất cả', 'IDEA', 'CONTENT_EDITING', 'CONTENT_DONE', 'PROD_FILMING', 'PROD_EDITING', 'PROD_DONE', 'VIDEO_REVIEW', 'SCHEDULED', 'PUBLISHED', 'REJECTED']}
                           onChange={(val) => setTaskStatusFilter(val)}
                           placeholder="Nhiệm vụ"
                           renderValue={(val) => {
                             if (val === 'Tất cả') return <span className="text-[11px] font-bold flex gap-1 items-center"><span className="text-slate-400 font-medium whitespace-nowrap">Task:</span> <span>Tất cả</span></span>;
                             const info = STATUS_MAP[val];
                             return (
                               <span className={`text-[11px] font-bold flex gap-1 items-center ${info?.textColor || ''}`}>
                                 <span className="text-slate-400 font-medium whitespace-nowrap">Task:</span> 
                                 <span className="truncate max-w-[70px]">{info?.name || val}</span>
                               </span>
                             );
                           }}
                           renderOption={(val) => {
                             if (val === 'Tất cả') return <span className="text-[12px] font-medium text-slate-600">Tất cả</span>;
                             const info = STATUS_MAP[val];
                             return (
                               <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${info?.textColor?.replace('text-', 'bg-') || 'bg-slate-400'}`} />
                                 <span className={`text-[12px] font-bold ${info?.textColor || 'text-slate-700'}`}>{info?.name || val}</span>
                               </div>
                             );
                           }}
                         />
                    </div>
                </div>
                <button 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Dự Án Mới
                </button>
              </div>
           </div>
           <div className="flex-1 overflow-x-auto overflow-y-auto p-0 w-full hidden md:block">
             <table className="w-full text-[13px] text-left border-collapse min-w-[1000px] border border-slate-200">
               <thead className="bg-[#f9fafb] text-slate-500 sticky top-0 z-10">
                 <tr>
                   <th className="px-3 py-2 border border-slate-200 font-normal w-[40px] text-center"></th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[200px]">Dự án</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[120px]">Loại</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[150px]">Trạng thái</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[140px]">Phong cách</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[280px]">Tiến độ & Nhật ký</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[150px]">Điểm nhấn</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[180px]">Nội dung khai thác</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[150px]">Brief</th>
                   <th className="px-3 py-2 border border-slate-200 font-normal min-w-[150px]">Ghi chú</th>
                 </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const filteredProjects = projects.filter(p => {
                        if (projectStatusFilter !== 'Tất cả' && p.update_status !== projectStatusFilter) return false;
                        
                        // If task filter is active, only show projects that have at least one task matching the status
                        if (taskStatusFilter !== 'Tất cả') {
                            const hasMatchingTask = videos.some(v => v.project_id === p.id && v.status === taskStatusFilter);
                            if (!hasMatchingTask) return false;
                        }

                        return true;
                    });

                    if (filteredProjects.length === 0) {
                        return (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center text-slate-400 bg-white">
                                    {projectStatusFilter !== 'Tất cả' ? `Không tìm thấy dự án nào có trạng thái "${projectStatusFilter}"` : 'Chưa có dự án Marketing nào.'}
                                </td>
                            </tr>
                        );
                    }

                    return filteredProjects.map((proj: any) => {
                      // Parse progress data
                      let phaseStr = '';
                      const start = proj.actual_start_date ? parseISO(proj.actual_start_date) : null;
                      const handover = proj.handover_date ? parseISO(proj.handover_date) : null;
                      const today = new Date();
                      
                      if (handover && today >= handover) {
                          phaseStr = 'Đã bàn giao';
                      } else if (start && today >= start) {
                          const daysSinceStart = differenceInDays(today, start);
                          let current = 0;
                          if (daysSinceStart < (current += (proj.design_days || 0))) phaseStr = 'GĐ: Thiết kế';
                          else if (daysSinceStart < (current += (proj.rough_construction_days || 0))) phaseStr = 'GĐ: Thi công thô';
                          else if (daysSinceStart < (current += (proj.finishing_days || 0))) phaseStr = 'GĐ: Hoàn thiện';
                          else if (daysSinceStart < (current += (proj.interior_days || 0))) phaseStr = 'GĐ: Nội thất';
                          else phaseStr = 'GĐ: Đang bàn giao';
                      } else {
                          phaseStr = proj.status || 'Chưa bắt đầu';
                      }
                      
                      // Get latest log
                      const logs = proj.marketing_daily_logs || [];
                      const latestLog = logs.length > 0 ? logs[0] : null;

                      // Get upcoming milestone
                      const milestones = proj.marketing_shooting_milestones || [];
                      const upcomingMilestone = milestones.find((m: any) => isFuture(parseISO(m.milestone_date)) || isToday(parseISO(m.milestone_date)));

                      return (
                         <React.Fragment key={proj.id}>
                           <tr className="bg-white hover:bg-slate-50 transition-colors cursor-pointer group" onClick={(e) => toggleProjectRow(proj.id, e)} onDoubleClick={() => { setEditingProject(proj); setIsProjectModalOpen(true); }}>
                             <td className="px-3 py-2 border border-slate-200 text-center text-slate-400 group-hover:text-slate-600 font-medium cursor-pointer">
                               {expandedProjects.has(proj.id) || taskStatusFilter !== 'Tất cả' ? (
                                  <svg className="w-4 h-4 mx-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                               ) : (
                                  <svg className="w-4 h-4 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                               )}
                             </td>
                             <td className="px-3 py-2 border border-slate-200 text-slate-900 font-semibold">{proj.name}</td>
                             <td className="px-3 py-2 border border-slate-200">
                               <InlineDropdown
                                   value={proj.project_type || ''}
                                   options={['Chung cư', 'Nhà phố', 'Biệt thự', 'Văn phòng', 'F&B', 'Khác']}
                                   placeholder="Chọn loại"
                                   onChange={(val) => updateProjectField(proj.id, 'project_type', val)}
                                   renderValue={(val) => <span className="inline-flex bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm text-xs font-semibold">{val}</span>}
                                   renderOption={(val) => <span className="inline-flex bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm text-[13px] font-semibold">{val}</span>}
                               />
                             </td>
                             <td className="px-3 py-2 border border-slate-200" onClick={e => e.stopPropagation()}>
                               <InlineDropdown
                                   value={proj.update_status || ''}
                                   options={['Thiết kế', 'Đang thi công', 'Đã bàn giao', 'Đầy đủ hình ảnh', 'Có link Highres']}
                                   placeholder="Trạng thái"
                                   onChange={(val) => updateProjectField(proj.id, 'update_status', val)}
                                   renderValue={(val) => <span className={`inline-flex px-2 py-0.5 rounded-sm text-xs font-semibold border ${getProjectStatusColor(val)} truncate max-w-[140px]`}>{val}</span>}
                                   renderOption={(val) => <span className={`inline-flex px-2 py-0.5 rounded-sm text-[13px] font-semibold border ${getProjectStatusColor(val)}`}>{val}</span>}
                               />
                             </td>
                             <td className="px-3 py-2 border border-slate-200" onClick={e => e.stopPropagation()}>
                               <InlineDropdown
                                   value={proj.effect_type ? proj.effect_type.split(',')[0].trim() : ''}
                                   options={['Hiện đại', 'Tối giản', 'Tân cổ điển', 'Wabi Sabi', 'Japandi', 'Minimal', 'Rustic', 'Industrial', 'Tropical', 'Bê tông']}
                                   placeholder="Phong cách"
                                   onChange={(val) => updateProjectField(proj.id, 'effect_type', val)}
                                   renderValue={(val) => <span className={`inline-flex px-2 py-0.5 rounded-sm text-[11px] font-bold ${getProjectEffectColor(val)}`}>{val}</span>}
                                   renderOption={(val) => <span className={`inline-flex px-2 py-0.5 rounded-sm text-[12px] font-bold ${getProjectEffectColor(val)}`}>{val}</span>}
                               />
                             </td>
                             <td className="px-3 py-2 border border-slate-200" onClick={e => e.stopPropagation()}>
                               <div className="flex flex-col gap-2 relative">
                                  <div className="flex items-center gap-2">
                                       {phaseStr ? (
                                           <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{phaseStr}</span>
                                       ) : (
                                           <span className="bg-gray-50 text-gray-500 border border-gray-100 text-[10px] font-medium px-2 py-0.5 rounded">Chưa setup</span>
                                       )}
                                       {upcomingMilestone && (
                                           <div className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded font-bold" title={upcomingMilestone.content}>
                                               <Video size={10} />
                                               {format(parseISO(upcomingMilestone.milestone_date), 'dd/MM')}
                                           </div>
                                       )}
                                  </div>
                                  {latestLog ? (
                                      <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                                          <div className="flex justify-between items-center mb-1">
                                              <span className="font-bold text-gray-400 text-[9px]">{format(parseISO(latestLog.log_date), 'dd/MM')}</span>
                                              {latestLog.media_link && (
                                                  <a href={latestLog.media_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 font-bold hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm transition-colors" title="Xem tư liệu đính kèm">
                                                      <Camera size={10} /> Tư liệu
                                                  </a>
                                              )}
                                          </div>
                                          <div className="line-clamp-2 leading-relaxed" title={latestLog.content}>{latestLog.content}</div>
                                      </div>
                                  ) : (
                                      <div className="text-[11px] text-gray-400 italic">Chưa có nhật ký</div>
                                  )}
                                </div>
                              </td>
                             {/* The rest of the table cells for the project row */}
                             <td className="px-3 py-2 border border-slate-200" title={proj.effect_description || ''}>
                               <div className="text-[12px] font-medium text-slate-700 line-clamp-2">{proj.effect_description || '-'}</div>
                             </td>
                             <td className="px-3 py-2 border border-slate-200" title={proj.customer_problem || ''}>
                               <div className="text-[12px] font-medium text-slate-700 line-clamp-2">{proj.customer_problem || '-'}</div>
                             </td>
                             <td className="px-3 py-2 border border-slate-200">
                               {proj.content_link ? (
                                 <a href={proj.content_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline text-[12px] font-medium" onClick={e => e.stopPropagation()}>Mở Link</a>
                               ) : <span className="text-[12px] text-slate-400">-</span>}
                             </td>
                             <td className="px-3 py-2 border border-slate-200" title={proj.other_info || ''}>
                               <div className="text-[12px] font-medium text-slate-700 line-clamp-2">{proj.other_info || '-'}</div>
                             </td>
                           </tr>
                           {(expandedProjects.has(proj.id) || taskStatusFilter !== 'Tất cả') && (
                             <tr>
                               <td colSpan={10} className="p-0">
                                 <div className="bg-slate-50 p-4 border-t border-slate-200">
                                   <div className="flex items-center gap-3 mb-3">
                                     <button 
                                       onClick={() => { setEditingTask({ project_id: proj.id, status: 'IDEA' } as any); setIsTaskModalOpen(true); }}
                                       className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                       title="Thêm Idea"
                                     >
                                       <Plus className="w-3.5 h-3.5" /> Thêm Idea
                                     </button>
                                     <h4 className="text-sm font-bold text-slate-700">Tasks cho dự án "{proj.name}"</h4>
                                   </div>
                                   <DragDropContext onDragEnd={(result) => {
                                      const { destination, source } = result;
                                      if (!destination) return;
                                      if (destination.index === source.index) return;
                                      
                                      const projTasks = videos.filter(v => v.project_id === proj.id && (taskStatusFilter === 'Tất cả' || v.status === taskStatusFilter)).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                      const draggedTask = projTasks[source.index];
                                      const updatedTasks = Array.from(projTasks);
                                      updatedTasks.splice(source.index, 1);
                                      updatedTasks.splice(destination.index, 0, draggedTask);
                                      
                                      // Calculate new created_at
                                      let newTime = Date.now();
                                      if (updatedTasks.length > 1) {
                                          if (destination.index === 0) {
                                              newTime = new Date(updatedTasks[1].created_at).getTime() - 1000;
                                          } else if (destination.index === updatedTasks.length - 1) {
                                              newTime = new Date(updatedTasks[destination.index - 1].created_at).getTime() + 1000;
                                          } else {
                                              const prevTime = new Date(updatedTasks[destination.index - 1].created_at).getTime();
                                              const nextTime = new Date(updatedTasks[destination.index + 1].created_at).getTime();
                                              newTime = prevTime + (nextTime - prevTime) / 2;
                                          }
                                      }
                                      const newDateString = new Date(newTime).toISOString();
                                      
                                      setVideos(prev => prev.map(v => v.id === draggedTask.id ? { ...v, created_at: newDateString } : v));
                                      supabase.from('marketing_tasks').update({ created_at: newDateString }).eq('id', draggedTask.id).then(({error}) => {
                                          if(error) console.error("Error updating order", error);
                                      });
                                   }}>
                                   <Droppable droppableId={`proj-${proj.id}`}>
                                     {(provided) => (
                                       <table className="w-full text-[12px] text-left border-collapse border border-slate-200" ref={provided.innerRef} {...provided.droppableProps}>
                                         <thead className="bg-slate-100 text-slate-500">
                                           <tr>
                                             <th className="px-3 py-2 border border-slate-200 font-normal w-[30px] text-center"></th>
                                             <th className="px-3 py-2 border border-slate-200 font-bold w-[40px] text-center">STT</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[150px]">Tiêu đề</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[100px]">Nền tảng</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[100px]">Link</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[130px]">Ngày đăng</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[120px]">Trạng thái</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal min-w-[100px]">Người phụ trách</th>
                                             <th className="px-3 py-2 border border-slate-200 font-normal w-[80px] text-center"></th>
                                           </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-200">

                                       {videos.filter(v => v.project_id === proj.id && (taskStatusFilter === 'Tất cả' || v.status === taskStatusFilter)).length === 0 ? (
                                         <tr>
                                           <td colSpan={10} className="px-4 py-6 text-center text-slate-400 bg-white">
                                             {taskStatusFilter !== 'Tất cả' ? `Không tìm thấy task "${taskStatusFilter}" cho dự án này.` : 'Chưa có task nào cho dự án này.'}
                                           </td>
                                         </tr>
                                       ) : (
                                         videos.filter(v => v.project_id === proj.id && (taskStatusFilter === 'Tất cả' || v.status === taskStatusFilter))
                                           .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                           .map((video: any, index: number) => {
                                           const statusInfo = STATUS_MAP[video.status];
                                           return (
                                            <Draggable key={video.id} draggableId={video.id} index={index}>
                                              {(provided, snapshot) => (
                                               <tr
                                                 ref={provided.innerRef}
                                                 {...provided.draggableProps}
                                                 className={`bg-white hover:bg-slate-50 transition-colors ${snapshot.isDragging ? 'shadow-lg border border-indigo-300' : ''}`}
                                               >
                                                 <td className="px-2 py-2 border border-slate-200 text-center text-slate-300 hover:text-indigo-500">
                                                   <div {...provided.dragHandleProps} className="flex justify-center cursor-grab active:cursor-grabbing p-1">
                                                     <GripVertical size={16} />
                                                   </div>
                                                 </td>
                                                 <td className="px-3 py-2 border border-slate-200 text-center font-bold text-slate-400">
                                                   {String(index + 1).padStart(2, '0')}
                                                 </td>
                                                 <td 
                                                   className="px-3 py-2 border border-slate-200 font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline transition-colors"
                                                   onClick={() => { setEditingTask(video); setIsTaskModalOpen(true); }}
                                                 >
                                                   {video.title}
                                                 </td>
                                                 <td className="px-3 py-2 border border-slate-200">{video.platform}</td>
                                                 <td className="px-3 py-2 border border-slate-200">
                                                   {video.link && (
                                                     <a href={video.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Link</a>
                                                   )}
                                                 </td>
                                                 <td className="px-3 py-2 border border-slate-200">
                                                   <div className="flex flex-col gap-1">
                                                     <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700" title="Ngày đăng">
                                                       <CalendarIcon className="w-3.5 h-3.5" />
                                                       <span>{video.dueDate ? format(parseISO(video.dueDate), 'dd/MM/yyyy') : 'Chưa xếp'}</span>
                                                     </div>
                                                   </div>
                                                 </td>
                                                 <td className="px-3 py-2 border border-slate-200">
                                                   <div className="flex items-center gap-2">
                                                     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                                                       <span className={`w-1.5 h-1.5 rounded-full ${statusInfo?.textColor?.replace('text-', 'bg-')}`}></span>
                                                       {statusInfo?.name || video.status}
                                                     </span>
                                                     {video.status === 'PROD_FILMING' && upcomingMilestone && (
                                                       <div className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded font-bold whitespace-nowrap" title={upcomingMilestone.content}>
                                                           <Video size={10} />
                                                           {format(parseISO(upcomingMilestone.milestone_date), 'dd/MM')}
                                                       </div>
                                                     )}
                                                   </div>
                                                 </td>
                                                 <td className="px-3 py-2 border border-slate-200">{video.assignee.split(',')[0]}</td>
                                                 <td className="px-3 py-2 border border-slate-200 text-center">
                                                   <button onClick={() => { setEditingTask(video); setIsTaskModalOpen(true); }} className="text-slate-400 hover:text-indigo-600">
                                                     <Edit size={14} />
                                                   </button>
                                                 </td>
                                               </tr>
                                              )}
                                            </Draggable>
                                           );
                                         })
                                       )}
                                       {provided.placeholder}
                                     </tbody>
                                   </table>
                                  )}
                                 </Droppable>
                                 </DragDropContext>
                                 </div>
                               </td>
                             </tr>
                           )}
                         </React.Fragment>
                       );
                    });
                  })()}
               </tbody>
             </table>
           </div>

           {/* Mobile List View */}
           <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50/50">
             {(() => {
               const filteredProjects = projects.filter(p => {
                   if (projectStatusFilter !== 'Tất cả' && p.update_status !== projectStatusFilter) return false;
                   if (taskStatusFilter !== 'Tất cả') {
                       const hasMatchingTask = videos.some(v => v.project_id === p.id && v.status === taskStatusFilter);
                       if (!hasMatchingTask) return false;
                   }
                   return true;
               });

               if (filteredProjects.length === 0) {
                   return <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">Không tìm thấy dự án phù hợp</div>;
               }

               return filteredProjects.map(proj => {
                 const projTasks = videos.filter(v => v.project_id === proj.id && (taskStatusFilter === 'Tất cả' || v.status === taskStatusFilter)).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                 const isExpanded = expandedProjects.has(proj.id);
                 const upcomingMilestone = (proj.marketing_shooting_milestones || []).find((m: any) => isFuture(parseISO(m.milestone_date)) || isToday(parseISO(m.milestone_date)));
                 
                 return (
                   <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                     {/* Project Header */}
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                       onClick={(e) => toggleProjectRow(proj.id, e)}
                     >
                       <div className="flex-1 pr-4">
                         <h4 className="font-bold text-slate-900 text-[15px]">{proj.name}</h4>
                         <div className="flex flex-wrap gap-2 mt-2">
                           {proj.update_status && (
                             <span className={`inline-flex px-2 py-0.5 rounded-sm text-[10px] font-bold border ${getProjectStatusColor(proj.update_status)}`}>
                               {proj.update_status}
                             </span>
                           )}
                           <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm text-[10px] font-medium border border-slate-200">
                             {projTasks.length} tasks
                           </span>
                         </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 transition-transform">
                         {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       </div>
                     </div>

                     {/* Expanded Tasks Area */}
                     {isExpanded && (
                       <div className="bg-slate-50/80 border-t border-slate-100 p-3 flex flex-col gap-3">
                         <div className="flex items-center gap-2 px-1 mb-1">
                           <button 
                             onClick={() => { setEditingTask({ project_id: proj.id, status: 'IDEA' } as any); setIsTaskModalOpen(true); }}
                             className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                           >
                             <Plus className="w-3.5 h-3.5" /> Thêm Idea
                           </button>
                           <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Ideas & Tasks</span>
                         </div>

                         {projTasks.length === 0 ? (
                           <div className="text-center text-slate-400 text-[12px] py-5 bg-white rounded-xl border border-slate-200 border-dashed">
                             Dự án này chưa có task nào.
                           </div>
                         ) : (
                           projTasks.map((task: any, index: number) => {
                             const statusInfo = STATUS_MAP[task.status];
                             return (
                               <div key={task.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 relative hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}>
                                 <div className="flex justify-between items-start gap-3 mb-2">
                                   <h5 className="font-bold text-slate-800 text-[13px] leading-snug flex-1">{task.title}</h5>
                                   <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 mt-0.5 shrink-0">
                                     #{String(index + 1).padStart(2, '0')}
                                   </div>
                                 </div>
                                 
                                 <div className="flex flex-wrap gap-1.5 mb-3">
                                   <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo?.color}`}>
                                     <span className={`w-1.5 h-1.5 rounded-full ${statusInfo?.textColor?.replace('text-', 'bg-')}`}></span>
                                     {statusInfo?.name || task.status}
                                   </span>
                                   {task.status === 'PROD_FILMING' && upcomingMilestone && (
                                     <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                       <Video size={10} /> {format(parseISO(upcomingMilestone.milestone_date), 'dd/MM')}
                                     </span>
                                   )}
                                   {task.platform && task.platform !== 'Khác' && (
                                     <span className="bg-gray-50 text-gray-500 border border-gray-100 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                       {task.platform}
                                     </span>
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
                                   <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                     <UsersIcon size={12} />
                                     <span className="truncate max-w-[120px]">{task.assignee.split(',')[0]}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                     <CalendarIcon size={12} />
                                     {task.dueDate ? format(parseISO(task.dueDate), 'dd/MM') : '--/--'}
                                   </div>
                                 </div>
                               </div>
                             );
                           })
                         )}
                       </div>
                     )}
                   </div>
                 );
               });
             })()}
           </div>
        </div>
      ) : view === 'CALENDAR' ? (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-indigo-600" />
                Lịch đăng bài
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  &lt;
                </button>
                <h3 className="text-lg font-bold text-gray-900 min-w-[120px] text-center">
                  {format(currentMonth, 'MM/yyyy')}
                </h3>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(day => (
                  <div key={day} className="py-3 text-center text-sm font-bold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-white">
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                  const dateFormat = "d";
                  const days = [];
                  let day = startDate;
                  let formattedDate = "";

                  while (day <= endDate) {
                    formattedDate = format(day, dateFormat);
                    const cloneDay = day;
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    // Find videos for this day
                    const dayVideos = videos.filter(v => isSameDay(new Date(v.dueDate), cloneDay));
                    const dayMilestones = projects.flatMap(p => 
                        (p.marketing_shooting_milestones || []).map((m: any) => ({
                            ...m,
                            projectName: p.name,
                            projectId: p.id
                        }))
                    ).filter(m => isSameDay(parseISO(m.milestone_date), cloneDay));

                    days.push(
                      <div 
                        key={day.toString()} 
                        className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
                      >
                        <div className="text-right text-sm font-medium mb-1">{formattedDate}</div>
                        <div className="space-y-1">
                          {dayMilestones.map(milestone => (
                            <div 
                              key={milestone.id} 
                              className="text-xs p-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 truncate hover:bg-rose-100 transition-colors mb-1"
                              title={`${milestone.projectName} - ${milestone.content}`}
                            >
                              <div className="font-bold flex items-center gap-1">
                                <Video size={12} className="shrink-0" /> Lịch Quay: <span className="truncate">{milestone.projectName}</span>
                              </div>
                              <div className="mt-0.5 truncate text-[10px] opacity-80">
                                {milestone.content}
                              </div>
                            </div>
                          ))}
                          {dayVideos.map(video => {
                            const statusDef = STATUS_MAP[video.status];
                            return (
                              <div 
                                key={video.id} 
                                className={`text-xs p-1.5 rounded border ${statusDef?.color} truncate cursor-pointer hover:opacity-80 transition-opacity mb-1`}
                                title={video.title}
                                onClick={() => { setEditingTask(video); setIsTaskModalOpen(true); }}
                              >
                                <div className="font-semibold truncate">{video.title}</div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="opacity-75">{video.platform}</span>
                                  <span className="opacity-75">{video.assignee.split(',')[0]}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                    day = addDays(day, 1);
                  }
                  return days;
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : view === 'TIMELINE' ? (
        <div 
          className="flex-1 min-h-0 min-w-0 flex flex-col p-2 md:p-4 bg-slate-50 relative overflow-hidden transition-all duration-300 rounded-2xl"
        >
          <ProjectGanttBoard />
        </div>
      ) : view === 'DASHBOARD' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            <MarketingDashboard videos={videos} />
          </div>
        </div>
      ) : view === 'WORKFLOW' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* PROFILE HEADER & PERMISSIONS SECTION */}
            {profile && (
              <>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="h-24 sm:h-32 bg-gradient-to-r from-pink-500 to-indigo-500 relative"></div>
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6">
                            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-pink-500 border-4 border-white shadow-xl flex flex-col justify-center items-center`}>
                                <span className="text-4xl sm:text-5xl text-white font-black tracking-tighter">
                                    {profile?.full_name?.substring(0, 2).toUpperCase() || 'MK'}
                                </span>
                                <div className="absolute -bottom-3 bg-white px-3 py-1 rounded-full shadow-lg border border-slate-100 flex items-center gap-1.5">
                                    <Award size={12} className="text-pink-600" />
                                    <span className="text-[10px] font-bold text-pink-600">{profile?.role}</span>
                                </div>
                            </div>
                            
                            <div className="text-center sm:text-left pt-2 flex-1">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">{profile?.full_name || 'Marketing Admin'}</h1>
                                <p className="text-slate-500 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                                    <Mail size={14} /> 
                                    {profile?.email || 'marketing@dqh.vn'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-pink-500" />
                        Quyền hạn & Chức năng
                    </h3>
                    <div className="prose prose-slate prose-sm max-w-none">
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Tài khoản của bạn được định danh với vai trò <span className="bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-md">{profile?.role}</span>. Dưới đây là các module bạn được phép truy cập trên hệ thống.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border bg-indigo-50/50 border-indigo-100">
                                <h4 className="text-sm font-bold mb-1 text-indigo-900">Quản lý Công việc</h4>
                                <p className="text-xs text-slate-500">Sử dụng Kanban Marketing, đăng bài, lên lịch.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-100">
                                <h4 className="text-sm font-bold mb-1 text-amber-900">Thi Công & Thiết Kế</h4>
                                <p className="text-xs text-slate-500">Chỉ xem tiến độ để viết bài PR truyền thông.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 opacity-80">
                                <h4 className="text-sm font-bold mb-1 text-slate-500">Dự án chung</h4>
                                <p className="text-xs text-slate-500">Bị giới hạn, không truy cập bảng tổng công ty.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 opacity-80">
                                <h4 className="text-sm font-bold mb-1 text-slate-500">Khách hàng (CRM)</h4>
                                <p className="text-xs text-slate-500">Chỉ Sale và Admin được phép truy cập.</p>
                            </div>
                        </div>
                    </div>
                </div>
              </>
            )}

            <div className="text-center pt-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-widest mb-2">QUY CHUẨN LÀM VIỆC</h2>
              <p className="text-gray-500">Quy trình phối hợp DQH & Team Coach Hiếu</p>
            </div>

            {/* Phần 1: Tổng quan */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">PHẦN 1: TỔNG QUAN</h3>
              </div>
              <div className="p-6">
                <table className="w-full text-sm text-left mb-6 border-collapse">
                  <thead className="bg-[#4a3b2c] text-white">
                    <tr>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-1/3">Hạng mục</th>
                      <th className="px-4 py-3 border border-[#4a3b2c]">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Kênh trao đổi chính</td>
                      <td className="px-4 py-3 border border-gray-200">Zalo group</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Đầu mối DQH</td>
                      <td className="px-4 py-3 border border-gray-200">Anh Minh (Co-founder)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Đầu mối Coach</td>
                      <td className="px-4 py-3 border border-gray-200">Anh Hiếu + Team Vy Trúc</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Output mục tiêu</td>
                      <td className="px-4 py-3 border border-gray-200">3 video/tuần (12 video/tháng)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Sync cố định</td>
                      <td className="px-4 py-3 border border-gray-200">1 lần/tuần (Thứ 3)</td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Quy trình tổng quan</h4>
                  <p className="text-gray-700 leading-relaxed">
                    Bước 1: DQH cập nhật công trình → Bước 2: Team Hiếu lên outline + hook → Bước 3: DQH điền chuyên môn + duyệt → Bước 4: DQH quay theo shot list → Bước 5: DQH upload source → Bước 6: Team Hiếu edit + QC → Bước 7: DQH duyệt final + Đăng
                  </p>
                </div>
              </div>
            </section>

            {/* Phần 2: Lịch tuần mẫu */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">LỊCH TUẦN MẪU</h3>
              </div>
              <div className="p-6">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#4a3b2c] text-white">
                    <tr>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-1/4">Thứ</th>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-3/8">Team Hiếu</th>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-3/8">Team DQH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 2</td>
                      <td className="px-4 py-3 border border-gray-200">Nhận update công trình</td>
                      <td className="px-4 py-3 border border-gray-200">Gửi update công trình</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 3</td>
                      <td className="px-4 py-3 border border-gray-200">Gửi outline + hook</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 4</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">Điền chuyên môn + duyệt</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 5-6</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">Quay footage</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 6 tối</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">Upload source</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 7-CN</td>
                      <td className="px-4 py-3 border border-gray-200">Edit + QC</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thứ 2 (tuần sau)</td>
                      <td className="px-4 py-3 border border-gray-200">Gửi video final</td>
                      <td className="px-4 py-3 border border-gray-200">Duyệt + Đăng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Phần 3: Chi tiết quy trình */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">PHẦN 2: CHI TIẾT QUY TRÌNH 7 BƯỚC</h3>
              </div>
              <div className="p-6 space-y-8">
                {/* Bước 1 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 1: DQH cập nhật công trình</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thứ 2 hàng tuần</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai làm:</strong> Anh Minh / Bạn media nội bộ</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Output:</strong> Bảng cập nhật công trình theo format:</p>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#4a3b2c] text-white">
                      <tr>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Công trình</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Giai đoạn</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Đặc biệt tuần này</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Quay được?</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Ngày quay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">Infiniti 2PN</td>
                        <td className="px-3 py-2 border border-gray-200">Thi công trần</td>
                        <td className="px-3 py-2 border border-gray-200">Lắp hệ thống chống ồn</td>
                        <td className="px-3 py-2 border border-gray-200">✓</td>
                        <td className="px-3 py-2 border border-gray-200">T4-T5</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">Landmark 3PN</td>
                        <td className="px-3 py-2 border border-gray-200">Thiết kế</td>
                        <td className="px-3 py-2 border border-gray-200">Vừa chốt layout</td>
                        <td className="px-3 py-2 border border-gray-200">X</td>
                        <td className="px-3 py-2 border border-gray-200">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bước 2 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 2: Team Hiếu lên outline + hook</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thứ 3</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Ai làm:</strong> Team Vy Trúc + Anh Hiếu duyệt</p>
                  <p className="text-sm text-gray-700"><strong>Output:</strong> Bảng content tuần bao gồm hook options, angle, shot list</p>
                </div>

                {/* Bước 3 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 3: DQH điền chuyên môn + duyệt</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thứ 4 trưa</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai làm:</strong> Anh Minh / Anh Quang</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Làm gì:</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                    <li>Chọn hook phù hợp nhất</li>
                    <li>Điền chi tiết chuyên môn vào script (kỹ thuật, vật liệu, số liệu)</li>
                    <li>Confirm ngày quay</li>
                  </ul>
                </div>

                {/* Bước 4 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 4: DQH quay theo shot list</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Thời gian:</strong> Thứ 5-6</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai làm:</strong> Bạn media nội bộ + Anh Minh/Quang</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Shot list chuẩn cho mỗi video:</strong></p>
                  <table className="w-full text-xs text-left border-collapse mb-2">
                    <thead className="bg-[#4a3b2c] text-white">
                      <tr>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Shot</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Mô tả</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Thời lượng</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Ai quay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">A</td>
                        <td className="px-3 py-2 border border-gray-200">Hook - cận mặt nói</td>
                        <td className="px-3 py-2 border border-gray-200">5-10s</td>
                        <td className="px-3 py-2 border border-gray-200">Anh Minh</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">B</td>
                        <td className="px-3 py-2 border border-gray-200">Cảnh rộng công trình</td>
                        <td className="px-3 py-2 border border-gray-200">3-5s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">C</td>
                        <td className="px-3 py-2 border border-gray-200">Cận chi tiết (vật liệu, thi công)</td>
                        <td className="px-3 py-2 border border-gray-200">10-15s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">D</td>
                        <td className="px-3 py-2 border border-gray-200">Giải thích tại hiện trường</td>
                        <td className="px-3 py-2 border border-gray-200">20-30s</td>
                        <td className="px-3 py-2 border border-gray-200">Anh Minh/Quang</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">E</td>
                        <td className="px-3 py-2 border border-gray-200">Before/After (nếu có)</td>
                        <td className="px-3 py-2 border border-gray-200">5-10s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-700 italic">Lưu ý: Quay DỌC (9:16) • Quay thừa, đừng thiếu • Raw footage OK</p>
                </div>

                {/* Bước 5 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 5: DQH upload source</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thứ 6 tối</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Ai làm:</strong> Bạn media nội bộ</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Upload lên:</strong> Google Drive folder chung</p>
                  <p className="text-sm text-gray-700"><strong>Cấu trúc folder:</strong> DQH_Content / Tuần_X / Video_TênCôngTrình / các file .mp4</p>
                </div>

                {/* Bước 6 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 6: Team Hiếu edit + QC</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Thời gian:</strong> Thứ 7 - Chủ Nhật</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai làm:</strong> Editor + Team Vy Trúc QC + Anh Hiếu duyệt final</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Checklist QC:</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                    <li>Hook đủ mạnh, 3s đầu có tension</li>
                    <li>Có text/caption rõ ràng</li>
                    <li>Nhạc phù hợp</li>
                    <li>CTA cuối video</li>
                    <li>Độ dài phù hợp (30-60s)</li>
                  </ul>
                </div>

                {/* Bước 7 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">BƯỚC 7: DQH duyệt final + Đăng</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thứ 2 tuần sau</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai làm:</strong> Anh Minh duyệt, Bạn media đăng</p>
                  <p className="text-sm text-gray-700"><strong>Checklist duyệt:</strong> Thông tin chuyên môn chính xác • Hình ảnh công trình OK • Không có gì nhạy cảm</p>
                </div>
              </div>
            </section>

            {/* Quy tắc không chờ & Quá hạn */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">QUY TẮC "KHÔNG CHỜ" & QUÁ HẠN</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Quy tắc "Không chờ"</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 ml-2">
                    <li>Không phản hồi sau 24h = đồng ý mặc định với option đầu tiên</li>
                    <li>Không có footage mới = dùng footage cũ hoặc format khác</li>
                    <li>Thiếu input chuyên môn = Team Hiếu viết draft, DQH chỉ sửa sai</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Quy tắc Quá Hạn (SLA)
                  </h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    Công việc được làm đều theo tuần cố định. Mặc định những nội dung chỉ được làm trong các ngày làm việc (<strong>Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6</strong>). 
                    <br/><br/>
                    Nếu qua ngày quy định của bước đó (ví dụ: qua Thứ 3 mà chưa có Outline) mà task chưa được chuyển sang bước tiếp theo, task đó sẽ tự động được coi là <strong>Quá Hạn</strong>.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      ) : view === 'ARCHIVE' ? (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 shrink-0">
                <FileText className="w-6 h-6 text-gray-500" />
                Mục Lưu trữ
              </h2>
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Bộ phễu lọc (Tìm kiếm)..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            {videos.filter(v => (v.status === 'REJECTED' || v.isarchived) && (!archiveSearch || (v.title?.toLowerCase().includes(archiveSearch.toLowerCase()) || v.platform?.toLowerCase().includes(archiveSearch.toLowerCase())))).length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-6 rounded-sm border-2 border-gray-400 flex items-start justify-center pt-1"><div className="w-3 h-[2px] bg-gray-400"></div></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có bài viết lưu trữ phù hợp</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Danh sách các bài viết bị từ chối, xóa, hoặc để làm sau sẽ nằm ở đây.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden auto-cols-auto">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider items-center hidden sm:grid">
                  <div className="col-span-5">Nội dung</div>
                  <div className="col-span-2 text-center">Nền tảng</div>
                  <div className="col-span-2 text-center">Tình trạng Task</div>
                  <div className="col-span-2 text-center">Date</div>
                  <div className="col-span-1 border-l-0 text-right pr-2">Actions</div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {videos.filter(v => (v.status === 'REJECTED' || v.isarchived) && (!archiveSearch || (v.title?.toLowerCase().includes(archiveSearch.toLowerCase()) || v.platform?.toLowerCase().includes(archiveSearch.toLowerCase())))).map(video => (
                    <div 
                      key={video.id} 
                      onClick={() => { setEditingTask(video); setIsTaskModalOpen(true); }}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <div className="col-span-1 sm:col-span-5 flex flex-col justify-center min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate group-hover:text-indigo-600 transition-colors" title={video.title}>{video.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><LayoutTemplate className="w-3 h-3 shrink-0"/> <span className="truncate">{video.project} • {video.assignee}</span></p>
                      </div>
                      
                      <div className="sm:hidden flex flex-wrap gap-2 text-[11px] font-medium border-t border-gray-100 pt-2 mt-1 w-full">
                        <div className="flex gap-1 items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/50"><Video className="w-3 h-3"/> {video.platform || 'Chưa nền tảng'}</div>
                        <div className="flex gap-1 items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md"><Flag className="w-3 h-3"/> {STATUS_MAP[video.status]?.name || 'Từ chối / Để làm sau'}</div>
                        <div className="flex gap-1 items-center px-2 py-1 bg-gray-50 text-gray-500 rounded-md"><CalendarIcon className="w-3 h-3"/> {video.dueDate ? format(new Date(video.dueDate), 'dd/MM/yyyy') : '-'}</div>
                      </div>

                      <div className="hidden sm:flex col-span-2 items-center justify-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1 ${video.platform && video.platform !== 'Khác' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {video.platform || 'Chưa nền tảng'}
                        </span>
                      </div>
                      <div className="hidden sm:flex col-span-2 items-center justify-center">
                        <span className="px-2.5 py-1 text-red-700 bg-red-50 border border-red-100 rounded-lg text-[11px] font-bold truncate max-w-full text-center">
                          {STATUS_MAP[video.status]?.name || 'Từ chối / Để làm sau'}
                        </span>
                      </div>
                      <div className="hidden sm:flex col-span-2 items-center justify-center text-xs font-semibold text-gray-500">
                        {video.dueDate ? format(new Date(video.dueDate), 'dd/MM/yyyy') : '-'}
                      </div>
                      <div className="col-span-1 flex flex-col sm:flex-row items-center justify-end gap-2">
                        {profile?.role?.trim() === 'Admin' && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateTask(video.id, { isarchived: false, status: video.status === 'REJECTED' ? 'IDEA' : video.status }); }}
                              className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                              title="Khôi phục trạng thái"
                            >
                              Khôi phục
                            </button>
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn nhiệm vụ này khỏi hệ thống?')) {
                                  try {
                                    await supabase.from('marketing_tasks').delete().eq('id', video.id);
                                    fetchData();
                                  } catch (err) { console.error('Lỗi xóa task', err); }
                                }
                              }}
                              className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={12} /> Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {/* Modals -> BottomSheets */}
      <BottomSheet 
        isOpen={!!showVideoModal} 
        onClose={() => setShowVideoModal(null)}
        title={showVideoModal?.title || 'Chi tiết Content'}
      >
        {showVideoModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trạng thái</span><div className="mt-1"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${STATUS_MAP[showVideoModal.status]?.color}`}>{STATUS_MAP[showVideoModal.status]?.name}</span></div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Người thực hiện</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.assignee}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nền tảng</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Video className="w-3 h-3 text-gray-400"/> {showVideoModal.platform}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Định dạng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.format}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lịch đăng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.dueDate ? format(new Date(showVideoModal.dueDate), 'dd/MM/yyyy') : '-'} {showVideoModal.publishTime}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mục tiêu</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Target className="w-3 h-3 text-gray-400"/> {showVideoModal.goal || '-'}</div></div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nội dung chi tiết</span>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{showVideoModal.contentDetails || 'Chưa có nội dung'}</div>
              </div>
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hashtag</span>
                  <div className="mt-1 text-sm font-medium text-indigo-600 bg-indigo-50/50 inline-block px-2 py-1 rounded-md border border-indigo-100/50">{showVideoModal.hashtags || '-'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ghi chú</span>
                  <div className="mt-1 text-sm text-gray-700 italic">{showVideoModal.notes || '-'}</div>
                </div>
              </div>
            </div>
        )}
      </BottomSheet>
      <MarketingProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
        editingProject={editingProject}
        onSave={handleSaveProject}
        onDelete={handleDeleteProjectFn}
        onArchive={handleArchiveProjectFn}
        profiles={profiles}
        currentUserProfile={profile}
      />
      <MarketingTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          onSaved={() => { setIsTaskModalOpen(false); setEditingTask(null); fetchData(); }}
          editingTask={editingTask}
          initialData={{ task_code: '', project_id: '' }}
          projects={projects}
          profiles={profiles}
          currentUserProfile={profile}
          generateNextTaskCode={(pId: string) => {
              const projTasks = tasks.filter(t => t.project_id === pId);
              let maxId = 0;
              projTasks.forEach(t => {
                  const num = parseInt(t.task_code?.split('-').pop() || '0', 10);
                  if (num > maxId) maxId = num;
              });
              const p = projects.find(x => x.id === pId);
              return p?.project_code ? `${p.project_code}-${String(maxId + 1).padStart(2, '0')}` : '';
          }}
      />
      <MarketingRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
};

export default MarketingApp;
