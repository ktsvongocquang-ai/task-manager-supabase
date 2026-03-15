import { useState, useEffect } from 'react';
import { Plus, Bell, Camera, Upload, Download, Folder, Users, ChevronLeft, Calendar, DollarSign, FileSpreadsheet, X, MessageSquare, Clock, FileSearch, ChevronRight, Settings, Phone, Printer, Building2, UserCheck, AlertTriangle, Minus, Sparkles, Trash2, Mic } from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as xlsx from 'xlsx';
import { parseConstructionExcel } from '../../lib/gemini';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { type Project, type Task } from '../../types';

// -------------------------------------------------------------
// TYPES & MOCK DATA INITIALIZATION
// -------------------------------------------------------------
type ViewState = 'HOME' | 'CREATE_PROJECT' | 'PROJECT_DETAIL' | 'DATA_CHECK' | 'DATA_UPLOAD' | 'PLANNING' | 'GANTT' | 'REMINDERS';
type TabState = 'DỰ ÁN' | 'THU CHI' | 'NHÂN SỰ' | 'CÀI ĐẶT';

const mockParsedData = [
  { id: 'b1', name: 'Ốp lam gỗ nhựa mặt tiền', quantity: 12, unit: 'm²', price: 1000000 },
  { id: 'b2', name: 'Sơn lại lô đề + khung cửa kính mặt tiền', quantity: 1, unit: 'gói', price: 2000000 },
  { id: 'b3', name: 'Ốp lam nhôm đứng mặt tiền', quantity: 1, unit: 'gói', price: 3000000 },
  { id: 'b4', name: 'Ốp alu tạo hình mặt tiền', quantity: 1, unit: 'gói', price: 12000000 },
];

const initialPersonnel = [
  { id: 'p1', name: 'Trần Sơn Hải', position: 'Giám đốc', type: 'NỘI BỘ', phone: '0901234567', status: 'Đang làm việc' },
  { id: 'p2', name: 'Ngô Hữu Thắng', position: 'Trưởng ban giám sát', type: 'NỘI BỘ', phone: '0987654321', status: 'Đang làm việc' },
  { id: 'p3', name: 'Đội thi công Alpha', position: 'Thầu Thạch Cao', type: 'THẦU PHỤ', phone: '0933123456', status: 'Nghỉ' }
];

const subcontractorsList = [
  'Tuấn (Kết cấu)',
  'Công ty Điện Beta (MEP)',
  'Cô Lan (MEP (Nước))',
  'Đội Sơn Delta (Hoàn thiện)',
  'Hùng (Đào móng)'
];

