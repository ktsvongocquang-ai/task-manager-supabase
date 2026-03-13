import { useState, useEffect } from 'react';
import { Plus, Bell, Camera, Upload, Download, Folder, Users, ChevronLeft, Calendar, DollarSign, FileSpreadsheet, X, MessageSquare, Clock, FileSearch, ChevronRight, Settings, Phone, Printer, Building2, UserCheck, AlertTriangle, Minus, Sparkles, Trash2 } from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as xlsx from 'xlsx';
import { parseConstructionExcel } from '../../lib/gemini';

// -------------------------------------------------------------
// TYPES & MOCK DATA INITIALIZATION
// -------------------------------------------------------------
type ViewState = 'HOME' | 'CREATE_PROJECT' | 'PROJECT_DETAIL' | 'DATA_CHECK' | 'PLANNING' | 'GANTT' | 'REMINDERS';
type TabState = 'DỰ ÁN' | 'THU CHI' | 'NHÂN SỰ' | 'CÀI ĐẶT';

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
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
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

const initialProjects: Project[] = [
  { id: '1', name: 'Nhà cô Lan', date: '06/05/2024', status: 'ĐANG CHẠY', budget: 150000000, actualCost: 45000000, startDate: '2024-05-06', hasInputData: true },
  { id: '2', name: 'Biệt thự Anh Hùng', date: '15/05/2024', status: 'MỚI', budget: 0, actualCost: 0, startDate: '2024-05-15', hasInputData: false }
];

const mockParsedData = [
  { id: 'b1', name: 'Ốp lam gỗ nhựa mặt tiền', quantity: 12, unit: 'm²', price: 1000000 },
  { id: 'b2', name: 'Sơn lại lô đề + khung cửa kính mặt tiền', quantity: 1, unit: 'gói', price: 2000000 },
  { id: 'b3', name: 'Ốp lam nhôm đứng mặt tiền', quantity: 1, unit: 'gói', price: 3000000 },
  { id: 'b4', name: 'Ốp alu tạo hình mặt tiền', quantity: 1, unit: 'gói', price: 12000000 },
];

const initialTasks: Task[] = [
  { id: 't1', name: 'Công tác thiết kế và chuẩn bị hồ sơ', category: 'KHÁC', subcontractor: '', days: 5, personnel: 2, budget: 15000000, approved: true, startDate: '2024-05-06', endDate: '2024-05-10', status: 'Hoàn thành', progress: 0 },
  { id: 't2', name: 'Tháo dỡ - Vận chuyển khỏi căn hộ', category: 'THI CÔNG', subcontractor: 'Hùng (Đào móng)', days: 2, personnel: 4, budget: 5000000, approved: true, startDate: '2024-05-11', endDate: '2024-05-12', status: 'Hoàn thành', progress: 0 },
  { id: 't3', name: 'Thi công hệ thống điện và chiếu sáng', category: 'MEP', subcontractor: 'Công ty Điện Beta (MEP)', days: 10, personnel: 4, budget: 45000000, approved: false, startDate: '2024-05-13', endDate: '2024-05-22', status: 'Đang thực hiện', progress: 0 },
  { id: 't4', name: 'Thi công trang trí mặt tiền', category: 'HOÀN THIỆN', subcontractor: 'Đội Sơn Delta (Hoàn thiện)', days: 12, personnel: 6, budget: 85000000, approved: true, startDate: '2024-05-23', endDate: '2024-06-03', status: 'Chưa bắt đầu', progress: 0 }
];

