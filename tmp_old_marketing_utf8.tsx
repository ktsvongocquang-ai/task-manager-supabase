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
  Archive,
  ChevronDown,
  ChevronRight,
  List,
  ShieldAlert,
  Award,
  Mail
} from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isSameWeek, isSameQuarter, isSameYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import MarketingRequestModal from './MarketingRequestModal';
import { SmartCard } from '../../components/layout/SmartCard';
import { BottomSheet } from '../../components/layout/BottomSheet';
import { useAuthStore } from '../../store/authStore';

// Mock Data based on the Google Doc workflow
const initialVideos = [
  {
    id: 'VID-001',
    title: 'Sß╗¡ dß╗Ñng Data Validation trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'IDEA',
    assignee: 'Optimate, Tuyß║┐n',
    dueDate: '2024-11-23',
    format: 'Video ngß║»n',
    platform: 'TikTok',
    priority: '╞»u ti├¬n',
    contentType: 'H╞░ß╗¢ng dß║½n sß╗¡ dß╗Ñng sß║ún phß║⌐m',
    goal: 'L╞░ß╗út xem',
    demoDate: '2024-11-20',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'H╞░ß╗¢ng dß║½n chi tiß║┐t c├ích sß╗¡ dß╗Ñng h├ám...',
    hashtags: '#DataValidation #GoogleSheets',
    assetLink: '[Optimate] Tuyß║┐n',
    notes: '',
    views: 2000,
    interactions: 400,
    shares: 30,
    saves: 20
  },
  {
    id: 'VID-002',
    title: 'C├ích tß║ío biß╗âu ─æß╗ô trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'CONTENT_EDITING',
    assignee: 'Tuyß║┐n',
    dueDate: '2024-11-23',
    format: 'Video d├ái',
    platform: 'YouTube',
    priority: 'Khß║⌐n cß║Ñp',
    contentType: 'Khuyß║┐n m├úi',
    goal: 'L╞░ß╗út y├¬u th├¡ch',
    demoDate: '2024-11-21',
    demoTime: '14:00',
    publishTime: '20:00',
    contentDetails: 'C├íc mß║╣o v├á thß╗º thuß║¡t gi├║p bß║ín l├ám...',
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
    title: 'C├ích tß║ío Dashboard trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'CONTENT_DONE',
    assignee: 'Optimate',
    dueDate: '2024-11-27',
    format: 'B├ái viß║┐t',
    platform: 'Facebook',
    priority: 'Tß╗½ tß╗½',
    contentType: 'Tips',
    goal: 'L╞░ß╗út l╞░u lß║íi',
    demoDate: '2024-11-24',
    demoTime: '14:00',
    publishTime: '19:00',
    contentDetails: 'H╞░ß╗¢ng dß║½n c├ích tß║ío dashboard...',
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
    title: 'C├ích sß╗¡ dß╗Ñng h├ám VLOOKUP trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'PROD_DOING',
    assignee: 'Optimate, Tuyß║┐n',
    dueDate: '2024-11-27',
    format: 'Video ngß║»n',
    platform: 'TikTok',
    priority: '╞»u ti├¬n',
    contentType: 'H╞░ß╗¢ng dß║½n sß╗¡ dß╗Ñng sß║ún phß║⌐m',
    goal: 'L╞░ß╗út xem',
    demoDate: '2024-11-25',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'C├ích sß╗¡ dß╗Ñng VLOOKUP...',
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
    title: 'C├ích sß╗¡ dß╗Ñng h├ám ARRAYFORMULA ─æß╗â t├¡nh to├ín h├áng loß║ít',
    project: 'Google Sheets Tips',
    status: 'VIDEO_REVIEW',
    assignee: 'Optimate, Tuyß║┐n',
    dueDate: '2024-11-23',
    format: 'Video d├ái',
    platform: 'YouTube',
    priority: 'Khß║⌐n cß║Ñp',
    contentType: 'Tips',
    goal: 'L╞░ß╗út xem',
    demoDate: '2024-11-22',
    demoTime: '14:00',
    publishTime: '18:00',
    contentDetails: 'H╞░ß╗¢ng dß║½n sß╗¡ dß╗Ñng h├ám ARRAYFORMULA...',
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
    title: 'Tß║ío b├ío c├ío ─æß╗Öng vß╗¢i Pivot Table trong Google Sheets',
    project: 'Google Sheets Tips',
    status: 'SCHEDULED',
    assignee: 'Tuyß║┐n',
    dueDate: '2024-11-04',
    format: 'B├ái viß║┐t',
    platform: 'Website',
    priority: 'Tß╗½ tß╗½',
    contentType: 'Khuyß║┐n m├úi',
    goal: 'L╞░ß╗út l╞░u lß║íi',
    demoDate: '2024-11-02',
    demoTime: '14:00',
    publishTime: '09:00',
    contentDetails: 'H╞░ß╗¢ng dß║½n tß║ío b├ío c├ío ─æß╗Öng...',
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
  { id: 'COL_IDEA', name: 'idea', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'COL_CONTENT', name: 'Viß║┐t contetn', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'COL_PROD', name: 'sß║ún xuß║Ñt', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'COL_DONE', name: 'ho├án th├ánh ─æ─âng', color: 'bg-green-50 border-green-200 text-green-800' }
];

const STATUS_MAP: Record<string, { col: string, name: string, color: string }> = {
  IDEA: { col: 'COL_IDEA', name: 'idea', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONTENT_EDITING: { col: 'COL_CONTENT', name: '─Éang soß║ín thß║úo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  CONTENT_DONE: { col: 'COL_CONTENT', name: 'Chß╗¥ duyß╗çt', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  PROD_DOING: { col: 'COL_PROD', name: 'sß║ún xuß║Ñt', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  PROD_DONE: { col: 'COL_PROD', name: '─É├ú xong', color: 'bg-green-100 text-green-800 border-green-200' },
  VIDEO_REVIEW: { col: 'COL_DONE', name: 'ho├án th├ánh ─æ─âng', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  SCHEDULED: { col: 'COL_SCHEDULE', name: 'Ch╞░a ─æ─âng', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  PUBLISHED: { col: 'COL_SCHEDULE', name: '─É├ú ─æ─âng', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { col: 'COL_REJECTED', name: 'Tß╗½ chß╗æi / ─Éß╗â sau', color: 'bg-red-100 text-red-800 border-red-200' }
};

const PRIORITY_COLORS: Record<string, string> = {
  'Khß║⌐n cß║Ñp': 'bg-red-100 text-red-700 border-red-200',
  '╞»u ti├¬n': 'bg-orange-100 text-orange-700 border-orange-200',
  'Tß╗½ tß╗½': 'bg-gray-100 text-gray-600 border-gray-200'
};

const PROJECTS_TIMELINE = [
  {
    id: 'PRJ-001',
    name: 'Infiniti 2PN',
    status: '─Éang thi c├┤ng',
    progress: 45,
    phases: [
      { name: 'Thiß║┐t kß║┐', start: '2026-03-01', end: '2026-03-10', color: 'bg-blue-500' },
      { name: 'Thi c├┤ng th├┤', start: '2026-03-11', end: '2026-03-20', color: 'bg-orange-500' },
      { name: 'Lß║»p nß╗Öi thß║Ñt', start: '2026-03-21', end: '2026-03-28', color: 'bg-purple-500' },
      { name: 'B├án giao', start: '2026-03-29', end: '2026-03-30', color: 'bg-green-500' }
    ],
    videos: [
      { date: '2026-03-15', title: 'Quay thi c├┤ng th├┤', status: 'SHOOTING' },
      { date: '2026-03-25', title: 'Quay lß║»p nß╗Öi thß║Ñt', status: 'PROPOSED' }
    ]
  },
  {
    id: 'PRJ-002',
    name: 'Landmark 3PN',
    status: 'Thiß║┐t kß║┐',
    progress: 15,
    phases: [
      { name: 'Thiß║┐t kß║┐', start: '2026-03-10', end: '2026-03-20', color: 'bg-blue-500' },
      { name: 'Thi c├┤ng th├┤', start: '2026-03-21', end: '2026-03-30', color: 'bg-orange-500' },
      { name: 'Lß║»p nß╗Öi thß║Ñt', start: '2026-04-01', end: '2026-04-10', color: 'bg-purple-500' },
      { name: 'B├án giao', start: '2026-04-11', end: '2026-04-12', color: 'bg-green-500' }
    ],
    videos: [
      { date: '2026-03-16', title: 'Chß╗æt layout thiß║┐t kß║┐', status: 'PROPOSED' }
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const getInitialView = () => {
    switch(initialTab) {
      case 'guidelines': return 'WORKFLOW';
      case 'kanban': return 'KANBAN';
      case 'posts': return 'LIST';
      case 'calendar': return 'CALENDAR';
      case 'progress': return 'TIMELINE';
      case 'archive': return 'ARCHIVE';
      default: return 'KANBAN';
    }
  };

  const [videos, setVideos] = useState(initialVideos);
  const { profile } = useAuthStore();
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Set<string>>(new Set(['COL_IDEA', 'COL_CONTENT']));
  
  const [view, setView] = useState<'WORKFLOW' | 'KANBAN' | 'TIMELINE' | 'CALENDAR' | 'KPI' | 'LIST' | 'ARCHIVE'>(getInitialView());
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 10, 1)); // November 2024 to match mock data
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [listTimeFilter, setListTimeFilter] = useState('Tß║Ñt cß║ú');
  const [statusFilter, setStatusFilter] = useState('Tß║Ñt cß║ú');
  const [formatFilter, setFormatFilter] = useState('Tß║Ñt cß║ú');
  const [showKanbanFilters, setShowKanbanFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<typeof videos[0] | null>(null);
  const [showArchivePopup, setShowArchivePopup] = useState<string | null>(null);

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

  const updateVideo = (id: string, updates: Partial<typeof videos[0]>) => {
    setVideos(videos.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col space-y-4 max-w-[1600px] mx-auto min-h-0">
      {/* Header */}
      <div className="flex flex-col justify-between items-start md:items-center gap-4 shrink-0 px-1 md:px-0 pt-2">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-h-[64px] min-w-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">Marketing Workflow</h1>
            <p className="text-sm text-gray-500 mt-1 truncate">Quy tr├¼nh phß╗æi hß╗úp DQH & Team Coach Hiß║┐u</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-start md:justify-end overflow-x-auto hide-scrollbar shrink-0">
            {/* Mobile Dropdown View Selector */}
            <div className="md:hidden w-full relative">
              <select 
                value={view}
                onChange={(e) => handleViewChange(e.target.value as any)}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
              >
                <option value="WORKFLOW">Quy chuß║⌐n l├ám viß╗çc</option>
                <option value="KANBAN">Bß║úng c├┤ng viß╗çc</option>
                <option value="LIST">Tß╗òng hß╗úp b├ái ─æ─âng</option>
                <option value="CALENDAR">Lß╗ïch ─æ─âng b├ái</option>
                <option value="TIMELINE">Tiß║┐n ─æß╗Ö dß╗▒ ├ín</option>
                <option value="ARCHIVE">L╞░u trß╗»</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Desktop Horizontal Tabs */}
            <div className="hidden md:flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'WORKFLOW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('WORKFLOW')}
              >
                Quy chuß║⌐n l├ám viß╗çc
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'KANBAN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('KANBAN')}
              >
                Bß║úng c├┤ng viß╗çc
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('LIST')}
              >
                Tß╗òng hß╗úp b├ái ─æ─âng
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'CALENDAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('CALENDAR')}
              >
                Lß╗ïch ─æ─âng b├ái
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'TIMELINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('TIMELINE')}
              >
                Tiß║┐n ─æß╗Ö dß╗▒ ├ín
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${view === 'ARCHIVE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleViewChange('ARCHIVE')}
              >
                L╞░u trß╗»
              </button>
            </div>
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Tß║ío Video Mß╗¢i
            </button>
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
                      Tß║Ñt cß║ú
                  </button>
                  <button 
                      className={`flex-1 min-w-0 px-2 py-1.5 rounded-full font-bold transition-all duration-300 truncate ${assigneeFilter === profile?.id ? 'bg-white text-[#5B5FC7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setAssigneeFilter(profile?.id || '')}
                  >
                      Cß╗ºa t├┤i
                  </button>
              </div>
              <button 
                  onClick={() => setView('CALENDAR')} 
                  className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-[#5B5FC7] rounded-full hover:bg-indigo-100 transition-colors shadow-sm shrink-0 flex-col gap-0.5"
                  title="Xem lß╗ïch ─æ─âng"
              >
                  <CalendarIcon size={16} />
                  <span className="text-[7px] font-bold leading-none uppercase">lß╗ïch ─æ─âng</span>
              </button>
            </div>

            <div className="hidden md:flex justify-end w-full min-w-0">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                <button onClick={() => setShowKanbanFilters(!showKanbanFilters)} className={`flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${showKanbanFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <Filter className="w-3.5 h-3.5" /> Lß╗ìc
                </button>
                <button onClick={() => setView('CALENDAR')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap">
                  <CalendarIcon className="w-3.5 h-3.5" /> lß╗ïch ─æ─âng
                </button>
              </div>
            </div>
            {showKanbanFilters && (
              <div className="hidden md:flex flex-wrap items-center gap-3 pt-2 text-sm min-w-0">
                <div className="inline-flex overflow-x-auto hide-scrollbar bg-white border border-gray-200 p-1 rounded-lg shadow-sm max-w-full">
                  {['Tß║Ñt cß║ú', 'Theo Tuß║ºn', 'Theo Th├íng', 'Theo Qu├╜', 'Theo N─âm'].map(filter => (
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
                   <option value="Tß║Ñt cß║ú">─Éß╗ïnh dß║íng: Tß║Ñt cß║ú</option>
                   <option value="Video ngß║»n">Video ngß║»n</option>
                   <option value="Video d├ái">Video d├ái</option>
                   <option value="B├ái viß║┐t">B├ái viß║┐t</option>
                   <option value="ß║ónh">ß║ónh</option>
                </select>
                {(listTimeFilter !== 'Tß║Ñt cß║ú' || formatFilter !== 'Tß║Ñt cß║ú') && (
                  <button onClick={() => { setListTimeFilter('Tß║Ñt cß║ú'); setFormatFilter('Tß║Ñt cß║ú'); }} className="text-xs text-gray-400 hover:text-gray-700 underline shrink-0 whitespace-nowrap">
                    X├│a lß╗Öc
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {view === 'KANBAN' ? (
        <>
           {/* Desktop Kanban Board */}
           <div className="hidden md:flex flex-1 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 md:min-h-[500px]">
              {COLUMNS.map(column => {
                const columnVideos = videos.filter(v => {
                  if (STATUS_MAP[v.status]?.col !== column.id) return false;
                  
                  // Apply filters if they are active
                  if (assigneeFilter && profile && assigneeFilter === profile.id) {
                     // In mock data, assignee is a name. Profile has full_name.
                     if (v.assignee !== profile.full_name) return false;
                  }
                  
                  if (listTimeFilter !== 'Tß║Ñt cß║ú') {
                    if (!v.dueDate) return false;
                    const date = new Date(v.dueDate);
                    const today = new Date();
                    if (listTimeFilter === 'Theo Tuß║ºn' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                    if (listTimeFilter === 'Theo Th├íng' && !isSameMonth(date, today)) return false;
                    if (listTimeFilter === 'Theo Qu├╜' && !isSameQuarter(date, today)) return false;
                    if (listTimeFilter === 'Theo N─âm' && !isSameYear(date, today)) return false;
                  }
                  if (formatFilter !== 'Tß║Ñt cß║ú' && v.format !== formatFilter) return false;
                  return true;
                });

                const activeVideos = columnVideos.filter((v: any) => !v.isArchived);
                const archivedVideos = columnVideos.filter((v: any) => v.isArchived);

                return (
                  <div key={column.id} className="w-[90vw] sm:w-[300px] md:flex-1 md:min-w-[300px] md:max-w-[400px] h-full bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col shrink-0 snap-center md:snap-align-none relative max-h-full">
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
                            title="Hiß╗ân thß╗ï l╞░u trß╗»"
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
                          <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-1"><span className="bg-yellow-100 px-2 py-0.5 rounded text-xs border border-yellow-200">{archivedVideos.length}</span> ─É├ú l╞░u trß╗»</h3>
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
                                   Kh├┤i phß╗Ñc
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
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border min-h-[24px] flex items-center ${statusDef?.color}`}>
                                  {statusDef?.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border min-h-[24px] flex items-center ${PRIORITY_COLORS[video.priority] || 'bg-gray-100 text-gray-600'}`}>
                                  {video.priority}
                                </span>
                                {!isIdeaCol && (
                                  <button className="text-gray-400 hover:text-gray-600 opacity-100 transition-opacity p-2 -mr-2">
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <h3 className={`font-bold text-slate-800 text-[14px] md:text-[15px] leading-tight group-hover:text-indigo-600 transition-colors ${!isExpanded ? 'line-clamp-2' : ''}`}>
                              {video.title}
                            </h3>
                            
                            {(!isIdeaCol || isExpanded) && (
                              <>
                                {isIdeaCol && isExpanded && (
                                  <div className="mt-3 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                    <table className="w-full text-left border-collapse">
                                      <tbody>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700 w-1/3">T├¬n video</td>
                                          <td className="py-1.5 text-gray-600">{video.title}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">C├┤ng tr├¼nh</td>
                                          <td className="py-1.5 text-gray-600">{video.project}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">Nh├ón vß║¡t ch├¡nh</td>
                                          <td className="py-1.5 text-gray-600">{video.assignee}</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                          <td className="py-1.5 font-semibold text-gray-700">Format</td>
                                          <td className="py-1.5 text-gray-600">{video.format}</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1.5 font-semibold text-gray-700">Hook ─æ├ú chß╗ìn</td>
                                          <td className="py-1.5 text-gray-600">{video.notes || 'Ch╞░a c├│'}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    
                                    {video.contentDetails && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <div className="font-semibold text-gray-700 mb-1">Giß║úi ph├íp DQH:</div>
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

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                  <div className="flex items-center gap-1.5 text-slate-500 min-h-[32px]">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-medium">{new Date(video.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                  </div>
                                  <div className="flex items-center gap-2 min-h-[32px]">
                                    <span className="text-[11px] text-slate-400 font-bold truncate max-w-[80px]">Thß╗▒c hiß╗çn</span>
                                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#5B5FC7] border border-indigo-100 flex items-center justify-center text-[10px] font-bold" title={video.assignee}>
                                      {video.assignee.substring(0, 2).toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons - Touch Target > 44px */}
                                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                  {video.status === 'IDEA' && (
                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 min-h-[44px] bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Ph├¬ duyß╗çt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'REJECTED' }); }}
                                        className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Tß╗½ chß╗æi
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        ─Éß╗â sau
                                      </button>
                                    </div>
                                  )}
                                  
                                  {video.status === 'CONTENT_EDITING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_DONE' }); }}
                                      className="w-full min-h-[44px] bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[12px] font-bold transition-colors"
                                    >
                                      Done
                                    </button>
                                  )}
                                  
                                  {video.status === 'CONTENT_DONE' && (
                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center gap-1"
                                      >
                                        Ph├¬ duyß╗çt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'CONTENT_EDITING' }); }}
                                        className="flex-1 sm:flex-none min-w-[100px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Tß╗½ chß╗æi (Edit)
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        ─Éß╗â sau
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'PROD_DOING' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DONE' }); }}
                                      className="w-full min-h-[44px] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary-100)] rounded-xl text-[12px] font-bold transition-colors"
                                    >
                                      ─É├ú xong
                                    </button>
                                  )}

                                  {video.status === 'PROD_DONE' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'VIDEO_REVIEW' }); }}
                                      className="w-full min-h-[44px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[12px] font-bold transition-colors"
                                    >
                                      Gß╗¡i qua Cß║ºn Ph├¬ Duyß╗çt
                                    </button>
                                  )}

                                  {video.status === 'VIDEO_REVIEW' && (
                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'SCHEDULED' }); }}
                                        className="flex-1 min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Ph├¬ duyß╗çt
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PROD_DOING' }); }}
                                        className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        Tß╗½ chß╗æi
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { isArchived: true } as any); }}
                                        className="flex-1 sm:flex-none min-w-[80px] min-h-[44px] bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold transition-colors"
                                      >
                                        ─Éß╗â sau
                                      </button>
                                    </div>
                                  )}

                                  {video.status === 'SCHEDULED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'PUBLISHED' }); }}
                                      className="w-full min-h-[44px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[12px] font-bold transition-colors"
                                    >
                                      ─É├ính dß║Ñu ─æ├ú ─æ─âng
                                    </button>
                                  )}
                                  
                                  {video.status === 'REJECTED' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateVideo(video.id, { status: 'IDEA' }); }}
                                      className="w-full min-h-[44px] bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[12px] font-bold transition-colors"
                                    >
                                      Kh├┤i phß╗Ñc
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

            {/* Mobile Accordion Task List (Lark style) */}
            <div className="md:hidden pb-24 border-y border-slate-200 mt-2 bg-white">
                {COLUMNS.map((column, index) => {
                    const isExpanded = expandedMobileGroups.has(column.id);
                    const isLast = index === COLUMNS.length - 1;
                    
                    const columnVideos = videos.filter(v => {
                        if (STATUS_MAP[v.status]?.col !== column.id) return false;
                        if (assigneeFilter && profile && assigneeFilter === profile.id && v.assignee !== profile.full_name) return false;
                        if (listTimeFilter !== 'Tß║Ñt cß║ú') {
                            if (!v.dueDate) return false;
                            const date = new Date(v.dueDate);
                            const today = new Date();
                            if (listTimeFilter === 'Theo Tuß║ºn' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                            if (listTimeFilter === 'Theo Th├íng' && !isSameMonth(date, today)) return false;
                            if (listTimeFilter === 'Theo Qu├╜' && !isSameQuarter(date, today)) return false;
                            if (listTimeFilter === 'Theo N─âm' && !isSameYear(date, today)) return false;
                        }
                        if (formatFilter !== 'Tß║Ñt cß║ú' && v.format !== formatFilter) return false;
                        return true;
                    });

                    const activeVideos = columnVideos.filter((v: any) => !v.isArchived);

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
                                        <div className="p-4 text-center text-slate-400 text-sm italic font-medium bg-transparent">Ch╞░a c├│ bß║ún ghi n├áo</div>
                                    ) : (
                                        activeVideos.map(video => {
                                            const statusDef = STATUS_MAP[video.status];
                                            const isIdeaCol = column.id === 'COL_IDEA';
                                            const isCardExpanded = expandedCards[video.id];
                                            
                                            // The same card design used in desktop but optimized width
                                            return (
                                              <div 
                                                key={video.id} 
                                                onClick={(e) => isIdeaCol && toggleCard(video.id, e)}
                                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:border-indigo-300 transition-all cursor-pointer flex flex-col gap-3"
                                              >
                                                <div className="flex justify-between items-start mb-2">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border min-h-[24px] flex items-center ${statusDef?.color}`}>
                                                      {statusDef?.name}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border min-h-[24px] flex items-center bg-gray-100 text-gray-600`}>
                                                      {video.priority}
                                                    </span>
                                                    {!isIdeaCol && (
                                                      <button className="text-gray-400 p-2 -mr-2">
                                                        <MoreVertical className="w-5 h-5" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                                
                                                <h3 className={`font-bold text-slate-800 text-[14px] leading-tight ${!isCardExpanded ? 'line-clamp-2' : ''}`}>
                                                  {video.title}
                                                </h3>
                                                
                                                {(!isIdeaCol || isCardExpanded) && (
                                                  <>
                                                    {isIdeaCol && isCardExpanded && (
                                                      <div className="mt-2 mb-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-left">
                                                        <div className="font-semibold text-gray-700 mb-1">C├┤ng tr├¼nh: <span className="font-normal text-gray-600">{video.project}</span></div>
                                                        <div className="font-semibold text-gray-700 mb-1">Format: <span className="font-normal text-gray-600">{video.format}</span></div>
                                                        {video.notes && <div className="font-semibold text-gray-700 mb-1">Hook: <span className="font-normal text-gray-600">{video.notes}</span></div>}
                                                      </div>
                                                    )}
                                                    
                                                    {!isIdeaCol && (
                                                      <>
                                                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 truncate">
                                                          <LayoutTemplate className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{video.project}</span>
                                                        </p>
                                                        
                                                        <div className="flex gap-1.5 mb-2">
                                                          <span className="text-[10px] font-medium bg-gray-50 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                                                            <Video className="w-3.5 h-3.5" /> {video.format}
                                                          </span>
                                                        </div>
                                                      </>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                                      <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs font-medium">{new Date(video.dueDate).toLocaleDateString('vi-VN')}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#5B5FC7] border border-indigo-100 flex items-center justify-center text-[10px] font-bold" title={video.assignee}>
                                                          {video.assignee.substring(0, 2).toUpperCase()}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
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
        <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 mx-1 md:mx-0">
          <div className="min-w-max">
            {/* Compute filtered */}
            {(() => {
              const filteredVideos = videos.filter(video => {
                if (listTimeFilter !== 'Tß║Ñt cß║ú') {
                  if (!video.dueDate) return false;
                  const date = new Date(video.dueDate);
                  const today = new Date();
                  if (listTimeFilter === 'Theo Tuß║ºn' && !isSameWeek(date, today, { weekStartsOn: 1 })) return false;
                  if (listTimeFilter === 'Theo Th├íng' && !isSameMonth(date, today)) return false;
                  if (listTimeFilter === 'Theo Qu├╜' && !isSameQuarter(date, today)) return false;
                  if (listTimeFilter === 'Theo N─âm' && !isSameYear(date, today)) return false;
                }
                if (statusFilter !== 'Tß║Ñt cß║ú' && STATUS_MAP[video.status]?.name !== statusFilter) return false;
                if (formatFilter !== 'Tß║Ñt cß║ú' && video.format !== formatFilter) return false;
                return true;
              });
              return (
                <div className="space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-2">L├èN Kß║╛ HOß║áCH B├ÇI ─É─éNG</h2>
            </div>
            
            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                {['Tß║Ñt cß║ú', 'Theo Tuß║ºn', 'Theo Th├íng', 'Theo Qu├╜', 'Theo N─âm'].map(filter => (
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
                    <option value="Tß║Ñt cß║ú">Trß║íng th├íi: Tß║Ñt cß║ú</option>
                    {Object.values(STATUS_MAP).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                 </select>
                 <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-sm">
                    <option value="Tß║Ñt cß║ú">─Éß╗ïnh dß║íng: Tß║Ñt cß║ú</option>
                    <option value="Video ngß║»n">Video ngß║»n</option>
                    <option value="Video d├ái">Video d├ái</option>
                    <option value="B├ái viß║┐t">B├ái viß║┐t</option>
                    <option value="ß║ónh">ß║ónh</option>
                 </select>
              </div>
            </div>

            {/* Tß╗öNG QUAN (Integrated KPIs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <h3 className="text-[11px] font-bold text-gray-500 text-center mb-4 uppercase tracking-wider">Sß╗É L╞»ß╗óNG CONTENT Mß╗ûI Nß╗ÇN Tß║óNG</h3>
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
    HIß╗åU QUß║ó CONTENT 
    {selectedVideo && (
      <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md normal-case flex items-center gap-1 font-semibold">
        ─Éang xem: <span className="max-w-[150px] truncate">{selectedVideo.title}</span>
        <button onClick={(e) => {e.stopPropagation(); setSelectedVideo(null)}} className="ml-1 text-indigo-400 hover:text-indigo-800 flex items-center"><X className="w-3 h-3"/></button>
      </span>
    )}
  </h3>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Tß╗òng b├ái viß║┐t</div>
                    <div className="text-xl font-bold text-gray-900">
                      {filteredVideos.length}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 flex-1">

                  {(() => {
                    const kpisToRender = [
                      { id: 'views', name: 'Sß╗É L╞»ß╗óT XEM', current: selectedVideo ? selectedVideo.views || 0 : filteredVideos.reduce((sum, v) => sum + (v.views || 0), 0), icon: TrendingUp },
                      { id: 'interactions', name: 'Sß╗É L╞»ß╗óT T╞»╞áNG T├üC', current: selectedVideo ? selectedVideo.interactions || 0 : filteredVideos.reduce((sum, v) => sum + (v.interactions || 0), 0), icon: Target },
                      { id: 'shares', name: 'Sß╗É L╞»ß╗óT CHIA Sß║║', current: selectedVideo ? selectedVideo.shares || 0 : filteredVideos.reduce((sum, v) => sum + (v.shares || 0), 0), icon: MessageCircle },
                      { id: 'saves', name: 'Sß╗É L╞»ß╗óT L╞»U Lß║áI', current: selectedVideo ? selectedVideo.saves || 0 : filteredVideos.reduce((sum, v) => sum + (v.saves || 0), 0), icon: CheckCircle2 },
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
                <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide">Warning Signs (Cß║únh b├ío K├¬nh)</h2>
              </div>
              <div className="divide-y divide-red-50 bg-white grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Quy tr├¼nh tß║»c</h4>
                    <p className="text-xs text-gray-600 mt-1">2 tuß║ºn li├¬n tiß║┐p kh├┤ng ─æß╗º 3 video. <br/><span className="font-medium text-red-700">H├ánh ─æß╗Öng:</span> Hß╗ìp khß║⌐n, t├¼m bottleneck</p>
                  </div>
                </div>
                <div className="p-4 flex items-start gap-3 hover:bg-red-50/30 transition-colors border-l border-red-50 lg:border-l-0 border-t md:border-t-0">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Content kh├┤ng work</h4>
                    <p className="text-xs text-gray-600 mt-1">4 tuß║ºn kh├┤ng c├│ video &gt;2K view. <br/><span className="font-medium text-red-700">H├ánh ─æß╗Öng:</span> ─Éß╗òi content pillar/hook</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-Friendly List using SmartCards */}
            <div className="space-y-0">
              {filteredVideos.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">Kh├┤ng t├¼m thß║Ñy b├ái ─æ─âng n├áo.</div>
              ) : filteredVideos.map((video) => {
                const statusDef = STATUS_MAP[video.status];
                
                // Determine if overdue or due today
                let progress = 50; // Default progress
                if (video.status === 'PUBLISHED') progress = 100;
                else if (video.status === 'IDEA') progress = 10;
                else if (video.status === 'CONTENT_EDITING') progress = 30;
                else if (video.status === 'CONTENT_DONE') progress = 40;
                else if (video.status === 'PROD_DOING') progress = 60;
                else if (video.status === 'PROD_DONE') progress = 80;
                else if (video.status === 'VIDEO_REVIEW') progress = 90;
                else if (video.status === 'SCHEDULED') progress = 95;

                const today = format(new Date(), 'yyyy-MM-dd');
                let overdueWarning = '';
                if (video.dueDate && video.dueDate < today && video.status !== 'PUBLISHED') {
                  overdueWarning = ' (Qu├í hß║ín)';
                } else if (video.dueDate === today && video.status !== 'PUBLISHED') {
                  overdueWarning = ' (H├┤m nay)';
                }

                return (
                  <SmartCard 
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    subtitle={`${video.format} ΓÇó ${video.platform}${overdueWarning}`}
                    status={statusDef?.name}
                    statusColor={statusDef?.color}
                    progress={progress}
                    deadline={video.dueDate ? format(new Date(video.dueDate), 'dd/MM/yyyy') : 'N/A'}
                    avatarInitials={video.assignee.substring(0, 2).toUpperCase()}
                    state="medium" // Always show progress and deadline in List view
                    onClick={() => { setSelectedVideo(video); setShowVideoModal(video); }}
                    onSwipeLeft={() => updateVideo(video.id, { status: 'PUBLISHED' })}
                    onSwipeRight={() => setIsRequestModalOpen(true)}
                  />
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex gap-6 text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-200 shadow-sm inline-flex">
              <div className="font-bold uppercase tracking-wider text-gray-800">C├íc ├┤ sß║╜ ─æ╞░ß╗úc t├┤ m├áu:</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-red-200 rounded-sm bg-red-50"></div> M├áu ─æß╗Å cho b├ái ─æ─âng qu├í hß║ín</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-yellow-200 rounded-sm bg-yellow-50"></div> M├áu v├áng cho b├ái ─æ─âng cß║ºn ─æ─âng h├┤m nay</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border border-blue-200 rounded-sm bg-blue-50"></div> M├áu xanh cho b├ái ─æ─âng cß║ºn c├│ demo h├┤m nay</div>
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
                Lß╗ïch ─æ─âng b├ái
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
                {['Thß╗⌐ 2', 'Thß╗⌐ 3', 'Thß╗⌐ 4', 'Thß╗⌐ 5', 'Thß╗⌐ 6', 'Thß╗⌐ 7', 'CN'].map(day => (
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
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GanttChartSquare className="w-5 h-5 text-indigo-600" />
                  Tiß║┐n ─æß╗Ö thi c├┤ng & Lß╗ïch quay
                </h2>
                <p className="text-sm text-gray-500 mt-1 lg:mt-0">Theo d├╡i tiß║┐n ─æß╗Ö thß╗▒c tß║┐ cß╗ºa c├íc c├┤ng tr├¼nh ─æß╗â l├¬n lß╗ïch quay video ph├╣ hß╗úp.</p>
              </div>
              <button 
                onClick={() => alert('T├¡nh n─âng tß║ío dß╗▒ ├ín ─æang ─æ╞░ß╗úc ph├ít triß╗ân')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Tß║ío Dß╗▒ ├ün
              </button>
            </div>

            {/* Header Days */}
            <div className="flex border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-white z-30">
              <div className="w-64 flex-shrink-0 font-bold text-gray-700 text-sm">Dß╗▒ ├ín (Th├íng 3/2026)</div>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            
            {/* PROFILE HEADER & PERMISSIONS SECTION */}
            {profile && (
              <>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="h-24 sm:h-32 bg-gradient-to-r from-pink-500 to-indigo-500 relative"></div>
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6">
                            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-pink-500 border-4 border-white shadow-xl flex flex-col justify-center items-center`}>
                                <span className="text-4xl sm:text-5xl text-white font-black tracking-tighter">
                                    {profile.full_name?.substring(0, 2).toUpperCase() || 'MK'}
                                </span>
                                <div className="absolute -bottom-3 bg-white px-3 py-1 rounded-full shadow-lg border border-slate-100 flex items-center gap-1.5">
                                    <Award size={12} className="text-pink-600" />
                                    <span className="text-[10px] font-bold text-pink-600">{profile.role}</span>
                                </div>
                            </div>
                            
                            <div className="text-center sm:text-left pt-2 flex-1">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">{profile.full_name || 'Marketing Admin'}</h1>
                                <p className="text-slate-500 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                                    <Mail size={14} /> 
                                    {profile.email || 'marketing@dqh.vn'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-pink-500" />
                        Quyß╗ün hß║ín & Chß╗⌐c n─âng
                    </h3>
                    <div className="prose prose-slate prose-sm max-w-none">
                        <p className="text-slate-600 leading-relaxed mb-6">
                            T├ái khoß║ún cß╗ºa bß║ín ─æ╞░ß╗úc ─æß╗ïnh danh vß╗¢i vai tr├▓ <span className="bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-md">{profile.role}</span>. D╞░ß╗¢i ─æ├óy l├á c├íc module bß║ín ─æ╞░ß╗úc ph├⌐p truy cß║¡p tr├¬n hß╗ç thß╗æng.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border bg-indigo-50/50 border-indigo-100">
                                <h4 className="text-sm font-bold mb-1 text-indigo-900">Quß║ún l├╜ C├┤ng viß╗çc</h4>
                                <p className="text-xs text-slate-500">Sß╗¡ dß╗Ñng Kanban Marketing, ─æ─âng b├ái, l├¬n lß╗ïch.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-100">
                                <h4 className="text-sm font-bold mb-1 text-amber-900">Thi C├┤ng & Thiß║┐t Kß║┐</h4>
                                <p className="text-xs text-slate-500">Chß╗ë xem tiß║┐n ─æß╗Ö ─æß╗â viß║┐t b├ái PR truyß╗ün th├┤ng.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 opacity-80">
                                <h4 className="text-sm font-bold mb-1 text-slate-500">Dß╗▒ ├ín chung</h4>
                                <p className="text-xs text-slate-500">Bß╗ï giß╗¢i hß║ín, kh├┤ng truy cß║¡p bß║úng tß╗òng c├┤ng ty.</p>
                            </div>
                            <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 opacity-80">
                                <h4 className="text-sm font-bold mb-1 text-slate-500">Kh├ích h├áng (CRM)</h4>
                                <p className="text-xs text-slate-500">Chß╗ë Sale v├á Admin ─æ╞░ß╗úc ph├⌐p truy cß║¡p.</p>
                            </div>
                        </div>
                    </div>
                </div>
              </>
            )}

            <div className="text-center pt-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-widest mb-2">QUY CHUß║¿N L├ÇM VIß╗åC</h2>
              <p className="text-gray-500">Quy tr├¼nh phß╗æi hß╗úp DQH & Team Coach Hiß║┐u</p>
            </div>

            {/* Phß║ºn 1: Tß╗òng quan */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">PHß║ªN 1: Tß╗öNG QUAN</h3>
              </div>
              <div className="p-6">
                <table className="w-full text-sm text-left mb-6 border-collapse">
                  <thead className="bg-[#4a3b2c] text-white">
                    <tr>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-1/3">Hß║íng mß╗Ñc</th>
                      <th className="px-4 py-3 border border-[#4a3b2c]">Chi tiß║┐t</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">K├¬nh trao ─æß╗òi ch├¡nh</td>
                      <td className="px-4 py-3 border border-gray-200">Zalo group</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">─Éß║ºu mß╗æi DQH</td>
                      <td className="px-4 py-3 border border-gray-200">Anh Minh (Co-founder)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">─Éß║ºu mß╗æi Coach</td>
                      <td className="px-4 py-3 border border-gray-200">Anh Hiß║┐u + Team Vy Tr├║c</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Output mß╗Ñc ti├¬u</td>
                      <td className="px-4 py-3 border border-gray-200">3 video/tuß║ºn (12 video/th├íng)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Sync cß╗æ ─æß╗ïnh</td>
                      <td className="px-4 py-3 border border-gray-200">1 lß║ºn/tuß║ºn (Thß╗⌐ 3)</td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Quy tr├¼nh tß╗òng quan</h4>
                  <p className="text-gray-700 leading-relaxed">
                    B╞░ß╗¢c 1: DQH cß║¡p nhß║¡t c├┤ng tr├¼nh ΓåÆ B╞░ß╗¢c 2: Team Hiß║┐u l├¬n outline + hook ΓåÆ B╞░ß╗¢c 3: DQH ─æiß╗ün chuy├¬n m├┤n + duyß╗çt ΓåÆ B╞░ß╗¢c 4: DQH quay theo shot list ΓåÆ B╞░ß╗¢c 5: DQH upload source ΓåÆ B╞░ß╗¢c 6: Team Hiß║┐u edit + QC ΓåÆ B╞░ß╗¢c 7: DQH duyß╗çt final + ─É─âng
                  </p>
                </div>
              </div>
            </section>

            {/* Phß║ºn 2: Lß╗ïch tuß║ºn mß║½u */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">Lß╗èCH TUß║ªN Mß║¬U</h3>
              </div>
              <div className="p-6">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#4a3b2c] text-white">
                    <tr>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-1/4">Thß╗⌐</th>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-3/8">Team Hiß║┐u</th>
                      <th className="px-4 py-3 border border-[#4a3b2c] w-3/8">Team DQH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 2</td>
                      <td className="px-4 py-3 border border-gray-200">Nhß║¡n update c├┤ng tr├¼nh</td>
                      <td className="px-4 py-3 border border-gray-200">Gß╗¡i update c├┤ng tr├¼nh</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 3</td>
                      <td className="px-4 py-3 border border-gray-200">Gß╗¡i outline + hook</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 4</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">─Éiß╗ün chuy├¬n m├┤n + duyß╗çt</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 5-6</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">Quay footage</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 6 tß╗æi</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                      <td className="px-4 py-3 border border-gray-200">Upload source</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 7-CN</td>
                      <td className="px-4 py-3 border border-gray-200">Edit + QC</td>
                      <td className="px-4 py-3 border border-gray-200">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium">Thß╗⌐ 2 (tuß║ºn sau)</td>
                      <td className="px-4 py-3 border border-gray-200">Gß╗¡i video final</td>
                      <td className="px-4 py-3 border border-gray-200">Duyß╗çt + ─É─âng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Phß║ºn 3: Chi tiß║┐t quy tr├¼nh */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">PHß║ªN 2: CHI TIß║╛T QUY TR├îNH 7 B╞»ß╗ÜC</h3>
              </div>
              <div className="p-6 space-y-8">
                {/* B╞░ß╗¢c 1 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 1: DQH cß║¡p nhß║¡t c├┤ng tr├¼nh</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thß╗⌐ 2 h├áng tuß║ºn</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai l├ám:</strong> Anh Minh / Bß║ín media nß╗Öi bß╗Ö</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Output:</strong> Bß║úng cß║¡p nhß║¡t c├┤ng tr├¼nh theo format:</p>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#4a3b2c] text-white">
                      <tr>
                        <th className="px-3 py-2 border border-[#4a3b2c]">C├┤ng tr├¼nh</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Giai ─æoß║ín</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">─Éß║╖c biß╗çt tuß║ºn n├áy</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Quay ─æ╞░ß╗úc?</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Ng├áy quay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">Infiniti 2PN</td>
                        <td className="px-3 py-2 border border-gray-200">Thi c├┤ng trß║ºn</td>
                        <td className="px-3 py-2 border border-gray-200">Lß║»p hß╗ç thß╗æng chß╗æng ß╗ôn</td>
                        <td className="px-3 py-2 border border-gray-200">Γ£ô</td>
                        <td className="px-3 py-2 border border-gray-200">T4-T5</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">Landmark 3PN</td>
                        <td className="px-3 py-2 border border-gray-200">Thiß║┐t kß║┐</td>
                        <td className="px-3 py-2 border border-gray-200">Vß╗½a chß╗æt layout</td>
                        <td className="px-3 py-2 border border-gray-200">X</td>
                        <td className="px-3 py-2 border border-gray-200">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* B╞░ß╗¢c 2 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 2: Team Hiß║┐u l├¬n outline + hook</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thß╗⌐ 3</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Ai l├ám:</strong> Team Vy Tr├║c + Anh Hiß║┐u duyß╗çt</p>
                  <p className="text-sm text-gray-700"><strong>Output:</strong> Bß║úng content tuß║ºn bao gß╗ôm hook options, angle, shot list</p>
                </div>

                {/* B╞░ß╗¢c 3 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 3: DQH ─æiß╗ün chuy├¬n m├┤n + duyß╗çt</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thß╗⌐ 4 tr╞░a</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai l├ám:</strong> Anh Minh / Anh Quang</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>L├ám g├¼:</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                    <li>Chß╗ìn hook ph├╣ hß╗úp nhß║Ñt</li>
                    <li>─Éiß╗ün chi tiß║┐t chuy├¬n m├┤n v├áo script (kß╗╣ thuß║¡t, vß║¡t liß╗çu, sß╗æ liß╗çu)</li>
                    <li>Confirm ng├áy quay</li>
                  </ul>
                </div>

                {/* B╞░ß╗¢c 4 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 4: DQH quay theo shot list</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Thß╗¥i gian:</strong> Thß╗⌐ 5-6</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai l├ám:</strong> Bß║ín media nß╗Öi bß╗Ö + Anh Minh/Quang</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Shot list chuß║⌐n cho mß╗ùi video:</strong></p>
                  <table className="w-full text-xs text-left border-collapse mb-2">
                    <thead className="bg-[#4a3b2c] text-white">
                      <tr>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Shot</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">M├┤ tß║ú</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Thß╗¥i l╞░ß╗úng</th>
                        <th className="px-3 py-2 border border-[#4a3b2c]">Ai quay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">A</td>
                        <td className="px-3 py-2 border border-gray-200">Hook - cß║¡n mß║╖t n├│i</td>
                        <td className="px-3 py-2 border border-gray-200">5-10s</td>
                        <td className="px-3 py-2 border border-gray-200">Anh Minh</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">B</td>
                        <td className="px-3 py-2 border border-gray-200">Cß║únh rß╗Öng c├┤ng tr├¼nh</td>
                        <td className="px-3 py-2 border border-gray-200">3-5s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">C</td>
                        <td className="px-3 py-2 border border-gray-200">Cß║¡n chi tiß║┐t (vß║¡t liß╗çu, thi c├┤ng)</td>
                        <td className="px-3 py-2 border border-gray-200">10-15s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200">D</td>
                        <td className="px-3 py-2 border border-gray-200">Giß║úi th├¡ch tß║íi hiß╗çn tr╞░ß╗¥ng</td>
                        <td className="px-3 py-2 border border-gray-200">20-30s</td>
                        <td className="px-3 py-2 border border-gray-200">Anh Minh/Quang</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 border border-gray-200">E</td>
                        <td className="px-3 py-2 border border-gray-200">Before/After (nß║┐u c├│)</td>
                        <td className="px-3 py-2 border border-gray-200">5-10s</td>
                        <td className="px-3 py-2 border border-gray-200">Media</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-700 italic">L╞░u ├╜: Quay Dß╗îC (9:16) ΓÇó Quay thß╗½a, ─æß╗½ng thiß║┐u ΓÇó Raw footage OK</p>
                </div>

                {/* B╞░ß╗¢c 5 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 5: DQH upload source</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thß╗⌐ 6 tß╗æi</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Ai l├ám:</strong> Bß║ín media nß╗Öi bß╗Ö</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Upload l├¬n:</strong> Google Drive folder chung</p>
                  <p className="text-sm text-gray-700"><strong>Cß║Ñu tr├║c folder:</strong> DQH_Content / Tuß║ºn_X / Video_T├¬nC├┤ngTr├¼nh / c├íc file .mp4</p>
                </div>

                {/* B╞░ß╗¢c 6 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 6: Team Hiß║┐u edit + QC</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Thß╗¥i gian:</strong> Thß╗⌐ 7 - Chß╗º Nhß║¡t</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai l├ám:</strong> Editor + Team Vy Tr├║c QC + Anh Hiß║┐u duyß╗çt final</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Checklist QC:</strong></p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                    <li>Hook ─æß╗º mß║ính, 3s ─æß║ºu c├│ tension</li>
                    <li>C├│ text/caption r├╡ r├áng</li>
                    <li>Nhß║íc ph├╣ hß╗úp</li>
                    <li>CTA cuß╗æi video</li>
                    <li>─Éß╗Ö d├ái ph├╣ hß╗úp (30-60s)</li>
                  </ul>
                </div>

                {/* B╞░ß╗¢c 7 */}
                <div>
                  <h4 className="text-md font-bold text-amber-900 mb-1">B╞»ß╗ÜC 7: DQH duyß╗çt final + ─É─âng</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Deadline:</strong> Thß╗⌐ 2 tuß║ºn sau</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Ai l├ám:</strong> Anh Minh duyß╗çt, Bß║ín media ─æ─âng</p>
                  <p className="text-sm text-gray-700"><strong>Checklist duyß╗çt:</strong> Th├┤ng tin chuy├¬n m├┤n ch├¡nh x├íc ΓÇó H├¼nh ß║únh c├┤ng tr├¼nh OK ΓÇó Kh├┤ng c├│ g├¼ nhß║íy cß║úm</p>
                </div>
              </div>
            </section>

            {/* Quy tß║»c kh├┤ng chß╗¥ & Qu├í hß║ín */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-amber-900/5 border-b border-amber-900/10 px-6 py-4">
                <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wider">QUY Tß║«C "KH├öNG CHß╗£" & QU├ü Hß║áN</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Quy tß║»c "Kh├┤ng chß╗¥"</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 ml-2">
                    <li>Kh├┤ng phß║ún hß╗ôi sau 24h = ─æß╗ông ├╜ mß║╖c ─æß╗ïnh vß╗¢i option ─æß║ºu ti├¬n</li>
                    <li>Kh├┤ng c├│ footage mß╗¢i = d├╣ng footage c┼⌐ hoß║╖c format kh├íc</li>
                    <li>Thiß║┐u input chuy├¬n m├┤n = Team Hiß║┐u viß║┐t draft, DQH chß╗ë sß╗¡a sai</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Quy tß║»c Qu├í Hß║ín (SLA)
                  </h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    C├┤ng viß╗çc ─æ╞░ß╗úc l├ám ─æß╗üu theo tuß║ºn cß╗æ ─æß╗ïnh. Mß║╖c ─æß╗ïnh nhß╗»ng nß╗Öi dung chß╗ë ─æ╞░ß╗úc l├ám trong c├íc ng├áy l├ám viß╗çc (<strong>Thß╗⌐ 2, Thß╗⌐ 3, Thß╗⌐ 4, Thß╗⌐ 5, Thß╗⌐ 6</strong>). 
                    <br/><br/>
                    Nß║┐u qua ng├áy quy ─æß╗ïnh cß╗ºa b╞░ß╗¢c ─æ├│ (v├¡ dß╗Ñ: qua Thß╗⌐ 3 m├á ch╞░a c├│ Outline) m├á task ch╞░a ─æ╞░ß╗úc chuyß╗ân sang b╞░ß╗¢c tiß║┐p theo, task ─æ├│ sß║╜ tß╗▒ ─æß╗Öng ─æ╞░ß╗úc coi l├á <strong>Qu├í Hß║ín</strong>.
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
                Mß╗Ñc L╞░u trß╗»
              </h2>
            </div>
            {videos.filter(v => v.status === 'REJECTED').length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-6 rounded-sm border-2 border-gray-400 flex items-start justify-center pt-1"><div className="w-3 h-[2px] bg-gray-400"></div></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ch╞░a c├│ b├ái viß║┐t l╞░u trß╗»</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Danh s├ích c├íc b├ái viß║┐t bß╗ï tß╗½ chß╗æi, x├│a, hoß║╖c ─æß╗â l├ám sau sß║╜ nß║▒m ß╗ƒ ─æ├óy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {videos.filter(v => v.status === 'REJECTED').map(video => (
                  <div key={video.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{video.title}</h3>
                      <p className="text-xs text-gray-500">{video.project} ΓÇó {video.assignee}</p>
                    </div>
                    <div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">Tß╗½ chß╗æi / ─Éß╗â l├ám sau</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      {/* Modals -> BottomSheets */}
      <BottomSheet 
        isOpen={!!showVideoModal} 
        onClose={() => setShowVideoModal(null)}
        title={showVideoModal?.title || 'Chi tiß║┐t Content'}
      >
        {showVideoModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trß║íng th├íi</span><div className="mt-1"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${STATUS_MAP[showVideoModal.status]?.color}`}>{STATUS_MAP[showVideoModal.status]?.name}</span></div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ng╞░ß╗¥i thß╗▒c hiß╗çn</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.assignee}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nß╗ün tß║úng</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Video className="w-3 h-3 text-gray-400"/> {showVideoModal.platform}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">─Éß╗ïnh dß║íng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.format}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lß╗ïch ─æ─âng</span><div className="mt-1 font-medium text-sm text-gray-900">{showVideoModal.dueDate ? format(new Date(showVideoModal.dueDate), 'dd/MM/yyyy') : '-'} {showVideoModal.publishTime}</div></div>
                <div><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mß╗Ñc ti├¬u</span><div className="mt-1 font-medium text-sm text-gray-900 flex items-center gap-1"><Target className="w-3 h-3 text-gray-400"/> {showVideoModal.goal || '-'}</div></div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nß╗Öi dung chi tiß║┐t</span>
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{showVideoModal.contentDetails || 'Ch╞░a c├│ nß╗Öi dung'}</div>
              </div>
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hashtag</span>
                  <div className="mt-1 text-sm font-medium text-indigo-600 bg-indigo-50/50 inline-block px-2 py-1 rounded-md border border-indigo-100/50">{showVideoModal.hashtags || '-'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ghi ch├║</span>
                  <div className="mt-1 text-sm text-gray-700 italic">{showVideoModal.notes || '-'}</div>
                </div>
              </div>
            </div>
        )}
      </BottomSheet>
      <MarketingRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
}
