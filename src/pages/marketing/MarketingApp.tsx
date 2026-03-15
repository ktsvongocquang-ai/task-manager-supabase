import React, { useState } from 'react';
import { 
  Plus,  
  Filter, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LayoutTemplate,
  Users,
  TrendingUp,
  Target,
  MessageCircle,
  GanttChartSquare,
  X,
  Archive
} from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isSameWeek, isSameQuarter, isSameYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MarketingRequestModal from './MarketingRequestModal';

// Mock Data based on the Google Doc workflow
const initialVideos = [
  {
    id: 'VID-001',
    title: 'Sử dụng Data Validation trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'IDEA',
    assignee: 'Optimate, Tuyến',
    dueDate: '2024-11-23',
    format: 'Video ngắn',
    platform: 'TikTok',
    priority: 'Ưu tiên',
    contentType: 'Hướng dẫn sử dụng sản phẩm',
    goal: 'Lượt xem',
    demoDate: '2024-11-20',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'Hướng dẫn chi tiết cách sử dụng hàm...',
    hashtags: '#DataValidation #GoogleSheets',
    assetLink: '[Optimate] Tuyến',
    notes: '',
    views: 2000,
    interactions: 400,
    shares: 30,
    saves: 20
  },
  {
    id: 'VID-002',
    title: 'Cách tạo biểu đồ trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'CONTENT_EDITING',
    assignee: 'Tuyến',
    dueDate: '2024-11-23',
    format: 'Video dài',
    platform: 'YouTube',
    priority: 'Khẩn cấp',
    contentType: 'Khuyến mãi',
    goal: 'Lượt yêu thích',
    demoDate: '2024-11-21',
    demoTime: '14:00',
    publishTime: '20:00',
    contentDetails: 'Các mẹo và thủ thuật giúp bạn làm...',
    hashtags: '#Charts #GoogleSheets',
    assetLink: '',
    notes: '',
    views: 1000,
    interactions: 32,
    shares: 40,
    saves: 50
  },
  {
    id: 'VID-003',
    title: 'Cách tạo Dashboard trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'CONTENT_DONE',
    assignee: 'Optimate',
    dueDate: '2024-11-27',
    format: 'Bài viết',
    platform: 'Facebook',
    priority: 'Từ từ',
    contentType: 'Tips',
    goal: 'Lượt lưu lại',
    demoDate: '2024-11-24',
    demoTime: '14:00',
    publishTime: '19:00',
    contentDetails: 'Hướng dẫn cách tạo dashboard...',
    hashtags: '#Dashboard #GoogleSheets',
    assetLink: '',
    notes: '',
    views: 5000,
    interactions: 120,
    shares: 80,
    saves: 150
  },
  {
    id: 'VID-004',
    title: 'Cách sử dụng hàm VLOOKUP trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'PROD_DOING',
    assignee: 'Optimate, Tuyến',
    dueDate: '2024-11-27',
    format: 'Video ngắn',
    platform: 'TikTok',
    priority: 'Ưu tiên',
    contentType: 'Hướng dẫn sử dụng sản phẩm',
    goal: 'Lượt xem',
    demoDate: '2024-11-25',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'Cách sử dụng VLOOKUP...',
    hashtags: '#VLOOKUP #GoogleSheets',
    assetLink: '',
    notes: '',
    views: 0,
    interactions: 0,
    shares: 0,
    saves: 0
  },
  {
    id: 'VID-005',
    title: 'Cách sử dụng hàm ARRAYFORMULA để tính toán hàng loạt',
    project: 'Google Sheets Tips',
    status: 'VIDEO_REVIEW',
    assignee: 'Optimate, Tuyến',
    dueDate: '2024-11-23',
    format: 'Video dài',
    platform: 'YouTube',
    priority: 'Khẩn cấp',
    contentType: 'Tips',
    goal: 'Lượt xem',
    demoDate: '2024-11-22',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'Hướng dẫn sử dụng hàm ARRAYFORMULA...',
    hashtags: '#ARRAYFORMULA #GoogleSheets',
    assetLink: '',
    notes: '',
    views: 0,
    interactions: 0,
    shares: 0,
    saves: 0
  },
  {
    id: 'VID-006',
    title: 'Tạo báo cáo động với Pivot Table trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'SCHEDULED',
    assignee: 'Tuyến',
    dueDate: '2024-11-04',
    format: 'Bài viết',
    platform: 'Website',
    priority: 'Từ từ',
    contentType: 'Khuyến mãi',
    goal: 'Lượt lưu lại',
    demoDate: '2024-11-02',
    demoTime: '14:00',
    publishTime: '09:00',
    contentDetails: 'Hướng dẫn tạo báo cáo động...',
    hashtags: '#PivotTable #GoogleSheets',
    assetLink: '',
    notes: '',
    views: 15000,
    interactions: 1296,
    shares: 210,
    saves: 210
  }
];

