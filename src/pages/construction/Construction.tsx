import { useState } from 'react';
import { Plus, Bell, Camera, Upload, Download, Folder, FileText, Users, ChevronLeft, Calendar, DollarSign, FileSpreadsheet, CheckCircle2, Copy, X, MessageSquare, Clock, FileSearch, ChevronRight, Settings } from 'lucide-react';

// Mock Data
const initialProjects = [
  { id: '1', name: 'Nhà cô Lan', date: '30/1/2026', status: 'ĐANG CHẠY' },
  { id: '2', name: 'Biệt thự Anh Hùng', date: '15/2/2026', status: 'MỚI' }
];

const mockParsedData = [
  { id: 1, name: 'Ốp lam gỗ nhựa mặt tiền', quantity: 12, unit: 'm²', price: 1000000 },
  { id: 2, name: 'Sơn lại lô đề + khung cửa kính mặt tiền', quantity: 1, unit: 'gói', price: 2000000 },
  { id: 3, name: 'Ốp lam nhôm đứng mặt tiền', quantity: 1, unit: 'gói', price: 3000000 },
  { id: 4, name: 'Ốp alu tạo hình mặt tiền', quantity: 1, unit: 'gói', price: 12000000 },
];

const mockTasks = [
  { id: 1, name: 'Công tác thiết kế và chuẩn bị hồ sơ', category: 'KHÁC', subcontractor: '', days: 7, personnel: 2, budget: 15000000, approved: true },
  { id: 2, name: 'Thi công hệ thống điện và chiếu sáng', category: 'MEP', subcontractor: 'Công ty Điện Beta (MEP)', days: 10, personnel: 4, budget: 45000000, approved: false },
  { id: 3, name: 'Thi công trang trí mặt tiền', category: 'HOÀN THIỆN', subcontractor: 'Đội Sơn Delta (Hoàn thiện)', days: 12, personnel: 6, budget: 85000000, approved: true },
  { id: 4, name: 'Sơn nước và lát sàn hoàn thiện', category: 'HOÀN THIỆN', subcontractor: 'Đội Sơn Delta (Hoàn thiện)', days: 15, personnel: 8, budget: 120000000, approved: false },
];

const subcontractors = [
  'Tuấn (Kết cấu)',
  'Công ty Điện Beta (MEP)',
  'Cô Lan (MEP (Nước))',
  'Đội Sơn Delta (Hoàn thiện)',
  'Hùng (Đào móng)'
];

