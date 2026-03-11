import { useState, useEffect } from 'react';
import { Plus, Bell, Camera, Upload, Download, Folder, Users, ChevronLeft, Calendar, DollarSign, FileSpreadsheet, CheckCircle2, X, MessageSquare, Clock, FileSearch, ChevronRight, Settings, Phone, Printer, Building2, UserCheck, AlertTriangle, FileText, Minus } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  { id: '1', name: 'Nhà cô Lan', date: '30/1/2026', status: 'ĐANG CHẠY', budget: 150000000, actualCost: 45000000, startDate: '2026-01-30', hasInputData: true },
  { id: '2', name: 'Biệt thự Anh Hùng', date: '15/2/2026', status: 'MỚI', budget: 0, actualCost: 0, startDate: '2026-02-15', hasInputData: false }
];

const mockParsedData = [
  { id: 'b1', name: 'Ốp lam gỗ nhựa mặt tiền', quantity: 12, unit: 'm²', price: 1000000 },
  { id: 'b2', name: 'Sơn lại lô đề + khung cửa kính mặt tiền', quantity: 1, unit: 'gói', price: 2000000 },
  { id: 'b3', name: 'Ốp lam nhôm đứng mặt tiền', quantity: 1, unit: 'gói', price: 3000000 },
  { id: 'b4', name: 'Ốp alu tạo hình mặt tiền', quantity: 1, unit: 'gói', price: 12000000 },
];