const COLUMNS = [
  { id: 'COL_IDEA', name: 'Idea đề xuất', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'COL_CONTENT', name: 'Soạn thảo content', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'COL_PROD', name: 'Sản xuất Video', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'COL_DONE', name: 'Hoàn thành', color: 'bg-green-50 border-green-200 text-green-800' }
];

const STATUS_MAP: Record<string, { col: string, name: string, color: string }> = {
  IDEA: { col: 'COL_IDEA', name: 'Idea đề xuất', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONTENT_EDITING: { col: 'COL_CONTENT', name: 'Đang soạn thảo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  CONTENT_DONE: { col: 'COL_CONTENT', name: 'Chờ duyệt', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  PROD_DOING: { col: 'COL_PROD', name: 'Đang sản xuất', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  PROD_DONE: { col: 'COL_PROD', name: 'Đã xong', color: 'bg-green-100 text-green-800 border-green-200' },
  VIDEO_REVIEW: { col: 'COL_DONE', name: 'Cần phê duyệt', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  SCHEDULED: { col: 'COL_SCHEDULE', name: 'Chưa đăng', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  PUBLISHED: { col: 'COL_SCHEDULE', name: 'Đã đăng', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { col: 'COL_REJECTED', name: 'Từ chối / Để sau', color: 'bg-red-100 text-red-800 border-red-200' }
};

const PRIORITY_COLORS: Record<string, string> = {
  'Khẩn cấp': 'bg-red-100 text-red-700 border-red-200',
  'Ưu tiên': 'bg-orange-100 text-orange-700 border-orange-200',
  'Từ từ': 'bg-gray-100 text-gray-600 border-gray-200'
};

const PROJECTS_TIMELINE = [
  {
    id: 'PRJ-001',
    name: 'Infiniti 2PN',
    status: 'Đang thi công',
    progress: 45,
    phases: [
      { name: 'Thiết kế', start: '2026-03-01', end: '2026-03-10', color: 'bg-blue-500' },
      { name: 'Thi công thô', start: '2026-03-11', end: '2026-03-20', color: 'bg-orange-500' },
      { name: 'Lắp nội thất', start: '2026-03-21', end: '2026-03-28', color: 'bg-purple-500' },
      { name: 'Bàn giao', start: '2026-03-29', end: '2026-03-30', color: 'bg-green-500' }
    ],
    videos: [
      { date: '2026-03-15', title: 'Quay thi công thô', status: 'SHOOTING' },
      { date: '2026-03-25', title: 'Quay lắp nội thất', status: 'PROPOSED' }
    ]
  },
  {
    id: 'PRJ-002',
    name: 'Landmark 3PN',
    status: 'Thiết kế',
    progress: 15,
    phases: [
      { name: 'Thiết kế', start: '2026-03-10', end: '2026-03-20', color: 'bg-blue-500' },
      { name: 'Thi công thô', start: '2026-03-21', end: '2026-03-30', color: 'bg-orange-500' },
      { name: 'Lắp nội thất', start: '2026-04-01', end: '2026-04-10', color: 'bg-purple-500' },
      { name: 'Bàn giao', start: '2026-04-11', end: '2026-04-12', color: 'bg-green-500' }
    ],
    videos: [
      { date: '2026-03-16', title: 'Chốt layout thiết kế', status: 'PROPOSED' }
    ]
  }
];

const PLATFORM_DATA = [
  { name: 'Facebook', value: 8, fill: '#4ade80' },
  { name: 'TikTok', value: 23, fill: '#facc15' },
  { name: 'Instagram', value: 3, fill: '#f87171' },
  { name: 'Website', value: 12, fill: '#f472b6' },
  { name: 'YouTube', value: 6, fill: '#c084fc' },
  { name: 'Email', value: 5, fill: '#fb923c' },
  { name: 'Shopee', value: 2, fill: '#f43f5e' },
  { name: 'Lazada', value: 0, fill: '#3b82f6' },
  { name: 'Tiki', value: 0, fill: '#2dd4bf' },
  { name: 'Zalo', value: 0, fill: '#a78bfa' },
];

export default function MarketingApp() {
  const [videos, setVideos] = useState(initialVideos);
  const [view, setView] = useState<'WORKFLOW' | 'KANBAN' | 'TIMELINE' | 'CALENDAR' | 'KPI' | 'LIST' | 'ARCHIVE'>('WORKFLOW');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // November 2024 to match mock data
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [listTimeFilter, setListTimeFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [formatFilter, setFormatFilter] = useState('Tất cả');
  const [showKanbanFilters, setShowKanbanFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<typeof videos[0] | null>(null);
  const [showArchivePopup, setShowArchivePopup] = useState<string | null>(null);

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateVideo = (id: string, updates: Partial<typeof videos[0]>) => {
    setVideos(videos.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto min-h-0 bg-gray-50 w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex flex-col pt-4 shrink-0">
        {/* Top Header Row */}
        <div className="px-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[64px] min-w-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">Marketing Workflow</h1>
            <p className="text-sm text-gray-500 mt-1 truncate">Quy trình phối hợp DQH & Team Coach Hiếu</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-start md:justify-end overflow-x-auto hide-scrollbar pb-1 md:pb-0 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'WORKFLOW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('WORKFLOW')}
              >
                Quy chuẩn làm việc
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'KANBAN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('KANBAN')}
              >
                Bảng công việc
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('LIST')}
              >
                Tổng hợp bài đăng
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'CALENDAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('CALENDAR')}
              >
                Lịch đăng bài
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'TIMELINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('TIMELINE')}
              >
                Tiến độ dự án
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'ARCHIVE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setView('ARCHIVE')}
              >
                Lưu trữ
              </button>
            </div>
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Tạo Video Mới
            </button>
          </div>
        </div>
        
        {/* Optional Secondary Header for Kanban Filters */}
        {view === 'KANBAN' && (
          <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 flex flex-col gap-2 min-w-0">
            <div className="flex justify-end w-full min-w-0">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                <button onClick={() => setShowKanbanFilters(!showKanbanFilters)} className={`flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${showKanbanFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <Filter className="w-3.5 h-3.5" /> Lọc
                </button>
                <button onClick={() => setView('CALENDAR')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap">
                  <CalendarIcon className="w-3.5 h-3.5" /> Lịch
                </button>
              </div>
            </div>
            {showKanbanFilters && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-sm min-w-0">
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
                {(listTimeFilter !== 'Tất cả' || formatFilter !== 'Tất cả') && (
                  <button onClick={() => { setListTimeFilter('Tất cả'); setFormatFilter('Tất cả'); }} className="text-xs text-gray-400 hover:text-gray-700 underline shrink-0 whitespace-nowrap">
                    Xóa lộc
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {view === 'KANBAN' ? (
        <>
           {/* Kanban Board */}
           <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <div className="flex gap-6 h-full min-w-max">
              {COLUMNS.map(column => {
                const columnVideos = videos.filter(v => {
                  if (STATUS_MAP[v.status]?.col !== column.id) return false;
                  
                  // Apply filters if they are active
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

                const activeVideos = columnVideos.filter((v: any) => !v.isArchived);
                const archivedVideos = columnVideos.filter((v: any) => v.isArchived);

                return (
                  <div key={column.id} className="w-80 flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shrink-0 relative">
                    <div className={`p-4 border-b flex items-center justify-between rounded-t-2xl shadow-sm shrink-0 ${column.color}`}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-700">{column.name}</h3>
                        <span className="bg-white/70 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          {activeVideos.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                                   onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: false } as any); if(archivedVideos.length === 1) setShowArchivePopup(null); }}
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

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 transition-colors">
                      {activeVideos.map(video => {
                        const statusDef = STATUS_MAP[video.status];
                        const isExpanded = expandedCards[video.id];
                        const isIdeaCol = column.id === 'COL_IDEA';
                        
                        return (
                          <div 
                            key={video.id} 
                            onClick={(e) => isIdeaCol && toggleCard(video.id, e)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3"
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${statusDef?.color}`}>
                                  {statusDef?.name}
                                </span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[video.priority] || 'bg-gray-100 text-gray-600'}`}>
                                  {video.priority}
                                </span>
                              </div>
                              {!isIdeaCol && (
                                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <h3 className={`font-bold text-slate-800 ${isIdeaCol && !isExpanded ? 'text-xs line-clamp-1' : 'text-[15px] group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug'}`}>
                              {video.title}
                            </h3>
                            
                            {(!isIdeaCol || isExpanded) && (
                              <>
                                {isIdeaCol && isExpanded && (
                                  <div className="mt-3 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                    <table className="w-full text-left border-collapse">
                                      <tbody>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700 w-1/3">Tên video</td>
                                          <td className="py-1.5 text-gray-600">{video.title}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">Công trình</td>
                                          <td className="py-1.5 text-gray-600">{video.project}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">Nhân vật chính</td>
                                          <td className="py-1.5 text-gray-600">{video.assignee}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">Format</td>
                                          <td className="py-1.5 text-gray-600">{video.format}</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1.5 font-semibold text-gray-700">Hook đã chọn</td>
                                          <td className="py-1.5 text-gray-600">{video.notes || 'Chưa có'}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    
                                    {video.contentDetails && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <div className="font-semibold text-gray-700 mb-1">Giải pháp DQH:</div>
                                        <div className="text-gray-600 whitespace-pre-line">{video.contentDetails}</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {!isIdeaCol && (
                                  <>
                                    <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5 truncate">
                                      <LayoutTemplate className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{video.project}</span>
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                                      <span className="text-[10px] font-medium bg-gray-50 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                                        <Video className="w-3.5 h-3.5" /> {video.format}
                                      </span>
                                      <span className="text-[10px] font-medium bg-gray-50 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                                        <Users className="w-3.5 h-3.5" /> {video.platform}
                                      </span>
                                    </div>
                                  </>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">{new Date(video.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[60px]">Người thực hiện</span>
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-[10px] font-bold" title={video.assignee}>
                                      {video.assignee.substring(0, 2).toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                                  {video.status === 'IDEA' && (
                                    <div className="flex gap-1.5 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'REJECTED' }); }}
                                        className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="px-2 py-1.5 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Để sau
                                      </button>
                                    </div>
                                  )}
                                  
                                  {video.status === 'CONTENT_EDITING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_DONE' }); }}
                                      className="w-full py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Done
                                    </button>
                                  )}
                                  
                                  {video.status === 'CONTENT_DONE' && (
                                    <div className="flex gap-1.5 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Từ chối (Edit)
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="px-2 py-1.5 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Để sau
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'PROD_DOING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DONE' }); }}
                                      className="w-full py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Đã xong
                                    </button>
                                  )}

                                  {video.status === 'PROD_DONE' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'VIDEO_REVIEW' }); }}
                                      className="w-full py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Gửi qua Cần Phê Duyệt
                                    </button>
                                  )}

                                  {video.status === 'VIDEO_REVIEW' && (
                                    <div className="flex gap-1.5 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'SCHEDULED' }); }}
                                        className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="px-2 py-1.5 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                                      >
                                        Để sau
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'SCHEDULED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PUBLISHED' }); }}
                                      className="w-full py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Đánh dấu đã đăng
                                    </button>
                                  )}
                                  
                                  {video.status === 'REJECTED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'IDEA' }); }}
                                      className="w-full py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Khôi phục
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : view === 'LIST' ? (
        <div className="flex-1 overflow-auto p-6 bg-white">
          <div className="min-w-max">
            {/* Compute filtered */}
            {(() => {
              const filteredVideos = videos.filter(video => {
                if (listTimeFilter !== 'Tất cả') {
                  if (!video.dueDate) return false;
                  const date = new Date(video.dueDate);
                  const today = new Date();
                  if (listTimeFilter === 'Theo Tuần' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                  if (listTimeFilter === 'Theo Tháng' && !isSameMonth(date, today)) return false;
                  if (listTimeFilter === 'Theo Quý' && !isSameQuarter(date, today)) return false;
                  if (listTimeFilter === 'Theo Năm' && !isSameYear(date, today)) return false;
                }
                if (statusFilter !== 'Tất cả' && STATUS_MAP[video.status]?.name !== statusFilter) return false;
                if (formatFilter !== 'Tất cả' && video.format !== formatFilter) return false;
                return true;
              });
              return (
                <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-2">LÊN KẾ HOẠCH BÀI ĐĂNG</h2>
            </div>
            
            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                {['Tất cả', 'Theo Tuần', 'Theo Tháng', 'Theo Quý', 'Theo Năm'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setListTimeFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${listTimeFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-sm">
                    <option value="Tất cả">Trạng thái: Tất cả</option>
                    {Object.values(STATUS_MAP).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                 </select>
                 <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-sm">
                    <option value="Tất cả">Định dạng: Tất cả</option>
                    <option value="Video ngắn">Video ngắn</option>
                    <option value="Video dài">Video dài</option>
                    <option value="Bài viết">Bài viết</option>
                    <option value="Ảnh">Ảnh</option>
                 </select>
              </div>
            </div>

            {/* TỔNG QUAN (Integrated KPIs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <h3 className="text-[11px] font-bold text-gray-500 text-center mb-4 uppercase tracking-wider">SỐ LƯỢNG CONTENT MỖI NỀN TẢNG</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PLATFORM_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {PLATFORM_DATA.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* KPI Results */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center flex-wrap gap-2">
    HIỆU QUẢ CONTENT 
    {selectedVideo && (
      <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md normal-case flex items-center gap-1 font-semibold">
        Đang xem: <span className="max-w-[150px] truncate">{selectedVideo.title}</span>
        <button onClick={(e) => {e.stopPropagation(); setSelectedVideo(null)}} className="ml-1 text-indigo-400 hover:text-indigo-800 flex items-center"><X className="w-3 h-3"/></button>
      </span>
    )}
  </h3>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Tổng bài viết</div>
                    <div className="text-xl font-bold text-gray-900">
                      {filteredVideos.length}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 flex-1">

                  {(() => {
                    const kpisToRender = [
                      { id: 'views', name: 'SỐ LƯỢT XEM', current: selectedVideo ? selectedVideo.views || 0 : filteredVideos.reduce((sum, v) => sum + (v.views || 0), 0), icon: TrendingUp },
                      { id: 'interactions', name: 'SỐ LƯỢT TƯƠNG TÁC', current: selectedVideo ? selectedVideo.interactions || 0 : filteredVideos.reduce((sum, v) => sum + (v.interactions || 0), 0), icon: Target },
                      { id: 'shares', name: 'SỐ LƯỢT CHIA SẺ', current: selectedVideo ? selectedVideo.shares || 0 : filteredVideos.reduce((sum, v) => sum + (v.shares || 0), 0), icon: MessageCircle },
                      { id: 'saves', name: 'SỐ LƯỢT LƯU LẠI', current: selectedVideo ? selectedVideo.saves || 0 : filteredVideos.reduce((sum, v) => sum + (v.saves || 0), 0), icon: CheckCircle2 },
                    ];
                    return kpisToRender.map(kpi => {
                      const Icon = kpi.icon;
                      return (
                        <div key={kpi.id} className="border border-indigo-100 rounded-xl p-4 flex items-center gap-4 bg-white/50 hover:bg-white shadow-sm hover:shadow-md transition-all">
                          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <Icon className="w-6 h-6 stroke-[2]" />
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase font-extrabold mb-1 tracking-wider">{kpi.name}</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">{kpi.current.toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Warning Signs */}
            <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide">Warning Signs (Cảnh báo Kênh)</h2>
              </div>
              <div className="divide-y divide-red-50 bg-white grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Quy trình tắc</h4>
                    <p className="text-xs text-gray-600 mt-1">2 tuần liên tiếp không đủ 3 video. <br/><span className="font-medium text-red-700">Hành động:</span> Họp khẩn, tìm bottleneck</p>
                  </div>
                </div>
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors border-l border-red-50 lg:border-l-0 border-t md:border-t-0">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Content không work</h4>
                    <p className="text-xs text-gray-600 mt-1">4 tuần không có video &gt;2K view. <br/><span className="font-medium text-red-700">Hành động:</span> Đổi content pillar/hook</p>
                  </div>
                </div>
              </div>
            </div>

{/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-r border-gray-200">Tiêu đề / Nội dung chính</th>
                    <th className="px-4 py-3 border-r border-gray-200">Người thực hiện</th>
                    <th className="px-4 py-3 border-r border-gray-200">Trạng thái</th>
                    <th className="px-4 py-3 border-r border-gray-200">Loại nội dung</th>
                    <th className="px-4 py-3 border-r border-gray-200">Nền tảng</th>
                    <th className="px-4 py-3 border-r border-gray-200">Định dạng</th>
                    <th className="px-4 py-3 border-r border-gray-200">Mục tiêu</th>
                    <th className="px-4 py-3 border-r border-gray-200">Ngày đăng</th>
                    <th className="px-4 py-3 border-r border-gray-200">Giờ đăng</th>
                    
                    
                    
                    
                    
                    
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVideos.map((video) => {
                    const statusDef = STATUS_MAP[video.status];
                    
                    // Determine row color based on conditions
                    let rowColorClass = "hover:bg-gray-50";
                    const today = format(new Date(), 'yyyy-MM-dd');
                    if (video.dueDate && video.dueDate < today && video.status !== 'PUBLISHED') {
                      rowColorClass = "bg-red-50 hover:bg-red-100"; // Overdue
                    } else if (video.dueDate === today && video.status !== 'PUBLISHED') {
                      rowColorClass = "bg-yellow-50 hover:bg-yellow-100"; // Due today
                    } else if (video.demoDate === today) {
                      rowColorClass = "bg-blue-50 hover:bg-blue-100"; // Demo today
                    }

                    return (
                      <tr key={video.id} onClick={() => setSelectedVideo(video)} className={`${rowColorClass} transition-colors cursor-pointer ${selectedVideo?.id === video.id ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : ''}`}>
                        <td className="px-4 py-3 border-r border-gray-200 font-medium max-w-[200px] truncate" title={video.title}>
    <button onClick={(e) => {e.stopPropagation(); setShowVideoModal(video);}} className="text-left font-bold text-indigo-700 hover:text-indigo-500 hover:underline w-full truncate">
      {video.title}
    </button>
  </td>
                        <td className="px-4 py-3 border-r border-gray-200 text-blue-600 font-medium">{video.assignee}</td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusDef?.color}`}>
                            {statusDef?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.contentType || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${video.platform === 'TikTok' ? 'bg-black' : video.platform === 'Facebook' ? 'bg-blue-600' : video.platform === 'YouTube' ? 'bg-red-600' : 'bg-gray-400'}`}></div>
                            {video.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.format}</td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.goal || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.dueDate ? format(new Date(video.dueDate), 'dd/MM/yyyy') : '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.publishTime || '-'}</td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex gap-6 text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-200 shadow-sm inline-flex">
              <div className="font-bold uppercase tracking-wider text-gray-800">Các ô sẽ được tô màu:</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-red-200 rounded-sm bg-red-50"></div> Màu đỏ cho bài đăng quá hạn</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-yellow-200 rounded-sm bg-yellow-50"></div> Màu vàng cho bài đăng cần đăng hôm nay</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-blue-200 rounded-sm bg-blue-50"></div> Màu xanh cho bài đăng cần có demo hôm nay</div>
            </div>
                          </div>
              );
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

                    days.push(
                      <div 
                        key={day.toString()} 
                        className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
                      >
                        <div className="text-right text-sm font-medium mb-1">{formattedDate}</div>
                        <div className="space-y-1">
                          {dayVideos.map(video => {
                            const statusDef = STATUS_MAP[video.status];
                            return (
                              <div 
                                key={video.id} 
                                className={`text-xs p-1.5 rounded border ${statusDef?.color} truncate cursor-pointer hover:opacity-80 transition-opacity`}
                                title={video.title}
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
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-white">
          <div className="min-w-[1000px] max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GanttChartSquare className="w-5 h-5 text-indigo-600" />
                Tiến độ thi công & Lịch quay
              </h2>
              <p className="text-sm text-gray-500">Theo dõi tiến độ thực tế của các công trình để lên lịch quay video phù hợp.</p>
            </div>

            {/* Header Days */}
            <div className="flex border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-white z-30">
              <div className="w-64 flex-shrink-0 font-bold text-gray-700 text-sm">Dự án (Tháng 3/2026)</div>
              <div className="flex-1 flex">
                {daysInMonth.map(day => (
                  <div key={day} className="flex-1 text-center text-[10px] font-medium text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Projects */}
            <div className="space-y-8">
              {PROJECTS_TIMELINE.map(project => (
                <div key={project.id} className="flex items-center group">
                  <div className="w-64 flex-shrink-0 pr-4">
                    <h3 className="font-bold text-gray-900 text-sm">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{project.status}</span>
                      <span className="text-[10px] text-gray-500">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="flex-1 relative h-16 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {daysInMonth.map(day => (
                        <div key={day} className="flex-1 border-r border-gray-100/50 h-full" />
                      ))}
                    </div>

                    {/* Render phases */}
                    {project.phases.map(phase => {
                       const startDay = parseInt(phase.start.split('-')[2]);
                       const endDay = parseInt(phase.end.split('-')[2]);
                       const left = ((startDay - 1) / 31) * 100;
                       const width = ((endDay - startDay + 1) / 31) * 100;
                       return (
                         <div 
                           key={phase.name}
                           className={`absolute top-2 bottom-2 rounded-lg ${phase.color} opacity-90 flex items-center justify-center overflow-hidden shadow-sm`}
                           style={{ left: `${left}%`, width: `${width}%` }}
                           title={`${phase.name}: ${phase.start} - ${phase.end}`}
                         >
                           <span className="text-[10px] text-white font-bold truncate px-2 drop-shadow-sm">{phase.name}</span>
                         </div>
                       )
                    })}
                    
                    {/* Render video milestones dynamically from videos array */}
                    {videos
                      .filter(v => v.project === project.name && v.dueDate && v.status !== 'REJECTED')
                      .map((video, idx) => {
                         const dateObj = new Date(video.dueDate);
                         const isMarch2026 = dateObj.getFullYear() === 2026 && dateObj.getMonth() === 2; // Check if it's March 2026
                         if (!isMarch2026) return null;
                         
                         const day = dateObj.getDate();
                         const left = ((day - 1) / 31) * 100;
                         return (
                           <div 
                             key={`dyn-vid-${video.id}-${idx}`}
                             className="absolute top-0 bottom-0 w-0.5 bg-red-400/80 z-10 group/marker transition-all"
                             style={{ left: `${left}%` }}
                           >
                             <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white border border-red-200 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm whitespace-nowrap z-20 flex items-center gap-1 opacity-90 group-hover/marker:opacity-100 group-hover/marker:z-50 group-hover/marker:scale-110 transition-all cursor-pointer" title={video.title} onClick={(e) => { e.stopPropagation(); setShowVideoModal(video); }}>
                               <Video className="w-3 h-3" />
                               <span className="truncate max-w-[100px]">{video.title}</span>
                             </div>
                             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                           </div>
                         );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : view === 'WORKFLOW' ? (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-widest mb-2">QUY CHUẨN LÀM VIỆC</h2>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-500" />
                Mục Lưu trữ
              </h2>
            </div>
            {videos.filter(v => v.status === 'REJECTED').length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-6 rounded-sm border-2 border-gray-400 flex items-start justify-center pt-1"><div className="w-3 h-[2px] bg-gray-400"></div></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có bài viết lưu trữ</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Danh sách các bài viết bị từ chối, xóa, hoặc để làm sau sẽ nằm ở đây.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {videos.filter(v => v.status === 'REJECTED').map(video => (
                  <div key={video.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{video.title}</h3>
                      <p className="text-xs text-gray-500">{video.project} • {video.assignee}</p>
                    </div>
                    <div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">Từ chối / Để làm sau</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
            {/* Modals */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 pr-4">{showVideoModal.title}</h3>
              <button onClick={() => setShowVideoModal(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      )}
      <MarketingRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
}
