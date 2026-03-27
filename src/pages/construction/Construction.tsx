import React, { useState, useEffect, useMemo } from 'react';
import { useConstructionData } from '../../hooks/useConstructionData';
import { aiConstructionService } from '../../services/aiConstructionService';
import { 
  Plus, Bell, Camera, Upload, Download, Folder, FileText, Users, Settings, 
  ChevronLeft, Calendar, DollarSign, FileSpreadsheet, CheckCircle2, Copy, X, 
  MessageSquare, Clock, FileCheck, FileSearch, LayoutTemplate, MousePointer2, 
  Image as ImageIcon, Circle, Square, Type, Lightbulb, Box, Palette, 
  ChevronRight, Cloud, Sun, CloudRain, Send, AlertTriangle, TrendingUp, 
  Target, MapPin, ShieldCheck, Eye, ListChecks, History, BarChart3, 
  Smartphone, Monitor, UserCircle, ThermometerSun, Check, User, 
  HelpCircle, LogOut, AlertCircle, Mic, Play, Square as SquareIcon, Zap
, ListTodo } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type UserRole = 'HOMEOWNER' | 'ENGINEER' | 'MANAGER';

interface Project {
  id: string;
  name: string;
  startDate: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  contractValue: number;
  address: string;
  ownerName: string;
  engineerName: string;
}

interface Task {
  id: string;
  name: string;
  category: string;
  status: 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
  subcontractor: string;
  days: number;
  budget: number;
  spent: number;
  approved: boolean;
  dependencies: string[]; // Task IDs that must be DONE before this starts
  tags: string[]; // e.g., #MacBeTong, #CotThep
  issues: Issue[];
  checklist: ChecklistItem[];
  standards?: string[]; // URLs to standard images
  progress: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'FIXING' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

interface Payment {
  id: string;
  date: string;
  content: string;
  recipient: string;
  amount: number;
  billPhoto: string;
  note: string;
  milestone?: string;
  status?: 'PAID' | 'PENDING' | 'WAITING';
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'ENGINEER' | 'ADDITIONAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
}

interface DailyLog {
  id: string;
  date: string;
  weatherMorning: string;
  weatherAfternoon: string;
  temperature: number;
  mainWorkers: number;
  subWorkers: number;
  tasksCompleted: string[];
  tasksTomorrow: string[];
  issues: string[];
  photos: string[];
  progress: number;
}

// --- Mock Data ---

const INITIAL_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Nhà cô Lan - Quận 7', 
    startDate: '2026-01-30', 
    status: 'ĐANG THI CÔNG', 
    progress: 45,
    budget: 2500000000,
    spent: 1200000000,
    contractValue: 2800000000,
    address: '123 Đường số 4, Phường Tân Phong, Quận 7, TP.HCM',
    ownerName: 'Cô Lan',
    engineerName: 'Nguyễn Văn Hùng'
  },
  { 
    id: '2', 
    name: 'Biệt thự Anh Hùng - Thủ Đức', 
    startDate: '2026-02-15', 
    status: 'MỚI', 
    progress: 10,
    budget: 5000000000,
    spent: 500000000,
    contractValue: 5500000000,
    address: '45 Khu đô thị Vạn Phúc, Thủ Đức, TP.HCM',
    ownerName: 'Anh Hùng',
    engineerName: 'Trần Minh Tuấn'
  }
];

const INITIAL_TASKS: Task[] = [
  { 
    id: 't1', 
    name: 'Ép cọc bê tông cốt thép', 
    category: 'PHẦN THÔ', 
    status: 'DONE', 
    subcontractor: 'CÔNG TY NỀN MÓNG VIỆT', 
    days: 5, 
    budget: 150000000, 
    spent: 145000000, 
    approved: true, 
    dependencies: [],
    tags: ['#EpCoc', '#BeTong'],
    issues: [],
    progress: 100,
    checklist: [
      { id: 'c1', label: 'Kiểm tra tim cọc', completed: true, required: true },
      { id: 'c2', label: 'Nghiệm thu vật liệu đầu vào', completed: true, required: true },
      { id: 'c3', label: 'Ép cọc thử', completed: true, required: true }
    ],
    standards: ['https://picsum.photos/seed/std1/800/600']
  },
  { 
    id: 't2', 
    name: 'Đào móng và thi công đà kiềng', 
    category: 'PHẦN THÔ', 
    status: 'DONE', 
    subcontractor: 'CÔNG TY XÂY DỰNG NAM', 
    days: 10, 
    budget: 250000000, 
    spent: 260000000, 
    approved: true, 
    dependencies: ['t1'],
    tags: ['#Mong', '#CotThep'],
    issues: [],
    progress: 100,
    checklist: [
      { id: 'c4', label: 'Đào đất đúng cao độ', completed: true, required: true },
      { id: 'c5', label: 'Lắp đặt cốt thép móng', completed: true, required: true },
      { id: 'c6', label: 'Đổ bê tông lót', completed: true, required: true }
    ],
    standards: ['https://picsum.photos/seed/std2/800/600']
  },
  { 
    id: 't3', 
    name: 'Xây tường bao tầng trệt', 
    category: 'PHẦN THÔ', 
    status: 'DOING', 
    subcontractor: 'CÔNG TY XÂY DỰNG NAM', 
    days: 7, 
    budget: 120000000, 
    spent: 50000000, 
    approved: true, 
    dependencies: ['t2'],
    tags: ['#XayTuong', '#Gach'],
    progress: 71,
    issues: [
      {
        id: 'i1',
        title: 'Sai lệch kích thước cửa sổ',
        description: 'Cửa sổ phòng khách bị lệch 5cm so với bản vẽ.',
        status: 'OPEN',
        severity: 'MEDIUM',
        createdAt: '2026-03-25',
        photoBefore: 'https://picsum.photos/seed/issue1/400/300'
      }
    ],
    checklist: [
      { id: 'c7', label: 'Kiểm tra độ thẳng đứng của tường', completed: false, required: true },
      { id: 'c8', label: 'Lắp đặt lanh tô cửa', completed: false, required: true },
      { id: 'c9', label: 'Tưới nước bảo dưỡng tường', completed: true, required: false }
    ],
    standards: ['https://picsum.photos/seed/std3/800/600']
  },
  { 
    id: 't4', 
    name: 'Lắp đặt hệ thống điện nước âm tường', 
    category: 'MEP', 
    status: 'TODO', 
    subcontractor: 'CÔNG TY ĐIỆN BẢO AN', 
    days: 12, 
    budget: 180000000, 
    spent: 0, 
    approved: false, 
    dependencies: ['t3'],
    tags: ['#MEP', '#DienNuoc'],
    progress: 0,
    issues: [],
    checklist: [
      { id: 'c10', label: 'Đục tường đúng sơ đồ', completed: false, required: true },
      { id: 'c11', label: 'Lắp đặt đế âm', completed: false, required: true }
    ]
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', date: '2026-05-18', content: 'Thiết kế bản vẽ', recipient: 'CÔNG TY KIẾN TRÚC VIỆT', amount: 14710000, billPhoto: 'https://picsum.photos/seed/bill1/400/600', note: 'Thanh toán đợt 1', milestone: 'Đợt 1: Thiết kế', status: 'PAID' },
  { id: 'p2', date: '2026-05-18', content: 'Nhà thầu ép cọc bê tông', recipient: 'CÔNG TY NỀN MÓNG VIỆT', amount: 136000000, billPhoto: 'https://picsum.photos/seed/bill2/400/600', note: 'Thanh toán đợt 2', milestone: 'Đợt 2: Ép cọc', status: 'PAID' },
  { id: 'p3', date: '2026-05-18', content: 'Trắc đạc', recipient: 'ANH THANH TÙNG', amount: 7000000, billPhoto: 'https://picsum.photos/seed/bill3/400/600', note: 'Thanh toán đợt 1', milestone: 'Đợt 1: Trắc đạc', status: 'PAID' },
  { id: 'p4', date: '2026-05-18', content: 'Nhà thầu chính', recipient: 'CÔNG TY XÂY DỰNG NAM', amount: 189900000, billPhoto: 'https://picsum.photos/seed/bill4/400/600', note: 'Thanh toán đợt 1', milestone: 'Đợt 1: Khởi công', status: 'PAID' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', date: '2026-03-25', description: 'Phụ cấp kỹ sư giám sát ca đêm', amount: 500000, type: 'ENGINEER', status: 'APPROVED', requestedBy: 'Kỹ sư Nam' },
  { id: 'e2', date: '2026-03-26', description: 'Mua thêm 50 bao xi măng phát sinh', amount: 4500000, type: 'ADDITIONAL', status: 'PENDING', requestedBy: 'Kỹ sư Nam' },
  { id: 'e3', date: '2026-03-27', description: 'Chi phí vận chuyển xà bần ngoài giờ', amount: 1200000, type: 'ADDITIONAL', status: 'PENDING', requestedBy: 'Kỹ sư Nam' },
];

const INITIAL_LOGS: DailyLog[] = [
  {
    id: 'l1',
    date: '2026-03-26',
    weatherMorning: 'Nắng - Làm bình thường',
    weatherAfternoon: 'Nắng - Làm bình thường',
    temperature: 34,
    mainWorkers: 8,
    subWorkers: 12,
    tasksCompleted: ['Xây tường bao phía Tây', 'Lắp đặt giàn giáo tầng 1'],
    tasksTomorrow: ['Tiếp tục xây tường bao', 'Nghiệm thu cốt thép sàn'],
    issues: ['Vật tư gạch về chậm 2 tiếng'],
    photos: ['https://picsum.photos/seed/site1/400/300', 'https://picsum.photos/seed/site2/400/300'],
    progress: 71
  },
  {
    id: 'l2',
    date: '2026-03-25',
    weatherMorning: 'Mưa - Làm bình thường',
    weatherAfternoon: 'Nắng - Làm bình thường',
    temperature: 30,
    mainWorkers: 6,
    subWorkers: 10,
    tasksCompleted: ['Đổ bê tông lót'],
    tasksTomorrow: ['Lắp đặt cốt thép móng'],
    issues: [],
    photos: ['https://picsum.photos/seed/site3/400/300'],
    progress: 65
  }
];

// --- Components ---

const ProgressBar = ({ progress, label }: { progress: number, label?: string }) => (
  <div className="w-full">
    {label && <div className="flex justify-between text-xs font-medium mb-1.5">
      <span className="text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-white">{progress}%</span>
    </div>}
    <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]"
      />
    </div>
  </div>
);

const DashboardGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4">
    {children}
  </div>
);