export const Construction = () => {
  const [currentView, setCurrentView] = useState('HOME');
  const [activeTab, setActiveTab] = useState('DỰ ÁN');
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // State for Create Project
  const [newProjectName, setNewProjectName] = useState('');
  
  // State for Data Upload
  const [isUploading, setIsUploading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [uploadType, setUploadType] = useState<'EXCEL' | 'PDF' | null>(null);
  
  // State for Planning
  const [tasks, setTasks] = useState(mockTasks);
  
  // State for Quote
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteSubcontractor, setQuoteSubcontractor] = useState('');
  const [quoteTone, setQuoteTone] = useState('Thường');
  const [isQuoteUploading, setIsQuoteUploading] = useState(false);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName,
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'MỚI'
      };
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setCurrentView('HOME');
    }
  };

  const handleUploadFile = (type: 'EXCEL' | 'PDF') => {
    setUploadType(type);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setHasData(true);
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
                setSelectedProject(project);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => setCurrentView('HOME')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Tạo Dự Án Mới</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Dự Án Mới</label>
          <input 
            type="text" 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="VD: Biệt thự Anh Hùng..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            autoFocus
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleCreateProject}
            className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Tạo Ngay
          </button>
          <button 
            onClick={() => setCurrentView('HOME')}
            className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  const renderProjectDetail = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-center gap-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <button onClick={() => setCurrentView('HOME')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 truncate">{selectedProject?.name}</h1>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 max-w-md mx-auto">
          <button 
            className={`flex-1 py-2 rounded-lg flex justify-center items-center transition-all font-medium ${!hasData ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => !hasData && setCurrentView('PROJECT_DETAIL')}
          >
            <Folder className="w-5 h-5 mr-2" /> Dữ liệu
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg flex justify-center items-center transition-all font-medium ${hasData ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => hasData && setCurrentView('PLANNING')}
          >
            <Calendar className="w-5 h-5 mr-2" /> Kế hoạch
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center text-slate-500 hover:text-slate-700 transition-all font-medium">
            <DollarSign className="w-5 h-5 mr-2" /> Chi phí
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Dữ Liệu Đầu Vào</h2>
            <p className="text-slate-500">Tải lên file Excel BOQ hoặc PDF hồ sơ thiết kế để AI tự động bóc tách khối lượng.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
            <button 
              onClick={() => handleUploadFile('EXCEL')}
              className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 p-8 rounded-2xl transition-all group"
            >
              <FileSpreadsheet className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-700">Tải Excel BOQ</span>
            </button>
            <button 
              onClick={() => handleUploadFile('PDF')}
              className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 p-8 rounded-2xl transition-all group"
            >
              <FileSearch className="w-12 h-12 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-center text-slate-700">AI Bóc Tách<br/>từ PDF</span>
            </button>
          </div>

          <div className="w-full bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Kéo thả file vào đây</h3>
            <p className="text-sm text-slate-500 max-w-[300px]">
              Hệ thống hỗ trợ phân tích tự động từ file Excel dự toán (.xlsx, .xls) hoặc dùng AI bóc tách từ bản vẽ PDF.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-6 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Dữ Liệu BOQ</h2>
              <p className="text-sm text-slate-500">Hệ thống AI đã phân tích thành công biểu mẫu.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Làm mới</button>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Upload className="w-4 h-4" /> Tải thêm
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Kiểm Tra Dữ Liệu</h3>
                <p className="text-sm text-slate-500">Vui lòng chọn các hạng mục cần thiết để lên kế hoạch thi công.</p>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Đã chọn: <strong className="text-indigo-600">24</strong> mục
                </div>
                <button 
                  onClick={() => setCurrentView('PLANNING')}
                  className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Tiếp tục
                </button>
              </div>
            </div>
            
            <div className="flex border-b border-slate-200 bg-white">
              <button className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:bg-slate-50 transition-colors">
                <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                Excel Gốc
              </button>
              <button className="flex-1 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30">
                <CheckCircle2 className="w-4 h-4 inline mr-2 relative top-[-1px]" />
                Đã Chọn (24)
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50/50">
              {mockParsedData.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-800 font-bold text-base mb-2 truncate">{item.name}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-semibold mb-0.5">SỐ LƯỢNG</span>
                        <span className="text-slate-700 font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200 pl-4">
                        <span className="text-slate-400 text-xs font-semibold mb-0.5">ĐƠN VỊ</span>
                        <span className="text-slate-700 font-medium">{item.unit}</span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200 pl-4">
                        <span className="text-slate-400 text-xs font-semibold mb-0.5">ĐƠN GIÁ</span>
                        <span className="text-indigo-600 font-bold">{item.price.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                  <button className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors border border-transparent hover:border-red-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlanning = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-center gap-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <button onClick={() => setCurrentView('PROJECT_DETAIL')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 truncate">{selectedProject?.name}</h1>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 max-w-md mx-auto">
          <button 
             className="flex-1 py-2 rounded-lg flex justify-center items-center font-medium text-slate-500 hover:text-slate-700 transition-all"
             onClick={() => setCurrentView('PROJECT_DETAIL')}
          >
            <Folder className="w-5 h-5 mr-2" /> Dữ liệu
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center bg-white shadow-sm text-indigo-600 transition-all font-medium">
            <Calendar className="w-5 h-5 mr-2" /> Kế hoạch
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center text-slate-500 hover:text-slate-700 transition-all font-medium">
            <DollarSign className="w-5 h-5 mr-2" /> Chi phí
          </button>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 gap-4 bg-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Kế Hoạch & Phân Bổ</h2>
          <p className="text-sm text-slate-500">Sắp xếp nhân sự, thời gian và thầu phụ cho các hạng mục.</p>
        </div>
        <button 
          onClick={() => setCurrentView('GANTT')}
          className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors w-full md:w-auto justify-center"
        >
          Xem Tiến Độ (Gantt) <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/50 space-y-4">
        {tasks.map((task, index) => (
          <div key={task.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-start md:items-center gap-3 mb-4 flex-col md:flex-row">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{task.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{task.name}</h3>
                </div>
              </div>
              
              <div className="w-full md:w-auto md:ml-auto flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 pl-11 md:pl-0">
                 <div className="text-sm">
                    <span className="text-slate-500 mr-2">Ngân sách:</span>
                    <span className="font-bold text-emerald-600">{task.budget.toLocaleString('vi-VN')} đ</span>
                 </div>
                <button 
                  onClick={() => toggleTaskApproval(index)}
                  className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm font-medium border ${task.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  <CheckCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">{task.approved ? 'Đã duyệt' : 'Duyệt'}</span>
                </button>
              </div>
            </div>
            
            <div className="pl-0 md:pl-11 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">giao thầu phụ</label>
                 <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-slate-50 cursor-pointer transition-colors"
                    value={task.subcontractor}
                    onChange={(e) => {
                      const newTasks = [...tasks];
                      newTasks[index].subcontractor = e.target.value;
                      setTasks(newTasks);
                    }}
                  >
                    <option value="">-- Click để chọn thầu phụ --</option>
                    {subcontractors.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Thời gian (ngày)</label>
                 <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-shadow">
                    <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <input 
                      type="number" 
                      value={task.days} 
                      onChange={(e) => {
                        const newTasks = [...tasks];
                        newTasks[index].days = parseInt(e.target.value) || 0;
                        setTasks(newTasks);
                      }}
                      className="w-full bg-transparent text-slate-800 font-bold focus:outline-none" 
                    />
                  </div>
              </div>
              
              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Nhân sự (người)</label>
                 <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                    <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="font-bold text-slate-800">{task.personnel}</span>
                 </div>
              </div>
            </div>

            {task.subcontractor && (
              <div className="pl-0 md:pl-11 mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 md:gap-3">
                <button 
                  onClick={() => {
                    setQuoteSubcontractor(task.subcontractor);
                    setIsQuoteOpen(true);
                  }}
                  className="flex-1 md:flex-none bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Gửi Yêu Cầu
                </button>
                <button 
                  onClick={handleUploadQuote}
                  className="flex-1 md:flex-none bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4 text-slate-400" /> Nhập Báo Giá
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderGantt = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('PLANNING')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 truncate">{selectedProject?.name} - Gantt</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-indigo-500" /> Bắt đầu: 30/01/2026
        </div>
      </div>

      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap gap-3">
        <button className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Xuất Excel
        </button>
        <button className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
          <FileText className="w-4 h-4 text-rose-500" /> In PDF PDF
        </button>
        <button 
          onClick={() => setIsQuoteOpen(true)}
          className="flex-[2] min-w-[200px] bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <DollarSign className="w-4 h-4" /> Yêu Cầu Báo Giá
        </button>
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800">Biểu đồ (View-only Mockup)</h3>
          <p className="text-xs text-slate-500 mt-1">Sử dụng thanh cuộn ngang để xem chi tiết timeline.</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-500 font-semibold uppercase">Tổng thời gian</div>
          <div className="font-black text-indigo-600 text-lg">51 ngày</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-white">
        {/* Mock Gantt Chart Visual */}
        <div className="min-w-[800px] border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-1/3 p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-r border-slate-200">HẠNG MỤC CÔNG VIỆC</div>
            <div className="w-2/3 flex p-3 justify-between text-xs text-slate-500 font-bold">
              <span>30/1</span>
              <span>4/2</span>
              <span>9/2</span>
              <span>14/2</span>
              <span>19/2</span>
              <span>24/2</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {tasks.map((task, idx) => (
              <div key={task.id} className="flex items-center hover:bg-slate-50 transition-colors">
                <div className="w-1/3 p-3 border-r border-slate-200">
                  <div className="font-bold text-sm text-slate-800 truncate mb-1">{task.name}</div>
                  <div className="text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                      <Users className="w-3 h-3" /> {task.subcontractor || 'Chưa phân công'}
                  </div>
                </div>
                <div className="w-2/3 p-3 relative h-16">
                  {/* Grid lines */}
                  <div className="absolute inset-x-3 top-0 bottom-0 flex justify-between z-0 pointer-events-none opacity-20">
                      <div className="w-px bg-slate-400 h-full"></div>
                      <div className="w-px bg-slate-400 h-full"></div>
                      <div className="w-px bg-slate-400 h-full"></div>
                      <div className="w-px bg-slate-400 h-full"></div>
                      <div className="w-px bg-slate-400 h-full"></div>
                      <div className="w-px bg-slate-400 h-full"></div>
                  </div>
                  
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center px-3 text-white text-xs font-bold shadow-sm z-10 border border-indigo-700/20"
                    style={{ 
                      left: `${10 + idx * 15}%`, 
                      width: `${task.days * 2.5}%` 
                    }}
                  >
                    <span className="truncate">{task.days} ngày</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuoteModal = () => {
    if (!isQuoteOpen) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsQuoteOpen(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">GỬI YÊU CẦU BÁO GIÁ</h2>
            </div>
            <button onClick={() => setIsQuoteOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
            <p className="text-sm text-slate-500 font-medium">Tạo tin nhắn gửi thầu phụ qua Zalo/Telegram để lấy đơn giá.</p>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Thầu Phụ Nhận</label>
                <div className="relative">
                    <select 
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 transition-colors shadow-sm"
                    value={quoteSubcontractor}
                    onChange={(e) => setQuoteSubcontractor(e.target.value)}
                    >
                    <option value="">-- Chọn Thầu Phụ --</option>
                    {subcontractors.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </div>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Giọng văn tự động</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {['Lịch sự', 'Thường', 'Gấp & Nhanh'].map(tone => (
                    <button 
                    key={tone}
                    onClick={() => setQuoteTone(tone)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${quoteTone === tone ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                    {tone}
                    </button>
                ))}
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-end">
                    <span>Nội dung tin nhắn (AI soạn sẵn)</span>
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono relative leading-relaxed shadow-inner">
                {`Chào anh/chị ${quoteSubcontractor || '[Tên Thầu Phụ]'}, 
Bên em đang có công trình "${selectedProject?.name || 'Công trình mới'}", cần khoán nhân công và vật tư.
Anh/chị xem qua và báo giá giúp em các mục sau nhé:

* Hạng mục:
  1. Thi công trọn gói theo khối lượng
     - KL: [Theo bản vẽ]
     - Đơn giá: ..................... đ

Anh/chị điền giá và gửi lại sớm giúp em để em chốt trình CĐT nhé.
Cảm ơn anh/chị!`}
                
                <div className="flex justify-end mt-4">
                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95">
                        <Copy className="w-4 h-4" /> Copy Tin Nhắn
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white font-sans flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        {isUploading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-lg"></div>
            <p className="text-slate-800 font-bold text-lg px-6 py-3 bg-white rounded-2xl shadow-xl border border-slate-100">
              {uploadType === 'PDF' ? '🤖 Đang dùng AI bóc tách khối lượng từ PDF...' : '🤖 Đang phân tích dữ liệu Excel BOQ...'}
            </p>
          </div>
        )}

        {isQuoteUploading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-lg"></div>
            <p className="text-slate-800 font-bold text-lg px-6 py-3 bg-white rounded-2xl shadow-xl border border-slate-100">
              🤖 Đang dùng AI đọc file báo giá của thầu phụ...
            </p>
          </div>
        )}
        
        {currentView === 'HOME' && activeTab === 'DỰ ÁN' && renderHome()}
        {currentView === 'CREATE_PROJECT' && renderCreateProject()}
        {currentView === 'PROJECT_DETAIL' && renderProjectDetail()}
        {currentView === 'DATA_CHECK' && renderProjectDetail()}
        {currentView === 'PLANNING' && renderPlanning()}
        {currentView === 'GANTT' && renderGantt()}
      </div>

      {/* Internal Tab Navigation for Construction Domain (replacing bottom nav with a top/internal local nav if needed, but keeping logic consistent) */}
      {currentView === 'HOME' && (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap sm:flex-nowrap justify-between items-center shadow-sm max-w-3xl mx-auto w-full gap-2">
          <button 
            onClick={() => setActiveTab('DỰ ÁN')}
            className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === 'DỰ ÁN' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Folder className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Dự án</span>
          </button>

          <button 
            onClick={() => setActiveTab('THU CHI')}
            className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === 'THU CHI' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Thu Chi</span>
          </button>
          <button 
            onClick={() => setActiveTab('NHÂN SỰ')}
            className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === 'NHÂN SỰ' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Nhân Sự</span>
          </button>
          <button 
            onClick={() => setActiveTab('CÀI ĐẶT')}
            className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === 'CÀI ĐẶT' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Cài Đặt</span>
          </button>
        </div>
      )}
      
      {renderQuoteModal()}
    </div>
  );
};