const initialPersonnel = [
  { id: 'p1', name: 'Trần Sơn Hải', position: 'Giám đốc', phone: '0901234567', status: 'Đang làm việc' },
  { id: 'p2', name: 'Jacky Lee', position: 'Giám sát', phone: '0987654321', status: 'Đang làm việc' }
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
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [activeTab, setActiveTab] = useState<TabState>('DỰ ÁN');
  
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('1');
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [personnel] = useState(initialPersonnel);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDate, setNewProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProjectBudget, setNewProjectBudget] = useState('');
  
  // App states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'EXCEL' | 'PDF' | null>(null);
  const [hasData, setHasData] = useState(true); // Default true for demo project 1
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

  const [activeProjectTab, setActiveProjectTab] = useState<'NHAT_KI' | 'TIMELINE' | 'CHI_PHI'>('TIMELINE');

  // Highlighted cells state: taskId-dayIndex
  const [highlightedCells, setHighlightedCells] = useState<Record<string, boolean>>({});

  const toggleCellHighlight = (taskId: string, dayIndex: number) => {
    const key = `${taskId}-${dayIndex}`;
    setHighlightedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const shiftProjectDate = (days: number) => {
    const newDate = addDays(parseISO(projectStartDate), days);
    setProjectStartDate(format(newDate, 'yyyy-MM-dd'));
  };
  
  // Quote Modal states
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteSubcontractor, setQuoteSubcontractor] = useState('');
  const [quoteTone, setQuoteTone] = useState('Thường');
  const [isQuoteUploading, setIsQuoteUploading] = useState(false);

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
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [currentView, isQuoteOpen]);

  const addNewTask = (category: string = 'THI CÔNG', insertAfterId?: string) => {
    let startDateStr = new Date().toISOString();
    let insertIndex = tasks.length;
    
    if (insertAfterId) {
        const targetIdx = tasks.findIndex(t => t.id === insertAfterId);
        if (targetIdx !== -1) {
            insertIndex = targetIdx + 1;
            startDateStr = tasks[targetIdx].endDate || tasks[targetIdx].startDate || new Date().toISOString();
        }
    } else {
        const lastTask = tasks[tasks.length - 1];
        startDateStr = lastTask ? (lastTask.endDate || lastTask.startDate || new Date().toISOString()) : new Date().toISOString();
    }
    const startDate = addDays(parseISO(startDateStr), 1);
    
    const newTask: Task = {
      id: `t_new_${Date.now()}`,
      name: 'Hạng mục thi công mới',
      category: category,
      subcontractor: '',
      days: 2,
      personnel: 2,
      budget: 0,
      approved: false,
      progress: 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: addDays(startDate, 1).toISOString().split('T')[0],
      status: 'Chưa bắt đầu'
    };
    
    const newTasks = [...tasks];
    newTasks.splice(insertIndex, 0, newTask);
    setTasks(newTasks);
  };

  const handleEditStart = (taskId: string, field: string, initialValue: string | number) => {
    setEditingTaskId(taskId);
    setEditingField(field);
    setEditValue(initialValue.toString());
  };

  const handleEditSave = () => {
    if (editingTaskId && editingField) {
      setTasks(tasks.map(t => {
        if (t.id === editingTaskId) {
           let updatedTask = { ...t };
           const newValue = editingField === 'days' || editingField === 'progress' ? Number(editValue) : editValue;
           updatedTask[editingField as keyof Task] = newValue as never;

           // Auto adjust dates
           if (editingField === 'days') {
               if (updatedTask.startDate) {
                   updatedTask.endDate = addDays(parseISO(updatedTask.startDate), Math.max(0, updatedTask.days - 1)).toISOString().split('T')[0];
               }
           } else if (editingField === 'startDate') {
               if (updatedTask.days && updatedTask.startDate) {
                   updatedTask.endDate = addDays(parseISO(updatedTask.startDate), Math.max(0, updatedTask.days - 1)).toISOString().split('T')[0];
               }
           } else if (editingField === 'endDate') {
               if (updatedTask.startDate && updatedTask.endDate) {
                   const start = parseISO(updatedTask.startDate);
                   const end = parseISO(updatedTask.endDate);
                   const diff = differenceInDays(end, start) + 1;
                   if (diff > 0) {
                       updatedTask.days = diff;
                   } else {
                       // invalid end date, fallback
                       updatedTask.endDate = updatedTask.startDate;
                       updatedTask.days = 1;
                   }
               }
           }

           return updatedTask;
        }
        return t;
      }));
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
      'GHI CHÚ': t.subcontractor || '',
      'THỜI LƯỢNG (NGÀY)': t.days,
      'BẮT ĐẦU': t.startDate ? format(parseISO(t.startDate), 'dd/MM/yyyy') : '',
      'KẾT THÚC': t.endDate ? format(parseISO(t.endDate), 'dd/MM/yyyy') : '',
      'TIẾN ĐỘ (%)': t.progress || 0,
      'NGÂN SÁCH (VNĐ)': t.budget || 0,
      'TRẠNG THÁI': t.status || 'Chưa bắt đầu',
      'ĐÃ DUYỆT': t.approved ? 'Có' : 'Không'
    }));
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Tiến Độ");
    xlsx.writeFile(workbook, `Tien-Do-Du-An-${selectedProject?.name || 'Moi'}.xlsx`);
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        date: format(parseISO(newProjectDate), 'dd/MM/yyyy'),
        status: 'MỚI',
        budget: parseInt(newProjectBudget.replace(/[^0-9]/g, '')) || 0,
        actualCost: 0,
        startDate: newProjectDate,
        hasInputData: false
      };
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setNewProjectDate(new Date().toISOString().split('T')[0]);
      setNewProjectBudget('');
      setCurrentView('HOME');
    }
  };

  const handleUploadFile = (type: 'EXCEL' | 'PDF', file?: File) => {
    setUploadType(type);
    setIsUploading(true);

    if (type === 'EXCEL' && file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = xlsx.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Use AI Parse (Gemini)
          const extractedData = await parseConstructionExcel(json);

          if (extractedData.length > 0) {
            setParsedData(extractedData);
            setSelectedParsedItems(extractedData.map(i => i.id));
            generateTasksFromData(extractedData);
          } else {
             generateTasksFromData(mockParsedData);
          }
        } catch (err) {
          console.error("Error parsing EXCEL", err);
          generateTasksFromData(mockParsedData);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
       // Mock for PDF or missing file
       setTimeout(() => {
         setParsedData(mockParsedData);
         setSelectedParsedItems(mockParsedData.map(i => i.id));
         generateTasksFromData(mockParsedData);
       }, 2000);
    }
  };

  const generateTasksFromData = (dataList: any[]) => {
    setIsUploading(false);
    setHasData(true);
    
    // Auto generate tasks with Logical Timeline thinking
    // Sort tasks by category priority if available (Chuẩn bị -> Cải tạo -> Nội thất)
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

    let currentStartDate = parseISO(selectedProject?.startDate || new Date().toISOString());
    const newTasks: Task[] = sortedData.map((item, index) => {
      const days = item.days || Math.floor(Math.random() * 5) + 2; 
      const endDate = addDays(currentStartDate, days - 1); // Task ends at the end of the day count
      
      const task: Task = {
        id: `t_${Date.now()}_${index}`,
        name: item.name,
        category: (item.category || '1. CÔNG TÁC CHUẨN BỊ TRƯỚC THI CÔNG').trim(),
        subcontractor: '',
        days: days,
        personnel: item.days > 3 ? 4 : 2, // Auto allocate personnel
        budget: item.price * item.quantity,
        approved: false,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'Chưa bắt đầu'
      };
      
      // Next task starts the day after this one ends (Sequential)
      currentStartDate = addDays(endDate, 1);
      return task;
    });
    
    setTasks(newTasks);
    
    // Update project status and Total Budget
    if (selectedProjectId) {
        setProjects(projects.map(p => {
            if (p.id === selectedProjectId) {
                const totalBudget = newTasks.reduce((sum, t) => sum + t.budget, 0);
                return {...p, status: 'ĐANG CHẠY', hasInputData: true, budget: totalBudget};
            }
            return p;
        }));
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
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Dự Án Thi Công</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống lập kế hoạch và phân bổ thầu phụ thông minh</p>
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
          JA
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

        <button className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square sm:aspect-auto sm:h-32 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
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
          {projects.map(project => (
            <div 
              key={project.id}
                onClick={() => {
                setSelectedProjectId(project.id);
                setHasData(!!project.hasInputData);
                setCurrentView('PROJECT_DETAIL');
              }}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:border-indigo-500 hover:shadow-sm transition-all gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{project.name}</h3>
                  <p className="text-sm text-slate-500">{project.date}</p>
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
          ))}
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
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Bắt đầu: {selectedProject?.date}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>ID: #{selectedProject?.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 items-center flex-wrap justify-end">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button onClick={() => setActiveProjectTab('NHAT_KI')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'NHAT_KI' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>NHẬT KÍ</button>
                <button onClick={() => setActiveProjectTab('TIMELINE')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>TIMELINE</button>
                <button onClick={() => setActiveProjectTab('CHI_PHI')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeProjectTab === 'CHI_PHI' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>CHI PHÍ</button>
            </div>
          <button className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cấu hình
          </button>
          <button 
            onClick={() => setCurrentView('PLANNING')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            LẬP KẾ HOẠCH <ChevronRight className="w-5 h-5" />
          </button>
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
                           <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{width: '100%'}}></div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-500">
        <div className="md:col-span-2 space-y-6">
           {!hasData ? (
             <div className="space-y-6">
                <div className="mb-4">
                   <h2 className="text-xl font-black text-white tracking-tight mb-2">Dữ Liệu Đầu Vào</h2>
                   <p className="text-slate-400 text-sm">
                     Tải lên file Excel BOQ hoặc PDF hồ sơ thiết kế để AI tự động bóc tách khối lượng.
                   </p>
                </div>
                
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

                <div className="bg-[#1C182B] rounded-[24px] p-12 flex flex-col items-center justify-center text-center mt-6 h-[400px]">
                    <Upload className="w-12 h-12 text-slate-500 mb-6" />
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Chưa có dữ liệu</h3>
                    <p className="text-slate-500 text-sm max-w-[280px]">Hệ thống hỗ trợ phân tích tự động từ file Excel dự toán hoặc dùng AI bóc tách từ bản vẽ PDF.</p>
                </div>
             </div>
           ) : (
             <>
               <div className="bg-[#1C182B] border border-transparent p-6 rounded-[24px]">
                 <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Dữ Liệu Đầu Vào</h2>
                 <p className="text-slate-400 text-sm mb-5">Tải lên file Excel BOQ hoặc dự toán để bắt đầu.</p>
                 <div className="flex gap-4">
                   <button 
                     onClick={() => { setHasData(false); setTasks([]); }} 
                     className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm"
                   >
                     Làm mới
                   </button>
                   <label className="bg-[#6B4BFF] cursor-pointer hover:bg-[#5A3EE0] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#6B4BFF]/30">
                     <Upload className="w-5 h-5"/> Tải Excel
                     <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => {
                       if (e.target.files && e.target.files.length > 0) {
                         handleUploadFile('EXCEL', e.target.files[0]);
                         e.target.value = '';
                       }
                     }} />
                   </label>
                 </div>
               </div>
               
               <div className="bg-slate-50 rounded-[24px] overflow-hidden shadow-2xl flex flex-col min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 bg-slate-50 border-b border-slate-200">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Kiểm Tra Dữ Liệu</h2>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">Hệ thống sẽ ẩn các dòng đã chọn. Vui lòng chọn hết các hạng mục cần thiết từ cột trái.</p>
                     
                     <button 
                        onClick={() => setCurrentView('PLANNING')}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2 mb-6"
                     >
                        <Sparkles className="w-5 h-5" /> Tiếp tục
                     </button>
                     
                     <div className="bg-white border border-slate-200 rounded-full py-3 px-6 text-center font-bold text-slate-500 mb-6 shadow-sm mx-auto max-w-[250px]">
                        Đã chọn: <span className="text-slate-900">{selectedParsedItems.length}</span> mục
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

                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
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
                                       <span>Số lượng: {item.quantity}</span>
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
             </>
           )}
        </div>

        <div className="space-y-6">
           {/* Sidebar Info Cards */}
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              <DollarSign className="w-10 h-10 text-white/50 mb-6" />
              <h3 className="text-white/60 font-black text-xs uppercase tracking-widest mb-1">Tổng Ngân Sách</h3>
              <div className="text-4xl font-black text-white tracking-tighter mb-4">
                 {selectedProject?.budget.toLocaleString('vi-VN')} đ
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-2/3 rounded-full"></div>
              </div>
           </div>

           <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-xl">
              <Users className="w-8 h-8 text-indigo-400 mb-6" />
              <h3 className="text-slate-500 font-black text-xs uppercase tracking-widest mb-4">Nhân Sự Hiện Trường</h3>
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(idx => (
                    <div key={idx} className="w-10 h-10 rounded-xl border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-white overflow-hidden shadow-lg">
                       <Users className="w-5 h-5 text-slate-500" />
                    </div>
                 ))}
                 <div className="w-10 h-10 rounded-xl border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                    +5
               </div>
            </div>
         </div>
      </div>
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
                         <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-200">{task.category}</span>
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
                        value={task.subcontractor}
                        onChange={(e) => {
                           const newTasks = [...tasks];
                           newTasks[index].subcontractor = e.target.value;
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
                             value={task.days}
                             onChange={(e) => {
                               const newTasks = [...tasks];
                               newTasks[index].days = parseInt(e.target.value) || 0;
                               setTasks(newTasks);
                             }}
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
                             value={task.personnel}
                             onChange={(e) => {
                               const newTasks = [...tasks];
                               newTasks[index].personnel = parseInt(e.target.value) || 0;
                               setTasks(newTasks);
                             }}
                           />
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <button 
                  onClick={() => toggleTaskApproval(index)}
                  className={`w-full lg:w-32 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${task.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 shadow-sm'}`}
              >
                  {task.approved ? 'Đã Duyệt' : 'Duyệt'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderGantt = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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

        <div className="flex gap-4">
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
             <div className="grid grid-cols-[40px_260px_120px_90px_90px_40px_40px_1fr] bg-[#f1f5f9] border-b border-slate-300 text-[10px] font-bold text-slate-800 text-center items-stretch uppercase">
                <div className="flex items-center justify-center border-r border-slate-300 py-3 leading-tight px-1 col-span-2">STT MÔ TẢ</div>
                <div className="flex items-center justify-center border-r border-slate-300 py-3">GHI CHÚ</div>
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
                            TUẦN {i + 1}
                         </div>
                      ))}
                   </div>
                   {/* Tầng 2: Ngày bắt đầu tuần */}
                   <div className="grid grid-cols-3 border-b border-slate-300 h-1/3 bg-white/50">
                      {Array.from({length: 3}).map((_, i) => {
                         const startOfProject = parseISO(projectStartDate);
                         const weekStart = addDays(startOfProject, i * 7);
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
                         const currentDate = addDays(startOfProject, i);
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
                     {tasks.filter(t => t.category === cat).map((task, taskIdx) => {
                         const startDay = task.startDate ? differenceInDays(parseISO(task.startDate), parseISO(projectStartDate)) + 1 : 1; 
                         const startDateFmt = task.startDate ? format(parseISO(task.startDate), 'dd/MM/yyyy') : '--/--/----';
                         const endDateFmt = task.endDate ? format(parseISO(task.endDate), 'dd/MM/yyyy') : '--/--/----';

                         const isEditingName = editingTaskId === task.id && editingField === 'name';
                         const isEditingSub = editingTaskId === task.id && editingField === 'subcontractor';
                         const isEditingStart = editingTaskId === task.id && editingField === 'startDate';
                         const isEditingEnd = editingTaskId === task.id && editingField === 'endDate';
                         const isEditingDays = editingTaskId === task.id && editingField === 'days';
                         const isEditingProgress = editingTaskId === task.id && editingField === 'progress';

                         return (
                            <div key={task.id} className="grid grid-cols-[40px_260px_120px_90px_90px_40px_40px_1fr] items-stretch border-b border-slate-200 group hover:bg-yellow-50/50 transition-colors bg-white">
                               <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center border-r border-slate-200 bg-[#f9fafb]">
                                  <span>{taskIdx + 1}</span>
                               </div>
                               
                               <div className="border-r border-slate-200 pl-4 pr-2 py-1.5 flex items-center cursor-text relative" onClick={() => !isEditingName && handleEditStart(task.id, 'name', task.name)}>
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-30">
                                      <button onClick={(e) => { e.stopPropagation(); addNewTask(cat, task.id); }} className="bg-emerald-50 border border-emerald-400 text-emerald-600 rounded p-[3px] hover:bg-emerald-100 hover:scale-125 transition-transform shadow-md" title="Chèn công tác bên dưới">
                                          <Plus className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setTasks(tasks.filter(t => t.id !== task.id)); }} className="bg-rose-50 border border-rose-400 text-rose-500 rounded p-[3px] hover:bg-rose-100 hover:scale-125 transition-transform shadow-md" title="Xóa công tác">
                                          <Trash2 className="w-3 h-3" strokeWidth={3} />
                                      </button>
                                  </div>

                                  {isEditingName ? (
                                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-[11px] text-slate-800 outline-none relative z-10" />
                                  ) : (
                                     <div className="text-[11px] text-slate-700 truncate min-w-0">{task.name}</div>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 px-2 py-1.5 flex items-center cursor-text" onClick={() => !isEditingSub && handleEditStart(task.id, 'subcontractor', task.subcontractor || '')}>
                                  {isEditingSub ? (
                                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-full bg-blue-50 border border-blue-400 rounded px-1.5 py-0.5 text-[11px] text-slate-800 outline-none" placeholder="Nhập thầu..." />
                                  ) : (
                                      <span className="text-[10px] text-slate-600 truncate">{task.subcontractor || <span className="italic text-slate-400 font-light">+ Thêm...</span>}</span>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 flex flex-col items-center justify-center cursor-text" onClick={() => !isEditingStart && handleEditStart(task.id, 'startDate', task.startDate || '')}>
                                  {isEditingStart ? (
                                     <input type="date" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="bg-blue-50 border border-blue-400 rounded px-1 text-[9px] text-slate-800 outline-none w-[95%]" />
                                  ) : (
                                     <span className="text-[9px] text-slate-700">{startDateFmt}</span>
                                  )}
                               </div>

                               <div className="border-r border-slate-200 flex flex-col items-center justify-center cursor-text" onClick={() => !isEditingEnd && handleEditStart(task.id, 'endDate', task.endDate || '')}>
                                  {isEditingEnd ? (
                                     <input type="date" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="bg-blue-50 border border-blue-400 rounded px-1 text-[9px] text-slate-800 outline-none w-[95%]" />
                                  ) : (
                                     <span className="text-[9px] text-slate-700">{endDateFmt}</span>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 flex items-center justify-center cursor-text bg-[#f9fafb]" onClick={() => !isEditingDays && handleEditStart(task.id, 'days', task.days)}>
                                  {isEditingDays ? (
                                     <input type="number" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-10 text-center bg-blue-50 border-2 border-blue-400 rounded px-1 text-[11px] font-bold text-slate-800 outline-none" />
                                  ) : (
                                     <span className="text-[12px] font-black text-slate-900">{task.days}</span>
                                  )}
                               </div>
                               
                               <div className="border-r border-slate-200 flex items-center justify-center cursor-text" onClick={() => !isEditingProgress && handleEditStart(task.id, 'progress', task.progress || 0)}>
                                  {isEditingProgress ? (
                                     <input type="number" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleEditSave} onKeyDown={handleEditKeyDown} className="w-8 text-center bg-blue-50 border border-blue-400 rounded px-1 text-[11px] text-slate-800 outline-none" />
                                  ) : (
                                     <span className="text-[10px] text-slate-700">{task.progress || 0}%</span>
                                  )}
                               </div>

                               <div className="grid grid-cols-21 relative bg-white group-hover:bg-yellow-50/20">
                                  {Array.from({length: 21}).map((_, i) => {
                                      const isWeekEnd = i % 7 === 6;
                                      const cellKey = `${task.id}-${i}`;
                                      const isHighlighted = highlightedCells[cellKey];
                                      return (
                                          <div 
                                            key={`col-${i}`} 
                                            onClick={() => toggleCellHighlight(task.id, i)}
                                            className={`border-r cursor-pointer transition-colors ${isHighlighted ? 'bg-emerald-500/80 hover:bg-emerald-500' : isWeekEnd ? 'bg-red-50/40 hover:bg-slate-100' : 'hover:bg-slate-100'} ${isWeekEnd ? 'border-r-slate-400' : 'border-r-slate-200'} ${i === 20 ? 'border-r-0' : ''}`} 
                                          />
                                      );
                                  })}

                                  <div 
                                     className="absolute inset-0 flex items-center justify-center bg-[#4a86e8] border-r border-white/30"
                                     style={{ 
                                       gridColumnStart: Math.max(1, startDay), 
                                       gridColumnEnd: Math.min(22, startDay + task.days),
                                       zIndex: 10
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
                     <div className="w-full bg-white/5 rounded-full h-3 flex overflow-hidden border border-white/5">
                         <div className={`h-full rounded-full ${p.actualCost > p.budget && p.budget > 0 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-indigo-500'}`} style={{width: `${Math.min((p.actualCost / (p.budget || 1)) * 100, 100)}%`}}></div>
                     </div>
                     {p.actualCost > p.budget && p.budget > 0 && (
                        <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-6 py-4 rounded-2xl text-xs font-bold leading-relaxed">
                            CẢNH BÁO: Dự án đã vượt ngân sách {((p.actualCost - p.budget) / p.budget * 100).toFixed(0)}%. Vui lòng đề xuất Phụ lục hợp đồng hoặc rà soát lại các khoản chi.
                        </div>
                     )}
                  </div>
              </div>
           </div>
        ))}
      </div>

      <div className="flex gap-4">
         <button 
           onClick={() => setProjects(projects.map(p => p.id === '1' ? {...p, actualCost: p.budget + 25000000} : p))}
           className="bg-white/5 hover:bg-rose-500/20 text-rose-400 px-8 py-4 rounded-2xl border border-white/10 font-black text-sm transition-all"
         >
             GIẢ LẬP RỦI RO LỖ
         </button>
         <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
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
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
               + THÊM NHÂN SỰ
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5">
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Họ tên & Liên hệ</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Chức vụ</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dự án hiện tại</th>
                     <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Trạng thái</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.03]">
                  {personnel.map(p => (
                     <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-6">
                           <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">{p.name}</div>
                           <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 font-medium"><Phone className="w-3 h-3" /> {p.phone}</div>
                        </td>
                        <td className="py-6">
                           <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300">
                               {p.position}
                           </span>
                        </td>
                        <td className="py-6">
                           <div className="text-sm font-bold text-white/80 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-600" /> Biệt thự Anh Hùng
                           </div>
                        </td>
                        <td className="py-6 text-right">
                           <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                              {p.status}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
             </table>
          </div>
             </div>
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

              <div className="border-2 border-dashed border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center group hover:border-emerald-500/50 transition-all bg-white/[0.02]">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-emerald-500" />
                 </div>
                 <p className="text-white font-black text-lg mb-2">Tải lên báo giá</p>
                 <p className="text-slate-500 text-xs font-medium mb-8">Hỗ trợ .doc, .docx, .xlsx, .pdf (Max 10MB)</p>
                 <button 
                   onClick={() => handleUploadQuote()}
                   className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
                 >
                    Chọn File để Phân Tích
                 </button>
              </div>
              </div>
           </div>
        </div>
      )
  );

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
              {currentView === 'DATA_CHECK' && renderProjectDetail()}
              {currentView === 'PLANNING' && renderPlanning()}
              {currentView === 'GANTT' && renderGantt()}
            </>
          )}
          
          {activeTab === 'THU CHI' && renderFinancial()}
          {activeTab === 'NHÂN SỰ' && renderPersonnel()}
          {activeTab === 'CÀI ĐẶT' && renderSettings()}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 z-[100] flex justify-around items-center max-w-lg mx-auto mb-6 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-x border-b">
        {[
          { id: 'DỰ ÁN', icon: Folder, label: 'DỰ ÁN' },
          { id: 'THU CHI', icon: DollarSign, label: 'THU CHI' },
          { id: 'NHÂN SỰ', icon: Users, label: 'NHÂN SỰ' },
          { id: 'CÀI ĐẶT', icon: Settings, label: 'CÀI ĐẶT' }
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