const DashboardCard = ({ icon, label, value, color, dark, onClick }: { icon: React.ReactNode, label: string, value: string | number, color?: string, dark?: boolean, onClick?: () => void }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`${dark ? 'bg-[#1C1C28] border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-4 border shadow-sm flex flex-col items-start gap-3 text-left w-full`}
  >
    <div className={`p-2 rounded-xl ${color ? color + ' bg-opacity-10' : (dark ? 'bg-white/5' : 'bg-gray-50')}`}>
      {color ? React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${color.replace('bg-', 'text-')}` }) : icon}
    </div>
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
      <div className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
  </motion.button>
);

function VoiceLogModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-sm bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" /> Nhật Ký Bằng Giọng Nói
              </h3>
              <button onClick={onClose} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8 text-center">
              <div className="relative w-32 h-32 mx-auto">
                {isRecording && (
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-indigo-500 rounded-full"
                  />
                )}
                <button 
                  onClick={() => {
                    setIsRecording(!isRecording);
                    if (!isRecording) {
                      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        setTranscript(event.results[0][0].transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => {
        alert("Lỗi microphone. Bật chế độ Demo.");
        setTimeout(() => { setTranscript("Hôm nay đội thợ xây đã hoàn thành 80% tường bao tầng 1. Vật tư gạch đã về đủ. Thời tiết nắng ráo thuận lợi..."); setIsRecording(false); }, 2000);
      };
      recognition.start();
    } else {
      setTimeout(() => { setTranscript("Hôm nay đội thợ xây đã hoàn thành 80% tường bao tầng 1. Vật tư gạch đã về đủ. Thời tiết nắng ráo thuận lợi..."); setIsRecording(false); }, 2000);
    }
                    }
                  }}
                  className={`relative z-10 w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording ? 'bg-rose-600 scale-110 shadow-[0_0_30px_#e11d48]' : 'bg-indigo-600 shadow-[0_0_20px_#6366f1]'
                  }`}
                >
                  {isRecording ? <SquareIcon className="w-10 h-10 text-white" /> : <Mic className="w-12 h-12 text-white" />}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">{isRecording ? 'Đang lắng nghe...' : 'Sẵn sàng ghi âm'}</h4>
                <p className="text-xs text-gray-500">Nhấn vào mic để bắt đầu báo cáo nhật ký</p>
              </div>

              {transcript && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10 text-left"
                >
                  <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2">Văn bản chuyển đổi (AI)</div>
                  <p className="text-xs text-gray-300 italic leading-relaxed">"{transcript}"</p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-gray-800 text-gray-400 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button 
                  disabled={!transcript}
                  onClick={() => {
                    alert("Nhật ký giọng nói đã được lưu và chuyển thành văn bản.");
                    onClose();
                  }}
                  className={`flex-1 font-bold py-4 rounded-2xl active:scale-95 transition-all ${
                    transcript ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Lưu Nhật Ký
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AcceptanceModal({ isOpen, onClose, task, onSave }: { isOpen: boolean, onClose: () => void, task: any, onSave?: (taskId: string, checklist: any[], issues: any[]) => void }) {
  const [localChecklist, setLocalChecklist] = useState<any[]>([]);
  const [localIssues, setLocalIssues] = useState<any[]>([]);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [isAddingIssue, setIsAddingIssue] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalChecklist([...(task.checklist || [])]);
      setLocalIssues([...(task.issues || [])]);
    }
  }, [task]);

  const addIssue = () => {
    if (!newIssueTitle) return;
    setLocalIssues([...localIssues, { title: newIssueTitle, status: 'OPEN' }]);
    setNewIssueTitle('');
    setIsAddingIssue(false);
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-5xl bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header matching Screenshot 1 */}
            <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-[#15151e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                  <ListTodo className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{task.name}</h3>
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">MEP</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              
              {/* SMART CHECKLIST - Wide, Read-Only Structure */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">SMART CHECKLIST</h4>
                </div>
                
                <div className="space-y-3">
                  {localChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-[#1C1C28] rounded-xl border border-gray-800 group hover:border-gray-700 transition-colors">
                      <div 
                        onClick={() => {
                          setLocalChecklist(prev => prev.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c));
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all border ${item.completed ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent border-gray-700'}`}
                      >
                        {item.completed && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200 font-medium'}`}>
                          {item.label} {item.required && <span className="text-rose-500 ml-1">*</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PUNCHLIST (LỖI) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">PUNCHLIST (LỖI)</h4>
                  </div>
                  <button 
                    onClick={() => setIsAddingIssue(true)}
                    className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-700 transition-colors"
                  >
                    + Báo lỗi mới
                  </button>
                </div>

                {isAddingIssue && (
                  <div className="flex gap-3 p-4 bg-[#15151e] border border-gray-800 rounded-xl">
                    <input 
                      type="text" 
                      placeholder="Mô tả lỗi phát hiện..." 
                      autoFocus
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white"
                    />
                    <button onClick={addIssue} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg font-bold text-xs uppercase">Lưu</button>
                    <button onClick={() => setIsAddingIssue(false)} className="bg-gray-800 text-gray-400 border border-gray-700 px-4 py-2 rounded-lg font-bold text-xs uppercase">Hủy</button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {localIssues.length === 0 ? (
                    <div className="bg-[#0A1A14] border border-[#103A25] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-xs text-emerald-500/80 font-medium tracking-wide">Không có lỗi nào được ghi nhận.</p>
                    </div>
                  ) : (
                    localIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-[#1A0F14] rounded-xl border border-[#3A101C]">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-200 font-medium">{issue.title}</div>
                        </div>
                        <div className="text-[9px] text-rose-400 uppercase font-bold border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 rounded">
                          {issue.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TÀI CHÍNH HẠNG MỤC - Wide row layout */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">$ TÀI CHÍNH HẠNG MỤC</h4>
                </div>
                <div className="bg-[#1C1C28] rounded-2xl p-6 border border-gray-800 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ngân sách</div>
                      <div className="text-lg font-bold text-white">{task.budget.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Đã chi</div>
                      <div className="text-lg font-bold text-gray-400">{task.spent.toLocaleString('vi-VN')} đ</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (task && onSave) onSave(task.id, localChecklist, localIssues);
                        alert("Hạng mục đã được nghiệm thu thành công.");
                        onClose();
                      }}
                      className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Nghiệm thu
                    </button>
                    <button onClick={() => alert("Đã gửi yêu cầu thanh toán.")} className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
                      Yêu cầu thanh toán
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImportQuotationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-sm bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> Nhập Báo Giá Tự Động
              </h3>
              <button onClick={onClose} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
                <Upload className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Tải lên Báo Giá (PDF/Excel)</h4>
                <p className="text-xs text-gray-500 leading-relaxed">AI sẽ tự động bóc tách hạng mục và tạo Timeline thi công tương ứng.</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-dashed border-white/10">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Kéo thả file vào đây</span>
              </div>
              <button 
                onClick={() => {
                  alert("Đang phân tích báo giá và tạo Timeline...");
                  onClose();
                }}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                Bắt Đầu Phân Tích
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SmartTaskBar({ isOpen, onClose, tasks: _tasks, project: _project }: { isOpen: boolean, onClose: () => void, tasks?: any[], project?: any }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-[#1C1C28]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3 shadow-2xl shadow-indigo-900/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Đánh Giá AI Hàng Ngày</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-white font-medium truncate">Ngày mai: Đổ bê tông sàn tầng 2. Cần chuẩn bị 24m3 bê tông tươi.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isChatOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-white/5 space-y-3"
              >
                <div className="bg-white/5 rounded-xl p-3 text-[11px] text-gray-300 leading-relaxed">
                  <span className="font-bold text-indigo-400">Bạn có thể hỏi:</span> "Tiến độ có kịp không?", "Cần thêm bao nhiêu thợ?", "Dự báo thời tiết ngày mai?"
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Hỏi AI về công việc..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button onClick={() => alert('Đang xử lý...')} className="p-2 bg-indigo-600 rounded-xl text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaceRecognitionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-sm bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Chấm Công AI
              </h3>
              <button onClick={onClose} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 border-2 border-indigo-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 border border-indigo-500/30 rounded-full"></div>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-800 bg-gray-900 flex items-center justify-center">
                  <UserCircle className="w-20 h-20 text-gray-700" />
                </div>
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-10"
                />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Đang nhận diện...</h4>
                <p className="text-xs text-gray-500">Vui lòng giữ khuôn mặt trong khung hình</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Kết quả dự kiến</div>
                <div className="text-sm font-bold text-white">Nguyễn Văn Hùng (Kỹ sư)</div>
                <div className="text-[10px] text-gray-500">Độ chính xác: 98.5%</div>
              </div>
              <button 
                onClick={() => {
                  alert("Chấm công thành công cho Nguyễn Văn Hùng");
                  onClose();
                }}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                Xác Nhận Chấm Công
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PaymentDetailsModal = ({ isOpen, onClose, payments }: { isOpen: boolean, onClose: () => void, payments: Payment[] }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        className="fixed inset-0 z-[80] bg-white flex flex-col"
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết thanh toán</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Nội dung</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Số tiền</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-bold text-gray-900">{payment.content}</div>
                    <div className="text-[10px] text-gray-500">{payment.date} • {payment.recipient}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-xs font-bold text-emerald-600">{payment.amount.toLocaleString('vi-VN')} đ</div>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
const FinancialCard = ({ spent, budget, contractValue }: { spent: number, budget: number, contractValue: number }) => {
  const data = [
    { name: 'Đã chi', value: spent, color: '#6366f1' },
    { name: 'Còn lại', value: budget - spent, color: '#1e1b4b' },
  ];

  const overBudget = spent > budget;
  const percentage = Math.round((spent / budget) * 100);

  return (
    <div className="bg-[#1C1C28] rounded-2xl p-5 border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Tài Chính Dự Án
        </h3>
        {overBudget && (
          <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
            <AlertTriangle className="w-3 h-3" /> VƯỢT ĐỊNH MỨC
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="w-24 h-24 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={30}
                outerRadius={45}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{percentage}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Đã giải ngân</div>
            <div className="text-lg font-bold text-white">{spent.toLocaleString('vi-VN')} đ</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Ngân sách dự kiến</div>
            <div className="text-sm font-medium text-gray-300">{budget.toLocaleString('vi-VN')} đ</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
        <div className="text-xs text-gray-400">Giá trị hợp đồng:</div>
        <div className="text-xs font-bold text-emerald-400">{contractValue.toLocaleString('vi-VN')} đ</div>
      </div>
    </div>
  );
};

const WeatherWidget = ({ weather, temp }: { weather: string, temp: number }) => (
  <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 rounded-2xl p-4 border border-indigo-500/30 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-500/20 rounded-xl">
        <Sun className="w-6 h-6 text-orange-400" />
      </div>
      <div>
        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Thời tiết hiện tại</div>
        <div className="text-lg font-bold text-white">{weather}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold text-white flex items-center gap-1 justify-end">
        <ThermometerSun className="w-5 h-5 text-rose-400" />
        {temp}°C
      </div>
      <div className="text-[10px] text-indigo-300 font-medium">Auto-fetched via API</div>
    </div>
  </div>
);

// --- Main App Component ---


function CreateProjectModal({ isOpen, onClose, onCreated }: { isOpen: boolean, onClose: () => void, onCreated: (project: any) => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  
  const handleSave = async () => {
    if (!name) return alert("Tên dự án bắt buộc!");
    onCreated({
       name, address, status: 'MỚI', progress: 0, budget: Number(budget) || 0, spent: 0,
       start_date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">Tạo Dự Án Mới</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4">
               <div><label className="text-xs font-bold text-gray-500">Tên dự án</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={name} onChange={e=>setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Địa chỉ</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={address} onChange={e=>setAddress(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Ngân sách dự kiến</label><input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={budget} onChange={e=>setBudget(e.target.value)} /></div>
               <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-4">Lưu Dự Án</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function DailyLogModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (log: any) => Promise<boolean> }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherMorning, setWeatherMorning] = useState('Nắng - Làm bình thường');
  const [weatherAfternoon, setWeatherAfternoon] = useState('Nắng - Làm bình thường');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mocking photo upload via Base64 simulation or external URL
  const handlePhotoUpload = () => {
     // Simulated successful photo capture
     setPhotos(prev => [...prev, 'https://images.unsplash.com/photo-1541888081696-6eecac213cc8?w=100&h=100&fit=crop']);
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await onSubmit({
       date,
       weatherMorning,
       weatherAfternoon,
       progress: Number(progress),
       notes,
       photo_urls: photos
    });
    setLoading(false);
    if(success) {
       alert("Đã lưu nhật ký!");
       onClose();
    } else {
       alert("Lỗi khi lưu nhật ký.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">Báo Cáo Nhật Ký Mới</h3><button disabled={loading} onClick={onClose}><X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4 overflow-y-auto">
               <div><label className="text-xs font-bold text-gray-500">Ngày</label><input type="date" className="w-full border rounded-xl px-3 py-2 mt-1" value={date} onChange={e=>setDate(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Thời tiết sáng</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={weatherMorning} onChange={e=>setWeatherMorning(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Thời tiết chiều</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={weatherAfternoon} onChange={e=>setWeatherAfternoon(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">% Tiến độ hoàn thành thêm</label><input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={progress} onChange={e=>setProgress(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Ghi chú sự cố / phát sinh</label><textarea className="w-full border rounded-xl px-3 py-2 mt-1" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
               
               <div>
                 <label className="text-xs font-bold text-gray-500 mb-2 block">Hình ảnh đính kèm (Mô phỏng)</label>
                 <div className="flex gap-2 flex-wrap">
                   {photos.map((url, idx) => <img key={idx} src={url} className="w-16 h-16 object-cover rounded-lg border"/>)}
                   <button onClick={handlePhotoUpload} className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                     <Camera className="w-6 h-6"/>
                   </button>
                 </div>
               </div>

               <button disabled={loading} onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-6">
                 {loading ? "Đang lưu..." : "Gửi Báo Cáo"}
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Construction = () => {
  const [userRole, setUserRole] = useState<UserRole>('ENGINEER');
  const [currentView, setCurrentView] = useState('DASHBOARD');
  
  const { projects: dbProjects, tasks: dbTasks, logs: dbLogs, createProject, createTimelineTasks, updateTaskStatusChecklist, submitDailyLog } = useConstructionData();
  const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Tie mock states to DB if available
  const activeProjects = dbProjects.length > 0 ? (dbProjects as any) : INITIAL_PROJECTS;
  const activeTasks = dbTasks.length > 0 ? (dbTasks as any) : INITIAL_TASKS;

  const [projects] = useState<Project[]>(INITIAL_PROJECTS); // Leaving legacy just in case
  const [selectedProject, setSelectedProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  useEffect(() => {
     if (dbProjects.length > 0 && (!selectedProject || selectedProject.id === INITIAL_PROJECTS[0].id)) {
        setSelectedProject(dbProjects[0] as any);
     }
  }, [dbProjects]);

  useEffect(() => {
     if (dbTasks.length > 0) setTasks(dbTasks as any);
  }, [dbTasks]);

  const [payments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [logs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeLog, setActiveLog] = useState<DailyLog>(logs[0]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMaterialRequestOpen, setIsMaterialRequestOpen] = useState(false);
  const [isFaceRecognitionOpen, setIsFaceRecognitionOpen] = useState(false);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [selectedTaskForAcceptance, setSelectedTaskForAcceptance] = useState<Task | null>(null);
  const [isVoiceLogOpen, setIsVoiceLogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isSmartTaskBarOpen, setIsSmartTaskBarOpen] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINANCIALS' | 'HISTORY' | 'SUBS'>('OVERVIEW');
  const [progressViewMode, setProgressViewMode] = useState<'LIST' | 'TIMELINE' | 'GALLERY'>('TIMELINE');
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  // --- Logic ---

  const projectStats = useMemo(() => {
    const totalBudget = tasks.reduce((acc, t) => acc + t.budget, 0);
    const totalSpent = tasks.reduce((acc, t) => acc + t.spent, 0);
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    return { totalBudget, totalSpent, progress };
  }, [tasks]);

  const canStartTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    if (task.dependencies.length === 0) return true;
    
    return task.dependencies.every(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask?.status === 'DONE';
    });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    if (newStatus === 'DOING' && !canStartTask(taskId)) {
      alert("Hạng mục này chưa thể bắt đầu. Vui lòng hoàn thành các hạng mục tiền đề trước.");
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  // --- Views ---

  const renderRoleSwitcher = () => (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1C1C28]/80 backdrop-blur-md border border-gray-800 rounded-full p-1 flex gap-1 z-50 shadow-2xl">
      {(['HOMEOWNER', 'ENGINEER', 'MANAGER'] as UserRole[]).map(role => (
        <button
          key={role}
          onClick={() => setUserRole(role)}
          className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
            userRole === role 
            ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
            : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {role === 'HOMEOWNER' ? 'CHỦ NHÀ' : role === 'ENGINEER' ? 'KỸ SƯ' : 'QUẢN LÝ'}
        </button>
      ))}
    </div>
  );

  

  const renderProgressView = () => (
    <div className={`flex flex-col h-full pb-32 ${userRole === 'HOMEOWNER' ? 'bg-[#F5F5F5]' : 'bg-[#0A0A0F]'}`}>
      {/* Header */}
      <div className={`p-4 sticky top-0 z-10 border-b ${userRole === 'HOMEOWNER' ? 'bg-white border-gray-100' : 'bg-[#1C1C28] border-gray-800'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-xl font-bold ${userRole === 'HOMEOWNER' ? 'text-gray-900' : 'text-white'}`}>Tiến Độ Công Trình</h1>
          
  <div className="flex gap-2">
    <button onClick={() => setIsProjectCreateOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95">
      <Plus className="w-4 h-4" /> Tạo Dự Án
    </button>
    <button onClick={() => setIsQuotationModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95">
      <FileSpreadsheet className="w-4 h-4" /> AI Tiến Độ
    </button>
  </div>

        </div>

        {/* View Switcher */}
        <div className={`flex p-1 rounded-2xl ${userRole === 'HOMEOWNER' ? 'bg-gray-100' : 'bg-gray-900'}`}>
          <button 
            onClick={() => setProgressViewMode('TIMELINE')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${progressViewMode === 'TIMELINE' ? (userRole === 'HOMEOWNER' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-800 text-white shadow-sm') : 'text-gray-500'}`}
          >
            Dòng thời gian (Gantt)
          </button>
          <button 
            onClick={() => setProgressViewMode('LIST')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${progressViewMode === 'LIST' ? (userRole === 'HOMEOWNER' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-800 text-white shadow-sm') : 'text-gray-500'}`}
          >
            Danh sách
          </button>
          <button 
            onClick={() => setProgressViewMode('GALLERY')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${progressViewMode === 'GALLERY' ? (userRole === 'HOMEOWNER' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-800 text-white shadow-sm') : 'text-gray-500'}`}
          >
            Thư viện ảnh
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        {progressViewMode === 'TIMELINE' ? (
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Đúng hạn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Trễ hạn</span>
                </div>
              </div>
              <div className="text-[10px] font-bold text-indigo-600 uppercase">Tháng 03/2026</div>
            </div>

            {/* Gantt Chart Simulation */}
            <div className={`rounded-3xl p-6 shadow-sm border space-y-8 overflow-x-auto no-scrollbar ${userRole === 'HOMEOWNER' ? 'bg-white border-gray-100' : 'bg-[#1C1C28] border-gray-800'}`}>
              {[
                { name: 'Móng & Cọc', start: 0, end: 30, status: 'DONE', color: 'bg-emerald-500' },
                { name: 'Khung bê tông T1', start: 25, end: 55, status: 'DONE', color: 'bg-emerald-500' },
                { name: 'Xây tường bao T1', start: 50, end: 85, status: 'LATE', color: 'bg-rose-500', delay: 3 },
                { name: 'Khung bê tông T2', start: 80, end: 100, status: 'TODO', color: 'bg-indigo-500' },
                { name: 'Điện nước âm tường', start: 90, end: 100, status: 'TODO', color: 'bg-indigo-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${userRole === 'HOMEOWNER' ? 'text-gray-700' : 'text-white'}`}>{item.name}</span>
                      {item.status === 'LATE' && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-bold uppercase">Trễ {item.delay} ngày</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{item.status === 'DONE' ? 'Hoàn thành' : 'Đang thực hiện'}</span>
                  </div>
                  <div className={`relative h-4 w-full rounded-full overflow-hidden ${userRole === 'HOMEOWNER' ? 'bg-gray-50' : 'bg-gray-900'}`}>
                    <motion.div 
                      initial={{ left: 0, width: 0 }}
                      animate={{ left: `${item.start}%`, width: `${item.end - item.start}%` }}
                      className={`absolute h-full rounded-full ${item.color} shadow-sm`}
                    />
                  </div>
                  
                  {/* AI Proposal for Late Tasks */}
                  {item.status === 'LATE' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-2xl p-3 flex gap-3 items-start ${userRole === 'HOMEOWNER' ? 'bg-rose-50 border-rose-100' : 'bg-rose-900/10 border-rose-500/20'}`}
                    >
                      <Lightbulb className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className={`text-[10px] font-medium leading-relaxed ${userRole === 'HOMEOWNER' ? 'text-rose-700' : 'text-rose-300'}`}>
                          <span className="font-bold">Đề xuất AI:</span> Để kịp tiến độ đổ sàn T2 vào 28/03, cần tăng cường thêm 04 thợ xây và làm thêm ca tối (18h-21h) trong 3 ngày tới.
                        </p>
                        <button onClick={() => alert("Đã cập nhật nguồn lực theo đề xuất AI.")} className="text-[9px] font-bold text-rose-600 uppercase tracking-wider hover:underline">Áp dụng ngay</button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend / Info */}
            <div className={`p-4 rounded-2xl border ${userRole === 'HOMEOWNER' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-900/10 border-indigo-500/20'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${userRole === 'HOMEOWNER' ? 'text-indigo-900' : 'text-indigo-300'}`}>Dự báo hoàn thành</h4>
                  <p className={`text-[10px] ${userRole === 'HOMEOWNER' ? 'text-indigo-700' : 'text-indigo-400'}`}>Dự kiến bàn giao: <span className="font-bold">15/08/2026</span> (Đúng kế hoạch)</p>
                </div>
              </div>
            </div>
          </div>
        ) : progressViewMode === 'LIST' ? (
          <div className="space-y-4">
            {/* Existing Progress List */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Hạng mục phần thô</h3>
              <div className={`rounded-3xl p-6 shadow-sm border space-y-6 ${userRole === 'HOMEOWNER' ? 'bg-white border-gray-100' : 'bg-[#1C1C28] border-gray-800'}`}>
                {[
                  { name: 'Công tác chuẩn bị', progress: 100 },
                  { name: 'Đào đất, móng', progress: 100 },
                  { name: 'Bê tông cốt thép móng', progress: 100 },
                  { name: 'Xây tường bao', progress: 85 },
                  { name: 'Đổ bê tông cột', progress: 40 },
                  { name: 'Lắp đặt điện nước', progress: 10 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${userRole === 'HOMEOWNER' ? 'text-gray-700' : 'text-white'}`}>{item.name}</span>
                      <span className="text-xs font-bold text-indigo-600">{item.progress}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${userRole === 'HOMEOWNER' ? 'bg-gray-100' : 'bg-gray-900'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Ép cọc đại trà', date: '15/01/2026', img: 'https://picsum.photos/seed/pile/400/300' },
                { title: 'Đổ bê tông móng', date: '22/01/2026', img: 'https://picsum.photos/seed/foundation/400/300' },
                { title: 'Lắp dựng cốt thép cột T1', date: '05/02/2026', img: 'https://picsum.photos/seed/steel/400/300' },
                { title: 'Đổ bê tông sàn T1', date: '12/02/2026', img: 'https://picsum.photos/seed/slab/400/300' },
                { title: 'Xây tường bao T1', date: '25/02/2026', img: 'https://picsum.photos/seed/wall/400/300' },
                { title: 'Lắp đặt điện nước T1', date: '02/03/2026', img: 'https://picsum.photos/seed/mep/400/300' },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl overflow-hidden border shadow-sm ${userRole === 'HOMEOWNER' ? 'bg-white border-gray-100' : 'bg-[#1C1C28] border-gray-800'}`}
                >
                  <div className="aspect-[4/3] relative group">
                    <img src={item.img} className="w-full h-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className={`text-[10px] font-bold ${userRole === 'HOMEOWNER' ? 'text-gray-900' : 'text-white'} truncate`}>{item.title}</div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase mt-1">{item.date}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold ${userRole === 'HOMEOWNER' ? 'border-gray-200 text-gray-400' : 'border-gray-800 text-gray-600'}`}>
              <Camera className="w-5 h-5" /> Tải thêm hình ảnh
            </button>
          </div>
        )}
      </div>
    </div>
  );

const renderHomeownerView = () => (
    currentView === 'PROGRESS' ? renderProgressView() : (
    <div className="bg-[#F5F5F5] min-h-full p-4 space-y-6 pb-32">
      {/* Project Overview Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {selectedProject.address}
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {selectedProject.status}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiến độ tổng thể</span>
            <span className="text-2xl font-bold text-indigo-600">{selectedProject.progress}%</span>
          </div>
          <ProgressBar progress={selectedProject.progress} />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
            <span>Bắt đầu: {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')}</span>
            <span>Dự kiến: {new Date(new Date(selectedProject.startDate).getTime() + 150*24*60*60*1000).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Financial Warning if applicable */}
      {selectedProject.spent > selectedProject.budget && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-900 uppercase tracking-tight">Cảnh báo ngân sách</div>
            <div className="text-[10px] text-rose-700">Chi phí hiện tại đã vượt định mức 5.2%</div>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard Grid */}
      <section>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Tổng quan dự án</h3>
        <DashboardGrid>
          <DashboardCard 
            icon={<DollarSign className="w-5 h-5 text-indigo-500" />} 
            label="Giá trị hợp đồng" 
            value={`${(selectedProject.budget / 1000000000).toFixed(1)} Tỷ`} 
          />
          <DashboardCard 
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
            label="Đã thanh toán" 
            value="1.2 Tỷ" 
            onClick={() => setIsPaymentModalOpen(true)}
          />
          <DashboardCard 
            icon={<AlertCircle className="w-5 h-5 text-orange-500" />} 
            label="Phát sinh" 
            value="45 Tr" 
          />
          <DashboardCard 
            icon={<FileText className="w-5 h-5 text-purple-500" />} 
            label="Hợp đồng" 
            value="Xem ngay" 
          />
          <DashboardCard 
            icon={<ImageIcon className="w-5 h-5 text-rose-500" />} 
            label="Thư viện ảnh" 
            value="24 Ảnh" 
            onClick={() => {
              setCurrentView('PROGRESS');
              setProgressViewMode('GALLERY');
            }}
          />
          <DashboardCard 
            icon={<Camera className="w-5 h-5 text-blue-500" />} 
            label="Camera Live" 
            value="02 Cam" 
            onClick={() => setIsCameraOpen(true)}
          />
        </DashboardGrid>
      </section>

      {/* Contract & Legal Section */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hợp đồng & Pháp lý</h3>
          <button className="text-[10px] font-bold text-indigo-600 uppercase">Tất cả</button>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-3">
          {[
            { name: 'Hợp đồng thi công trọn gói', type: 'PDF', size: '2.4 MB', date: '12/01/2024' },
            { name: 'Giấy phép xây dựng', type: 'JPG', size: '1.1 MB', date: '05/01/2024' },
            { name: 'Bản vẽ thiết kế kỹ thuật', type: 'PDF', size: '15.8 MB', date: '10/01/2024' },
          ].map((doc, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-700">{doc.name}</div>
                <div className="text-[10px] text-gray-400 font-medium">{doc.type} • {doc.size} • {doc.date}</div>
              </div>
              <Download className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      {/* Payment Milestones */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tiến độ thanh toán</h3>
          <button className="text-[10px] font-bold text-indigo-600 uppercase">Chi tiết</button>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          {[
            { label: 'Đợt 1: Tạm ứng hợp đồng', amount: '200.000.000', status: 'PAID', date: '15/01/2024' },
            { label: 'Đợt 2: Hoàn thành phần móng', amount: '350.000.000', status: 'PAID', date: '20/02/2024' },
            { label: 'Đợt 3: Hoàn thành sàn T1', amount: '400.000.000', status: 'PENDING', date: 'Dự kiến 15/03' },
            { label: 'Đợt 4: Hoàn thành sàn T2', amount: '400.000.000', status: 'WAITING', date: 'Dự kiến 30/03' },
          ].map((m, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 
                m.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {m.status === 'PAID' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-700">{m.label}</div>
                <div className="text-[10px] text-gray-400 font-medium">{m.date}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900">{m.amount} đ</div>
                <div className={`text-[8px] font-bold uppercase ${
                  m.status === 'PAID' ? 'text-emerald-500' : 
                  m.status === 'PENDING' ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {m.status === 'PAID' ? 'Đã thu' : m.status === 'PENDING' ? 'Chờ thu' : 'Chưa đến'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Structural Progress List */}
      <section>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Hạng mục phần thô</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          {[
            { name: 'Công tác chuẩn bị', progress: 100 },
            { name: 'Đào đất, móng', progress: 100 },
            { name: 'Bê tông cốt thép móng', progress: 100 },
            { name: 'Xây tường bao', progress: 85 },
            { name: 'Đổ bê tông cột', progress: 40 },
            { name: 'Lắp đặt điện nước', progress: 10 },
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">{item.name}</span>
                <span className="text-xs font-bold text-indigo-600">{item.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ));

  const renderEngineerView = () => (
    currentView === 'PROGRESS' ? renderProgressView() : (
    <div className="flex flex-col h-full pb-32">
      {/* Header */}
      <div className="p-4 bg-[#0A0A0F] sticky top-0 z-10 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="cursor-pointer" onClick={() => setIsProjectSelectorOpen(true)}>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                Hiện Trường <ChevronLeft className="w-4 h-4 rotate-270" />
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedProject.name}</p>
            </div>
          </div>
          <button className="p-2 bg-gray-800 rounded-xl text-gray-400">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <WeatherWidget weather={logs[0].weatherMorning} temp={logs[0].temperature} />

        {/* Navigation Tabs for Engineer */}
        <div className="flex bg-[#1C1C28] p-1 rounded-2xl border border-gray-800 mt-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white' : 'text-gray-500'
            }`}
          >
            Kanban
          </button>
          <button 
            onClick={() => setActiveTab('FINANCIALS')}
            className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'FINANCIALS' ? 'bg-indigo-600 text-white' : 'text-gray-500'
            }`}
          >
            Chi phí
          </button>
        </div>
      </div>

      {activeTab === 'FINANCIALS' && (
        <div className="p-4">
          {renderFinancialsTab()}
        </div>
      )}

      {activeTab === 'OVERVIEW' && (
        <>
          {/* Bảng Kanban */}
          <div className="flex-1 overflow-x-auto p-4 flex gap-4">
        {(['TODO', 'DOING', 'REVIEW', 'DONE'] as const).map(status => (
          <div key={status} className="min-w-[280px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === 'TODO' ? 'bg-gray-500' : 
                  status === 'DOING' ? 'bg-indigo-500' : 
                  status === 'REVIEW' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}></div>
                {status === 'TODO' ? 'Cần làm' : status === 'DOING' ? 'Đang làm' : status === 'REVIEW' ? 'Chờ duyệt' : 'Hoàn thành'}
              </h3>
              <span className="text-[10px] font-bold text-gray-600 bg-gray-900 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {tasks.filter(t => t.status === status).map(task => (
                <motion.div 
                  layoutId={task.id}
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className={`bg-[#1C1C28] rounded-2xl p-4 border cursor-pointer active:scale-95 transition-all ${
                    task.issues.length > 0 ? 'border-rose-500/30' : 'border-gray-800'
                  } shadow-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{task.category}</div>
                    {task.issues.length > 0 && (
                      <div className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        {task.issues.length} LỖI
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-3 leading-tight">{task.name}</h4>
                  
                  {task.issues.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {task.issues.map(issue => (
                        <div key={issue.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{issue.title}</span>
                            <span className="text-[8px] font-bold text-rose-500/70">{issue.status}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[8px] font-bold text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-[#1C1C28] flex items-center justify-center text-[8px] font-bold text-gray-400">
                        {task.subcontractor.charAt(0)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {status === 'TODO' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskStatusChange(task.id, 'DOING');
                          }}
                          className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {status === 'DOING' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskStatusChange(task.id, 'REVIEW');
                          }}
                          className="p-1.5 bg-orange-600/20 text-orange-400 rounded-lg border border-orange-500/30"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )}

  {/* Quick Action Button */}
      <div className="fixed bottom-32 right-6 z-50">
        <button 
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isQuickActionOpen ? 'bg-rose-600 rotate-45' : 'bg-indigo-600'
          }`}
        >
          <Plus className="w-8 h-8 text-white" />
        </button>

        <AnimatePresence>
          {isQuickActionOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
              {[
                { icon: <Lightbulb className="w-5 h-5" />, label: 'Đánh Giá AI', color: 'bg-indigo-600', onClick: () => setIsSmartTaskBarOpen(true) },
                { icon: <Camera className="w-5 h-5" />, label: 'Chụp Nhật Ký', color: 'bg-emerald-600' },
                { icon: <Mic className="w-5 h-5" />, label: 'Ghi Âm Nhật Ký', color: 'bg-violet-600', onClick: () => setIsVoiceLogOpen(true) },
                { icon: <AlertTriangle className="w-5 h-5" />, label: 'Báo Cáo Sự Cố', color: 'bg-rose-600' },
                { icon: <Box className="w-5 h-5" />, label: 'Yêu Cầu Vật Tư', color: 'bg-orange-600', onClick: () => setIsMaterialRequestOpen(true) },
                { icon: <Users className="w-5 h-5" />, label: 'Chấm Công AI', color: 'bg-indigo-600', onClick: () => setIsFaceRecognitionOpen(true) },
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    if (action.onClick) action.onClick();
                    setIsQuickActionOpen(false);
                  }}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-[#1C1C28] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white shadow-xl`}>
                    {action.icon}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[70] bg-[#0A0A0F] flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-[#1C1C28]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <ListChecks className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">{selectedTask.name}</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{selectedTask.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Construction Standards Section */}
              {selectedTask.standards && (
                <section>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Tiêu chuẩn thi công
                  </h3>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <img 
                      src={selectedTask.standards[0]} 
                      className="w-full h-auto" 
                      alt="Standards" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-4 bg-gray-50">
                      <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Quy định chung</h4>
                      <ul className="space-y-2">
                        <li className="text-[10px] text-gray-600 flex gap-2">
                          <span className="font-bold text-indigo-600">01.</span>
                          Sát tường phải chèn sát hoặc khoan râu sắt liên kết.
                        </li>
                        <li className="text-[10px] text-gray-600 flex gap-2">
                          <span className="font-bold text-indigo-600">02.</span>
                          Thiết kế bản vẽ mặt cắt (vị trí bể tự hoại) tránh sai sót.
                        </li>
                        <li className="text-[10px] text-gray-600 flex gap-2">
                          <span className="font-bold text-indigo-600">03.</span>
                          Bả lanh tô bê tông cốt thép đúc sẵn tại nhà máy.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Checklist Section */}
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Smart Checklist
                </h3>
                <div className="space-y-2">
                  {selectedTask.checklist.map(item => (
                    <div key={item.id} className="bg-[#1C1C28] rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
                              ...t,
                              checklist: t.checklist.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c)
                            } : t));
                            setSelectedTask(prev => prev ? {
                              ...prev,
                              checklist: prev.checklist.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c)
                            } : null);
                          }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {item.label}
                          {item.required && <span className="text-rose-500 ml-1">*</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Issues Section */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Punchlist (Lỗi)
                  </h3>
                  <button className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg border border-indigo-400/20">
                    + Báo lỗi mới
                  </button>
                </div>
                {selectedTask.issues.length === 0 ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 text-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                    <p className="text-xs text-emerald-500/60">Không có lỗi nào được ghi nhận.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTask.issues.map(issue => (
                      <div key={issue.id} className="bg-[#1C1C28] rounded-2xl p-4 border border-rose-500/20">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            issue.severity === 'HIGH' ? 'bg-rose-500' : 
                            issue.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">{issue.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="aspect-video rounded-lg overflow-hidden border border-gray-800 relative">
                            <img src={issue.photoBefore} className="w-full h-full object-cover" alt="Before" />
                            <span className="absolute bottom-1 left-1 bg-black/60 text-[8px] px-1 rounded text-white font-bold">TRƯỚC</span>
                          </div>
                          <div className="aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center justify-center text-center">
                            <Camera className="w-4 h-4 text-gray-700 mb-1" />
                            <span className="text-[8px] text-gray-600 font-bold uppercase">Chụp ảnh sau sửa</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Financial Section */}
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Tài chính hạng mục
                </h3>
                <div className="bg-[#1C1C28] rounded-2xl p-4 border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Ngân sách:</span>
                    <span className="text-sm font-bold text-white">{selectedTask.budget.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Đã chi:</span>
                    <span className="text-sm font-bold text-indigo-400">{selectedTask.spent.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setSelectedTaskForAcceptance(selectedTask);
                        setIsAcceptanceModalOpen(true);
                      }}
                      className="bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Nghiệm thu
                    </button>
                    <button className="bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-indigo-900/20">
                      Yêu cầu thanh toán
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material Request Modal */}
      <AnimatePresence>
        {isMaterialRequestOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#1C1C28] w-full max-w-sm rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="p-4 flex justify-between items-center border-b border-gray-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-orange-400" /> Yêu Cầu Vật Tư
                </h3>
                <button onClick={() => setIsMaterialRequestOpen(false)} className="p-2 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Loại vật tư</label>
                  <select className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option>Xi măng</option>
                    <option>Gạch xây</option>
                    <option>Cát xây tô</option>
                    <option>Đá 1x2</option>
                    <option>Sắt thép</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Số lượng</label>
                  <div className="flex gap-3">
                    <input type="number" placeholder="0" className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    <select className="w-24 bg-gray-900 border border-gray-800 rounded-xl px-2 py-3 text-sm text-white focus:outline-none">
                      <option>Bao</option>
                      <option>Viên</option>
                      <option>Khối</option>
                      <option>Tấn</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Ngày cần</label>
                  <input type="date" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <button 
                  onClick={() => {
                    alert("Yêu cầu vật tư đã được gửi đến bộ phận thu mua.");
                    setIsMaterialRequestOpen(false);
                  }}
                  className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                >
                  Gửi Yêu Cầu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    )
  );

  const renderProfileView = () => (
    <div className="bg-[#F5F5F5] min-h-full p-4 space-y-6 pb-32">
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
        <div className="w-24 h-24 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white border-4 border-indigo-50 shadow-xl">
          CL
        </div>
        <h2 className="text-xl font-bold text-gray-900">Cường Lê</h2>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Chủ đầu tư • Premium</p>
        
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">02</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Dự án</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-lg font-bold text-gray-900">15</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Hợp đồng</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">128</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Tài liệu</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        {[
          { icon: <User className="w-5 h-5" />, label: 'Thông tin cá nhân' },
          { icon: <ShieldCheck className="w-5 h-5" />, label: 'Bảo mật & Quyền riêng tư' },
          { icon: <Bell className="w-5 h-5" />, label: 'Cài đặt thông báo' },
          { icon: <HelpCircle className="w-5 h-5" />, label: 'Trung tâm trợ giúp' },
          { icon: <LogOut className="w-5 h-5" />, label: 'Đăng xuất', color: 'text-rose-500' },
        ].map((item, idx) => (
          <button key={idx} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-gray-50 ${item.color || 'text-gray-600'}`}>
                {item.icon}
              </div>
              <span className={`text-sm font-bold ${item.color || 'text-gray-700'}`}>{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );

  const ExpenseModal = () => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'ENGINEER' | 'ADDITIONAL'>('ENGINEER');

    const handleSubmit = () => {
      const newExpense: Expense = {
        id: `e${expenses.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        description,
        amount: parseInt(amount),
        type,
        status: 'PENDING',
        requestedBy: 'Kỹ sư Nam'
      };
      setExpenses([newExpense, ...expenses]);
      setIsExpenseModalOpen(false);
      setDescription('');
      setAmount('');
    };

    return (
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1C1C28] w-full max-w-md rounded-3xl border border-gray-800 p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" /> Đề xuất chi phí
                </h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loại chi phí</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setType('ENGINEER')}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${type === 'ENGINEER' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Kỹ sư
                    </button>
                    <button 
                      onClick={() => setType('ADDITIONAL')}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${type === 'ADDITIONAL' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      Phát sinh
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mô tả chi tiết</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ví dụ: Phụ cấp tăng ca, Mua thêm vật tư..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Số tiền (VNĐ)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!description || !amount}
                className="w-full bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                Gửi đề xuất
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const renderFinancialsTab = () => (
    <div className="space-y-6">
      {/* Budget vs Actual */}
      <div className="bg-[#1C1C28] rounded-3xl p-6 border border-gray-800">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" /> Ngân Sách vs Thực Tế
        </h3>
        <div className="space-y-6">
          {[
            { label: 'Phần thô', budget: 850, actual: 820, color: 'bg-indigo-500' },
            { label: 'Hoàn thiện', budget: 1200, actual: 450, color: 'bg-emerald-500' },
            { label: 'Nội thất', budget: 600, actual: 0, color: 'bg-amber-500' },
            { label: 'Phát sinh', budget: 100, actual: 125, color: 'bg-rose-500', warning: true },
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">{item.actual} Tr</span>
                  <span className="text-[10px] text-gray-500 ml-1">/ {item.budget} Tr</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                  style={{ width: `${Math.min(100, (item.actual / item.budget) * 100)}%` }}
                ></div>
              </div>
              {item.warning && (
                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                  <AlertTriangle className="w-3 h-3" /> Vượt định mức 25% - Cần phê duyệt
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engineer & Additional Expenses */}
      <div className="bg-[#1C1C28] rounded-3xl p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Chi phí Kỹ sư & Phát sinh
          </h3>
          {userRole === 'ENGINEER' && (
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="space-y-4">
          {expenses.map((expense, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                expense.type === 'ENGINEER' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {expense.type === 'ENGINEER' ? <User className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{expense.description}</div>
                <div className="text-[10px] text-gray-500">{expense.date} • {expense.requestedBy}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{expense.amount.toLocaleString('vi-VN')} đ</div>
                <div className={`text-[10px] font-bold uppercase ${
                  expense.status === 'APPROVED' ? 'text-emerald-400' : 
                  expense.status === 'PENDING' ? 'text-amber-400' : 'text-rose-400'
                }`}>{expense.status === 'APPROVED' ? 'Đã duyệt' : expense.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Milestones */}
      <div className="bg-[#1C1C28] rounded-3xl p-6 border border-gray-800">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" /> Đợt Thanh Toán
        </h3>
        <div className="space-y-4">
          {payments.map((payment, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                payment.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 
                payment.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
              }`}>
                {payment.status === 'PAID' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{payment.milestone}</div>
                <div className="text-[10px] text-gray-500">{payment.date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{payment.amount.toLocaleString('vi-VN')} đ</div>
                <div className={`text-[10px] font-bold uppercase ${
                  payment.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                }`}>{payment.status === 'PAID' ? 'Đã thu' : 'Chờ thu'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
        <FileText className="w-5 h-5" /> Xuất Báo Cáo Tài Chính
      </button>
    </div>
  );

  const renderManagerView = () => (
    currentView === 'PROGRESS' ? renderProgressView() : (
    <div className="p-4 space-y-6 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Quản Trị Dự Án</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold border border-gray-700">
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-[#1C1C28] p-1 rounded-2xl border border-gray-800 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white' : 'text-gray-500'
          }`}
        >
          Tổng quan
        </button>
        <button 
          onClick={() => setActiveTab('FINANCIALS')}
          className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'FINANCIALS' ? 'bg-indigo-600 text-white' : 'text-gray-500'
          }`}
        >
          Tài chính
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'HISTORY' ? 'bg-indigo-600 text-white' : 'text-gray-500'
          }`}
        >
          Lịch sử
        </button>
        <button 
          onClick={() => setActiveTab('SUBS')}
          className={`flex-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'SUBS' ? 'bg-indigo-600 text-white' : 'text-gray-500'
          }`}
        >
          Thầu phụ
        </button>
      </div>

      {activeTab === 'FINANCIALS' && renderFinancialsTab()}

      {activeTab === 'OVERVIEW' && (
        <>
          {/* Pending Approvals (Only for Manager) */}
          {userRole === 'MANAGER' && expenses.some(e => e.status === 'PENDING') && (
            <section>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Cần phê duyệt ({expenses.filter(e => e.status === 'PENDING').length})
                </h3>
              </div>
              <div className="space-y-3">
                {expenses.filter(e => e.status === 'PENDING').map((expense, idx) => (
                  <div key={idx} className="bg-[#1C1C28] rounded-3xl p-4 border border-rose-500/20 shadow-lg shadow-rose-900/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expense.type === 'ENGINEER' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {expense.type === 'ENGINEER' ? <User className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{expense.description}</div>
                          <div className="text-[10px] text-gray-500">{expense.requestedBy} • {expense.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{expense.amount.toLocaleString('vi-VN')} đ</div>
                        <div className="text-[10px] text-rose-400 font-bold uppercase">{expense.type === 'ENGINEER' ? 'Kỹ sư' : 'Phát sinh'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, status: 'APPROVED' } : e))}
                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                      >
                        Phê duyệt
                      </button>
                      <button 
                        onClick={() => setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, status: 'REJECTED' } : e))}
                        className="flex-1 py-2 bg-rose-600/20 text-rose-400 text-[10px] font-bold rounded-xl border border-rose-500/20 uppercase tracking-wider active:scale-95 transition-all"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Advisor Section */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-3xl p-6 border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Lightbulb className="w-8 h-8 text-indigo-400/30" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Cố Vấn Dự Án AI
            </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs text-gray-300 leading-relaxed">
                    Dựa trên dữ liệu thời tiết, ngày mai có khả năng mưa lớn (80%). Tôi đề xuất lùi lịch đổ bê tông sàn tầng 1 sang ngày kia để đảm bảo chất lượng.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs text-gray-300 leading-relaxed">
                    Hạng mục "Xây tường bao" đang có 1 lỗi chưa sửa. Nếu không xử lý trong 48h tới, sẽ ảnh hưởng đến tiến độ lắp đặt điện nước âm tường.
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-indigo-700 transition-all">
                Xem phân tích chi tiết
              </button>
            </div>
          </div>

          {/* High-Level Stats */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Chỉ số vận hành
            </h3>
            <DashboardGrid>
              <DashboardCard 
                icon={<DollarSign className="w-5 h-5 text-emerald-400" />} 
                label="Tổng chi phí" 
                value="1.250 Tr" 
                dark
              />
              <DashboardCard 
                icon={<TrendingUp className="w-5 h-5 text-indigo-400" />} 
                label="Tiến độ" 
                value="45%" 
                dark
              />
              <DashboardCard 
                icon={<Users className="w-5 h-5 text-blue-400" />} 
                label="Nhân công" 
                value="24" 
                dark
              />
              <DashboardCard 
                icon={<AlertTriangle className="w-5 h-5 text-rose-400" />} 
                label="Rủi ro" 
                value="Thấp" 
                dark
              />
            </DashboardGrid>
          </section>

          {/* Cashflow Forecast */}
          <div className="bg-[#1C1C28] rounded-2xl p-5 border border-gray-800">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Dự Báo Dòng Tiền (30 Ngày)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Tuần 1', value: 200 },
                  { name: 'Tuần 2', value: 450 },
                  { name: 'Tuần 3', value: 300 },
                  { name: 'Tuần 4', value: 600 },
                ]}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1C28', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Dự kiến cần chuẩn bị: </span>
              <span className="text-sm font-bold text-indigo-400">1.550.000.000 đ</span>
            </div>
          </div>

          {/* Heatmap / Delay Grid */}
          <div className="bg-[#1C1C28] rounded-2xl p-5 border border-gray-800">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Điểm Nóng Tiến Độ
            </h3>
            <div className="space-y-3">
              {tasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'DONE' ? 'bg-emerald-500' : 
                    task.status === 'DOING' ? 'bg-indigo-500' : 'bg-rose-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium">{task.name}</span>
                      <span className={task.status === 'TODO' ? 'text-rose-400 font-bold' : 'text-gray-500'}>
                        {task.status === 'TODO' ? 'Trễ 2 ngày' : 'Đúng hạn'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-900 rounded-full">
                      <div className={`h-full rounded-full ${
                        task.status === 'DONE' ? 'bg-emerald-500' : 
                        task.status === 'DOING' ? 'bg-indigo-500' : 'bg-rose-500'
                      }`} style={{ width: task.status === 'DONE' ? '100%' : task.status === 'DOING' ? '50%' : '10%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Punchlist Summary */}
          <div className="bg-[#1C1C28] rounded-2xl p-5 border border-gray-800">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-orange-400" />
              Quản Lý Lỗi (Punchlist)
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                <div className="text-xl font-bold text-rose-400">01</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Chưa sửa</div>
              </div>
              <div className="flex-1 text-center p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                <div className="text-xl font-bold text-orange-400">02</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Đang sửa</div>
              </div>
              <div className="flex-1 text-center p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                <div className="text-xl font-bold text-emerald-400">15</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Đã xong</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="w-4 h-4" /> Nhật Ký Hoạt Động
          </h3>
          {[
            { time: '10:30 AM', user: 'Hùng (Kỹ sư)', action: 'Đã cập nhật tiến độ hạng mục "Xây tường bao"', type: 'PROGRESS' },
            { time: '09:15 AM', user: 'Tuấn (Thầu phụ)', action: 'Đã gửi yêu cầu thanh toán đợt 2', type: 'FINANCE' },
            { time: 'Hôm qua', user: 'Hệ thống', action: 'Tự động sao lưu hình ảnh lên Google Drive', type: 'SYSTEM' },
            { time: '2 ngày trước', user: 'Lan (Chủ nhà)', action: 'Đã xem camera trực tuyến', type: 'VIEW' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#1C1C28] p-4 rounded-2xl border border-gray-800 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                {item.type === 'PROGRESS' ? <TrendingUp className="w-5 h-5 text-indigo-400" /> : 
                 item.type === 'FINANCE' ? <DollarSign className="w-5 h-5 text-emerald-400" /> : 
                 <History className="w-5 h-5 text-gray-500" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white mb-1">{item.action}</div>
                <div className="text-[10px] text-gray-500">{item.user} • {item.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'SUBS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Danh Bạ Thầu Phụ
            </h3>
            <button className="text-[10px] font-bold text-indigo-400">+ Thêm mới</button>
          </div>
          {[
            { name: 'Tuấn (Kết cấu)', phone: '0901 234 567', rating: 4.8, tasks: 3 },
            { name: 'Công ty Điện Beta', phone: '0908 888 999', rating: 4.5, tasks: 1 },
            { name: 'Hùng (Đào móng)', phone: '0912 333 444', rating: 4.2, tasks: 2 },
          ].map((sub, idx) => (
            <div key={idx} className="bg-[#1C1C28] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center font-bold text-indigo-400 border border-gray-800">
                  {sub.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{sub.name}</div>
                  <div className="text-[10px] text-gray-500">{sub.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">★ {sub.rating}</div>
                <div className="text-[10px] text-gray-500">{sub.tasks} hạng mục</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ));

  const renderLogsView = () => (
    <div className="bg-white min-h-full p-4 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Nhật Ký Công Việc</h1>
        <button onClick={() => alert("Tính năng chat AI đang trong giai đoạn thử nghiệm.")} className="p-2 bg-indigo-600 rounded-xl text-white">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-4">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Ngày báo cáo</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Buổi sáng</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Buổi chiều</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Tiến độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="p-4">
                  <div className="text-xs font-bold text-gray-900">{log.date}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600">
                    <Sun className="w-3 h-3 text-orange-400" />
                    {log.weatherMorning.split(' - ')[0]}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600">
                    <CloudRain className="w-3 h-3 text-blue-400" />
                    {log.weatherAfternoon.split(' - ')[0]}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-xs font-bold text-indigo-600">+{log.progress}%</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans selection:bg-indigo-500/30">
      {/* Top Navigation Bar */}
      <div className="p-4 flex items-center justify-between bg-[#1C1C28]/50 backdrop-blur-md sticky top-0 z-40 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-indigo-400">QUẢN LÝ THI CÔNG AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <SearchIcon className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-800"></div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Gói Cao Cấp</div>
              <div className="text-xs font-bold text-white">DQH Architects</div>
            </div>
            <div className="w-8 h-8 bg-gray-800 rounded-full border border-gray-700"></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto relative min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={userRole + currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'LOGS' ? renderLogsView() : currentView === 'PROFILE' ? renderProfileView() : (
              <>
                {userRole === 'HOMEOWNER' && renderHomeownerView()}
                {userRole === 'ENGINEER' && renderEngineerView()}
                {userRole === 'MANAGER' && renderManagerView()}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <PaymentDetailsModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        payments={payments} 
      />

      <FaceRecognitionModal 
        isOpen={isFaceRecognitionOpen} 
        onClose={() => setIsFaceRecognitionOpen(false)} 
      />

      <VoiceLogModal 
        isOpen={isVoiceLogOpen} 
        onClose={() => setIsVoiceLogOpen(false)} 
      />

      <AcceptanceModal isOpen={isAcceptanceModalOpen} onClose={() => setIsAcceptanceModalOpen(false)} task={selectedTaskForAcceptance} onSave={(taskId, checklist, issues) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist, issues, status: 'DONE' } : t))} />

      <ImportQuotationModal 
        isOpen={isQuotationModalOpen} 
        onClose={() => setIsQuotationModalOpen(false)} 
      />

      <SmartTaskBar isOpen={isSmartTaskBarOpen} onClose={() => setIsSmartTaskBarOpen(false)} tasks={tasks} project={selectedProject} />

      {/* Role Switcher (Floating) */}
      {renderRoleSwitcher()}
      {ExpenseModal()}

      {/* Bottom Navigation (Mobile Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1C28]/90 backdrop-blur-xl border-t border-gray-800 px-6 py-3 flex justify-between items-center z-40">
        <NavButton icon={<LayoutTemplate className="w-6 h-6" />} label="Dự án" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} />
        <NavButton icon={<Calendar className="w-6 h-6" />} label="Tiến độ" active={currentView === 'PROGRESS'} onClick={() => setCurrentView('PROGRESS')} />
        <div className="w-12"></div> {/* Spacer for Quick Action */}
        <NavButton icon={<FileCheck className="w-6 h-6" />} label="Nhật ký" active={currentView === 'LOGS'} onClick={() => setCurrentView('LOGS')} />
        <NavButton icon={<UserCircle className="w-6 h-6" />} label="Hồ sơ" active={currentView === 'PROFILE'} onClick={() => setCurrentView('PROFILE')} />
      </nav>
      {/* Project Selector Modal */}
      <AnimatePresence>
        {isProjectSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Chọn Dự Án</h2>
                <p className="text-xs text-gray-500">Bạn đang tham gia {projects.length} dự án</p>
              </div>
              <div className="space-y-3">
                {projects.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p);
                      setIsProjectSelectorOpen(false);
                    }}
                    className={`w-full p-4 rounded-3xl border text-left transition-all ${
                      selectedProject.id === p.id ? 'bg-indigo-600 border-indigo-500' : 'bg-[#1C1C28] border-gray-800'
                    }`}
                  >
                    <div className="text-sm font-bold text-white mb-1">{p.name}</div>
                    <div className="text-[10px] text-white/60 font-medium">{p.address}</div>
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{p.status}</div>
                      <div className="text-[10px] font-bold text-white">{p.progress}%</div>
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsProjectSelectorOpen(false)}
                className="w-full py-4 text-gray-500 font-bold text-sm"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
