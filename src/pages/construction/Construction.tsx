import React, { useState, useMemo } from 'react';
import {
  Plus, Camera, Upload, FileText, X, Clock, CheckCircle2,
  AlertTriangle, DollarSign, FileSpreadsheet,
  Eye, ListChecks, BarChart3, Search, Send, Mic,
  Check, ChevronDown, Zap, TrendingUp, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type UserRole = 'HOMEOWNER' | 'ENGINEER' | 'MANAGER';
type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
type ViewTab = 'KANBAN' | 'COST' | 'PROGRESS' | 'LOGS';

interface Project {
  id: string; name: string; startDate: string; status: string;
  progress: number; budget: number; spent: number; contractValue: number;
  address: string; ownerName: string; engineerName: string;
}

interface CTask {
  id: string; name: string; category: string; status: TaskStatus;
  subcontractor: string; days: number; budget: number; spent: number;
  approved: boolean; dependencies: string[]; tags: string[];
  issues: Issue[]; checklist: ChecklistItem[]; progress: number;
}

interface ChecklistItem { id: string; label: string; completed: boolean; required: boolean; }
interface Issue {
  id: string; title: string; description: string; status: 'OPEN' | 'FIXING' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH'; photoBefore?: string; photoAfter?: string; createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

const PROJECTS: Project[] = [
  {
    id: '1', name: 'Nhà cô Lan - Quận 7', startDate: '2026-01-30', status: 'ĐANG THI CÔNG', progress: 45,
    budget: 2500000000, spent: 1200000000, contractValue: 2800000000,
    address: '123 Đường số 4, P. Tân Phong, Q7, TP.HCM', ownerName: 'Cô Lan', engineerName: 'Nguyễn Văn Hùng'
  },
  {
    id: '2', name: 'Biệt thự Anh Hùng - Thủ Đức', startDate: '2026-02-15', status: 'MỚI', progress: 10,
    budget: 5000000000, spent: 500000000, contractValue: 5500000000,
    address: '45 Khu đô thị Vạn Phúc, Thủ Đức', ownerName: 'Anh Hùng', engineerName: 'Trần Minh Tuấn'
  }
];

const TASKS: CTask[] = [
  {
    id: 't1', name: 'Ép cọc bê tông cốt thép', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty Nền Móng Việt',
    days: 5, budget: 150000000, spent: 145000000, approved: true, dependencies: [], tags: ['#EpCoc'],
    issues: [], progress: 100,
    checklist: [
      { id: 'c1', label: 'Kiểm tra tim cọc', completed: true, required: true },
      { id: 'c2', label: 'Nghiệm thu vật liệu đầu vào', completed: true, required: true },
      { id: 'c3', label: 'Ép cọc thử', completed: true, required: true }
    ]
  },
  {
    id: 't2', name: 'Đào móng và thi công đà kiềng', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty XD Nam',
    days: 10, budget: 250000000, spent: 260000000, approved: true, dependencies: ['t1'], tags: ['#Mong'],
    issues: [], progress: 100,
    checklist: [
      { id: 'c4', label: 'Đào đất đúng cao độ', completed: true, required: true },
      { id: 'c5', label: 'Lắp đặt cốt thép móng', completed: true, required: true }
    ]
  },
  {
    id: 't3', name: 'Xây tường bao tầng trệt', category: 'PHẦN THÔ', status: 'DOING', subcontractor: 'Công ty XD Nam',
    days: 7, budget: 120000000, spent: 50000000, approved: true, dependencies: ['t2'], tags: ['#XayTuong', '#Gach'],
    progress: 71,
    issues: [{
      id: 'i1', title: 'Sai lệch kích thước cửa sổ', description: 'Cửa sổ phòng khách bị lệch 5cm so với bản vẽ',
      status: 'OPEN', severity: 'HIGH', createdAt: '2026-03-20'
    }],
    checklist: [
      { id: 'c7', label: 'Kiểm tra mạch vữa đều', completed: true, required: true },
      { id: 'c8', label: 'Kiểm tra thẳng đứng bằng máy', completed: false, required: true }
    ]
  },
  {
    id: 't4', name: 'Lắp đặt hệ thống điện nước âm tường', category: 'MEP', status: 'TODO', subcontractor: 'Điện Nước Hoàng Gia',
    days: 8, budget: 180000000, spent: 0, approved: false, dependencies: ['t3'], tags: ['#MEP', '#DienNuoc'],
    issues: [], progress: 0,
    checklist: [
      { id: 'c10', label: 'Đục tường đúng sơ đồ', completed: false, required: true },
      { id: 'c11', label: 'Lắp đặt đề ám', completed: false, required: true }
    ]
  },
  {
    id: 't5', name: 'Đổ bê tông sàn tầng 2', category: 'PHẦN THÔ', status: 'TODO', subcontractor: 'Công ty XD Nam',
    days: 3, budget: 200000000, spent: 0, approved: false, dependencies: ['t3'], tags: ['#BeTong'],
    issues: [], progress: 0,
    checklist: [
      { id: 'c12', label: 'Kiểm tra cốt thép trước đổ', completed: false, required: true },
      { id: 'c13', label: 'Đổ bê tông đúng mác', completed: false, required: true }
    ]
  }
];

// ═══════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════
const fmt = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Tỷ`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} Tr`;
  return n.toLocaleString('vi-VN') + ' đ';
};

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  TODO: { label: 'Cần làm', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  DOING: { label: 'Đang làm', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  REVIEW: { label: 'Nghiệm thu', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  DONE: { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const catColors: Record<string, string> = {
  'PHẦN THÔ': 'bg-orange-100 text-orange-700 border-orange-200',
  'MEP': 'bg-sky-100 text-sky-700 border-sky-200',
  'HOÀN THIỆN': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'NỘI THẤT': 'bg-purple-100 text-purple-700 border-purple-200',
  'KHÁC': 'bg-slate-100 text-slate-600 border-slate-200',
};

// ═══════════════════════════════════════════════════════════
// TASK DETAIL DRAWER
// ═══════════════════════════════════════════════════════════

function TaskDetailDrawer({
  task, isOpen, onClose, onUpdate, userRole
}: {
  task: CTask | null; isOpen: boolean; onClose: () => void;
  onUpdate: (t: CTask) => void; userRole: UserRole;
}) {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [showAddIssue, setShowAddIssue] = useState(false);

  if (!task) return null;
  const canEdit = userRole !== 'HOMEOWNER';
  const canApprove = userRole === 'MANAGER';
  const sc = statusConfig[task.status];
  const cc = catColors[task.category] || catColors['KHÁC'];
  const completedChecklist = task.checklist.filter(c => c.completed).length;

  const toggleChecklistItem = (itemId: string) => {
    if (!canEdit) return;
    const updated = { ...task, checklist: task.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c) };
    onUpdate(updated);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !canEdit) return;
    const updated = { ...task, checklist: [...task.checklist, { id: `cl_${Date.now()}`, label: newChecklistItem.trim(), completed: false, required: false }] };
    onUpdate(updated);
    setNewChecklistItem('');
  };

  const addIssue = () => {
    if (!newIssueTitle.trim()) return;
    const newIssue: Issue = {
      id: `iss_${Date.now()}`, title: newIssueTitle.trim(), description: newIssueDesc.trim(),
      status: 'OPEN', severity: 'MEDIUM', createdAt: new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...task, issues: [...task.issues, newIssue] });
    setNewIssueTitle(''); setNewIssueDesc(''); setShowAddIssue(false);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!canEdit && newStatus !== 'REVIEW') return;
    onUpdate({ ...task, status: newStatus });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cc}`}>{task.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>{sc.label}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{task.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{task.subcontractor} • {task.days} ngày</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Progress */}
              <div className="p-5 border-b border-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500">Tiến độ</span>
                  <span className="text-sm font-bold text-indigo-600">{task.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                  <span>Ngân sách: {fmt(task.budget)}</span>
                  <span>Đã chi: {fmt(task.spent)}</span>
                </div>
              </div>

              {/* Smart Checklist */}
              <div className="p-5 border-b border-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Smart Checklist
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {completedChecklist}/{task.checklist.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {task.checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      disabled={!canEdit}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        item.completed ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'
                      } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                      }`}>
                        {item.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                      {item.required && <span className="text-rose-400 text-xs ml-auto">*</span>}
                    </button>
                  ))}
                </div>
                {/* Add Checklist */}
                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text" value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                      placeholder="+ Thêm checklist mới..."
                      className="flex-1 px-3 py-2.5 text-sm border border-dashed border-slate-300 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 bg-white placeholder-slate-400"
                    />
                    {newChecklistItem.trim() && (
                      <button onClick={addChecklistItem} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Punchlist (Issues) */}
              <div className="p-5 border-b border-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Punchlist (Lỗi)
                  </h3>
                  {canEdit && (
                    <button onClick={() => setShowAddIssue(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Báo lỗi mới
                    </button>
                  )}
                </div>

                {task.issues.length === 0 && !showAddIssue ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Không có lỗi nào được ghi nhận</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {task.issues.map(issue => (
                      <div key={issue.id} className={`p-3 rounded-xl border ${
                        issue.severity === 'HIGH' ? 'border-rose-200 bg-rose-50' :
                        issue.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-50' :
                        'border-slate-200 bg-slate-50'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                issue.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                issue.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>{issue.severity === 'HIGH' ? 'Nghiêm trọng' : issue.severity === 'MEDIUM' ? 'Trung bình' : 'Nhẹ'}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                issue.status === 'OPEN' ? 'bg-red-100 text-red-600' :
                                issue.status === 'FIXING' ? 'bg-blue-100 text-blue-600' :
                                'bg-green-100 text-green-600'
                              }`}>{issue.status === 'OPEN' ? 'Mở' : issue.status === 'FIXING' ? 'Đang sửa' : 'Đã xử lý'}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{issue.title}</p>
                            {issue.description && <p className="text-xs text-slate-500 mt-1">{issue.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {issue.photoBefore && <img src={issue.photoBefore} className="w-16 h-16 object-cover rounded-lg" alt="before" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Issue Form */}
                {showAddIssue && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <input
                      type="text" value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)}
                      placeholder="Tên lỗi (VD: Vách tường bị nứt)"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <textarea
                      value={newIssueDesc} onChange={e => setNewIssueDesc(e.target.value)}
                      placeholder="Mô tả chi tiết lỗi..."
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                    />
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                        <Camera className="w-4 h-4" /> Chụp ảnh
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                        <Mic className="w-4 h-4" /> Ghi âm
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={addIssue} disabled={!newIssueTitle.trim()} className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40">
                        Lưu lỗi
                      </button>
                      <button onClick={() => { setShowAddIssue(false); setNewIssueTitle(''); setNewIssueDesc(''); }} className="px-4 text-sm font-bold text-slate-500 hover:text-slate-700">
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer — Action Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              {canApprove && task.status === 'REVIEW' && (
                <div className="flex gap-2 mb-2">
                  <button onClick={() => handleStatusChange('DONE')} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Phê duyệt
                  </button>
                  <button onClick={() => handleStatusChange('DOING')} className="px-4 bg-rose-100 text-rose-700 text-sm font-bold py-3 rounded-xl hover:bg-rose-200 transition-colors">
                    Trả lại
                  </button>
                </div>
              )}
              {canEdit && task.status === 'DOING' && (
                <button onClick={() => handleStatusChange('REVIEW')} className="w-full bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Gửi nghiệm thu
                </button>
              )}
              {canEdit && task.status === 'TODO' && (
                <button onClick={() => handleStatusChange('DOING')} className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Bắt đầu thi công
                </button>
              )}
              {task.status === 'DONE' && (
                <div className="text-center text-sm text-emerald-600 font-bold flex items-center justify-center gap-2 py-2">
                  <CheckCircle2 className="w-5 h-5" /> Hạng mục đã hoàn thành & phê duyệt
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK CARD (matches Kanban design)
// ═══════════════════════════════════════════════════════════

function TaskCard({ task, onClick }: { task: CTask; onClick: () => void }) {
  const sc = statusConfig[task.status];
  const cc = catColors[task.category] || catColors['KHÁC'];
  const completedChecklist = task.checklist.filter(c => c.completed).length;
  const hasIssues = task.issues.filter(i => i.status === 'OPEN').length;

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-indigo-600 transition-colors flex-1">
          {task.name}
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${cc}`}>
          {task.category}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>
            {sc.label}
          </span>
          {hasIssues > 0 && (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> {hasIssues}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.checklist.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
              <ListChecks className="w-3 h-3" /> {completedChecklist}/{task.checklist.length}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400">{fmt(task.budget)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KANBAN VIEW (matching Kanban module layout)
// ═══════════════════════════════════════════════════════════

const KANBAN_COLS: { id: TaskStatus; title: string; icon: React.ReactNode }[] = [
  { id: 'TODO', title: 'Cần làm', icon: <Clock className="w-4 h-4 text-slate-400" /> },
  { id: 'DOING', title: 'Đang làm', icon: <Zap className="w-4 h-4 text-blue-500" /> },
  { id: 'REVIEW', title: 'Nghiệm thu', icon: <Eye className="w-4 h-4 text-amber-500" /> },
  { id: 'DONE', title: 'Hoàn thành', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
];

function KanbanView({ tasks, onTaskClick, userRole }: { tasks: CTask[]; onTaskClick: (t: CTask) => void; userRole: UserRole }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ minHeight: '500px' }}>
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="w-[85vw] sm:w-[280px] md:w-[300px] bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col shrink-0">
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                {col.icon}
                <h3 className="font-bold text-slate-700 text-sm">{col.title}</h3>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{colTasks.length}</span>
              </div>
            </div>
            {/* Column Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-8 text-slate-300 text-xs font-medium">Trống</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COST OVERVIEW (per-project budget dashboard)
// ═══════════════════════════════════════════════════════════

function CostOverview({ tasks, project }: { tasks: CTask[]; project: Project }) {
  const categories = useMemo(() => {
    const catMap: Record<string, { budget: number; spent: number }> = {};
    tasks.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { budget: 0, spent: 0 };
      catMap[t.category].budget += t.budget;
      catMap[t.category].spent += t.spent;
    });
    return Object.entries(catMap).map(([name, data]) => ({ name, ...data }));
  }, [tasks]);

  const totalBudget = tasks.reduce((s, t) => s + t.budget, 0);
  const totalSpent = tasks.reduce((s, t) => s + t.spent, 0);
  const overspent = totalSpent > totalBudget;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hợp đồng</p>
          <p className="text-lg font-bold text-slate-800">{fmt(project.contractValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ngân sách TĐ</p>
          <p className="text-lg font-bold text-slate-800">{fmt(totalBudget)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Đã chi</p>
          <p className={`text-lg font-bold ${overspent ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(totalSpent)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Còn lại</p>
          <p className="text-lg font-bold text-indigo-600">{fmt(totalBudget - totalSpent)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-indigo-500" /> Ngân Sách vs Thực Tế
        </h3>
        <div className="space-y-5">
          {categories.map(cat => {
            const pct = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
            const over = cat.spent > cat.budget;
            return (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase">{cat.name}</span>
                  <span className={`text-sm font-bold ${over ? 'text-rose-600' : 'text-slate-800'}`}>
                    {fmt(cat.spent)} <span className="text-slate-400 font-normal">/ {fmt(cat.budget)}</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Vượt {Math.round(((cat.spent - cat.budget) / cat.budget) * 100)}% — Cần phê duyệt
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Milestones */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-500" /> Tiến Độ Thanh Toán
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Đợt 1: Tạm ứng HĐ', amount: 200000000, status: 'PAID', date: '15/01/2026' },
            { label: 'Đợt 2: Hoàn thành móng', amount: 350000000, status: 'PAID', date: '20/02/2026' },
            { label: 'Đợt 3: Sàn T1', amount: 400000000, status: 'PENDING', date: 'Dự kiến 15/03' },
            { label: 'Đợt 4: Sàn T2', amount: 400000000, status: 'WAITING', date: 'Dự kiến 30/03' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                m.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {m.status === 'PAID' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 truncate">{m.label}</div>
                <div className="text-[10px] text-slate-400 font-medium">{m.date}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-slate-900">{fmt(m.amount)}</div>
                <div className={`text-[9px] font-bold uppercase ${
                  m.status === 'PAID' ? 'text-emerald-500' : m.status === 'PENDING' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {m.status === 'PAID' ? 'Đã thu' : m.status === 'PENDING' ? 'Chờ thu' : 'Chưa đến'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS TIMELINE
// ═══════════════════════════════════════════════════════════

function ProgressTimeline({ tasks }: { tasks: CTask[] }) {
  const timelineItems = useMemo(() =>
    tasks.map(t => ({
      name: t.name,
      category: t.category,
      progress: t.progress,
      status: t.status,
      days: t.days,
      budget: t.budget,
    })), [tasks]);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Hoàn thành</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Đang làm</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /> Chưa bắt đầu</div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        {timelineItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{item.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${catColors[item.category] || catColors['KHÁC']}`}>
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-medium">{item.days} ngày</span>
                <span className="text-xs font-bold text-indigo-600">{item.progress}%</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className={`h-full rounded-full ${
                  item.status === 'DONE' ? 'bg-emerald-500' :
                  item.status === 'DOING' ? 'bg-indigo-500' : 'bg-slate-300'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// IMPORT QUOTATION MODAL (AI Timeline Generator)
// ═══════════════════════════════════════════════════════════

function ImportQuotationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl"
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" /> Nhập Báo Giá → AI Tạo Timeline
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                <Upload className="w-10 h-10 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">Tải lên Báo Giá (PDF / Excel)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">AI sẽ tự động bóc tách hạng mục và tạo Timeline thi công tương ứng.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xs text-slate-400 font-bold">Kéo thả file vào đây hoặc click để chọn</span>
                <p className="text-[10px] text-slate-300 mt-1">PDF, XLSX, XLS • Tối đa 10MB</p>
              </div>
              <div className="text-left bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <p className="text-[11px] text-indigo-700 font-medium">
                  💡 <strong>Hoặc gửi timeline có sẵn:</strong> Bạn cũng có thể paste nội dung báo giá / timeline từ bên ngoài vào ô bên dưới.
                </p>
                <textarea
                  placeholder="Dán nội dung timeline hoặc báo giá ở đây..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => { alert('Đang phân tích báo giá và tạo Timeline...'); onClose(); }}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                🚀 Bắt Đầu Phân Tích AI
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN CONSTRUCTION COMPONENT
// ═══════════════════════════════════════════════════════════

export const Construction = () => {
  const [userRole, setUserRole] = useState<UserRole>('ENGINEER');
  const [activeTab, setActiveTab] = useState<ViewTab>('KANBAN');
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[0]);
  const [tasks, setTasks] = useState<CTask[]>(TASKS);
  const [selectedTask, setSelectedTask] = useState<CTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const done = tasks.filter(t => t.status === 'DONE').length;
    const issues = tasks.reduce((s, t) => s + t.issues.filter(i => i.status === 'OPEN').length, 0);
    const review = tasks.filter(t => t.status === 'REVIEW').length;
    return { progress: Math.round((done / tasks.length) * 100), done, total: tasks.length, issues, review };
  }, [tasks]);

  const openTask = (task: CTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = (updated: CTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'KANBAN', label: 'Kanban', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'COST', label: 'Chi phí', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'PROGRESS', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'LOGS', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto w-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý Thi công</h1>
          <p className="text-sm text-slate-400 mt-0.5">{selectedProject.name} • {selectedProject.address}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* AI Action Buttons (Manager only) */}
          {userRole === 'MANAGER' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsQuotationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all h-[38px]"
              >
                <FileSpreadsheet className="w-4 h-4" /> AI Tiến Độ
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all h-[38px]">
                <Plus className="w-4 h-4" /> Tạo Dự Án
              </button>
            </div>
          )}
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProject.id}
              onChange={e => setSelectedProject(PROJECTS.find(p => p.id === e.target.value) || PROJECTS[0])}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-medium text-slate-700 appearance-none pr-8 h-[38px]"
            >
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm hạng mục..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 h-[38px] w-48"
            />
          </div>

          {/* Role Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['HOMEOWNER', 'ENGINEER', 'MANAGER'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => setUserRole(role)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  userRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {role === 'HOMEOWNER' ? 'Chủ nhà' : role === 'ENGINEER' ? 'Kỹ sư' : 'Quản lý'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{stats.progress}%</p>
            <p className="text-[10px] text-slate-400 font-bold">Tiến độ</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{stats.done}/{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-bold">Hoàn thành</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{stats.review}</p>
            <p className="text-[10px] text-slate-400 font-bold">Chờ duyệt</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{stats.issues}</p>
            <p className="text-[10px] text-slate-400 font-bold">Lỗi mở</p>
          </div>
        </div>
      </div>

      {/* ─── VIEW TABS ─── */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {VIEW_TABS.map(tab => {
          // Hide COST tab for HOMEOWNER
          if (tab.id === 'COST' && userRole === 'HOMEOWNER') return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === 'KANBAN' && (
              <KanbanView tasks={filteredTasks} onTaskClick={openTask} userRole={userRole} />
            )}
            {activeTab === 'COST' && (
              <CostOverview tasks={tasks} project={selectedProject} />
            )}
            {activeTab === 'PROGRESS' && (
              <ProgressTimeline tasks={tasks} />
            )}
            {activeTab === 'LOGS' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Nhật ký Công trường</h3>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Tạo báo cáo
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-left text-[10px] font-bold text-slate-400 uppercase">Ngày</th>
                        <th className="p-4 text-left text-[10px] font-bold text-slate-400 uppercase">Thời tiết</th>
                        <th className="p-4 text-left text-[10px] font-bold text-slate-400 uppercase">Ghi chú</th>
                        <th className="p-4 text-right text-[10px] font-bold text-slate-400 uppercase">Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { date: '27/03/2026', weather: 'Nắng — 34°C', note: 'Tiếp tục xây tường bao tầng trệt', progress: 3 },
                        { date: '26/03/2026', weather: 'Nắng nhẹ — 31°C', note: 'Hoàn thành gia công cốt thép cột T1', progress: 5 },
                        { date: '25/03/2026', weather: 'Mưa chiều — 29°C', note: 'Tạm dừng đổ bê tông buổi chiều do mưa', progress: 0 },
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="p-4 text-xs font-bold text-slate-800">{log.date}</td>
                          <td className="p-4 text-xs text-slate-600">{log.weather}</td>
                          <td className="p-4 text-xs text-slate-600 max-w-[300px] truncate">{log.note}</td>
                          <td className="p-4 text-right">
                            <span className={`text-xs font-bold ${log.progress > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {log.progress > 0 ? `+${log.progress}%` : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── TASK DETAIL DRAWER ─── */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateTask}
        userRole={userRole}
      />

      {/* ─── IMPORT QUOTATION MODAL ─── */}
      <ImportQuotationModal isOpen={isQuotationModalOpen} onClose={() => setIsQuotationModalOpen(false)} />
    </div>
  );
};
