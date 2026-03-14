import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
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
  GanttChartSquare
} from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isSameWeek, isSameQuarter, isSameYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  { id: 'COL_DONE', name: 'Hoàn thành', color: 'bg-green-50 border-green-200 text-green-800' },
  { id: 'COL_SCHEDULE', name: 'Lịch đăng', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'COL_REJECTED', name: 'Từ chối / Để sau', color: 'bg-gray-50 border-gray-200 text-gray-800' }
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

const KPIS = [
  { id: 'views', name: 'SỐ LƯỢT XEM', current: 15000, icon: TrendingUp, color: 'text-gray-900' },
  { id: 'interactions', name: 'SỐ LƯỢT TƯƠNG TÁC', current: 1296, icon: Target, color: 'text-gray-900' },
  { id: 'shares', name: 'SỐ LƯỢT CHIA SẺ', current: 210, icon: MessageCircle, color: 'text-gray-900' },
  { id: 'saves', name: 'SỐ LƯỢT LƯU LẠI', current: 210, icon: CheckCircle2, color: 'text-gray-900' },
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

const ASSIGNEE_DATA = [
  { name: 'Tuyến', value: 27, fill: '#86efac' },
  { name: 'Optimate', value: 22, fill: '#fef08a' },
  { name: 'Tuyến', value: 17, fill: '#fdba74' }, // Just mocking the image
];

const FORMAT_DATA = [
  { name: 'Bài viết', value: 8, fill: '#86efac' },
  { name: 'Video dài', value: 8, fill: '#67e8f9' },
  { name: 'Video ngắn', value: 6, fill: '#f9a8d4' },
  { name: 'Ảnh', value: 9, fill: '#fde047' },
];

const GOAL_DATA = [
  { name: 'Lượt xem', value: 15, fill: '#86efac' },
  { name: 'Lượt yêu thích', value: 6, fill: '#f9a8d4' },
  { name: 'Lượt lưu lại', value: 20, fill: '#fde047' },
];

const STATUS_DATA = [
  { name: 'Lên ý tưởng', value: 5, fill: '#d8b4fe' },
  { name: 'Đang viết', value: 8, fill: '#93c5fd' },
  { name: 'Chờ duyệt', value: 4, fill: '#fde047' },
  { name: 'Đã duyệt', value: 3, fill: '#86efac' },
  { name: 'Đã lên lịch', value: 10, fill: '#fdba74' },
  { name: 'Đã đăng', value: 15, fill: '#67e8f9' },
];

export default function MarketingApp() {
  const [videos, setVideos] = useState(initialVideos);
  const [view, setView] = useState<'WORKFLOW' | 'KANBAN' | 'TIMELINE' | 'CALENDAR' | 'KPI' | 'LIST'>('WORKFLOW');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // November 2024 to match mock data
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [listTimeFilter, setListTimeFilter] = useState('Tất cả');

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateVideo = (id: string, updates: Partial<typeof videos[0]>) => {
    setVideos(videos.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Workflow</h1>
          <p className="text-sm text-gray-500 mt-1">Quy trình phối hợp DQH & Team Coach Hiếu</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'WORKFLOW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('WORKFLOW')}
            >
              Quy chuẩn làm việc
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'KANBAN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('KANBAN')}
            >
              Bảng công việc
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('LIST')}
            >
              Tổng hợp bài đăng
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'CALENDAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('CALENDAR')}
            >
              Lịch đăng bài
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'TIMELINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('TIMELINE')}
            >
              Tiến độ dự án
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'KPI' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('KPI')}
            >
              Tổng quan
            </button>
          </div>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Tạo Video Mới
          </button>
        </div>
      </div>

      {view === 'KANBAN' ? (
        <>
          {/* Filters & Search */}
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border-b border-gray-200">
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm video, công trình..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Lọc
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <CalendarIcon className="w-4 h-4" />
                Lịch tuần
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <div className="flex gap-6 h-full min-w-max">
              {COLUMNS.map(column => {
                const columnVideos = videos.filter(v => STATUS_MAP[v.status]?.col === column.id);
                return (
                  <div key={column.id} className="w-80 flex flex-col h-full">
                    <div className={`px-4 py-3 rounded-t-xl border-t border-l border-r font-bold text-sm flex justify-between items-center ${column.color}`}>
                      <span>{column.name}</span>
                      <span className="bg-white/60 px-2.5 py-0.5 rounded-full text-xs">{columnVideos.length}</span>
                    </div>
                    <div className="flex-1 bg-gray-100/50 border border-gray-200 rounded-b-xl p-3 overflow-y-auto space-y-3">
                      {columnVideos.map(video => {
                        const statusDef = STATUS_MAP[video.status];
                        const isExpanded = expandedCards[video.id];
                        const isIdeaCol = column.id === 'COL_IDEA';
                        
                        return (
                          <div 
                            key={video.id} 
                            onClick={(e) => isIdeaCol && toggleCard(video.id, e)}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group ${isIdeaCol && !isExpanded ? 'p-2' : 'p-3'}`}
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
                            
                            <h3 className={`font-bold text-gray-900 ${isIdeaCol && !isExpanded ? 'text-xs line-clamp-1' : 'text-sm mb-1 line-clamp-2'}`}>
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
                                    <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1">
                                      <LayoutTemplate className="w-3.5 h-3.5" /> {video.project}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                                      <span className="text-[10px] font-medium bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                                        <Video className="w-3 h-3" /> {video.format}
                                      </span>
                                      <span className="text-[10px] font-medium bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                                        <Users className="w-3 h-3" /> {video.platform}
                                      </span>
                                    </div>
                                  </>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                  <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {new Date(video.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-gray-400 font-medium truncate max-w-[60px]">{video.assignee}</span>
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold ring-1 ring-white" title={video.assignee}>
                                      {video.assignee.substring(0, 2).toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex flex-col gap-1.5">
                                  {video.status === 'IDEA' && (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'REJECTED' }); }}
                                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'IDEA' }); }}
                                        className="px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Để sau
                                      </button>
                                    </div>
                                  )}
                                  
                                  {video.status === 'CONTENT_EDITING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_DONE' }); }}
                                      className="w-full py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[11px] font-medium transition-colors"
                                    >
                                      Done
                                    </button>
                                  )}
                                  
                                  {video.status === 'CONTENT_DONE' && (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Từ chối (Edit)
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'PROD_DOING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DONE' }); }}
                                      className="w-full py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded text-[11px] font-medium transition-colors"
                                    >
                                      Đã xong
                                    </button>
                                  )}

                                  {video.status === 'PROD_DONE' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'VIDEO_REVIEW' }); }}
                                      className="w-full py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-[11px] font-medium transition-colors"
                                    >
                                      Gửi qua Cần Phê Duyệt
                                    </button>
                                  )}

                                  {video.status === 'VIDEO_REVIEW' && (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'SCHEDULED' }); }}
                                        className="flex-1 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Phê duyệt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[11px] font-medium transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'SCHEDULED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PUBLISHED' }); }}
                                      className="w-full py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors"
                                    >
                                      Đánh dấu đã đăng
                                    </button>
                                  )}
                                  
                                  {video.status === 'REJECTED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'IDEA' }); }}
                                      className="w-full py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-[11px] font-medium transition-colors"
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
                      
                      <button className="w-full py-2.5 flex items-center justify-center gap-1 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border-2 border-dashed border-gray-200 hover:border-indigo-200 mt-2">
                        <Plus className="w-4 h-4" /> Thêm Bài Viết
                      </button>
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
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-2">LÊN KẾ HOẠCH BÀI ĐĂNG</h2>
            </div>
            
            {/* Filter */}
            <div className="flex justify-center mb-6">
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
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4 mb-6 justify-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-48 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Tổng số bài
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {videos.filter(video => {
                    if (listTimeFilter === 'Tất cả') return true;
                    if (!video.dueDate) return false;
                    const date = new Date(video.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuần') return isSameWeek(date, today, { weekStartsOn: 1 });
                    if (listTimeFilter === 'Theo Tháng') return isSameMonth(date, today);
                    if (listTimeFilter === 'Theo Quý') return isSameQuarter(date, today);
                    if (listTimeFilter === 'Theo Năm') return isSameYear(date, today);
                    return true;
                  }).length}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-48 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Số bài đăng hôm nay
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {videos.filter(video => {
                    if (listTimeFilter === 'Tất cả') return true;
                    if (!video.dueDate) return false;
                    const date = new Date(video.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuần') return isSameWeek(date, today, { weekStartsOn: 1 });
                    if (listTimeFilter === 'Theo Tháng') return isSameMonth(date, today);
                    if (listTimeFilter === 'Theo Quý') return isSameQuarter(date, today);
                    if (listTimeFilter === 'Theo Năm') return isSameYear(date, today);
                    return true;
                  }).filter(v => v.publishTime && v.dueDate === format(new Date(), 'yyyy-MM-dd')).length}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-48 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                  <Video className="w-3.5 h-3.5 text-blue-500" /> Số bài có demo hôm nay
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {videos.filter(video => {
                    if (listTimeFilter === 'Tất cả') return true;
                    if (!video.dueDate) return false;
                    const date = new Date(video.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuần') return isSameWeek(date, today, { weekStartsOn: 1 });
                    if (listTimeFilter === 'Theo Tháng') return isSameMonth(date, today);
                    if (listTimeFilter === 'Theo Quý') return isSameQuarter(date, today);
                    if (listTimeFilter === 'Theo Năm') return isSameYear(date, today);
                    return true;
                  }).filter(v => v.demoDate === format(new Date(), 'yyyy-MM-dd')).length}
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
                    <th className="px-4 py-3 border-r border-gray-200">Nội dung</th>
                    <th className="px-4 py-3 border-r border-gray-200">Hashtag</th>
                    <th className="px-4 py-3 border-r border-gray-200">Ghi chú</th>
                    <th className="px-4 py-3 border-r border-gray-200">Số lượt xem</th>
                    <th className="px-4 py-3 border-r border-gray-200">Số lượt tương tác</th>
                    <th className="px-4 py-3 border-r border-gray-200">Số lượt chia sẻ</th>
                    <th className="px-4 py-3">Số lượt lưu lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {videos.filter(video => {
                    if (listTimeFilter === 'Tất cả') return true;
                    if (!video.dueDate) return false;
                    const date = new Date(video.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuần') return isSameWeek(date, today, { weekStartsOn: 1 });
                    if (listTimeFilter === 'Theo Tháng') return isSameMonth(date, today);
                    if (listTimeFilter === 'Theo Quý') return isSameQuarter(date, today);
                    if (listTimeFilter === 'Theo Năm') return isSameYear(date, today);
                    return true;
                  }).map((video, idx) => {
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
                      <tr key={video.id} className={`${rowColorClass} transition-colors`}>
                        <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-900 max-w-[200px] truncate" title={video.title}>{video.title}</td>
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
                        <td className="px-4 py-3 border-r border-gray-200 max-w-[200px] truncate text-gray-500" title={video.contentDetails}>{video.contentDetails || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200 text-blue-500">{video.hashtags || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200">{video.notes || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200 text-right font-medium">{video.views?.toLocaleString() || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200 text-right font-medium">{video.interactions?.toLocaleString() || '-'}</td>
                        <td className="px-4 py-3 border-r border-gray-200 text-right font-medium">{video.shares?.toLocaleString() || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{video.saves?.toLocaleString() || '-'}</td>
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
                    
                    {/* Render video milestones */}
                    {project.videos.map((video, idx) => {
                       const day = parseInt(video.date.split('-')[2]);
                       const left = ((day - 1) / 31) * 100;
                       return (
                         <div 
                           key={idx}
                           className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                           style={{ left: `${left}%` }}
                         >
                           <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white border border-red-200 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm whitespace-nowrap z-20 flex items-center gap-1">
                             <Video className="w-3 h-3" />
                             {video.title}
                           </div>
                           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                         </div>
                       )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : view === 'KPI' ? (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Platform Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 text-center mb-6 uppercase">SỐ LƯỢNG CONTENT Ở MỖI NỀN TẢNG</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PLATFORM_DATA} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {PLATFORM_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assignee Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 text-center mb-6 uppercase">PHÂN BỔ CONTENT THEO NGƯỜI THỰC HIỆN</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ASSIGNEE_DATA} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {ASSIGNEE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* KPI Results */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">KẾT QUẢ BÀI VIẾT</h3>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">SỐ BÀI VIẾT</div>
                    <div className="text-2xl font-bold text-gray-900">45</div>
                  </div>
                </div>
                
                {/* Platform Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {['Tất cả', 'Facebook', 'TikTok', 'Instagram', 'Website', 'YouTube'].map((platform) => (
                    <button 
                      key={platform}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        platform === 'Tất cả' 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                  {KPIS.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                      <div key={kpi.id} className="border-2 border-indigo-600 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <Icon className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{kpi.name}</div>
                          <div className="text-xl font-bold text-gray-900">{kpi.current.toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Today's Posts */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase text-center">BÀI ĐĂNG HÔM NAY</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <table className="w-full text-xs text-left">
                    <thead className="text-gray-500 font-bold border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2">BÀI ĐĂNG</th>
                        <th className="px-4 py-2">NGƯỜI THỰC HIỆN</th>
                        <th className="px-4 py-2">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {videos.slice(0, 4).map(v => {
                        const statusDef = STATUS_MAP[v.status];
                        return (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[150px]">{v.title}</td>
                            <td className="px-4 py-3 text-gray-500">{v.assignee}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-semibold ${statusDef?.color}`}>
                                {statusDef?.name}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Format Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 text-center mb-2 uppercase">PHÂN BỔ THEO ĐỊNH DẠNG</h3>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={FORMAT_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {FORMAT_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 text-center mb-2 uppercase">PHÂN BỔ THEO TRẠNG THÁI</h3>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {STATUS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Goal Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 text-center mb-2 uppercase">PHÂN BỔ THEO MỤC TIÊU</h3>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={GOAL_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {GOAL_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Warning Signs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50/50 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-red-900">Warning Signs (Cảnh báo)</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-4 flex items-start gap-4 hover:bg-gray-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Quy trình tắc: 2 tuần liên tiếp không đủ 3 video</h4>
                    <p className="text-sm text-gray-500 mt-1">Hành động: Họp khẩn, tìm bottleneck</p>
                  </div>
                </div>
                <div className="p-4 flex items-start gap-4 hover:bg-gray-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Content không work: 4 tuần không có video {'>'}2K view</h4>
                    <p className="text-sm text-gray-500 mt-1">Hành động: Đổi content pillar/hook</p>
                  </div>
                </div>
              </div>
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
      ) : null}
      {/* Modals */}
      <MarketingRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
}