export const Construction = () => {
  // -------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [activeTab, setActiveTab] = useState<TabState>('DỰ ÁN');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const [personnel] = useState(initialPersonnel);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDate, setNewProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProjectBudget, setNewProjectBudget] = useState('');
  
  // App states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'EXCEL' | 'PDF' | null>(null);
  const [hasData, setHasData] = useState(true); // Default true for demo project 1
  const [isClientView, setIsClientView] = useState(false);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  
  const [parsedData, setParsedData] = useState<{id: string, name: string, quantity: number, unit: string, price: number}[]>(mockParsedData);
  const [selectedParsedItems, setSelectedParsedItems] = useState<string[]>(mockParsedData.map(i => i.id));
  const [activeDataTab, setActiveDataTab] = useState<'ALL' | 'SELECTED'>('ALL');
  
  // Project Info states for Gantt
  const [projectStartDate, setProjectStartDate] = useState('2024-05-06');
  const [currentWeek, setCurrentWeek] = useState(3);
  const [leadArchitect, setLeadArchitect] = useState('VÕ NGỌC QUANG');
  const [supervisor, setSupervisor] = useState('NGÔ HỮU THẮNG');

  // Inline Editing states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Project Info editing state
  const [isEditingProjInfo, setIsEditingProjInfo] = useState<string | null>(null);

  // Diary/Timeline states
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryTaskId, setDiaryTaskId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [diaryNote, setDiaryNote] = useState('');
  
  // Progress/Images Gallery states
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTaskId, setGalleryTaskId] = useState<string | null>(null);

  // Financials Transaction Modal state
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [formTransaction, setFormTransaction] = useState({ supplier: '', amount: '', date: '', reason: '' });

  const [activeProjectTab, setActiveProjectTab] = useState<'NHAT_KI' | 'TIMELINE' | 'CHI_PHI'>('TIMELINE');

  const shiftProjectDate = (days: number) => {
    const weeksToShift = days / 7;
    setCurrentWeek(prev => Math.max(1, prev + weeksToShift));
  };
  
  // Quote Modal states
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteSubcontractor, setQuoteSubcontractor] = useState('');
  const [quoteTaskName, setQuoteTaskName] = useState('');
  const [quoteTone, setQuoteTone] = useState('Thường');
  const [isQuoteUploading, setIsQuoteUploading] = useState(false);

  // Risk Simulation Modal
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [riskFactor, setRiskFactor] = useState(10);

  // GPS Check-in Simulation
  const [gpsCheckingId, setGpsCheckingId] = useState<string | null>(null);

  // Settings state
  const [settings] = useState({
    companyName: 'CÔNG TY TNHH J.ARCHITECT',
    address: 'TP. Hồ Chí Minh, Việt Nam',
    planner: 'Trần Sơn Hải',
    checker: 'Jacky Lee',
    approver: 'Giám Đốc'
  });

  // -------------------------------------------------------------
  // EFFECTS & UTILS
  // -------------------------------------------------------------
  
  useEffect(() => {
    fetchProjects();
    fetchTasks();

    const channel = supabase.channel('construction_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'projects' },
            () => fetchProjects()
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            () => fetchTasks()
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, []);

  const fetchProjects = async () => {
      try {
          setLoading(true);
          const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
          if (data) setProjects(data as Project[]);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const fetchTasks = async () => {
      try {
          const { data } = await supabase.from('tasks').select('*');
          if (data) setTasks(data as Task[]);
      } catch (err) {
          console.error(err);
      }
  };

  const displayTasks = tasks.filter(t => t.project_id === selectedProjectId);

  // ESC to exit logic
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingTaskId) {
            setEditingTaskId(null);
            setEditingField(null);
        } else if (currentView === 'REMINDERS' || currentView === 'CREATE_PROJECT' || currentView === 'PLANNING' || currentView === 'GANTT') {
          setCurrentView('HOME');
        }
        if (isQuoteOpen) setIsQuoteOpen(false);
        if (isDiaryOpen) setIsDiaryOpen(false);
        if (isGalleryOpen) setIsGalleryOpen(false);
        if (isTransactionOpen) setIsTransactionOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [currentView, isQuoteOpen, isDiaryOpen, isGalleryOpen, isTransactionOpen]);

  const addNewTask = async (category: string = 'THI CÔNG', insertAfterId?: string) => {
    if (!selectedProjectId) return;
    try {
        let maxId = 0;
        const projTasks = tasks.filter(t => t.project_id === selectedProjectId);
        projTasks.forEach(t => {
            const match = t.task_code.match(/-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        
        const proj = projects.find(p => p.id === selectedProjectId);
        const nextCode = proj?.project_code ? `${proj.project_code}-${String(maxId + 1).padStart(2, '0')}` : `TASK-${Date.now()}`;
        
        const payload = {
            project_id: selectedProjectId,
            task_code: nextCode,
            name: 'Hạng mục thi công mới',
            status: 'Chưa bắt đầu',
            completion_pct: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: addDays(new Date(), 2).toISOString().split('T')[0],
            assignee_id: profile?.id
        };
        
        const { error } = await supabase.from('tasks').insert(payload);
        if (!error) fetchTasks();
    } catch (err) {
        console.error(err);
    }
  };

  const handleEditStart = (taskId: string, field: string, initialValue: string | number | null) => {
    setEditingTaskId(taskId);
    setEditingField(field);
    setEditValue(initialValue ? initialValue.toString() : '');
  };

  const handleEditSave = async () => {
    if (editingTaskId && editingField) {
        try {
            const taskToEdit = tasks.find(t => t.id === editingTaskId);
            if (!taskToEdit) return;

            let updatePayload: any = {};
            
            // Map our fake fields back to real fields
            let realField = editingField;
            if (editingField === 'startDate') realField = 'start_date';
            if (editingField === 'endDate') realField = 'end_date';
            if (editingField === 'progress') realField = 'completion_pct';
            if (editingField === 'budget') realField = 'cost_estimate'; // Mock mapping if available

            if (editingField === 'days') {
                // If they edit days, adjust end_date
                if (taskToEdit.start_date) {
                    const newDays = Math.max(1, Number(editValue));
                    updatePayload.end_date = addDays(parseISO(taskToEdit.start_date), newDays - 1).toISOString().split('T')[0];
                }
            } else {
                updatePayload[realField] = editingField === 'progress' ? Number(editValue) : editValue;
            }

            const { error } = await supabase.from('tasks').update(updatePayload).eq('id', editingTaskId);
            if (!error) fetchTasks();
        } catch (err) {
            console.error(err);
        }
    }
    setEditingTaskId(null);
    setEditingField(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSave();
    if (e.key === 'Escape') {
        setEditingTaskId(null);
        setEditingField(null);
    }
  };

  const exportToExcel = () => {
    const exportData = tasks.map((t, index) => ({
      'STT': index + 1,
      'MÔ TẢ': t.name,
      'GHI CHÚ': t.description || '',
      'BẮT ĐẦU': t.start_date ? format(parseISO(t.start_date), 'dd/MM/yyyy') : '',
      'KẾT THÚC': t.end_date ? format(parseISO(t.end_date), 'dd/MM/yyyy') : '',
      'TIẾN ĐỘ (%)': t.completion_pct || 0,
      'NGÂN SÁCH (VNĐ)': t.cost_estimate || 0,
      'TRẠNG THÁI': t.status || 'Chưa bắt đầu',
      'ĐÃ DUYỆT': t.is_approved ? 'Có' : 'Không'
    }));
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Tiến Độ");
    xlsx.writeFile(workbook, `Tien-Do-Du-An-${selectedProject?.name || 'Moi'}.xlsx`);
  };

  const generateTasksFromData = async (dataList: any[]) => {
    setIsUploading(false);
    
    // Auto generate tasks with Logical Timeline thinking
    const priority = { 
      '1. CÔNG TÁC CHUẨN BỊ TRƯỚC THI CÔNG': 1, 
      '2. HẠNG MỤC CẢI TẠO KIẾN TRÚC': 2, 
      '3. HẠNG MỤC LẮP ĐẶT NỘI THẤT': 3, 
      '4. NGHIỆM THU NỘI BỘ - DEFECT': 4, 
      '5. NGHIỆM THU BÀN GIAO KHÁCH HÀNG': 5 
    };
    const sortedData = [...dataList].sort((a, b) => {
      const pA = priority[a.category as keyof typeof priority] || 99;
      const pB = priority[b.category as keyof typeof priority] || 99;
      return pA - pB;
    });

    let currentStartDate = parseISO(selectedProject?.start_date || new Date().toISOString());
    const newTasks = sortedData.map((item, index) => {
      const days = item.days || Math.floor(Math.random() * 5) + 2; 
      const endDate = addDays(currentStartDate, days - 1);
      
      const payload = {
        project_id: selectedProjectId,
        task_code: `GEN-${Date.now()}-${index}`,
        name: item.name,
        // Using 'description' to temporarily hold category string since tasks table might lack category
        description: (item.category || '1. CÔNG TÁC CHUẨN BỊ TRƯỚC THI CÔNG').trim(), 
        cost_estimate: item.price * item.quantity,
        is_approved: false,
        start_date: currentStartDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'Chưa bắt đầu'
      };
      
      currentStartDate = addDays(endDate, 1);
      return payload;
    });
    
    // Bulk insert into Supabase
    if (selectedProjectId) {
        try {
            await supabase.from('tasks').insert(newTasks);
            
            // Update project total budget
            const totalBudget = newTasks.reduce((sum, t) => sum + (t.cost_estimate || 0), 0);
            await supabase.from('projects').update({
                status: 'Đang thực hiện',
                budget: totalBudget
            }).eq('id', selectedProjectId);

            fetchTasks();
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    }

    setCurrentView('DATA_CHECK');
  };

  const handleUploadQuote = () => {
    setIsQuoteUploading(true);
    setTimeout(() => {
      setIsQuoteUploading(false);
    }, 2000);
  };

  const toggleTaskApproval = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].approved = !newTasks[index].approved;
    setTasks(newTasks);
  };



  const renderHome = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-slate-800">Quản Lý Dự Án Thi Công</h1>
             {isClientView && <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase rounded-lg shadow-sm">Client View</span>}
          </div>
          <p className="text-sm text-slate-500 mt-1">Hệ thống lập kế hoạch và phân bổ thầu phụ thông minh</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Góc nhìn Khách</span>
            <button 
              onClick={() => setIsClientView(!isClientView)}
              className={`w-10 h-6 rounded-full transition-colors relative shadow-inner ${isClientView ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
               <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${isClientView ? 'translate-x-[20px]' : 'translate-x-[4px]'}`}></span>
            </button>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
            JA
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setCurrentView('CREATE_PROJECT')}
          className="bg-indigo-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-white">TẠO DỰ ÁN MỚI</span>
        </button>
        
        <button className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
          <Bell className="w-8 h-8 text-indigo-500" />
          <span className="font-medium text-slate-700">THÔNG BÁO</span>
        </button>

        <button onClick={() => setIsTransactionOpen(true)} className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
          <Camera className="w-8 h-8 text-indigo-500" />
          <span className="font-medium text-slate-700">CHỤP HĐ NHANH</span>
        </button>

        <div className="flex flex-col gap-4">
          <button className="bg-white rounded-2xl p-4 flex items-center justify-center gap-2 flex-1 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
            <Upload className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-slate-700">IMPORT</span>
          </button>
          <button className="bg-white rounded-2xl p-4 flex items-center justify-center gap-2 flex-1 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
            <Download className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-slate-700">EXPORT ZIP</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Danh Sách Dự Án</h2>
        <div className="space-y-3">
          {projects.map(project => {
            let health = { color: 'bg-emerald-500', text: 'TỐT (Đúng ngân sách/tiến độ)', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            const actualCost = 0; // Mock actual cost
            if (project.budget && project.budget > 0) {
                const ratio = actualCost / project.budget;
                if (ratio > 1.15) health = { color: 'bg-rose-500', text: 'NGUY HIỂM (Vượt chi/trễ >15%)', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
                else if (ratio > 1) health = { color: 'bg-amber-500', text: 'CẢNH BÁO (Vượt chi/trễ >5%)', bg: 'bg-amber-50 text-amber-600 border-amber-200' };
            }

            return (
              <div 
                key={project.id}
                  onClick={() => {
                  setSelectedProjectId(project.id);
                  setHasData(true); // Assuming data is present for now
                  setCurrentView('PROJECT_DETAIL');
                }}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:border-indigo-500 hover:shadow-sm transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center">
                    <Folder className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800 text-lg">{project.name}</h3>
                        <div className="flex items-center gap-1.5" title={health.text}>
                            <div className={`w-3 h-3 rounded-full shadow-sm ${health.color}`}></div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${health.bg} whitespace-nowrap hidden md:inline-block`}>
                                {health.text}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">{project.created_at ? format(parseISO(project.created_at), 'dd/MM/yyyy') : '--/--/----'}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-full">
                    {project.status}
                  </span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-slate-50"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-400 border-2 border-slate-50"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-50 flex items-center justify-center text-[10px] text-slate-600 font-bold">+6</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCreateProject = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <button 
        onClick={() => setCurrentView('HOME')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>
      
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <Plus className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Dự Án Mới</h2>
                <p className="text-slate-400 font-medium">Khởi tạo không gian làm việc cho công trình</p>
            </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Tên Công Trình</label>
            <input 
              type="text" 
              placeholder="VD: Cửa hàng Coffee Quận 1..."
              className="w-full bg-slate-950/50 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-bold text-lg focus:outline-none focus:border-indigo-500 transition-all"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                <Calendar className="w-6 h-6 text-indigo-400 mb-3" />
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Ngày bắt đầu</label>
                <input 
                  type="date"
                  value={newProjectDate}
                  onChange={(e) => setNewProjectDate(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
                />
             </div>
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative group hover:border-emerald-500/30 transition-all">
                <DollarSign className="w-6 h-6 text-emerald-400 mb-3" />
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">Ngân sách dự kiến</label>
                <input 
                  type="text"
                  placeholder="VD: 50.000.000"
                  value={newProjectBudget}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val) {
                      setNewProjectBudget(parseInt(val).toLocaleString('vi-VN'));
                    } else {
                      setNewProjectBudget('');
                    }
                  }}
                  className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-slate-600"
                />
             </div>
          </div>

          <button 
            onClick={handleCreateProject}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 text-xl"
          >
            KHỞI TẠO DỰ ÁN
          </button>
        </div>
      </div>
    </div>
  );

  const renderProjectDetail = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('HOME')}
            className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-white tracking-tight">{selectedProject?.name}</h1>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 tracking-widest">{selectedProject?.status}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>ID: #{selectedProject?.id}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Bắt đầu: {selectedProject?.created_at ? format(parseISO(selectedProject.created_at), 'dd/MM/yyyy') : '--/--/----'}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>ID: #{selectedProject?.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 items-center flex-wrap justify-end">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button onClick={() => setActiveProjectTab('NHAT_KI')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'NHAT_KI' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>NHẬT KÍ</button>
                {hasData && (
                  <button onClick={() => setActiveProjectTab('TIMELINE')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>TIMELINE</button>
                )}
                {!isClientView && (
                  <button onClick={() => setActiveProjectTab('CHI_PHI')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'CHI_PHI' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>CHI PHÍ</button>
                )}
            </div>
          <button className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cấu hình
          </button>
          {!hasData && (
             <button 
               onClick={() => setCurrentView('DATA_UPLOAD')}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
             >
               LẬP KẾ HOẠCH <ChevronRight className="w-5 h-5" />
             </button>
          )}
        </div>
      </div>

      {activeProjectTab === 'NHAT_KI' && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-white tracking-tight mb-8">Nhật Kí Thi Công - Hôm Nay, {format(new Date(), 'dd/MM/yyyy')}</h2>
            
            <div className="grid grid-cols-1 gap-8">
                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                    <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Clock className="w-5 h-5" /> ĐẦU NGÀY: CÔNG VIỆC CÔNG NHÂN LÀ GÌ?
                    </h3>
                    <textarea 
                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        rows={4}
                        placeholder="Mô tả chi tiết công việc phân công cho công nhân trong ngày..."
                    ></textarea>
                    <div className="mt-4 flex gap-4">
                        <button className="flex items-center gap-2 bg-white/5 text-slate-300 border border-white/10 px-5 py-3 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all">
                            <Camera className="w-5 h-5" /> Chụp hình báo cáo
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                    <h3 className="text-rose-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Clock className="w-5 h-5" /> CUỐI NGÀY: NGHIỆM THU & BÁO CÁO
                    </h3>
                    <textarea 
                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                        rows={4}
                        placeholder="Kết quả công việc hôm nay đã hoàn thành những gì? Có vướng mắc gì không?"
                    ></textarea>
                    <div className="mt-4 flex gap-4">
                        <button className="flex items-center gap-2 bg-white/5 text-slate-300 border border-white/10 px-5 py-3 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all">
                            <Camera className="w-5 h-5" /> Chụp hình báo cáo
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6">
                    <h3 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Calendar className="w-5 h-5" /> CÔNG VIỆC NGÀY MAI LÀ GÌ?
                    </h3>
                    <textarea 
                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-medium outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        rows={3}
                        placeholder="Mô tả dự kiến công việc ngày mai..."
                    ></textarea>
                </div>
                
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-lg">
                    LƯU NHẬT KÍ NGÀY {format(new Date(), 'dd/MM')}
                </button>
            </div>
        </div>
      )}

      {activeProjectTab === 'CHI_PHI' && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
           <h2 className="text-2xl font-black text-white tracking-tight mb-8">Tổng Quan Chi Phí Dự Án</h2>
           {selectedProject && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                       <div className="flex justify-between text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">
                           <span>Ngân sách kế hoạch</span>
                       </div>
                       <div className="text-4xl font-black text-emerald-400 tracking-tighter mb-6 relative z-10">
                          {selectedProject.budget.toLocaleString('vi-VN')} đ
                       </div>
                       <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 relative z-10">
                           <div className="h-full bg-white w-2/3 rounded-full"></div>
                       </div>
                       <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors z-0" />
                  </div>
                  <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                       <div className="flex justify-between text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">
                           <span>Thực tế giải ngân</span>
                       </div>
                       <div className={`text-4xl font-black tracking-tighter mb-6 relative z-10 ${selectedProject.actualCost > selectedProject.budget && selectedProject.budget > 0 ? 'text-rose-500' : 'text-indigo-400'}`}>
                          {selectedProject.actualCost.toLocaleString('vi-VN')} đ
                       </div>
                       <div className="w-full bg-white/5 rounded-full h-3 flex overflow-hidden border border-white/5 relative z-10">
                           <div className={`h-full rounded-full ${selectedProject.actualCost > selectedProject.budget && selectedProject.budget > 0 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-indigo-500'}`} style={{width: `${Math.min((selectedProject.actualCost / (selectedProject.budget || 1)) * 100, 100)}%`}}></div>
                       </div>
                       {selectedProject.actualCost > selectedProject.budget && selectedProject.budget > 0 && (
                          <div className="mt-4 text-xs font-bold text-rose-500/80 uppercase tracking-wider relative z-10">
                              Vượt ngân sách {((selectedProject.actualCost - selectedProject.budget) / selectedProject.budget * 100).toFixed(0)}%
                          </div>
                       )}
                       <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors z-0" />
                  </div>
              </div>
           )}
        </div>
      )}

      {activeProjectTab === 'TIMELINE' && (
         <div className="animate-in fade-in duration-500 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl">
             {renderGantt(true)}
         </div>
      )}
    </div>
  );

  const renderDataUpload = () => (
     <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="flex items-center gap-6 mb-8">
          <button 
            onClick={() => setCurrentView('PROJECT_DETAIL')}
            className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all group shadow-xl"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Thiết lập Dữ Liệu</h1>
            <p className="text-slate-400 font-medium">Phân tích BOQ và bóc tách khối lượng</p>
          </div>
        </div>

        {!hasData ? (
             <div className="space-y-6">
                <div className="bg-[#1C182B] rounded-[24px] p-8 border border-white/5">
                   <h2 className="text-xl font-black text-white tracking-tight mb-2">Tải Lên Dữ Liệu Đầu Vào</h2>
                   <p className="text-slate-400 text-sm mb-6">
                     Hỗ trợ file Excel dự toán (.xlsx) hoặc bản vẽ (.pdf) để AI tự động bóc tách.
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                     <label 
                       onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                       onDragLeave={() => setIsDraggingExcel(false)}
                       onDrop={(e) => {
                         e.preventDefault();
                         setIsDraggingExcel(false);
                         if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                           handleUploadFile('EXCEL', e.dataTransfer.files[0]);
                         }
                       }}
                       className={`p-10 rounded-[20px] cursor-pointer bg-[#2E284D] border border-transparent hover:bg-[#39315D] transition-all group flex flex-col items-center justify-center gap-4 ${isDraggingExcel ? 'border-indigo-500 border-dashed border-2' : ''}`}
                     >
                       <FileSpreadsheet className={`w-10 h-10 text-emerald-400 transition-transform ${isDraggingExcel ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`} />
                       <span className="font-bold text-white text-md tracking-wide">Tải Excel BOQ</span>
                       <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                           handleUploadFile('EXCEL', e.target.files[0]);
                           e.target.value = ''; // Reset for re-upload
                         }
                       }} />
                     </label>
                     <label 
                       onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                       onDragLeave={() => setIsDraggingPdf(false)}
                       onDrop={(e) => {
                         e.preventDefault();
                         setIsDraggingPdf(false);
                         if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                           handleUploadFile('PDF', e.dataTransfer.files[0]);
                         }
                       }}
                       className={`p-10 rounded-[20px] cursor-pointer bg-[#232035] border border-transparent hover:bg-[#2A2640] transition-all group flex flex-col items-center justify-center gap-4 ${isDraggingPdf ? 'border-rose-500 border-dashed border-2' : ''}`}
                     >
                       <FileSearch className={`w-10 h-10 text-rose-500 transition-transform ${isDraggingPdf ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`} />
                       <div className="text-center">
                           <span className="font-bold text-white text-md tracking-wide block">AI Bóc Tách</span>
                           <span className="font-bold text-white text-md tracking-wide block">từ PDF</span>
                       </div>
                       <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                         if (e.target.files && e.target.files.length > 0) {
                           handleUploadFile('PDF', e.target.files[0]);
                           e.target.value = ''; // Reset for re-upload
                         }
                       }} />
                     </label>
                   </div>
                </div>
             </div>
        ) : (
             <div className="space-y-6">
               <div className="bg-[#1C182B] border border-white/5 p-6 rounded-[24px]">
                 <div className="flex justify-between items-center">
                     <div>
                         <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Dữ Liệu Đã Tải Lên</h2>
                         <p className="text-slate-400 text-sm">Hệ thống đã phân tích thành công.</p>
                     </div>
                     <button 
                       onClick={() => { setHasData(false); setTasks([]); }} 
                       className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors shadow-sm"
                     >
                       Tải lại file khác
                     </button>
                 </div>
               </div>
               
               <div className="bg-slate-50 rounded-[24px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 bg-slate-50 border-b border-slate-200">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Kiểm Tra Hạng Mục</h2>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">Chọn các hạng mục thi công cần đưa vào bảng tiến độ kế hoạch.</p>
                     
                     <button 
                        onClick={() => setCurrentView('PLANNING')}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mb-6 active:scale-95"
                     >
                        DI CHUYỂN ĐẾN LẬP KẾ HOẠCH <ChevronRight className="w-5 h-5" />
                     </button>
                     
                     <div className="bg-white border border-slate-200 rounded-full py-3 px-6 text-center font-bold text-slate-500 mb-6 shadow-sm mx-auto max-w-[250px]">
                        Đã chọn: <span className="text-indigo-600"> {selectedParsedItems.length} </span> mục
                     </div>

                     <div className="flex border-b border-slate-200">
                        <button 
                          onClick={() => setActiveDataTab('ALL')}
                          className={`flex-1 py-4 text-sm font-black transition-all flex items-center justify-center gap-2 border-b-2 ${activeDataTab === 'ALL' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                        >
                           <FileSpreadsheet className="w-4 h-4" /> Excel Gốc
                        </button>
                        <button 
                          onClick={() => setActiveDataTab('SELECTED')}
                          className={`flex-1 py-4 text-sm font-black transition-all flex items-center justify-center gap-2 border-b-2 ${activeDataTab === 'SELECTED' ? 'text-emerald-600 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                        >
                           <Sparkles className="w-4 h-4" /> Đã Chọn ({selectedParsedItems.length})
                        </button>
                     </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto p-6 space-y-3 bg-slate-50">
                     {parsedData
                       .filter(item => activeDataTab === 'ALL' || selectedParsedItems.includes(item.id))
                       .map((item, idx) => {
                         const isSelected = selectedParsedItems.includes(item.id);
                         return (
                           <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all group">
                              <div className="flex items-start gap-3 flex-1">
                                 <div className="font-bold text-slate-400 w-10 pt-0.5 text-sm">[{idx + 1}]</div>
                                 <div className="flex-1">
                                    <div className="font-bold text-slate-900 leading-snug mb-2 text-[15px]">{item.name}</div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                       <span>Khối lượng: {item.quantity}</span>
                                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                       <span>Đơn vị: {item.unit}</span>
                                       <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                         {item.price.toLocaleString('vi-VN')} đ
                                       </span>
                                    </div>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => {
                                   if (isSelected) {
                                     setSelectedParsedItems(prev => prev.filter(id => id !== item.id));
                                   } else {
                                     setSelectedParsedItems(prev => [...prev, item.id]);
                                   }
                                 }}
                                 className={`w-10 h-10 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                              >
                                 {isSelected ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              </button>
                           </div>
                         );
                     })}
                  </div>
               </div>
             </div>
        )}
     </div>
  );

  const renderPlanning = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('PROJECT_DETAIL')}
            className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lập Kế Hoạch</h1>
            <p className="text-slate-500 font-medium">Sắp xếp nhân sự, thời gian và thầu phụ cho các hạng mục</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
               onClick={() => addNewTask()}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
           >
               + CHÈN HẠNG MỤC
           </button>
           <button 
               onClick={() => setCurrentView('GANTT')}
               className="bg-white hover:bg-slate-50 text-indigo-600 font-black px-8 py-4 rounded-2xl border border-indigo-200 transition-all flex items-center gap-3 shadow-sm active:scale-95"
           >
               XEM TIẾN ĐỘ (GANTT) <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task, index) => (
          <div key={task.id} className="bg-white border border-slate-200 p-8 rounded-[32px] group hover:border-indigo-300 hover:shadow-md transition-all relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${task.approved ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-600 text-sm border border-slate-200">
                       {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-200">{task.description || 'Chưa phân loại'}</span>
                         {task.status === 'Trễ hạn' && <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-200 animate-pulse">TRỄ HẠN</span>}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{task.name}</h3>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                     <select 
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none hover:border-indigo-300 transition-all"
                        value={task.subcontractor || ''}
                        onChange={(e) => {
                           const newTasks = [...tasks];
                           newTasks[index] = { ...newTasks[index], subcontractor: e.target.value };
                           setTasks(newTasks);
                        }}
                     >
                        <option value="">-- Chọn Đội --</option>
                        {subcontractorsList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                     </select>
                     <div 
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${!task.subcontractor ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse' : 'bg-white border-slate-200 text-slate-400'}`}
                        title={!task.subcontractor ? "Cần chọn thầu phụ" : "Thông tin thầu phụ"}
                     >
                        <AlertTriangle className="w-4 h-4" />
                     </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                     <div className="flex items-center gap-3 text-slate-500">
                        <span className="font-medium">Thời gian:</span>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-indigo-500/50 transition-colors shadow-sm">
                           <Clock className="w-4 h-4 mr-2" />
                           <input 
                             type="number" 
                             className="w-12 bg-transparent text-slate-800 font-bold text-center outline-none"
                             value={task.start_date && task.end_date ? Math.max(1, differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1) : 1}
                             readOnly
                           />
                        </div>
                        <span className="font-medium">ngày</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-500">
                        <span className="font-medium">Nhân sự:</span>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-emerald-500/50 transition-colors shadow-sm">
                           <Users className="w-4 h-4 mr-2" />
                           <input 
                             type="number" 
                             className="w-10 bg-transparent text-slate-800 font-bold text-center outline-none"
                             value={task.personnel || 0}
                             onChange={(e) => {
                               const newTasks = [...tasks];
                               newTasks[index] = { ...newTasks[index], personnel: parseInt(e.target.value) || 0 };
                               setTasks(newTasks);
                             }}
                           />
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <button 
                  onClick={async () => {
                     const newApproval = !task.is_approved;
                     await supabase.from('tasks').update({ is_approved: newApproval }).eq('id', task.id);
                     fetchTasks();
                  }}
                  className={`w-full lg:w-32 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${task.is_approved ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 shadow-sm'}`}
              >
                  {task.is_approved ? 'Đã Duyệt' : 'Duyệt'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderGantt = (isEmbedded = false) => (
    <div className={`space-y-8 animate-in fade-in duration-500 ${isEmbedded ? '' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isEmbedded ? 'flex-row-reverse' : ''}`}>
        {!isEmbedded && (
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('PLANNING')}
              className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Sơ Đồ Tiến Độ (Gantt)</h1>
              <p className="text-slate-400 font-medium">Theo dõi thời gian thi công thực tế</p>
            </div>
          </div>
        )}

        <div className={`flex gap-4 ${isEmbedded ? 'w-full justify-end' : ''}`}>
          <button 
            onClick={exportToExcel}
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm border border-slate-200 active:scale-95 text-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Excel
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('gantt-chart-container');
              if (element) {
                // Change background color of pdf to white for clean printing
                html2canvas(element, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF('l', 'mm', 'a3');
                  const imgProps = pdf.getImageProperties(imgData);
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                  pdf.save(`Tien-do-kem-chu-ky.pdf`);
                });
              }
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm border border-slate-200 active:scale-95 text-sm"
          >
            <Printer className="w-5 h-5" /> In PDF
          </button>
          <button 
            onClick={() => setIsQuoteOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm border border-slate-200 active:scale-95 text-sm"
          >
             <DollarSign className="w-5 h-5" /> Yêu Cầu Báo Giá
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4 px-2">
        <div className="space-y-1 text-[12px] font-medium text-slate-700">
           <div className="flex gap-10">
              <div className="w-[150px]">Ngày bắt đầu dự án:</div>
              <div className="font-black cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2" onClick={() => setIsEditingProjInfo('startDate')}>
                 {isEditingProjInfo === 'startDate' ? (
                    <input autoFocus type="date" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} onBlur={() => setIsEditingProjInfo(null)} className="bg-blue-50 border border-blue-400 rounded px-1 outline-none text-[11px]" />
                 ) : format(parseISO(projectStartDate), 'dd/MM/yyyy')}
              </div>
              <div className="ml-20">TUẦN</div>
              <div className="font-black text-blue-600 ml-5 cursor-pointer hover:scale-110 transition-transform flex items-center gap-2" onClick={() => setIsEditingProjInfo('week')}>
                 {isEditingProjInfo === 'week' ? (
                    <input autoFocus type="number" value={currentWeek} onChange={e => setCurrentWeek(Number(e.target.value))} onBlur={() => setIsEditingProjInfo(null)} className="w-12 bg-blue-50 border border-blue-400 rounded px-1 outline-none text-[11px]" />
                 ) : currentWeek}
              </div>
           </div>
           <div className="flex gap-10">
              <div className="w-[150px]">Kiến trúc sư Chủ trì:</div>
              <div className="font-black opacity-80 cursor-pointer hover:opacity-100" onClick={() => setIsEditingProjInfo('arch')}>
                 {isEditingProjInfo === 'arch' ? (
                    <input autoFocus value={leadArchitect} onChange={e => setLeadArchitect(e.target.value)} onBlur={() => setIsEditingProjInfo(null)} className="bg-blue-50 border border-blue-400 rounded px-1 outline-none text-[11px]" />
                 ) : leadArchitect}
              </div>
           </div>
           <div className="flex gap-10">
              <div className="w-[150px]">Giám sát Thi công:</div>
              <div className="font-black opacity-80 cursor-pointer hover:opacity-100" onClick={() => setIsEditingProjInfo('super')}>
                 {isEditingProjInfo === 'super' ? (
                    <input autoFocus value={supervisor} onChange={e => setSupervisor(e.target.value)} onBlur={() => setIsEditingProjInfo(null)} className="bg-blue-50 border border-blue-400 rounded px-1 outline-none text-[11px]" />
                 ) : supervisor}
              </div>
           </div>
        </div>
      </div>

      <div id="gantt-chart-container" className="bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200">
        <div className="overflow-x-auto text-slate-800 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="min-w-[1250px]">
             {/* Gantt Header */}
             <div className={`grid ${!isClientView ? 'grid-cols-[40px_260px_120px_90px_90px_40px_40px_90px_1fr]' : 'grid-cols-[40px_260px_120px_90px_90px_40px_40px_1fr]'} bg-[#f1f5f9] border-b border-slate-300 text-[10px] font-bold text-slate-800 text-center items-stretch uppercase sticky top-0 z-40`}>
                <div className="flex items-center justify-center border-r border-slate-300 py-3 leading-tight px-1 col-span-2">STT MÔ TẢ</div>
                <div className="flex items-center justify-center border-r border-slate-300 py-3">GHI CHÚ & THẦU</div>
                <div className="flex items-center justify-center border-r border-slate-300 py-3 col-span-2">THỜI GIAN</div>
                <div className="flex items-center justify-center border-r border-slate-300 py-3 bg-[#e2e8d8]">NGÀY</div>
                <div className="flex items-center justify-center border-r border-slate-300 py-3 bg-[#e2e8d8] relative">
                   %
                   <button 
                      onClick={() => shiftProjectDate(-7)}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 bg-white shadow-xl border-2 border-blue-500 rounded-full p-1.5 text-blue-600 hover:scale-110 transition-all flex items-center justify-center"
                      title="Trượt về trước 1 tuần"
                   >
                      <ChevronLeft className="w-3 h-3" strokeWidth={3} />
                   </button>
                </div>
                {!isClientView && (
                  <div className="flex items-center justify-center border-r border-slate-300 py-3 bg-[#e2e8d8]">NGÂN SÁCH</div>
                )}
                <div className="flex flex-col relative">
                   <button 
                      onClick={() => shiftProjectDate(7)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white shadow-xl border-2 border-blue-500 rounded-full p-1.5 text-blue-600 hover:scale-110 transition-all flex items-center justify-center"
                      title="Trượt về sau 1 tuần"
                   >
                      <ChevronRight className="w-3 h-3" strokeWidth={3} />
                   </button>
                   {/* Tầng 1: Tuần */}
                   <div className="grid grid-cols-3 border-b border-slate-300 h-1/3">
                      {Array.from({length: 3}).map((_, i) => (
                         <div key={`week-${i}`} className={`border-r border-slate-400 flex items-center justify-center bg-white text-[10px] font-black uppercase ${i === 2 ? 'border-r-0' : ''}`}>
                            TUẦN {currentWeek + i}
                         </div>
                      ))}
                   </div>
                   {/* Tầng 2: Ngày bắt đầu tuần */}
                   <div className="grid grid-cols-3 border-b border-slate-300 h-1/3 bg-white/50">
                      {Array.from({length: 3}).map((_, i) => {
                         const startOfProject = parseISO(projectStartDate);
                         const viewStartDate = addDays(startOfProject, (currentWeek - 1) * 7);
                         const weekStart = addDays(viewStartDate, i * 7);
                         return (
                            <div key={`wdate-${i}`} className={`border-r border-slate-400 flex items-center justify-center text-[9px] py-0.5 ${i === 2 ? 'border-r-0' : ''}`}>
                               {format(weekStart, 'dd/MM/yyyy')}
                            </div>
                         );
                      })}
                   </div>
                   {/* Tầng 3: Day + Thứ */}
                   <div className="grid grid-cols-21 h-1/3 bg-[#f3f3f3]">
                      {Array.from({length: 21}).map((_, i) => {
                         const startOfProject = parseISO(projectStartDate);
                         const viewStartDate = addDays(startOfProject, (currentWeek - 1) * 7);
                         const currentDate = addDays(viewStartDate, i);
                         const dayNum = format(currentDate, 'd');
                         const dayName = i % 7 === 6 ? 'CN' : `T${(i % 7) + 2}`;
                         const isWeekEnd = i % 7 === 6;
                         return (
                            <div key={i} className={`flex flex-col items-center justify-center border-r ${isWeekEnd ? 'border-r-slate-400' : 'border-r-slate-300'} text-[8px] ${i % 7 === 6 ? 'text-red-600 bg-red-50' : 'text-slate-600'} ${i === 20 ? 'border-r-0' : ''}`}>
                               <span className="leading-none font-bold">{dayNum}</span>
                               <span className="leading-none">{dayName}</span>
                            </div>
                         );
                      })}
                   </div>
                </div>
             </div>
             
             {/* Gantt Rows grouped by Category */}
             <div className="bg-white">
                {Array.from(new Set(tasks.map(t => t.category))).map((cat, catIdx) => (
                   <div key={cat} className="group/cat">
                     <div className="grid grid-cols-[40px_1fr] bg-[#e5e5e5] border-b border-slate-300 text-[11px] font-bold text-slate-800 uppercase items-stretch group/header hover:bg-[#d5d5d5] transition-colors relative">
                        <div className="text-center font-black border-r border-slate-300 py-1.5 flex items-center justify-center min-h-[28px]">{catIdx + 1}</div>
                        <div className="px-4 py-1.5 flex items-center relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-1 opacity-0 group-hover/header:opacity-100 transition-all z-30">
                               <button 
                                  onClick={() => addNewTask(cat)} 
                                  className="bg-emerald-50 text-emerald-600 rounded border border-emerald-400 p-0.5 hover:bg-emerald-100 hover:scale-125 shadow-md flex items-center justify-center"
                                  title="Chèn công tác"
                               >
                                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                               </button>
                            </div>
                            <span>{cat}</span>
                        </div>
                     </div>
                     {tasks.filter(t => t.description === cat).map((task, taskIdx) => {
                         const maxId = 0;
                         const viewStartDate = addDays(parseISO(projectStartDate), (currentWeek - 1) * 7);
                         const startDay = task.start_date ? differenceInDays(parseISO(task.start_date), viewStartDate) + 1 : 1; 
                         const startDateFmt = task.start_date ? format(parseISO(task.start_date), 'dd/MM/yyyy') : '--/--/----';
                         const endDateFmt = task.end_date ? format(parseISO(task.end_date), 'dd/MM/yyyy') : '--/--/----';

                         const isEditingName = editingTaskId === task.id && editingField === 'name';
                         const isEditingSub = editingTaskId === task.id && editingField === 'subcontractor';
                         const isEditingStart = editingTaskId === task.id && editingField === 'startDate';
                         const isEditingEnd = editingTaskId === task.id && editingField === 'endDate';
                         const isEditingDays = editingTaskId === task.id && editingField === 'days';
                         const isEditingProgress = editingTaskId === task.id && editingField === 'progress';

                         // Calculate days
                         let calculatedDays = 1;
                         if (task.start_date && task.end_date) {
                             calculatedDays = Math.max(1, differenceInDays(parseISO(task.end_date), parseISO(task.start_date)) + 1);
                         }

                         return (
                            <div key={task.id} className={`grid ${!isClientView ? 'grid-cols-[40px_260px_120px_90px_90px_40px_40px_90px_1fr]' : 'grid-cols-[40px_260px_120px_90px_90px_40px_40px_1fr]'} items-stretch border-b border-slate-200 group hover:bg-yellow-50/50 transition-colors bg-white ${task.completion_pct === 100 ? 'opacity-50 grayscale' : ''}`}>
                               <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center border-r border-slate-200 bg-[#f9fafb]">
                                  <span>{taskIdx + 1}</span>
                               </div>
                               
                               <div className="border-r border-slate-200 pl-4 pr-2 py-1.5 flex items-center cursor-text relative" onClick={() => !isEditingName && handleEditStart(task.id, 'name', task.name)}>
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-30">
                                      <button onClick={(e) => { e.stopPropagation(); addNewTask(cat, task.id); }} className="bg-emerald-50 border border-emerald-400 text-emerald-600 rounded p-[3px] hover:bg-emerald-100 hover:scale-125 transition-transform shadow-md" title="Chèn công tác bên dưới">
                                          <Plus className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setGalleryTaskId(task.id); setIsGalleryOpen(true); }} className="bg-blue-50 border border-blue-400 text-blue-600 rounded p-[3px] hover:bg-blue-100 hover:scale-125 transition-transform shadow-md" title="Xem ảnh nghiệm thu">
                                          <Camera className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setDiaryTaskId(task.id); setIsDiaryOpen(true); }} className="bg-indigo-50 border border-indigo-400 text-indigo-600 rounded p-[3px] hover:bg-indigo-100 hover:scale-125 transition-transform shadow-md" title="Ghi nhật ký / Cập nhật tiến độ">
                                          <MessageSquare className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setQuoteSubcontractor(task.subcontractor || ''); setQuoteTaskName(task.name); setIsQuoteOpen(true); }} className="bg-orange-50 border border-orange-400 text-orange-600 rounded p-[3px] hover:bg-orange-100 hover:scale-125 transition-transform shadow-md" title="Tự động yêu cầu báo giá">
                                          <DollarSign className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                      <button onClick={async (e) => { 
                                          e.stopPropagation(); 
                                          if(confirm('Xóa công tác này?')){
                                              await supabase.from('tasks').delete().eq('id', task.id);
                                              fetchTasks();
                                          }
                                      }} className="bg-rose-50 border border-rose-400 text-rose-500 rounded p-[3px] hover:bg-rose-100 hover:scale-125 transition-transform shadow-md" title="Xóa công tác">
                                          <Trash2 className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                  </div>

                                  {isEditingName ? (
                                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-[11px] text-slate-800 outline-none relative z-10" />
                                  ) : (
                                     <div className="text-[11px] text-slate-700 truncate min-w-0 flex items-center gap-1">
                                        {task.name}
                                        {task.completion_pct && task.completion_pct > 0 && (
                                           <button onClick={(e) => { e.stopPropagation(); setGalleryTaskId(task.id); setIsGalleryOpen(true); }} className="text-blue-500 flex items-center shrink-0">
                                              <Camera className="w-3 h-3" />
                                           </button>
                                        )}
                                     </div>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 px-2 py-1.5 flex items-center justify-between cursor-text group/note relative" onClick={() => !isEditingSub && handleEditStart(task.id, 'subcontractor', task.subcontractor || '')}>
                                  {isEditingSub ? (
                                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-[11px] text-slate-800 outline-none" placeholder="Đọc hoặc nhập nội dung..." />
                                  ) : (
                                      <span className="text-[10px] text-slate-600 truncate">{task.subcontractor || <span className="italic text-slate-400 font-light pr-4">+ Ghi chú...</span>}</span>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); setDiaryTaskId(task.id); setIsDiaryOpen(true); }} className="opacity-0 group-hover/note:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity bg-white/80 p-0.5 rounded-md absolute right-1">
                                      <Mic className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                               
                               <div className="border-r border-slate-200 flex flex-col items-center justify-center cursor-text" onClick={() => !isEditingStart && handleEditStart(task.id, 'startDate', task.start_date || '')}>
                                  {isEditingStart ? (
                                     <input type="date" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="bg-blue-50 border border-blue-400 rounded px-1 text-[9px] text-slate-800 outline-none w-[95%]" />
                                  ) : (
                                     <span className="text-[9px] text-slate-700">{startDateFmt}</span>
                                  )}
                               </div>

                               <div className="border-r border-slate-200 flex flex-col items-center justify-center cursor-text" onClick={() => !isEditingEnd && handleEditStart(task.id, 'endDate', task.end_date || '')}>
                                  {isEditingEnd ? (
                                     <input type="date" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="bg-blue-50 border border-blue-400 rounded px-1 text-[9px] text-slate-800 outline-none w-[95%]" />
                                  ) : (
                                     <span className="text-[9px] text-slate-700">{endDateFmt}</span>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 flex items-center justify-center cursor-text bg-[#f9fafb]" onClick={() => !isEditingDays && handleEditStart(task.id, 'days', calculatedDays)}>
                                  {isEditingDays ? (
                                     <input type="number" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-10 text-center bg-blue-50 border-2 border-blue-400 rounded px-1 text-[11px] font-bold text-slate-800 outline-none" />
                                  ) : (
                                     <span className="text-[12px] font-black text-slate-900">{calculatedDays}</span>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 flex items-center justify-center cursor-text" onClick={() => !isEditingProgress && handleEditStart(task.id, 'progress', task.completion_pct || 0)}>
                                  {isEditingProgress ? (
                                     <input type="number" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-8 text-center bg-blue-50 border border-blue-400 rounded px-1 text-[11px] text-slate-800 outline-none" />
                                  ) : (
                                     <span className="text-[10px] text-slate-700">{task.completion_pct || 0}%</span>
                                  )}
                               </div>

                               {!isClientView && (
                                 <div className="border-r border-slate-200 flex items-center justify-right px-2">
                                     <span className="text-[10px] text-slate-700 font-medium">{(task.cost_estimate || 0).toLocaleString()}đ</span>
                                 </div>
                               )}

                               <div className="grid grid-cols-21 relative bg-white group-hover:bg-yellow-50/20">
                                  {Array.from({length: 21}).map((_, i) => {
                                      const isWeekEnd = i % 7 === 6;
                                      return (
                                          <div 
                                            key={`col-${i}`} 
                                            className={`border-r transition-colors ${isWeekEnd ? 'bg-red-50/40 hover:bg-slate-100' : 'hover:bg-slate-100'} ${isWeekEnd ? 'border-r-slate-400' : 'border-r-slate-200'} ${i === 20 ? 'border-r-0' : ''}`} 
                                          />
                                      );
                                  })}

                                  <div 
                                     className="absolute inset-0 flex items-center justify-center bg-[#4a86e8]/50 border-r border-white/30"
                                     style={{ 
                                       gridColumnStart: Math.max(1, startDay), 
                                       gridColumnEnd: Math.max(1, Math.min(22, startDay + calculatedDays)),
                                       zIndex: 10,
                                       display: (startDay + calculatedDays <= 1) || (startDay >= 22) ? 'none' : 'flex'
                                     }}
                                  >
                                      {/* Fill full cell style */}
                                  </div>
                               </div>
                            </div>
                         );
                     })}
                   </div>
                 ))}

                 {/* Signature Block for Print/PDF */}
                 <div className="bg-white px-12 pt-16 pb-32 flex justify-between items-start mt-8 border-t-2 border-slate-800">
                    <div className="text-center w-64">
                      <h3 className="font-extrabold text-[15px] mb-2 text-slate-900 uppercase tracking-widest">NGƯỜI LẬP BIỂU</h3>
                      <p className="italic text-sm text-slate-500 mb-24">(Ký, ghi rõ họ tên)</p>
                      <p className="font-bold text-[15px] text-slate-900">{settings.planner}</p>
                    </div>
                    <div className="text-center w-64">
                      <h3 className="font-extrabold text-[15px] mb-2 text-slate-900 uppercase tracking-widest">NGƯỜI KIỂM TRA</h3>
                      <p className="italic text-sm text-slate-500 mb-24">(Ký, ghi rõ họ tên)</p>
                      <p className="font-bold text-[15px] text-slate-900">{settings.checker}</p>
                    </div>
                    <div className="text-center w-64">
                      <h3 className="font-extrabold text-[15px] mb-2 text-slate-900 uppercase tracking-widest">PHÊ DUYỆT</h3>
                      <p className="italic text-sm text-slate-500 mb-24">(Ký, ghi rõ họ tên)</p>
                      <p className="font-bold text-[15px] text-slate-900">{settings.approver}</p>
                    </div>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Diary Modal */}
         {isDiaryOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDiaryOpen(false)}></div>
               <div className="relative bg-white rounded-3xl w-[90%] md:w-[600px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                           <MessageSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-slate-800">Nhật Ký Hiện Trường (Auto-Timeline)</h2>
                           <p className="text-xs font-medium text-slate-500">Báo cáo tiến độ thời gian thực cho hạng mục: <span className="text-indigo-600 font-bold">{tasks.find(t => t.id === diaryTaskId)?.name}</span></p>
                        </div>
                     </div>
                     <button onClick={() => setIsDiaryOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 bg-white rounded-xl shadow-sm hover:bg-rose-50">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                     <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nội dung báo cáo (Hỗ trợ giọng nói)</label>
                        <div className="relative">
                           <textarea 
                              value={diaryNote}
                              onChange={e => setDiaryNote(e.target.value)}
                              placeholder="Kỹ sư giám sát nhập hoặc đọc ghi chú thi công hôm nay..."
                              className="w-full h-32 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-700 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none pr-14"
                           ></textarea>
                           <button 
                              onClick={() => {
                                 if (!isListening) {
                                    setIsListening(true);
                                    setDiaryNote('');
                                    let dots = 0;
                                    const mockText = "Hôm nay tổ thi công đã hoàn thiện 50% khối lượng, vật tư xi măng thiếu 2 bao, cần bổ sung gấp vào sáng mai. Thời tiết tốt.";
                                    const interval = setInterval(() => {
                                       dots++;
                                       setDiaryNote("Đang phân tích giọng nói" + ".".repeat(dots % 4));
                                    }, 400);
                                    
                                    setTimeout(() => {
                                       clearInterval(interval);
                                       setIsListening(false);
                                       setDiaryNote(mockText);
                                    }, 3000);
                                 }
                              }}
                              className={`absolute bottom-4 right-4 p-3 rounded-xl shadow-md transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/20'}`}
                              title="Speech to Text"
                           >
                              <Mic className="w-5 h-5" /> 
                           </button>
                        </div>
                     </div>
                     
                     <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                           <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-blue-900 mb-1">AI Tự Động Phân Tích Timeline</h4>
                           <p className="text-xs text-blue-700 leading-relaxed">
                              Khi nhấn Gửi, AI sẽ đọc nội dung nhật ký để tự động: <br/>
                              1. Cập nhật <span className="font-bold border-b border-blue-300">Tiến độ (%)</span> dựa trên khối lượng báo cáo.<br/>
                              2. Phát cảnh báo rủi ro nếu có vật tư thiếu hoặc thời tiết xấu.<br/>
                              3. Gửi thông báo Push đến Khách hàng (Nếu bật chế độ Client View).
                           </p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                     <button onClick={() => setIsDiaryOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
                        Đóng
                     </button>
                     <button 
                        onClick={() => {
                           // Simulate AI Auto-Update Progress
                           if (diaryTaskId && diaryNote.includes('50%')) {
                              setTasks(tasks.map(t => t.id === diaryTaskId ? {...t, progress: 50} : t));
                           }
                           setDiaryNote('');
                           setIsDiaryOpen(false);
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                     >
                        LƯU & CẬP NHẬT TIẾN ĐỘ
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Photo Gallery Modal */}
         {isGalleryOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGalleryOpen(false)}></div>
               <div className="relative bg-white rounded-3xl w-[90%] md:w-[800px] max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                           <Camera className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tight">Ảnh Nghiệm Thu Hiện Trường</h2>
                           <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Hạng mục: <span className="text-blue-600">{tasks.find(t => t.id === galleryTaskId)?.name}</span></p>
                        </div>
                     </div>
                     <button onClick={() => setIsGalleryOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-rose-50">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto space-y-8 flex-1">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                         {[1, 2, 3].map((imgNum) => (
                             <div key={imgNum} className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100">
                                 {/* Mock Image Placeholder */}
                                 <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                     <Sparkles className="w-8 h-8 text-white/50" />
                                 </div>
                                 <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex flex-col justify-end p-4">
                                     <p className="text-white font-bold text-sm translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">Góc thi công {imgNum}</p>
                                     <p className="text-slate-300 text-[10px] translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">{format(new Date(), 'dd/mm/yyyy HH:mm')}</p>
                                 </div>
                             </div>
                         ))}
                         
                         {/* Upload New Photo Card */}
                         <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all aspect-square gap-3">
                             <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <Plus className="w-6 h-6" />
                             </div>
                             <span className="font-bold text-sm">Thêm Ảnh Mới</span>
                         </div>
                     </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                     <button onClick={() => setIsGalleryOpen(false)} className="px-6 py-4 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
                        Đóng Quy Trình
                     </button>
                     <button 
                        onClick={() => {
                           // Mock sending to marketing
                           setIsGalleryOpen(false);
                           alert("Đã tự động tag [Dự án + Hạng mục] và gửi thẳng vào kho lưu trữ nội dung của team Marketing!");
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                     >
                        <Sparkles className="w-5 h-5" /> Push Auto-Feed to Marketing
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl">
           <DollarSign className="w-8 h-8" />
        </div>
        <div>
           <h2 className="text-3xl font-black text-white tracking-tight">Tổng Hợp Chi Phí</h2>
           <p className="text-slate-400 font-medium">Kiểm soát ngân sách và dòng tiền theo thời gian thực</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map(p => (
           <div key={p.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8">
                <div>
                   <h3 className="font-black text-xl text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                     <Building2 className="w-6 h-6 text-emerald-500" /> {p.name}
                   </h3>
                   <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Mã dự án: PRJ-00{p.id}</p>
                </div>
                {p.actualCost > p.budget && p.budget > 0 && (
                  <div className="bg-rose-500/10 text-rose-500 p-2 rounded-xl border border-rose-500/20 animate-bounce">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                  <div>
                     <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                         <span>Ngân sách kế hoạch</span>
                         <span className="text-white">{p.budget.toLocaleString('vi-VN')} đ</span>
                     </div>
                     <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                         <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{width: '100%'}}></div>
                     </div>
                  </div>
                  
                  <div>
                     <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                         <span>Thực tế giải ngân</span>
                         <span className={`font-black ${p.actualCost > p.budget && p.budget > 0 ? 'text-rose-500' : 'text-indigo-400'}`}>
                             {p.actualCost.toLocaleString('vi-VN')} đ
                         </span>
                     </div>
                     <div className="w-full bg-white/5 rounded-full h-3 flex overflow-hidden border border-white/5 relative">
                         {/* Break-Even Marker */}
                         <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20" style={{left: '80%'}} title="Điểm hòa vốn (80%)"></div>
                         <div className={`h-full rounded-full relative z-10 transition-all ${p.actualCost > p.budget && p.budget > 0 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-indigo-500'}`} style={{width: `${Math.min((p.actualCost / (p.budget || 1)) * 100, 100)}%`}}></div>
                     </div>
                     {p.actualCost > p.budget && p.budget > 0 && (
                        <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm group-hover:blur-none transition-all duration-700 pointer-events-none">
                              <AlertTriangle className="w-32 h-32" />
                           </div>
                           <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                               <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex flex-col items-center justify-center border border-rose-500/30 shrink-0">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">VƯỢT</span>
                                   <span className="text-xl font-black">{((p.actualCost - p.budget) / p.budget * 100).toFixed(0)}%</span>
                               </div>
                               <div>
                                   <h4 className="font-black text-rose-400 mb-2 uppercase tracking-tight">Cảnh báo rủi ro bồi thường / lỗ</h4>
                                   <p className="text-sm font-medium leading-relaxed text-rose-200">
                                       Dự án đã vượt ngân sách. Hệ thống phân tích AI cho thấy nguyên nhân chủ yếu do <strong className="text-white">vật tư tăng giá (60%)</strong> và <strong className="text-white">tiến độ thi công kéo dài (40%)</strong>. Vui lòng rà soát hoặc đề xuất phụ lục phát sinh.
                                   </p>
                                   <div className="flex gap-2 mt-4">
                                       <button className="bg-rose-500 text-white text-xs font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors">Yêu cầu Phụ Lục</button>
                                       <button className="bg-white/5 text-rose-400 border border-rose-500/30 text-xs font-black uppercase px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">Chi tiết Phân Tích</button>
                                   </div>
                               </div>
                           </div>
                        </div>
                     )}
                     <div className="flex justify-between items-center mt-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                         <span>0%</span>
                         <span className="text-amber-400/80 translate-x-[20px] pb-1 border-b border-amber-400/30">Điểm hòa vốn (80%)</span>
                         <span>100%</span>
                     </div>
                  </div>
              </div>
           </div>
        ))}
      </div>

      <div className="flex gap-4">
         <button 
           onClick={() => setIsRiskModalOpen(true)}
           className="bg-white/5 hover:bg-rose-500/20 text-rose-400 px-8 py-4 rounded-2xl border border-white/10 font-black text-sm transition-all flex items-center gap-2 shadow-sm"
         >
             <AlertTriangle className="w-5 h-5" /> GIẢ LẬP RỦI RO LỖ BẰNG AI
         </button>
         <button onClick={() => setIsTransactionOpen(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
             TẠO PHIẾU CHI MỚI
         </button>
      </div>
    </div>
  );

  const renderPersonnel = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl">
           <Users className="w-8 h-8" />
        </div>
        <div>
           <h2 className="text-3xl font-black text-white tracking-tight">Nhân Sự Công Trường</h2>
           <p className="text-slate-400 font-medium">Quản lý đội ngũ giám sát và thầu phụ tại dự án</p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
               <UserCheck className="w-6 h-6 text-indigo-500" /> DANH SÁCH ĐANG TRỰC
            </h3>
            {!isClientView && (
               <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                  + THÊM N/S & CHECK GPS
               </button>
            )}
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5">
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Họ tên & Liên hệ</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vai trò</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dự án hiện tại</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Định vị & Trạng thái</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.03]">
                  {personnel.map(p => (
                     <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-6">
                           <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">{p.name}</div>
                           {!isClientView && <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-medium"><Phone className="w-3 h-3" /> {p.phone}</div>}
                        </td>
                        <td className="py-6">
                           <div className="flex flex-col items-start gap-1.5">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${p.type === 'NỘI BỘ' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                  {p.type}
                              </span>
                              <span className="text-xs font-bold text-slate-300">
                                  {p.position}
                              </span>
                           </div>
                        </td>
                        <td className="py-6">
                           <div className="text-sm font-bold text-white/80 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-600" /> Biệt thự Anh Hùng
                           </div>
                        </td>
                        <td className="py-6 text-right">
                           <div className="flex justify-end gap-3 items-center">
                               {p.status === 'Đang làm việc' && (
                                  <div 
                                     onClick={() => {
                                        if(gpsCheckingId) return;
                                        setGpsCheckingId(p.id);
                                        setTimeout(() => {
                                            alert(`Đã xác thực vị trí GPS của ${p.name} hợp lệ tại tọa độ: 10.762622, 106.660172 (Công trường Biệt thự Anh Hùng)`);
                                            setGpsCheckingId(null);
                                        }, 2000);
                                     }}
                                     className={`cursor-pointer text-[10px] px-2 py-1 rounded flex items-center gap-1 border transition-all ${gpsCheckingId === p.id ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'text-emerald-500/70 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'}`} 
                                     title={gpsCheckingId === p.id ? 'Đang truy xuất vị trí GPS...' : 'Bấm để kiểm tra lại định vị GPS thực tế'}
                                  >
                                      {gpsCheckingId === p.id ? (
                                          <><div className="w-2 h-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> AI Checking...</>
                                      ) : (
                                          <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 border border-emerald-300"></div> GPS Đã Check</>
                                      )}
                                  </div>
                               )}
                               <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${p.status === 'Đang làm việc' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-slate-400 bg-white/5 border-white/10'}`}>
                                  {p.status === 'Đang làm việc' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>}
                                  {p.status}
                               </span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
             </table>
          </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 shadow-xl">
           <Settings className="w-8 h-8" />
        </div>
        <div>
           <h2 className="text-3xl font-black text-white tracking-tight">Cấu Hình & Thông Tin</h2>
           <p className="text-slate-400 font-medium">Quản lý thông tin doanh nghiệp và thầu phụ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
               <h3 className="text-xl font-black text-white tracking-tight mb-8 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-indigo-500" /> THÔNG TIN DOANH NGHIỆP
               </h3>
               
               <div className="space-y-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tên đơn vị thi công</label>
                     <input type="text" defaultValue={settings.companyName} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Địa chỉ trụ sở</label>
                     <input type="text" defaultValue={settings.address} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
               </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
               <h3 className="text-xl font-black text-white tracking-tight mb-8">PHÂN QUYỀN PHÊ DUYỆT</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Người lập kế hoạch</label>
                     <input type="text" defaultValue={settings.planner} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Người kiểm tra</label>
                     <input type="text" defaultValue={settings.checker} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cấp phê duyệt cuối</label>
                     <input type="text" defaultValue={settings.approver} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[32px] shadow-2xl shadow-indigo-600/20 text-white">
               <h4 className="font-black text-lg mb-2">HỆ THỐNG ĐÃ SẴN SÀNG</h4>
               <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">Mọi thay đổi sẽ được đồng bộ ngay lập tức tới tất cả các thiết bị trong mạng lưới công trường.</p>
               <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-50 transition-all active:scale-95 uppercase text-xs tracking-widest">
                  Lưu thiết lập
               </button>
            </div>
      </div>
      </div>
    </div>
  );

  const renderQuoteModal = () => (
    isQuoteOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsQuoteOpen(false)}></div>
        <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
           {/* Modal Header */}
           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
                 </div>
                 <div>
                    <h3 className="font-black text-white text-xl tracking-tight uppercase">Phân tích báo giá AI</h3>
                    <p className="text-xs text-slate-400 font-medium">Bóc tách dữ liệu từ file Word/Excel/PDF của thầu phụ</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsQuoteOpen(false)}
                className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
           
           <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Chọn thầu phụ</label>
                    <select 
                      value={quoteSubcontractor}
                      onChange={(e) => setQuoteSubcontractor(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                       <option value="">Chọn...</option>
                       {subcontractorsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Giọng văn phản hồi</label>
                    <select 
                      value={quoteTone}
                      onChange={(e) => setQuoteTone(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                       <option value="PROFESSIONAL">Chuyên nghiệp</option>
                       <option value="FRIENDLY">Thân thiện</option>
                       <option value="STRICT">Cứng rắn (Ép giá)</option>
                    </select>
                 </div>
              </div>

              <div className="border-2 border-dashed border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center group hover:border-emerald-500/50 transition-all bg-white/[0.02] relative overflow-hidden">
                 {quoteTaskName && (
                    <div className="absolute top-0 left-0 w-full bg-emerald-500/10 border-b border-emerald-500/10 p-3 text-emerald-400 text-xs text-center font-bold tracking-widest uppercase">
                       Tạo báo giá cho: {quoteTaskName}
                    </div>
                 )}
                 <div className={`w-full max-w-sm mt-8 ${quoteTaskName ? '' : 'hidden'}`}>
                    <textarea 
                        readOnly 
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-slate-300 text-sm h-32 outline-none mb-6 resize-none custom-scrollbar"
                        value={`Gửi anh/chị${quoteSubcontractor ? ' ' + quoteSubcontractor : ''},\n\nNhờ anh/chị báo giá giúp em hạng mục "${quoteTaskName}" với khối lượng đính kèm.\nPhản hồi giúp em trong thời gian sớm nhất nhé.\n\nCảm ơn anh/chị.`}
                    />
                 </div>
                 
                 <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-emerald-500" />
                 </div>
                 <p className="text-white font-black text-lg mb-1">Tải lên file khối lượng (*.xlsx, *.pdf)</p>
                 <p className="text-slate-500 text-xs font-medium mb-6">AI sẽ tự động đọc bảng khối lượng này và soạn tin nhắn WhatsApp/Zalo mẫu cho thầu phụ.</p>
                 <div className="flex gap-4">
                     <button 
                       onClick={() => handleUploadQuote()}
                       className="bg-slate-700 hover:bg-slate-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[11px] tracking-widest"
                     >
                        Tải Lên Báo Giá Thầu (OCR)
                     </button>
                     <button 
                       onClick={() => {
                           setIsQuoteOpen(false);
                           setQuoteTaskName('');
                           alert('Đang mở màn hình chia sẻ tin nhắn Zalo kèm bảng khối lượng Import ban đầu...');
                       }}
                       className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 uppercase text-[11px] tracking-widest"
                     >
                        <MessageSquare className="w-4 h-4" /> Gửi Tin Nhắn Data Gốc
                     </button>
                 </div>
              </div>
              </div>
           </div>
        </div>
      )
  );

  const renderTransactionModal = () => (
      isTransactionOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-auto">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTransactionOpen(false)}></div>
              <div className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tạo Phiếu Chi AI</h2>
                          <p className="text-slate-500 font-medium text-sm mt-1">Hệ thống hỗ trợ quét hóa đơn nhận diện chữ</p>
                      </div>
                      <button onClick={() => setIsTransactionOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="p-8 space-y-6">
                      <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group relative overflow-hidden">
                          {!isOcrScanning ? (
                              <>
                                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                                      <Camera className="w-6 h-6" />
                                  </div>
                                  <p className="font-bold text-indigo-900 text-center">Chụp / Tải lên Hóa Đơn</p>
                                  <p className="text-xs text-indigo-500 mt-1 font-medium">AI OCR sẽ tự động điền các thông tin bên dưới</p>
                                  <div 
                                     className="absolute inset-0 z-10"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         setIsOcrScanning(true);
                                         setFormTransaction({ supplier: '', amount: '', date: '', reason: '' });
                                         setTimeout(() => {
                                             setIsOcrScanning(false);
                                             setFormTransaction({ 
                                                 supplier: 'Công ty Cổ phần Bê tông Vinaconex', 
                                                 amount: '45,000,000', 
                                                 date: format(new Date(), 'yyyy-MM-dd'), 
                                                 reason: 'Thanh toán đợt 2 tiền cọc bê tông móng.' 
                                             });
                                         }, 2500);
                                     }}
                                  ></div>
                              </>
                          ) : (
                              <div className="flex flex-col items-center justify-center w-full py-4 relative z-20">
                                  <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden mb-4 relative">
                                      <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-1/3 animate-[slideRight_1s_ease-in-out_infinite_alternate]"></div>
                                  </div>
                                  <p className="text-sm font-black text-indigo-700 uppercase tracking-widest animate-pulse flex items-center gap-2">
                                      <Sparkles className="w-4 h-4" /> ĐANG PHÂN TÍCH OCR...
                                  </p>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Đơn vị thụ hưởng / NCC</label>
                              <input type="text" value={formTransaction.supplier} onChange={e => setFormTransaction({...formTransaction, supplier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400" placeholder="VD: Vật liệu xây dựng ABC..." />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Số tiền (VNĐ)</label>
                                  <input type="text" value={formTransaction.amount} onChange={e => setFormTransaction({...formTransaction, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-600 outline-none focus:border-indigo-400" placeholder="0" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ngày chi</label>
                                  <input type="date" value={formTransaction.date} onChange={e => setFormTransaction({...formTransaction, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Lý do chi</label>
                              <textarea value={formTransaction.reason} onChange={e => setFormTransaction({...formTransaction, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 h-24 resize-none" placeholder="Chi tiết..."></textarea>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                      <button onClick={() => setIsTransactionOpen(false)} className="px-6 py-4 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all">
                          Hủy
                      </button>
                      <button 
                          onClick={() => {
                              setIsTransactionOpen(false);
                              alert("Đã tạo đề xuất chi thành công!");
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                          LƯU PHIẾU CHI
                      </button>
                  </div>
              </div>
          </div>
      )
  );

  const renderRiskModal = () => {
     if (!isRiskModalOpen || !selectedProject) return null;
     
     const currentBudget = selectedProject.budget;
     const currentCost = selectedProject.actualCost;
     const simulatedCost = currentCost + (currentCost * (riskFactor / 100));
     const expectedProfit = Math.max(0, currentBudget - simulatedCost);
     const simulatedLoss = Math.max(0, simulatedCost - currentBudget);
     
     const total = simulatedCost + expectedProfit;
     const costPct = (simulatedCost / (total || 1)) * 100;
     
     return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsRiskModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                         <AlertTriangle className="w-7 h-7 text-rose-500" />
                      </div>
                      <div>
                         <h3 className="font-black text-white text-xl tracking-tight uppercase">AI Giả Lập Rủi Ro: {selectedProject.name}</h3>
                         <p className="text-xs text-slate-400 font-medium">Phân tích khả năng sinh lời dự kiến khi có biến đổi về giá vật tư</p>
                      </div>
                   </div>
                   <button onClick={() => setIsRiskModalOpen(false)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-8 space-y-8">
                   <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-6">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kịch bản: Giá biến động</label>
                         <span className="text-3xl font-black text-rose-400">+{riskFactor}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="0" 
                         max="60" 
                         step="5"
                         value={riskFactor} 
                         onChange={(e) => setRiskFactor(Number(e.target.value))}
                         className="w-full appearance-none bg-slate-800 h-2 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer transition-all"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-bold">
                         <span>Bình thường (0%)</span>
                         <span>Khủng hoảng (60%)</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="flex justify-center">
                         <div 
                             className="w-48 h-48 rounded-full relative shadow-[0_0_50px_rgba(244,63,94,0.15)] transition-all duration-500 border-4 border-slate-800"
                             style={{
                                 background: `conic-gradient(#6366f1 0% ${costPct}%, ${expectedProfit > 0 ? '#10b981' : '#f43f5e'} ${costPct}% 100%)`
                             }}
                         >
                            <div className="absolute inset-4 bg-slate-900 rounded-full flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                               <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                                  {expectedProfit > 0 ? 'LỢI NHUẬN' : 'LỖ DỰ KIẾN'}
                               </span>
                               <span className={`text-xl font-black ${expectedProfit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                  {expectedProfit > 0 ? expectedProfit.toLocaleString('vi-VN') : simulatedLoss.toLocaleString('vi-VN')} đ
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng chi (Simulated)</span>
                            </div>
                            <span className="font-black text-white text-lg">{simulatedCost.toLocaleString('vi-VN')} đ</span>
                         </div>
                         <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                               <div className={`w-3 h-3 rounded-full ${expectedProfit > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                               <span className={`text-xs font-bold uppercase tracking-widest ${expectedProfit > 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>{expectedProfit > 0 ? 'Lãi còn lại' : 'Lỗ dự báo'}</span>
                            </div>
                            <span className={`font-black text-lg ${expectedProfit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                               {expectedProfit > 0 ? expectedProfit.toLocaleString('vi-VN') : simulatedLoss.toLocaleString('vi-VN')} đ
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
     );
  };

  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-12 pb-24 overflow-y-auto z-10">
        {isUploading && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(79,70,229,0.3)]"></div>
            <p className="text-white font-bold text-xl px-8 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl text-center">
              {uploadType === 'PDF' ? '🤖 Đang dùng AI bóc tách khối lượng từ PDF...' : '🤖 Đang phân tích dữ liệu Excel BOQ...'}
            </p>
          </div>
        )}

        {isQuoteUploading && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]"></div>
            <p className="text-white font-bold text-xl px-8 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl text-center">
              🤖 Đang dùng AI đọc file báo giá của thầu phụ...
            </p>
          </div>
        )}
        
        {/* Dynamic Content Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'DỰ ÁN' && (
            <>
              {currentView === 'HOME' && renderHome()}
              {currentView === 'CREATE_PROJECT' && renderCreateProject()}
              {currentView === 'PROJECT_DETAIL' && renderProjectDetail()}
              {currentView === 'DATA_UPLOAD' && renderDataUpload()}
              {currentView === 'PLANNING' && renderPlanning()}
              {currentView === 'GANTT' && renderGantt()}
            </>
          )}
          
          {activeTab === 'THU CHI' && !isClientView && renderFinancial()}
          {activeTab === 'NHÂN SỰ' && renderPersonnel()}
          {activeTab === 'CÀI ĐẶT' && !isClientView && renderSettings()}
          {renderQuoteModal()}
          {renderTransactionModal()}
          {renderRiskModal()}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 z-[100] flex justify-around items-center max-w-lg mx-auto mb-6 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-x border-b">
        {[
          { id: 'DỰ ÁN', icon: Folder, label: 'DỰ ÁN' },
          ...(!isClientView ? [{ id: 'THU CHI', icon: DollarSign, label: 'THU CHI' }] : []),
          { id: 'NHÂN SỰ', icon: Users, label: 'NHÂN SỰ' },
          ...(!isClientView ? [{ id: 'CÀI ĐẶT', icon: Settings, label: 'CÀI ĐẶT' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabState);
              if (tab.id === 'DỰ ÁN') setCurrentView('HOME');
            }}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
              activeTab === tab.id 
              ? 'text-indigo-400 scale-110' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/20' : ''}`}>
              <tab.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reminders Trigger - Floating Button */}
      <button 
        onClick={() => setCurrentView('REMINDERS')}
        className="fixed top-6 right-6 z-50 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-white/10 transition-all active:scale-95 group"
      >
        <div className="relative">
          <Bell className="w-6 h-6 text-indigo-400 group-hover:rotate-12 transition-transform" />
          {tasks.some(t => t.status === 'Trễ hạn') && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
          )}
        </div>
      </button>

      {/* Modals & Overlays */}
      {currentView === 'REMINDERS' && (
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-4">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setCurrentView('HOME')}></div>
           <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                        <Bell className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                         <h3 className="font-bold text-white text-lg">NHẮC VIỆC HÔM NAY</h3>
                         <p className="text-xs text-slate-400">Ngày {format(new Date(), 'dd/MM/yyyy')}</p>
                      </div>
                  </div>
                  <button onClick={() => setCurrentView('HOME')} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
               </div>
               
               <div className="flex px-4 py-2 border-b border-white/5 gap-2">
                  <button className="flex-1 py-3 font-bold text-sm text-white bg-indigo-500/10 border border-indigo-500/20 rounded-xl">Thầu Phụ (1)</button>
                  <button className="flex-1 py-3 font-bold text-sm text-slate-400 hover:text-slate-200 rounded-xl">Nhân Sự (0)</button>
               </div>
               
               <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 font-bold rounded-2xl flex items-center justify-center border border-indigo-600/30">T</div>
                         <div>
                            <div className="font-bold text-white">Anh Tuấn</div>
                            <div className="text-xs text-slate-400">0901234567</div>
                         </div>
                      </div>
                      <div className="bg-slate-950/50 rounded-xl p-4 border-l-4 border-indigo-500 mb-5 text-sm">
                         <div className="text-xs font-black text-indigo-400 mb-1 tracking-wider uppercase">BIỆT THỰ ANH HÙNG</div>
                         <div className="text-slate-200 font-medium">Công tác thiết kế và chuẩn bị hồ sơ</div>
                      </div>
                      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                         <MessageSquare className="w-5 h-5" /> GỬI ZALO
                      </button>
                  </div>
                  
                  {tasks.some(t => t.status === 'Trễ hạn') && (
                     <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-5">
                           <div className="w-12 h-12 bg-rose-500/10 text-rose-500 font-bold rounded-2xl flex items-center justify-center border border-rose-500/20 animate-pulse"><Bell className="w-6 h-6"/></div>
                           <div>
                              <div className="font-bold text-rose-500">Báo Động Trễ Hạn</div>
                              <div className="text-xs text-slate-400">Có {tasks.filter(t => t.status === 'Trễ hạn').length} hạng mục đang trễ</div>
                           </div>
                        </div>
                        <button 
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                          onClick={() => {
                             setActiveTab('DỰ ÁN');
                             setCurrentView('GANTT');
                          }}
                        >
                           KIỂM TRA GANTT NGAY
                        </button>
                     </div>
                  )}
               </div>
           </div>
        </div>
      )}

      {renderQuoteModal()}
      
      {/* Hidden PDF Template remains the same but inside z-0 */}
      <div id="gantt-export-template" className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
          {/* ... exactly same template content ... */}
      </div>
    </div>
  );
};

export default Construction;