const initialTasks: Task[] = [
  { id: 't1', name: 'Công tác thiết kế và chuẩn bị hồ sơ', category: 'KHÁC', subcontractor: '', days: 5, personnel: 2, budget: 15000000, approved: true, startDate: '2026-01-30', endDate: '2026-02-04', status: 'Hoàn thành' },
  { id: 't2', name: 'Tháo dỡ - Vận chuyển khỏi căn hộ', category: 'THI CÔNG', subcontractor: 'Hùng (Đào móng)', days: 2, personnel: 4, budget: 5000000, approved: true, startDate: '2026-02-05', endDate: '2026-02-07', status: 'Hoàn thành' },
  { id: 't3', name: 'Thi công hệ thống điện và chiếu sáng', category: 'MEP', subcontractor: 'Công ty Điện Beta (MEP)', days: 10, personnel: 4, budget: 45000000, approved: false, startDate: '2026-02-08', endDate: '2026-02-18', status: 'Đang thực hiện' },
  { id: 't4', name: 'Thi công trang trí mặt tiền', category: 'HOÀN THIỆN', subcontractor: 'Đội Sơn Delta (Hoàn thiện)', days: 12, personnel: 6, budget: 85000000, approved: true, startDate: '2026-02-19', endDate: '2026-03-03', status: 'Chưa bắt đầu' }
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
  
  // Data Check states
  const [selectedParsedItems, setSelectedParsedItems] = useState<string[]>(mockParsedData.map(i => i.id));
  const [activeDataTab, setActiveDataTab] = useState<'ALL' | 'SELECTED'>('ALL');
  
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
        if (currentView === 'REMINDERS' || currentView === 'CREATE_PROJECT' || currentView === 'PLANNING' || currentView === 'GANTT') {
          setCurrentView('HOME');
        }
        if (isQuoteOpen) setIsQuoteOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [currentView, isQuoteOpen]);

  const addNewTask = () => {
    const lastTask = tasks[tasks.length - 1];
    const startDateStr = lastTask ? (lastTask.endDate || lastTask.startDate || new Date().toISOString()) : new Date().toISOString();
    const startDate = addDays(parseISO(startDateStr), 1);
    
    const newTask: Task = {
      id: `t_new_${Date.now()}`,
      name: 'Hạng mục thi công mới',
      category: 'THI CÔNG',
      subcontractor: settings.planner, // Auto-select creator/planner
      days: 5,
      personnel: 2,
      budget: 1000000,
      approved: false,
      startDate: startDate.toISOString().split('T')[0],
      endDate: addDays(startDate, 5).toISOString().split('T')[0],
      status: 'Chưa bắt đầu'
    };
    setTasks([...tasks, newTask]);
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

  const handleUploadFile = (type: 'EXCEL' | 'PDF') => {
    setUploadType(type);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setHasData(true);
      
      // Auto generate tasks from BOQ mock data
      let currentStartDate = parseISO(selectedProject?.startDate || new Date().toISOString());
      const newTasks: Task[] = mockParsedData.map((item, index) => {
        const days = Math.floor(Math.random() * 5) + 2; // Random 2-6 days
        const endDate = addDays(currentStartDate, days);
        const task: Task = {
          id: `t_${Date.now()}_${index}`,
          name: item.name,
          category: 'THI CÔNG',
          subcontractor: '',
          days: days,
          personnel: Math.floor(Math.random() * 4) + 1,
          budget: item.price * item.quantity,
          approved: false,
          startDate: currentStartDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          status: 'Chưa bắt đầu'
        };
        currentStartDate = addDays(endDate, 1);
        return task;
      });
      
      setTasks(newTasks);
      
      // Update project status
      if (selectedProjectId) {
         setProjects(projects.map(p => {
             if (p.id === selectedProjectId) {
                 return {...p, status: 'ĐANG CHẠY', hasInputData: true, budget: newTasks.reduce((sum, t) => sum + t.budget, 0)};
             }
             return p;
         }));
      }

      setCurrentView('DATA_CHECK');
    }, 2500);
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
        
        <div className="flex gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl min-h-[400px] flex flex-col relative overflow-hidden">
           {!hasData ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                   <Upload className="w-10 h-10 text-indigo-400" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-black text-white tracking-tight">Dữ Liệu Đầu Vào</h2>
                   <p className="text-slate-400 font-medium max-w-sm mx-auto">
                     Tải lên file Excel BOQ hoặc PDF hồ sơ thiết kế để AI tự động bóc tách và sinh thời gian thi công.
                   </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div 
                    onClick={() => handleUploadFile('EXCEL')}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingExcel(true); }}
                    onDragLeave={() => setIsDraggingExcel(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingExcel(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleUploadFile('EXCEL');
                      }
                    }}
                    className={`p-8 rounded-3xl cursor-pointer bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group flex flex-col items-center gap-4 ${isDraggingExcel ? 'bg-indigo-500/20 border-indigo-500 border-dashed border-2' : ''}`}
                  >
                    <FileSpreadsheet className={`w-12 h-12 text-emerald-400 transition-transform ${isDraggingExcel ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`} />
                    <span className="font-black text-white uppercase tracking-widest text-xs">Excel BOQ</span>
                    <span className="text-slate-500 text-[10px] font-medium mt-[-10px] hidden group-hover:block transition-all">Nhấp hoặc Kéo thả file</span>
                  </div>
                  <div 
                    onClick={() => handleUploadFile('PDF')}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                    onDragLeave={() => setIsDraggingPdf(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleUploadFile('PDF');
                      }
                    }}
                    className={`p-8 rounded-3xl cursor-pointer bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group flex flex-col items-center gap-4 ${isDraggingPdf ? 'bg-rose-500/20 border-rose-500 border-dashed border-2' : ''}`}
                  >
                    <FileSearch className={`w-12 h-12 text-rose-400 transition-transform ${isDraggingPdf ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`} />
                    <span className="font-black text-white uppercase tracking-widest text-xs">PDF AI Scan</span>
                    <span className="text-slate-500 text-[10px] font-medium mt-[-10px] hidden group-hover:block transition-all">Nhấp hoặc Kéo thả file</span>
                  </div>
                </div>
             </div>
           ) : (
             <div className="space-y-6 animate-in fade-in duration-500 flex flex-col flex-1 bg-white/5 backdrop-blur-xl rounded-[32px] p-2 border border-white/10">
                <div className="p-6 pb-0">
                   <h2 className="text-2xl font-black text-white tracking-tight mb-2">Kiểm Tra Dữ Liệu</h2>
                   <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">Hệ thống sẽ ẩn các dòng đã chọn. Vui lòng chọn hết các hạng mục cần thiết từ cột trái.</p>
                   
                   <button 
                      onClick={() => setCurrentView('PLANNING')}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mb-4"
                   >
                      <CheckCircle2 className="w-5 h-5" /> Tiếp tục
                   </button>
                   
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center font-bold text-white mb-6">
                      Đã chọn: <span className="text-emerald-400">{selectedParsedItems.length}</span> mục
                   </div>

                   <div className="flex bg-slate-950/50 rounded-2xl border border-white/5 p-1 mb-4">
                      <button 
                        onClick={() => setActiveDataTab('ALL')}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeDataTab === 'ALL' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <FileText className="w-4 h-4" /> Excel Gốc
                      </button>
                      <button 
                        onClick={() => setActiveDataTab('SELECTED')}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeDataTab === 'SELECTED' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <CheckCircle2 className="w-4 h-4" /> Đã Chọn ({selectedParsedItems.length})
                      </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-6">
                   {mockParsedData
                     .filter(item => activeDataTab === 'ALL' || selectedParsedItems.includes(item.id))
                     .map((item, idx) => {
                       const isSelected = selectedParsedItems.includes(item.id);
                       return (
                         <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4 flex-1">
                               <div className="font-black text-emerald-500 w-6">{idx + 1}</div>
                               <div className="flex-1">
                                  <div className="font-bold text-white mb-1.5">{item.name}</div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                     <span>SL: {item.quantity}</span>
                                     <span>ĐV: {item.unit}</span>
                                     <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20 tracking-wider">
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
                               className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
                            >
                               {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                         </div>
                       );
                   })}
                </div>
             </div>
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
    </div>
  );

  const renderPlanning = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('PROJECT_DETAIL')}
            className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Lập Kế Hoạch</h1>
            <p className="text-slate-400 font-medium">Sắp xếp nhân sự, thời gian và thầu phụ cho các hạng mục</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
               onClick={addNewTask}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
           >
               + CHÈN HẠNG MỤC
           </button>
           <button 
               onClick={() => setCurrentView('GANTT')}
               className="bg-white/5 hover:bg-white/10 text-indigo-400 font-black px-8 py-4 rounded-2xl border border-indigo-500/30 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/5 active:scale-95"
           >
               XEM TIẾN ĐỘ (GANTT) <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task, index) => (
          <div key={task.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] group hover:bg-white/10 transition-all relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${task.approved ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm border border-white/5">
                       {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">{task.category}</span>
                         {task.status === 'Trễ hạn' && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-500/20 animate-pulse">TRỄ HẠN</span>}
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors uppercase">{task.name}</h3>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-4">
                  <div className="flex items-center gap-4">
                     <select 
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
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
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 cursor-help">
                        <AlertTriangle className="w-4 h-4" />
                     </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                     <div className="flex items-center gap-3 text-slate-400">
                        <span className="font-medium">Thời gian:</span>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-indigo-500/50 transition-colors">
                           <Clock className="w-4 h-4 mr-2" />
                           <input 
                             type="number" 
                             className="w-12 bg-transparent text-white font-bold text-center outline-none"
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
                     <div className="flex items-center gap-3 text-slate-400">
                        <span className="font-medium">Nhân sự:</span>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-emerald-500/50 transition-colors">
                           <Users className="w-4 h-4 mr-2" />
                           <input 
                             type="number" 
                             className="w-10 bg-transparent text-white font-bold text-center outline-none"
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
                  className={`w-full lg:w-32 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${task.approved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
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

        <button 
          onClick={() => {
            const element = document.getElementById('gantt-chart-container');
            if (element) {
              html2canvas(element, { scale: 2, backgroundColor: '#020617' }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'mm', 'a3');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Tien-do.pdf`);
              });
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Printer className="w-5 h-5" /> XUẤT PDF A3
        </button>
      </div>

      <div id="gantt-chart-container" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] p-8 text-white">
             {/* Gantt Header */}
             <div className="grid grid-cols-[300px_1fr] border-b border-white/10 pb-4 mb-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hạng mục thi công</div>
                <div className="grid grid-cols-31 gap-1 text-[10px] font-black text-slate-500 text-center">
                   {Array.from({length: 31}).map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
             </div>
             
             {/* Gantt Rows */}
             <div className="space-y-2">
                {tasks.filter(t => t.approved).map(task => {
                    const startDay = parseInt(task.startDate?.split('-')[2] || '1');
                    return (
                       <div key={task.id} className="grid grid-cols-[300px_1fr] items-center py-2 group">
                          <div className="pr-4">
                             <div className="text-xs font-bold text-white uppercase group-hover:text-indigo-400 transition-colors truncate">{task.name}</div>
                             <div className="text-[10px] text-slate-500">{task.subcontractor}</div>
                          </div>
                          <div className="grid grid-cols-31 gap-1 h-8 bg-white/5 rounded-lg overflow-hidden relative border border-white/5">
                             <div 
                                className="absolute bg-gradient-to-r from-indigo-500 to-purple-600 h-full flex items-center px-2 text-[9px] font-black rounded-r-md border-r-2 border-white/30"
                                style={{ gridColumnStart: startDay, gridColumnEnd: startDay + task.days }}
                             >
                                {task.subcontractor}
                             </div>
                          </div>
                       </div>
                    );
                })}
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
