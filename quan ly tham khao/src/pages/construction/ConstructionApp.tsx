import React, { useState } from 'react';
import { Plus, Bell, Camera, Upload, Download, Folder, FileText, Users, Settings, ChevronLeft, Calendar, DollarSign, FileSpreadsheet, CheckCircle2, Copy, X, MessageSquare, Clock, FileCheck, FileSearch, LayoutTemplate, MousePointer2, Image as ImageIcon, Circle, Square, Type, Lightbulb, Box, Palette, ChevronRight } from 'lucide-react';

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

export default function ConstructionApp() {
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
  const [hasQuoteData, setHasQuoteData] = useState(false);

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
      setHasQuoteData(true);
    }, 2000);
  };

  const toggleTaskApproval = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].approved = !newTasks[index].approved;
    setTasks(newTasks);
  };

  const renderHome = () => (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản Lý Dự Án</h1>
          <p className="text-sm text-gray-400 mt-1">Hệ thống lập kế hoạch và phân bổ thầu phụ thông minh</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-900">
          JA
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setCurrentView('CREATE_PROJECT')}
          className="bg-indigo-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] hover:bg-indigo-700 transition-colors"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-white">TẠO DỰ ÁN MỚI</span>
        </button>
        
        <button className="bg-[#1C1C28] rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] border border-gray-800 hover:bg-gray-800 transition-colors">
          <Bell className="w-8 h-8 text-gray-400" />
          <span className="font-medium text-gray-400">THÔNG BÁO</span>
        </button>

        <button className="bg-[#1C1C28] rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] border border-gray-800 hover:bg-gray-800 transition-colors">
          <Camera className="w-8 h-8 text-gray-400" />
          <span className="font-medium text-gray-400">CHỤP HĐ NHANH</span>
        </button>

        <div className="flex flex-col gap-4">
          <button className="bg-[#1C1C28] rounded-2xl p-4 flex items-center justify-center gap-2 flex-1 border border-gray-800 hover:bg-gray-800 transition-colors">
            <Upload className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-gray-300">IMPORT</span>
          </button>
          <button className="bg-[#1C1C28] rounded-2xl p-4 flex items-center justify-center gap-2 flex-1 border border-gray-800 hover:bg-gray-800 transition-colors">
            <Download className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-gray-300">EXPORT ZIP</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Danh Sách Dự Án</h2>
        <div className="space-y-3">
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => {
                setSelectedProject(project);
                setCurrentView('PROJECT_DETAIL');
              }}
              className="bg-[#1C1C28] rounded-2xl p-4 border border-gray-800 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-400">{project.date}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-semibold rounded-full">
                  {project.status}
                </span>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-700 border border-[#1C1C28]"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-600 border border-[#1C1C28]"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-800 border border-[#1C1C28] flex items-center justify-center text-[10px] text-gray-400">+6</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateProject = () => (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setCurrentView('HOME')} className="p-2 bg-gray-800 rounded-full text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Tạo Dự Án Mới</h1>
      </div>

      <div className="bg-[#1C1C28] rounded-2xl p-6 border border-gray-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tên Dự Án Mới</label>
          <input 
            type="text" 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="VD: Biệt thự Anh Hùng..."
            className="w-full bg-transparent border-2 border-indigo-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            autoFocus
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleCreateProject}
            className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Tạo Ngay
          </button>
          <button 
            onClick={() => setCurrentView('HOME')}
            className="flex-1 bg-gray-800 text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  const renderProjectDetail = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-4 bg-[#0A0A0F] sticky top-0 z-10">
        <button onClick={() => setCurrentView('HOME')} className="p-2 bg-gray-800 rounded-full text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white truncate">{selectedProject?.name}</h1>
      </div>

      <div className="px-4 mb-6">
        <div className="flex bg-[#1C1C28] rounded-xl p-1 border border-gray-800">
          <button 
            className={`flex-1 py-2 rounded-lg flex justify-center items-center transition-colors ${!hasData ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => !hasData && setCurrentView('PROJECT_DETAIL')}
          >
            <Folder className="w-5 h-5" />
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg flex justify-center items-center transition-colors ${hasData ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => hasData && setCurrentView('PLANNING')}
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center text-gray-400 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 px-4">
          <h2 className="text-lg font-bold text-white mb-1">Dữ Liệu Đầu Vào</h2>
          <p className="text-sm text-gray-400 mb-6">Tải lên file Excel BOQ hoặc PDF hồ sơ thiết kế để AI tự động bóc tách khối lượng.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => handleUploadFile('EXCEL')}
              className="flex flex-col items-center justify-center gap-3 bg-[#1C1C28] border border-gray-800 hover:border-indigo-500 text-white p-6 rounded-2xl transition-colors"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              <span className="font-medium">Tải Excel BOQ</span>
            </button>
            <button 
              onClick={() => handleUploadFile('PDF')}
              className="flex flex-col items-center justify-center gap-3 bg-[#1C1C28] border border-gray-800 hover:border-indigo-500 text-white p-6 rounded-2xl transition-colors"
            >
              <FileSearch className="w-8 h-8 text-rose-500" />
              <span className="font-medium text-center">AI Bóc Tách<br/>từ PDF</span>
            </button>
          </div>

          <div className="bg-[#1C1C28] border border-gray-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <Upload className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Chưa có dữ liệu</h3>
            <p className="text-sm text-gray-500 max-w-[250px]">
              Hệ thống hỗ trợ phân tích tự động từ file Excel dự toán hoặc dùng AI bóc tách từ bản vẽ PDF.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Dữ Liệu Đầu Vào</h2>
              <p className="text-sm text-gray-400">Tải lên file Excel BOQ hoặc dự toán để bắt đầu.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium">Làm mới</button>
              <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                <Upload className="w-4 h-4" /> Tải Excel
              </button>
            </div>
          </div>

          <div className="bg-[#1C1C28] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-bold text-white mb-1">Kiểm Tra Dữ Liệu</h3>
              <p className="text-xs text-gray-400 mb-4">Hệ thống sẽ ẩn các dòng đã chọn. Vui lòng chọn hết các hạng mục cần thiết từ cột trái.</p>
              
              <button 
                onClick={() => setCurrentView('PLANNING')}
                className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4"
              >
                <CheckCircle2 className="w-5 h-5" />
                Tiếp tục
              </button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span>Đã chọn: <strong className="text-white">24</strong> mục</span>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800">
              <button className="flex-1 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent">
                <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                Excel Gốc
              </button>
              <button className="flex-1 py-3 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Đã Chọn (24)
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {mockParsedData.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="font-bold text-emerald-400 mt-0.5">{idx + 1}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm mb-2">{item.name}</h4>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>SL: {item.quantity}</span>
                      <span>ĐV: {item.unit}</span>
                      <span className="text-white font-medium">{item.price.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                  <button className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                    -
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
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between bg-[#0A0A0F] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('PROJECT_DETAIL')} className="p-2 bg-gray-800 rounded-full text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white truncate">{selectedProject?.name}</h1>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex bg-[#1C1C28] rounded-xl p-1 border border-gray-800">
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center text-gray-400 hover:text-white transition-colors" onClick={() => setCurrentView('PROJECT_DETAIL')}>
            <Folder className="w-5 h-5" />
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center bg-indigo-600 text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="flex-1 py-2 rounded-lg flex justify-center items-center text-gray-400 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Kế Hoạch & Phân Bổ</h2>
          <p className="text-xs text-gray-400">* Kéo thả để sắp xếp. Chỉnh sửa trực tiếp.</p>
        </div>
        <button 
          onClick={() => setCurrentView('GANTT')}
          className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          Xem Tiến Độ (Gantt) <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-4 overflow-y-auto pb-24 space-y-4">
        {tasks.map((task, index) => (
          <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{task.category}</div>
                <h3 className="font-bold text-gray-900 text-sm">{task.name}</h3>
              </div>
              <button 
                onClick={() => toggleTaskApproval(index)}
                className={`p-1.5 rounded-full transition-colors ${task.approved ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                title={task.approved ? "Đã duyệt chi phí" : "Chưa duyệt"}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ngân sách dự kiến:</span>
                <span className="font-bold text-indigo-600">{task.budget.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="relative">
                <select 
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={task.subcontractor}
                  onChange={(e) => {
                    const newTasks = [...tasks];
                    newTasks[index].subcontractor = e.target.value;
                    setTasks(newTasks);
                  }}
                >
                  <option value="">-- Chọn Thầu Phụ --</option>
                  {subcontractors.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <ChevronLeft className="w-4 h-4 -rotate-90" />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Thời gian:</span>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <input 
                      type="number" 
                      value={task.days} 
                      onChange={(e) => {
                        const newTasks = [...tasks];
                        newTasks[index].days = parseInt(e.target.value) || 0;
                        setTasks(newTasks);
                      }}
                      className="w-8 bg-transparent text-center font-medium text-gray-900 focus:outline-none" 
                    />
                  </div>
                  <span className="text-gray-500">ngày</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Nhân sự:</span>
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{task.personnel}</span>
                </div>
              </div>

              {task.subcontractor && (
                <div className="pt-3 mt-3 border-t border-gray-100 flex gap-2">
                  <button 
                    onClick={() => {
                      setQuoteSubcontractor(task.subcontractor);
                      setIsQuoteOpen(true);
                    }}
                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" /> Gửi Y/C
                  </button>
                  <button 
                    onClick={handleUploadQuote}
                    className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Nhập Báo Giá
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGantt = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 flex items-center gap-4 bg-[#0A0A0F] sticky top-0 z-10">
        <button onClick={() => setCurrentView('PLANNING')} className="p-2 bg-gray-800 rounded-full text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white truncate">{selectedProject?.name}</h1>
      </div>

      <div className="p-4 bg-[#0A0A0F] border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Biểu Đồ Tiến Độ</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" /> Bắt đầu: 30/01/2026
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> In PDF
          </button>
          <button 
            onClick={() => setIsQuoteOpen(true)}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" /> Yêu Cầu Báo Giá
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900">Điều Chỉnh Tiến Độ (Gantt)</h3>
          <p className="text-xs text-gray-500">Nhấn giữ 1.5s để di chuyển. Chạm để chỉnh sửa.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-center">
          <div className="text-xs text-gray-500 font-medium">Tổng: 51</div>
          <div className="font-bold text-gray-900">Ngày</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Mock Gantt Chart Visual */}
        <div className="min-w-[600px]">
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            <div className="w-1/3 font-bold text-gray-500 text-xs">HẠNG MỤC</div>
            <div className="w-2/3 flex justify-between text-xs text-gray-500 font-medium">
              <span>30/1</span>
              <span>4/2</span>
              <span>9/2</span>
              <span>14/2</span>
              <span>19/2</span>
              <span>24/2</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {tasks.map((task, idx) => (
              <div key={task.id} className="flex items-center">
                <div className="w-1/3 pr-4">
                  <div className="font-bold text-sm text-gray-900 truncate">{task.name}</div>
                  <div className="text-xs text-gray-500 truncate">{task.subcontractor || 'Chưa giao'}</div>
                </div>
                <div className="w-2/3 relative h-8 bg-gray-50 rounded">
                  <div 
                    className="absolute top-1 bottom-1 bg-indigo-600 rounded-full flex items-center px-3 text-white text-xs font-bold"
                    style={{ 
                      left: `${idx * 15}%`, 
                      width: `${task.days * 3}%` 
                    }}
                  >
                    {task.days}d
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMoodboard = () => (
    <div className="flex flex-col h-full bg-[#0A0A0F]">
      <div className="p-4 flex items-center justify-between bg-[#1C1C28] sticky top-0 z-10 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-6 h-6 text-rose-500" />
          <h1 className="text-xl font-bold text-white">Tạo Moodboard</h1>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Lưu
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Canvas Area */}
        <div className="flex-1 bg-white m-4 rounded-xl border border-gray-800 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           {/* Mockup of canvas with some images and circles */}
           <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-indigo-500 overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/wood/200/200" className="w-full h-full object-cover" alt="wood" />
           </div>
           <div className="absolute top-20 left-36 w-40 h-40 rounded-full border-2 border-emerald-500 overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/interior/200/200" className="w-full h-full object-cover" alt="interior" />
           </div>
           <div className="absolute bottom-20 right-10 w-48 h-32 bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg p-2">
             <img src="https://picsum.photos/seed/furniture/300/200" className="w-full h-full object-cover rounded" alt="furniture" />
           </div>
           
           {/* Toolbar */}
           <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1C1C28] border border-gray-800 rounded-xl p-2 flex flex-col gap-2 shadow-xl">
             <button className="p-2 text-white bg-indigo-600 rounded-lg"><MousePointer2 className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><ImageIcon className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Circle className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Square className="w-5 h-5" /></button>
             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Type className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Bottom Process Bar (like in the video) */}
        <div className="bg-[#1C1C28] border-t border-gray-800 p-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Ý TƯỞNG
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Box className="w-4 h-4" /> BỐI CẢNH
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Palette className="w-4 h-4" /> PHONG CÁCH
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
              <Camera className="w-4 h-4" /> GÓC NHÌN
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> MOODBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuoteModal = () => {
    if (!isQuoteOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom-full duration-300">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">YÊU CẦU BÁO GIÁ</h2>
          </div>
          <button onClick={() => setIsQuoteOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500">Tạo tin nhắn gửi thầu phụ để lấy đơn giá.</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Thầu Phụ</label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={quoteSubcontractor}
              onChange={(e) => setQuoteSubcontractor(e.target.value)}
            >
              <option value="">-- Chọn Thầu Phụ --</option>
              {subcontractors.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giọng văn</label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['Lịch sự', 'Thường', 'Gấp'].map(tone => (
                <button 
                  key={tone}
                  onClick={() => setQuoteTone(tone)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${quoteTone === tone ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono relative">
              {`Chào ${quoteSubcontractor || '[Tên Thầu Phụ]'}, gửi Anh danh sách hạng mục công trình "${selectedProject?.name || 'Công trình'}" nhờ Anh báo giá giúp em:

* Gói: Công tác thiết kế và chuẩn bị hồ sơ
  1. Chi phí thiết kế trọn gói
     - KL: 1 gói
     - Đơn giá: ..................... đ

Anh/chị điền giá và gửi lại giúp em sớm nhé.
Thanks!
              
* Đã bao gồm chỗ trống để điền giá`}
              
              <button className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-colors">
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-[#0A0A0F] font-sans flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {isUploading && (
          <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">
              {uploadType === 'PDF' ? 'Đang dùng AI bóc tách khối lượng từ PDF...' : 'Đang dùng AI để phân tích dữ liệu...'}
            </p>
          </div>
        )}

        {isQuoteUploading && (
          <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">Đang dùng AI đọc file báo giá của thầu phụ...</p>
          </div>
        )}
        
        {currentView === 'HOME' && activeTab === 'DỰ ÁN' && renderHome()}
        {currentView === 'HOME' && activeTab === 'MOODBOARD' && renderMoodboard()}
        {currentView === 'CREATE_PROJECT' && renderCreateProject()}
        {currentView === 'PROJECT_DETAIL' && renderProjectDetail()}
        {currentView === 'DATA_CHECK' && renderProjectDetail()}
        {currentView === 'PLANNING' && renderPlanning()}
        {currentView === 'GANTT' && renderGantt()}
      </div>

      {/* Bottom Navigation */}
      {currentView === 'HOME' && (
        <div className="bg-[#1C1C28] border-t border-gray-800 px-6 py-4 flex justify-between items-center pb-safe">
          <button 
            onClick={() => setActiveTab('DỰ ÁN')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'DỰ ÁN' ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            <Folder className="w-6 h-6" />
            <span className="text-[10px] font-bold">DỰ ÁN</span>
          </button>
          <button 
            onClick={() => setActiveTab('MOODBOARD')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'MOODBOARD' ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            <LayoutTemplate className="w-6 h-6" />
            <span className="text-[10px] font-bold">MOODBOARD</span>
          </button>
          <button 
            onClick={() => setActiveTab('THU CHI')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'THU CHI' ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] font-bold">THU CHI</span>
          </button>
          <button 
            onClick={() => setActiveTab('NHÂN SỰ')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'NHÂN SỰ' ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold">NHÂN SỰ</span>
          </button>
          <button 
            onClick={() => setActiveTab('CÀI ĐẶT')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'CÀI ĐẶT' ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-bold">CÀI ĐẶT</span>
          </button>
        </div>
      )}
      
      {renderQuoteModal()}
    </div>
  );
}
