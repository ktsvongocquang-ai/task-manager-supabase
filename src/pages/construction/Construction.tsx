import React, { useState, useMemo, useEffect, useCallback, Component } from 'react';
import {
  Plus, Camera, Upload, FileText, X, Clock, CheckCircle2,
  AlertTriangle, DollarSign, FileSpreadsheet,
  Eye, ListChecks, BarChart3, Search, Send, Mic,
  Check, ChevronDown, Zap, TrendingUp, FileCheck, Users, Download,
  AlertCircle, CheckCheck, XCircle, Bot, QrCode, Copy, ExternalLink, Save, Building2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

import type { UserRole, TaskStatus, ViewTab, CTask, Project, DailyLog, Milestone, Approval, Notification, Subcontractor, AttendanceData, FinanceData, ConstructionPhase, PaymentRecord, WeatherType } from './types';
import { fmt, statusConfig, catColors } from './types';
import { PROJECTS, TASKS, MILESTONES, NOTIFICATIONS, FINANCE, DAILY_LOGS } from './mockData';
import { ManagerDashboard, EngineerDailyReport, ClientCountdown, SubcontractorView, AttendanceView, ReportsView, DailyLogView, ProjectOverview, PaymentHistory, ContractorProgressChart } from './views';
import { ProjectManagementAIModule } from './ProjectManagement';
import { useConstructionData, type SupabaseProject, type SupabaseMilestone, type SupabaseApproval, type SupabaseNotification, type SupabaseDailyLog, type SupabasePaymentRecord, type SupabaseSubcontractor } from '../../hooks/useConstructionData';
import { aiConstructionService } from '../../services/aiConstructionService';

// ── Mapping helpers: Supabase → local types ──
const mapProject = (p: SupabaseProject): Project => ({
  id: p.id, name: p.name, startDate: p.start_date || '',
  handoverDate: p.handover_date || '', status: p.status,
  progress: p.progress || 0, budget: p.budget || 0, spent: p.spent || 0,
  contractValue: p.contract_value || 0, address: p.address || '',
  ownerName: p.owner_name || '', engineerName: p.engineer_name || '',
  budgetSpent: p.budget_spent || 0,
  riskLevel: (p.risk_level as 'green' | 'yellow' | 'red') || 'green',
  unexpectedCosts: p.unexpected_costs || 0, totalDocuments: p.total_documents || 0,
  daysOff: p.days_off || 0, totalDiaryEntries: p.total_diary_entries || 0,
});

const mapMilestone = (m: SupabaseMilestone): Milestone => ({
  id: m.id, name: m.name,
  status: (m.status as 'upcoming' | 'pending_internal' | 'passed') || 'upcoming',
  approvedDate: m.approved_date || null,
  paymentAmount: m.payment_amount || 0,
  paymentStatus: (m.payment_status as 'paid' | 'unpaid') || 'unpaid',
  subTasks: Array.isArray(m.sub_tasks) ? m.sub_tasks : [],
});

const mapApproval = (a: SupabaseApproval): Approval => ({
  id: a.id, projectId: a.project_id,
  type: (a.type as 'qc' | 'material' | 'variation' | 'budget_alert') || 'qc',
  title: a.title, detail: a.detail || '',
  date: a.created_at?.split('T')[0] || '',
  status: (a.status as 'pending' | 'approved' | 'rejected') || 'pending',
});

const mapNotification = (n: SupabaseNotification): Notification => ({
  id: n.id,
  level: (n.level as 'critical' | 'action' | 'good' | 'info') || 'info',
  msg: n.msg, time: n.created_at || '', read: n.read,
});

const mapDailyLog = (l: SupabaseDailyLog): DailyLog => {
  const [am, pm] = (l.weather || 'sunny/sunny').split('/');
  return {
    id: l.id, date: l.date, projectId: l.project_id,
    weatherAM: (am as WeatherType) || 'sunny',
    weatherPM: (pm as WeatherType) || 'sunny',
    taskCategory: l.task_category || l.work_item || '',
    taskProgress: l.task_progress || 0,
    workerCount: { main: l.main_workers || 0, helper: l.helper_workers || 0 },
    sitePhotos: Array.isArray(l.photo_urls) ? l.photo_urls : [],
    contractorPhotos: Array.isArray(l.contractor_photo_urls) ? l.contractor_photo_urls : [],
    videos: Array.isArray(l.video_urls) ? l.video_urls : [],
    voiceNotes: Array.isArray(l.voice_notes) ? l.voice_notes : [],
    notes: l.notes || l.content || '',
    issues: Array.isArray(l.issue_ids) ? l.issue_ids : [],
    createdBy: (l.created_by as 'ENGINEER' | 'MANAGER') || 'ENGINEER',
    editable: l.editable !== false,
    status: (l.status as 'pending' | 'approved' | 'rejected') || 'pending',
    reporterName: l.reporter_name || '',
    temperature: l.temperature || 30,
    machines: l.machines || '',
    materials: l.materials || '',
    comments: Array.isArray(l.comments) ? l.comments : [],
  };
};

const mapPayment = (r: SupabasePaymentRecord): PaymentRecord => ({
  id: r.id, projectId: r.project_id, date: r.date,
  description: r.description, amount: r.amount || 0,
  billPhotos: Array.isArray(r.bill_photos) ? r.bill_photos : [],
  type: (r.type as 'payment_out' | 'payment_in') || 'payment_out',
  status: (r.status as 'confirmed' | 'pending') || 'pending',
  category: r.category || 'Vật liệu',
});

const mapSubcontractor = (s: SupabaseSubcontractor): Subcontractor => ({
  id: s.id, name: s.name, trade: s.trade, phone: s.phone, rating: s.rating,
  projectIds: Array.isArray(s.project_ids) ? s.project_ids : [],
  contractAmount: s.contract_amount || 0,
  paidAmount: s.paid_amount || 0,
  progressPercent: s.progress_percent || 0,
});

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-20"><div className="h-3 bg-slate-200 rounded w-1/2 mb-3" /><div className="h-5 bg-slate-100 rounded w-3/4" /></div>)}
      </div>
      <div className="flex gap-4">
        {[1,2,3,4].map(i => <div key={i} className="w-[280px] bg-white rounded-2xl border border-slate-200 p-4 h-[400px] shrink-0"><div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />{[1,2,3].map(j => <div key={j} className="bg-slate-50 rounded-xl p-4 mb-3"><div className="h-3 bg-slate-200 rounded w-3/4 mb-2" /><div className="h-2 bg-slate-100 rounded w-full mb-2" /><div className="h-2 bg-slate-100 rounded w-1/2" /></div>)}</div>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 border-2 border-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-rose-600">Đã xảy ra lỗi</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Thử lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'info';
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-indigo-600' };
  const icons = { success: <CheckCheck className="w-4 h-4" />, error: <XCircle className="w-4 h-4" />, info: <AlertCircle className="w-4 h-4" /> };
  return (
    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className={`fixed bottom-6 right-6 z-[100] ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium`}>
      {icons[type]} {message}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════

function ConfirmDialog({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel }: {
  isOpen: boolean; title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full">
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className={`flex-1 ${confirmColor} text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity`}>{confirmLabel}</button>
          <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm hover:bg-slate-50">Hủy</button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK DETAIL DRAWER
// ═══════════════════════════════════════════════════════════

function TaskDetailDrawer({ task, isOpen, onClose, onUpdate, userRole }: {
  task: CTask | null; isOpen: boolean; onClose: () => void; onUpdate: (t: CTask) => void; userRole: UserRole;
}) {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  if (!task) return null;
  const canEdit = userRole !== 'HOMEOWNER';
  const canApprove = userRole === 'MANAGER';
  const sc = statusConfig[task.status];
  const cc = catColors[task.category] || catColors['KHÁC'];
  const completedChecklist = task.checklist.filter(c => c.completed).length;

  const toggleChecklistItem = (itemId: string) => {
    if (!canEdit) return;
    onUpdate({ ...task, checklist: task.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c) });
  };
  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !canEdit) return;
    onUpdate({ ...task, checklist: [...task.checklist, { id: `cl_${Date.now()}`, label: newChecklistItem.trim(), completed: false, required: false }] });
    setNewChecklistItem('');
  };
  const deleteChecklistItem = (itemId: string) => {
    if (!canEdit) return;
    onUpdate({ ...task, checklist: task.checklist.filter(c => c.id !== itemId) });
  };
  const saveChecklistEdit = (itemId: string) => {
    if (!editingChecklistText.trim()) return;
    onUpdate({ ...task, checklist: task.checklist.map(c => c.id === itemId ? { ...c, label: editingChecklistText.trim() } : c) });
    setEditingChecklistId(null); setEditingChecklistText('');
  };
  const addIssue = () => {
    if (!newIssueTitle.trim()) return;
    onUpdate({ ...task, issues: [...task.issues, { id: `iss_${Date.now()}`, title: newIssueTitle.trim(), description: newIssueDesc.trim() + (issuePhotos.length > 0 ? ` [${issuePhotos.length} ảnh đính kèm]` : ''), status: 'OPEN', severity: 'MEDIUM', createdAt: new Date().toISOString().split('T')[0] }] });
    setNewIssueTitle(''); setNewIssueDesc(''); setShowAddIssue(false); setIssuePhotos([]);
  };
  const deleteIssue = (issueId: string) => {
    if (!canEdit) return;
    onUpdate({ ...task, issues: task.issues.filter(i => i.id !== issueId) });
  };
  const toggleIssueStatus = (issueId: string) => {
    if (!canEdit) return;
    onUpdate({ ...task, issues: task.issues.map(i => i.id === issueId ? { ...i, status: (i.status === 'OPEN' ? 'RESOLVED' : 'OPEN') as 'OPEN' | 'FIXING' | 'RESOLVED' } : i) });
  };
  const handleStatusChange = (s: TaskStatus) => { if (canEdit || s === 'REVIEW') onUpdate({ ...task, status: s }); };

  // Photo capture via file input
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setIssuePhotos(prev => [...prev, ev.target!.result as string]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Speech-to-text via Web Speech API
  const startSpeechToText = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setNewIssueDesc(prev => prev + ' [Trình duyệt không hỗ trợ Speech]'); return; }
    const recognition = new SR();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewIssueDesc(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => { setIsListening(false); setNewIssueDesc(prev => prev + ' [Lỗi mic]'); };
    recognition.start();
  };

  return (
    <AnimatePresence>
      {isOpen && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]" onClick={onClose} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cc}`}>{task.category}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>{sc.label}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{task.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{task.subcontractor} • {task.days} ngày</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Progress */}
            <div className="p-5 border-b border-slate-50">
              <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-500">Tiến độ</span><span className="text-sm font-bold text-indigo-600">{task.progress}%</span></div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} /></div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium"><span>Ngân sách: {fmt(task.budget)}</span><span>Đã chi: {fmt(task.spent)}</span></div>
            </div>
            {/* Checklist */}
            <div className="p-5 border-b border-slate-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Smart Checklist</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{completedChecklist}/{task.checklist.length}</span>
              </div>
              <div className="space-y-1.5">
                {task.checklist.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-3 rounded-xl transition-all group ${item.completed ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <button onClick={() => toggleChecklistItem(item.id)} disabled={!canEdit} className="shrink-0">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>{item.completed && <Check className="w-3 h-3 text-white" />}</div>
                    </button>
                    {editingChecklistId === item.id ? (
                      <input type="text" value={editingChecklistText} onChange={e => setEditingChecklistText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveChecklistEdit(item.id); if (e.key === 'Escape') setEditingChecklistId(null); }} onBlur={() => saveChecklistEdit(item.id)} autoFocus className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200" />
                    ) : (
                      <span onDoubleClick={() => { if (canEdit) { setEditingChecklistId(item.id); setEditingChecklistText(item.label); } }} className={`flex-1 text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'} ${canEdit ? 'cursor-text' : ''}`}>{item.label}</span>
                    )}
                    {item.required && <span className="text-rose-400 text-xs">*</span>}
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingChecklistId(item.id); setEditingChecklistText(item.label); }} className="p-1 hover:bg-slate-200 rounded-md" title="Sửa"><FileText className="w-3 h-3 text-slate-400" /></button>
                        <button onClick={() => deleteChecklistItem(item.id)} className="p-1 hover:bg-rose-100 rounded-md" title="Xóa"><X className="w-3 h-3 text-rose-400" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <input type="text" value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChecklistItem()} placeholder="+ Thêm checklist mới..." className="flex-1 px-3 py-2.5 text-sm border border-dashed border-slate-300 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 bg-white placeholder-slate-400" />
                  {newChecklistItem.trim() && <button onClick={addChecklistItem} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"><Plus className="w-4 h-4" /></button>}
                </div>
              )}
            </div>
            {/* Punchlist */}
            <div className="p-5 border-b border-slate-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Punchlist (Lỗi)</h3>
                {canEdit && <button onClick={() => setShowAddIssue(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Báo lỗi mới</button>}
              </div>
              {task.issues.length === 0 && !showAddIssue ? (
                <div className="text-center py-6"><CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" /><p className="text-sm text-slate-400">Không có lỗi</p></div>
              ) : (
                <div className="space-y-2">
                  {task.issues.map(issue => (
                    <div key={issue.id} className={`p-3 rounded-xl border group ${issue.status === 'RESOLVED' ? 'border-slate-200 bg-slate-50 opacity-60' : issue.severity === 'HIGH' ? 'border-rose-200 bg-rose-50' : issue.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${issue.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{issue.severity === 'HIGH' ? 'Nghiêm trọng' : 'Trung bình'}</span>
                        <button onClick={() => toggleIssueStatus(issue.id)} className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${issue.status === 'OPEN' ? 'bg-blue-100 text-blue-700 hover:bg-emerald-100 hover:text-emerald-700' : 'bg-emerald-100 text-emerald-700 hover:bg-blue-100 hover:text-blue-700'}`}>{issue.status === 'OPEN' ? 'Mở' : 'Đã xử lý'}</button>
                        {canEdit && <button onClick={() => deleteIssue(issue.id)} className="ml-auto p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-100 rounded-md transition-all" title="Xóa lỗi"><X className="w-3 h-3 text-rose-400" /></button>}
                      </div>
                      <p className={`text-sm font-bold ${issue.status === 'RESOLVED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{issue.title}</p>
                      {issue.description && <p className="text-xs text-slate-500 mt-1">{issue.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {showAddIssue && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <input type="text" value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)} placeholder="Tên lỗi (VD: Vách tường bị nứt)" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  <div className="relative">
                    <textarea value={newIssueDesc} onChange={e => setNewIssueDesc(e.target.value)} placeholder="Mô tả chi tiết lỗi..." rows={2} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none pr-16" />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      <button onClick={() => photoInputRef.current?.click()} className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors" title="Chụp/chọn ảnh"><Camera className="w-4 h-4 text-indigo-500" /></button>
                      <button onClick={startSpeechToText} className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-rose-100 animate-pulse' : 'hover:bg-indigo-100'}`} title="Nói để nhập"><Mic className={`w-4 h-4 ${isListening ? 'text-rose-500' : 'text-indigo-500'}`} /></button>
                    </div>
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoCapture} className="hidden" />
                  {/* Photo previews */}
                  {issuePhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {issuePhotos.map((photo, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setIssuePhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={addIssue} disabled={!newIssueTitle.trim()} className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-colors">Lưu lỗi</button>
                    <button onClick={() => { setShowAddIssue(false); setNewIssueTitle(''); setNewIssueDesc(''); setIssuePhotos([]); }} className="px-4 text-sm font-bold text-slate-500 hover:text-slate-700">Hủy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Footer actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            {canApprove && task.status === 'REVIEW' && (
              <div className="flex gap-2 mb-2">
                <button onClick={() => handleStatusChange('DONE')} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Phê duyệt</button>
                <button onClick={() => handleStatusChange('DOING')} className="px-4 bg-rose-100 text-rose-700 text-sm font-bold py-3 rounded-xl">Trả lại</button>
              </div>
            )}
            {canEdit && task.status === 'DOING' && <button onClick={() => handleStatusChange('REVIEW')} className="w-full bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Gửi nghiệm thu</button>}
            {canEdit && task.status === 'TODO' && <button onClick={() => handleStatusChange('DOING')} className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> Bắt đầu thi công</button>}
            {task.status === 'DONE' && <div className="text-center text-sm text-emerald-600 font-bold flex items-center justify-center gap-2 py-2"><CheckCircle2 className="w-5 h-5" /> Đã hoàn thành</div>}
          </div>
        </motion.div>
      </>)}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK CARD
// ═══════════════════════════════════════════════════════════

function TaskCard({ task, onClick }: { task: CTask; onClick: () => void }) {
  const sc = statusConfig[task.status]; const cc = catColors[task.category] || catColors['KHÁC'];
  const completedChecklist = task.checklist.filter(c => c.completed).length;
  const hasIssues = task.issues.filter(i => i.status === 'OPEN').length;
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; (e.target as HTMLElement).style.opacity = '0.5'; }}
      onDragEnd={e => { (e.target as HTMLElement).style.opacity = '1'; }}
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-indigo-600 transition-colors flex-1">{task.name}</h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${cc}`}>{task.category}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden"><div className={`h-full rounded-full transition-all ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${task.progress}%` }} /></div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>{sc.label}</span>
          {hasIssues > 0 && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {hasIssues}</span>}
        </div>
        <div className="flex items-center gap-2">
          {task.checklist.length > 0 && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><ListChecks className="w-3 h-3" /> {completedChecklist}/{task.checklist.length}</span>}
          <span className="text-[10px] font-bold text-slate-400">{fmt(task.budget)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KANBAN VIEW
// ═══════════════════════════════════════════════════════════

const KANBAN_COLS: { id: TaskStatus; title: string; icon: React.ReactNode }[] = [
  { id: 'TODO', title: 'Cần làm', icon: <Clock className="w-4 h-4 text-slate-400" /> },
  { id: 'DOING', title: 'Đang làm', icon: <Zap className="w-4 h-4 text-blue-500" /> },
  { id: 'REVIEW', title: 'Nghiệm thu', icon: <Eye className="w-4 h-4 text-amber-500" /> },
  { id: 'DONE', title: 'Hoàn thành', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
];

function KanbanView({ tasks, onTaskClick, onMoveTask }: { tasks: CTask[]; onTaskClick: (t: CTask) => void; onMoveTask?: (taskId: string, newStatus: TaskStatus) => void }) {
  const [dragOverCol, setDragOverCol] = React.useState<TaskStatus | null>(null);
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ minHeight: '500px' }}>
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`w-[85vw] sm:w-[280px] md:w-[300px] bg-[#f8fafc] rounded-2xl border-2 flex flex-col shrink-0 transition-all ${dragOverCol === col.id ? 'border-indigo-400 bg-indigo-50/30 scale-[1.01]' : 'border-slate-200'}`}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => { e.preventDefault(); setDragOverCol(null); const taskId = e.dataTransfer.getData('taskId'); if (taskId && onMoveTask) onMoveTask(taskId, col.id); }}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl shadow-sm shrink-0">
              <div className="flex items-center gap-2">{col.icon}<h3 className="font-bold text-slate-700 text-sm">{col.title}</h3><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{colTasks.length}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {colTasks.map(task => <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)}
              {colTasks.length === 0 && <div className="text-center py-8 text-slate-300 text-xs font-medium">{dragOverCol === col.id ? 'Thả ở đây' : 'Trống'}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COST OVERVIEW (with EVA)
// ═══════════════════════════════════════════════════════════

function CostOverview({ tasks, project, milestones: milestonesFromDB }: { tasks: CTask[]; project: Project; milestones?: any[] }) {
  // Use Supabase milestones if available, otherwise fall back to mock
  const activeMilestones = (milestonesFromDB && milestonesFromDB.length > 0) ? milestonesFromDB : MILESTONES;
  const categories = useMemo(() => {
    const m: Record<string, { budget: number; spent: number }> = {};
    tasks.forEach(t => { if (!m[t.category]) m[t.category] = { budget: 0, spent: 0 }; m[t.category].budget += t.budget; m[t.category].spent += t.spent; });
    return Object.entries(m).map(([name, data]) => ({ name, ...data }));
  }, [tasks]);
  const totalBudget = tasks.reduce((s, t) => s + t.budget, 0);
  const totalSpent = tasks.reduce((s, t) => s + t.spent, 0);
  const over = totalSpent > totalBudget;
  const budgetPct = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0;

  return (
    <div className="space-y-6">
      {/* EVA Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Earned Value Analysis</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">% Khối lượng xong</p>
            <p className="text-2xl font-bold text-indigo-600">{project.progress}%</p>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${project.progress}%` }} /></div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">% Ngân sách đã chi</p>
            <p className={`text-2xl font-bold ${budgetPct > project.progress * 1.15 ? 'text-rose-600' : 'text-emerald-600'}`}>{budgetPct}%</p>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${budgetPct > project.progress * 1.15 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }} /></div>
          </div>
        </div>
        {budgetPct > project.progress * 1.15 && (
          <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Chi tiền nhanh hơn tiến độ. Dự báo vượt ngân sách {Math.round((budgetPct / project.progress - 1) * 100)}%.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hợp đồng', value: fmt(project.contractValue), color: 'text-slate-800' },
          { label: 'Ngân sách', value: fmt(totalBudget), color: 'text-slate-800' },
          { label: 'Đã chi', value: fmt(totalSpent), color: over ? 'text-rose-600' : 'text-emerald-600' },
          { label: 'Còn lại', value: fmt(totalBudget - totalSpent), color: 'text-indigo-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Category bars */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-500" /> Ngân Sách vs Thực Tế</h3>
        <div className="space-y-5">
          {categories.map(cat => {
            const pct = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
            const o = cat.spent > cat.budget;
            return (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 uppercase">{cat.name}</span><span className={`text-sm font-bold ${o ? 'text-rose-600' : 'text-slate-800'}`}>{fmt(cat.spent)} <span className="text-slate-400 font-normal">/ {fmt(cat.budget)}</span></span></div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${o ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} /></div>
                {o && <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vượt {Math.round(((cat.spent - cat.budget) / cat.budget) * 100)}%</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Milestones */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-500" /> Tiến Độ Thanh Toán</h3>
        <div className="space-y-4">
          {activeMilestones.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${(m.paymentStatus || m.payment_status) === 'paid' ? 'bg-emerald-100 text-emerald-600' : (m.status === 'pending_internal') ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{(m.paymentStatus || m.payment_status) === 'paid' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</div>
              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-700 truncate">{m.name}</div><div className="text-[10px] text-slate-400">{m.status === 'passed' ? (m.approvedDate || m.approved_date) : m.status === 'pending_internal' ? 'Đang QC...' : 'Sắp tới'}</div></div>
              <div className="text-right shrink-0"><div className="text-xs font-bold text-slate-900">{fmt(m.paymentAmount || m.payment_amount || 0)}</div><div className={`text-[9px] font-bold uppercase ${(m.paymentStatus || m.payment_status) === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>{(m.paymentStatus || m.payment_status) === 'paid' ? 'Đã thu' : 'Chưa'}</div></div>
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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Hoàn thành</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Đang làm</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /> Chưa bắt đầu</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        {tasks.map((t, idx) => (
          <div key={t.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{t.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${catColors[t.category] || catColors['KHÁC']}`}>{t.category}</span>
              </div>
              <div className="flex items-center gap-3"><span className="text-[10px] text-slate-400">{t.days} ngày</span><span className="text-xs font-bold text-indigo-600">{t.progress}%</span></div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${t.progress}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }} className={`h-full rounded-full ${t.status === 'DONE' ? 'bg-emerald-500' : t.status === 'DOING' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            </div>
            {t.startDate && <p className="text-[10px] text-slate-400">{t.startDate} → {t.endDate}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// IMPORT QUOTATION MODAL — PDF / Excel / Text → AI Timeline
// ═══════════════════════════════════════════════════════════

type ImportMode = 'add_to_project' | 'create_project';

interface ExtractedProjectInfo {
  name: string; ownerName: string; address: string;
  contractValue: number; budget: number; startDate: string; handoverDate: string;
}

const CAT_STYLE: Record<string, string> = {
  'PHẦN THÔ':   'bg-red-100 text-red-700 border border-red-200',
  'ĐIỆN NƯỚC':  'bg-blue-100 text-blue-700 border border-blue-200',
  'HOÀN THIỆN': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'KHÁC':       'bg-slate-100 text-slate-600 border border-slate-200',
};

function ImportQuotationModal({ isOpen, onClose, onGenerate, onCreateProject }: {
  isOpen: boolean; onClose: () => void;
  onGenerate: (tasks: any[]) => Promise<void>;
  onCreateProject: (info: ExtractedProjectInfo, tasks: any[]) => Promise<void>;
}) {
  const [mode, setMode] = useState<'replace_project' | 'create_project'>('replace_project');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [editedTasks, setEditedTasks] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());
  const [extractedInfo, setExtractedInfo] = useState<ExtractedProjectInfo>({
    name: '', ownerName: '', address: '', contractValue: 0, budget: 0, startDate: '', handoverDate: '',
  });
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setText(''); setFileName(''); setFileBase64(''); setFileMime(''); setError('');
    setStep('upload'); setEditedTasks([]); setSelectedIdx(new Set());
  };

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = ev => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setFileBase64(base64); setFileMime('application/pdf'); setText('');
      };
      reader.readAsDataURL(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const { read, utils } = await import('xlsx');
          const wb = read(ev.target?.result, { type: 'array' });
          const lines: string[] = [];
          wb.SheetNames.forEach(name => {
            const csv = utils.sheet_to_csv(wb.Sheets[name]);
            if (csv.trim()) lines.push(`[Sheet: ${name}]\n${csv}`);
          });
          setText(lines.join('\n\n')); setFileBase64(''); setFileMime('');
        } catch { setError('Không đọc được file Excel. Thử lưu lại dạng .xlsx'); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => { setText(ev.target?.result as string || ''); setFileBase64(''); setFileMime(''); };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !fileBase64) { setError('Vui lòng chọn file hoặc nhập nội dung'); return; }
    setIsAnalyzing(true); setError('');
    try {
      let tasks: any[] = [];
      let info: ExtractedProjectInfo = { name: '', ownerName: '', address: '', contractValue: 0, budget: 0, startDate: '', handoverDate: '' };
      if (fileBase64 && fileMime) {
        const result = await aiConstructionService.analyzeFileMultimodal(fileBase64, fileMime);
        tasks = result.tasks; info = result.projectInfo;
      } else {
        tasks = await aiConstructionService.generateTimelineFromQuotation(text);
        if (mode === 'create_project') info = await aiConstructionService.extractProjectInfo(text);
      }
      setEditedTasks(JSON.parse(JSON.stringify(tasks)));
      setSelectedIdx(new Set(tasks.map((_, i) => i))); // all selected by default
      setExtractedInfo(info);
      setStep('preview');
    } catch (e: any) {
      setError(e?.message || 'AI phân tích thất bại. Kiểm tra API key.');
    } finally { setIsAnalyzing(false); }
  };

  const handleConfirmPreview = async () => {
    const selected = editedTasks.filter((_, i) => selectedIdx.has(i));
    if (!selected.length) { setError('Vui lòng chọn ít nhất 1 hạng mục'); return; }
    if (mode === 'create_project') { setStep('confirm'); return; }
    setIsAnalyzing(true); setError('');
    try { await onGenerate(selected); reset(); onClose(); }
    catch (e: any) { setError(e?.message || 'Lỗi khi lưu'); }
    finally { setIsAnalyzing(false); }
  };

  const handleConfirmCreate = async () => {
    const selected = editedTasks.filter((_, i) => selectedIdx.has(i));
    setIsAnalyzing(true); setError('');
    try { await onCreateProject(extractedInfo, selected); reset(); onClose(); }
    catch (e: any) { setError(e?.message || 'Lỗi khi tạo dự án'); }
    finally { setIsAnalyzing(false); }
  };

  const allSelected = selectedIdx.size === editedTasks.length && editedTasks.length > 0;
  const toggleAll = () => setSelectedIdx(allSelected ? new Set() : new Set(editedTasks.map((_, i) => i)));
  const updateTask = (idx: number, field: string, val: any) =>
    setEditedTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));

  // Group by category for preview display
  const groupedPreview = React.useMemo(() => {
    const map = new Map<string, { task: any; idx: number }[]>();
    editedTasks.forEach((task, idx) => {
      const cat = task.category || 'KHÁC';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ task, idx });
    });
    return map;
  }, [editedTasks]);

  const fileTypeLabel = fileMime === 'application/pdf' ? '📄 PDF' : fileName.includes('.xl') ? '📊 Excel' : fileName ? '📝 Text' : '';
  const STEP_LABELS = { upload: '1. Tải file', preview: '2. Chọn hạng mục', confirm: '3. Thông tin dự án' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl transition-all ${step === 'preview' ? 'max-w-2xl' : 'max-w-lg'}`}>

            {/* Header + step indicator */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs">
                  {(['upload', 'preview', 'confirm'] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <span className="text-slate-300">›</span>}
                      <span className={`font-bold ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {STEP_LABELS[s]}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* ── STEP 1: Upload ── */}
            {step === 'upload' && (
              <div className="p-5 space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {([['replace_project', 'Cập nhật / Ghi đè Timeline'], ['create_project', 'Tạo dự án mới']] as ['replace_project' | 'create_project', string][]).map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer text-center"
                  onClick={() => fileRef.current?.click()}>
                  {fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-indigo-600">{fileTypeLabel} {fileName}</span>
                      <button onClick={e => { e.stopPropagation(); reset(); }} className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold">Kéo thả hoặc click chọn file</p>
                      <p className="text-[11px] text-slate-400 mt-1">PDF (timeline / hợp đồng) • Excel (.xlsx) báo giá • Text / CSV</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".txt,.csv,.pdf,.xlsx,.xls" onChange={handleFileRead} className="hidden" />
                </div>
                {!fileBase64 && (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-[11px] text-indigo-700 font-medium mb-2">💡 Hoặc paste nội dung trực tiếp:</p>
                    <textarea value={text} onChange={e => { setText(e.target.value); setFileName(''); }}
                      placeholder={'VD:\nMóng cọc ép: 150tr, 5 ngày\nXây tường trệt: 120tr, 7 ngày\nMEP: 180tr, 8 ngày...'}
                      rows={5} className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" />
                  </div>
                )}
                {fileBase64 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">PDF đã tải — AI sẽ đọc trực tiếp bằng Gemini multimodal</p>
                  </div>
                )}
                {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="flex gap-3">
                  <button onClick={handleAnalyze} disabled={isAnalyzing || (!text.trim() && !fileBase64)}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isAnalyzing ? <><Bot className="w-4 h-4 animate-pulse" /> Đang phân tích AI...</> : <><Bot className="w-4 h-4" /> Phân Tích AI</>}
                  </button>
                  <button onClick={() => { reset(); onClose(); }} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Hủy</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Preview + Select ── */}
            {step === 'preview' && (
              <div className="flex flex-col max-h-[80vh]">
                {/* Summary bar */}
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                  <p className="text-xs text-indigo-700 font-bold">
                    AI tìm thấy {editedTasks.length} hạng mục — đã chọn {selectedIdx.size}
                  </p>
                  <button onClick={toggleAll}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${allSelected ? 'bg-white border-indigo-300 text-indigo-600' : 'bg-indigo-600 text-white border-transparent'}`}>
                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Task list — scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {Array.from(groupedPreview.entries()).map(([cat, items]) => (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_STYLE[cat] || CAT_STYLE['KHÁC']}`}>{cat}</span>
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] text-slate-400">{items.length} hạng mục</span>
                      </div>
                      <div className="space-y-2">
                        {items.map(({ task, idx }) => {
                          const checked = selectedIdx.has(idx);
                          return (
                            <div key={idx}
                              className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${checked ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-white opacity-60'}`}
                              onClick={() => {
                                setSelectedIdx(prev => {
                                  const n = new Set(prev);
                                  checked ? n.delete(idx) : n.add(idx);
                                  return n;
                                });
                              }}
                            >
                              {/* Checkbox */}
                              <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>

                              {/* Task info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                                {/* Editable fields */}
                                <div className="flex items-center gap-3 mt-1.5" onClick={e => e.stopPropagation()}>
                                  <label className="flex items-center gap-1 text-xs text-slate-500">
                                    Thời gian:
                                    <input type="number" min={1} value={task.days}
                                      onChange={e => updateTask(idx, 'days', parseInt(e.target.value) || 1)}
                                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" />
                                    ngày
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-slate-500">
                                    Bắt đầu:
                                    <input type="date" value={task.startDate || ''}
                                      onChange={e => updateTask(idx, 'startDate', e.target.value)}
                                      className="px-1.5 py-0.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white cursor-pointer hover:bg-slate-50" />
                                  </label>
                                </div>
                                {/* Checklist preview */}
                                {task.checklist?.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {task.checklist.slice(0, 2).map((c: string, ci: number) => (
                                      <span key={ci} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">✓ {c}</span>
                                    ))}
                                    {task.checklist.length > 2 && (
                                      <span className="text-[10px] text-slate-400">+{task.checklist.length - 2} mục nghiệm thu</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Duration badge */}
                              <div className="shrink-0 text-right">
                                <div className="text-xs font-bold text-slate-600">{task.days}d</div>
                                <div className="text-[10px] text-slate-400">{task.startDate || '—'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-2">
                  {selectedIdx.size > 0 && (() => {
                    const selectedTasks = editedTasks.filter((_, i) => selectedIdx.has(i));
                    const totalCost = selectedTasks.reduce((a, t) => a + (t.budget || 0), 0);
                    // Calculate true project duration
                    let minDate = new Date(8640000000000000);
                    let maxDate = new Date(-8640000000000000);
                    let hasDates = false;
                    selectedTasks.forEach(t => {
                      if (t.startDate) {
                        hasDates = true;
                        const sd = new Date(t.startDate);
                        if (!isNaN(sd.getTime())) {
                          if (sd < minDate) minDate = sd;
                          const ed = new Date(sd.getTime() + (Math.max(0, t.days - 1)) * 86400000);
                          if (ed > maxDate) maxDate = ed;
                        }
                      }
                    });
                    const diffDays = hasDates ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1) : 0;
                    
                    return (
                      <div className="flex gap-3 text-xs text-slate-500 justify-between px-1">
                        <span>Tổng thời gian: <strong className="text-slate-700">{hasDates ? diffDays : selectedTasks.reduce((a, t) => a + (t.days || 0), 0)} ngày</strong></span>
                        <span>Đã chọn: <strong className="text-slate-700">{selectedTasks.length} mục</strong></span>
                      </div>
                    );
                  })()}
                  {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setStep('upload')} className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-white">
                      ← Phân tích lại
                    </button>
                    <button onClick={handleConfirmPreview} disabled={isAnalyzing || selectedIdx.size === 0}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      {isAnalyzing ? 'Đang lưu...' : <>{mode === 'create_project' ? <Building2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />} Thêm {selectedIdx.size} hạng mục vào Timeline →</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Project Info (create_project mode only) ── */}
            {step === 'confirm' && (
              <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
                <p className="text-xs text-slate-500 font-medium">AI đã trích xuất thông tin dự án. Kiểm tra và chỉnh sửa trước khi tạo:</p>
                {([
                  { label: 'Tên dự án', key: 'name', type: 'text' },
                  { label: 'Chủ nhà', key: 'ownerName', type: 'text' },
                  { label: 'Địa chỉ công trình', key: 'address', type: 'text' },
                  { label: 'Giá trị hợp đồng (đ)', key: 'contractValue', type: 'number' },
                  { label: 'Ngân sách (đ)', key: 'budget', type: 'number' },
                  { label: 'Ngày khởi công', key: 'startDate', type: 'date' },
                  { label: 'Ngày bàn giao', key: 'handoverDate', type: 'date' },
                ] as { label: string; key: keyof ExtractedProjectInfo; type: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{f.label}</label>
                    <input type={f.type} value={(extractedInfo as any)[f.key] || ''}
                      onChange={e => setExtractedInfo(i => ({ ...i, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                      className="mt-0.5 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                ))}
                <div className="bg-indigo-50 rounded-xl px-3 py-2.5 border border-indigo-100">
                  <p className="text-[11px] text-indigo-700 font-bold">{selectedIdx.size} hạng mục đã chọn sẽ được tạo tự động</p>
                </div>
                {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={handleConfirmCreate} disabled={isAnalyzing}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isAnalyzing ? 'Đang tạo...' : <><Building2 className="w-4 h-4" /> Tạo Dự Án & Timeline</>}
                  </button>
                  <button onClick={() => setStep('preview')} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Sửa lại</button>
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARE QR MODAL — Khách hàng quét để xem giao diện Chủ nhà
// ═══════════════════════════════════════════════════════════

function ShareQRModal({ isOpen, onClose, project }: { isOpen: boolean; onClose: () => void; project: Project }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/construction?project=${project.id}&role=homeowner`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Chia sẻ cho Chủ nhà</p>
                  <p className="text-[11px] text-slate-400">{project.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                <QRCodeSVG value={shareUrl} size={200} level="M" includeMargin={false}
                  imageSettings={{ src: '/pwa-192x192.png', x: undefined, y: undefined, height: 36, width: 36, excavate: true }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">Chủ nhà quét để xem tiến độ công trình</p>
                <p className="text-[11px] text-slate-400">Giao diện chỉ xem — Nhật ký • Tiến độ • Thanh toán</p>
              </div>

              {/* Owner info */}
              <div className="w-full bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{project.ownerName || 'Chủ nhà'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{project.address}</p>
                </div>
              </div>

              {/* Link copy */}
              <div className="w-full flex gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 truncate font-mono">
                  {shareUrl.replace('https://', '')}
                </div>
                <button onClick={copyLink} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>

              <button onClick={() => window.open(shareUrl, '_blank')} className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> Xem thử giao diện Chủ nhà
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// CREATE PROJECT MODAL — Tạo dự án mới
// ═══════════════════════════════════════════════════════════

function EditProjectModal({ project, onClose, onSave }: {
  project: Project; onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: project.name, address: project.address, ownerName: project.ownerName,
    startDate: project.startDate || '', handoverDate: project.handoverDate || '',
    contractValue: String(project.contractValue || ''), budget: String(project.budget || ''),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Cần điền tên dự án'); return; }
    setSaving(true); setError('');
    try {
      await onSave({
        name: form.name.trim(), address: form.address.trim(),
        ownerName: form.ownerName.trim(), startDate: form.startDate,
        handoverDate: form.handoverDate,
        contractValue: parseInt(form.contractValue.replace(/\D/g, '')) || 0,
        budget: parseInt(form.budget.replace(/\D/g, '')) || 0,
      });
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi khi cập nhật'); }
    finally { setSaving(false); }
  };

  const fields = [
    { label: 'Tên dự án *', key: 'name', type: 'text' },
    { label: 'Địa chỉ', key: 'address', type: 'text' },
    { label: 'Chủ nhà', key: 'ownerName', type: 'text' },
    { label: 'Ngày khởi công', key: 'startDate', type: 'date' },
    { label: 'Ngày bàn giao', key: 'handoverDate', type: 'date' },
    { label: 'Giá trị hợp đồng (đ)', key: 'contractValue', type: 'text' },
    { label: 'Ngân sách (đ)', key: 'budget', type: 'text' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Chỉnh sửa Dự Án</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          ))}
          {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
            </button>
            <button onClick={onClose} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Hủy</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateProjectModal({ isOpen, onClose, onCreate }: {
  isOpen: boolean; onClose: () => void;
  onCreate: (data: Partial<Project>) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: '', address: '', ownerName: '', startDate: '', handoverDate: '', contractValue: '', budget: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.ownerName.trim()) { setError('Cần điền tên dự án và chủ nhà'); return; }
    setSaving(true);
    setError('');
    try {
      await onCreate({
        name: form.name.trim(), address: form.address.trim(),
        ownerName: form.ownerName.trim(), startDate: form.startDate,
        handoverDate: form.handoverDate,
        contractValue: parseInt(form.contractValue.replace(/\D/g, '')) || 0,
        budget: parseInt(form.budget.replace(/\D/g, '')) || 0,
      });
      setForm({ name: '', address: '', ownerName: '', startDate: '', handoverDate: '', contractValue: '', budget: '' });
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi khi tạo dự án'); }
    finally { setSaving(false); }
  };

  const fields = [
    { label: 'Tên dự án *', key: 'name', placeholder: 'VD: Nhà cô Lan - Q.7', type: 'text' },
    { label: 'Địa chỉ', key: 'address', placeholder: '123 Đường số 4, P. Tân Phong, Q7', type: 'text' },
    { label: 'Chủ nhà *', key: 'ownerName', placeholder: 'Nguyễn Thị Lan', type: 'text' },
    { label: 'Ngày khởi công', key: 'startDate', placeholder: '', type: 'date' },
    { label: 'Ngày bàn giao', key: 'handoverDate', placeholder: '', type: 'date' },
    { label: 'Giá trị hợp đồng (đ)', key: 'contractValue', placeholder: '2800000000', type: 'text' },
    { label: 'Ngân sách (đ)', key: 'budget', placeholder: '1700000000', type: 'text' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tạo Dự Án Mới</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                    className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
              ))}
              {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? 'Đang tạo...' : <><Plus className="w-4 h-4" /> Tạo Dự Án</>}
                </button>
                <button onClick={onClose} className="px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Hủy</button>
              </div>
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
  const db = useConstructionData();

  const [userRole, setUserRole] = useState<UserRole>('MANAGER');
  const [activeTab, setActiveTab] = useState<ViewTab>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[0]);
  const [tasks, setTasks] = useState<CTask[]>(TASKS);
  const [selectedTask, setSelectedTask] = useState<CTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isShareQROpen, setIsShareQROpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void } | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(DAILY_LOGS);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'success') => setToast({ message, type }), []);

  // ── Derived Supabase data (project-specific: no mock fallback) ──
  const dbProjects: Project[] = db.projects.length > 0 ? db.projects.map(mapProject) : PROJECTS;
  const dbMilestones: Milestone[] = db.milestones.map(mapMilestone);
  const dbApprovals: Approval[] = db.approvals.map(mapApproval);
  const dbNotifications: Notification[] = db.notifications.length > 0 ? db.notifications.map(mapNotification) : NOTIFICATIONS;
  const dbPayments: PaymentRecord[] = db.paymentRecords.map(mapPayment);
  const dbSubs: Subcontractor[] = db.subcontractors.map(mapSubcontractor);
  const dbPhases: ConstructionPhase[] = db.phases.map(p => ({ id: p.id, name: p.name, status: p.status as 'done' | 'doing' | 'upcoming', order: p.sort_order, startDate: p.start_date || undefined, endDate: p.end_date || undefined, note: p.note }));
  const dbAttendance: AttendanceData = db.attendance.length > 0
    ? db.getAttendanceSummary(selectedProject.id)
    : { thisWeek: { main: 0, helper: 0 }, thisMonth: { main: 0, helper: 0 }, dailyRate: { main: 0, helper: 0 } };
  const dbFinance: FinanceData = db.projects.length > 0 ? db.getFinanceData() : FINANCE;

  // ── Sync Supabase tasks → local CTask[] (always sync, even empty) ──
  useEffect(() => {
    setTasks(db.tasks.map(t => ({
      id: t.id, name: t.name, category: t.category, status: t.status as TaskStatus,
      subcontractor: t.subcontractor || '', days: t.days, budget: t.budget, spent: t.spent,
      approved: t.approved, dependencies: t.dependencies || [], tags: t.tags || [],
      issues: t.issues || [], checklist: t.checklist || [], progress: t.progress,
      startDate: t.start_date || t.planned_start,
      endDate: t.end_date || t.planned_end,
      plannedStart: t.planned_start || t.start_date,
      plannedEnd: t.planned_end || t.end_date,
      duration: t.duration || t.days || 1,
    })));
  }, [db.tasks]);

  // ── Sync Supabase logs → local DailyLog[] (always sync, even empty) ──
  useEffect(() => {
    setDailyLogs(db.logs.map(mapDailyLog));
  }, [db.logs]);

  // ── Load project details when project changes ──
  useEffect(() => {
    if (selectedProject?.id && !selectedProject.id.match(/^[1-4]$/)) {
      // Clear previous project data immediately for clean state
      setTasks([]);
      setDailyLogs([]);
      db.loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject?.id]);

  // ── Sync selected project from db when projects load ──
  useEffect(() => {
    if (db.projects.length > 0 && selectedProject.id.match(/^[1-4]$/)) {
      // Check if there's a URL param for a specific project
      const params = new URLSearchParams(window.location.search);
      const urlProjectId = params.get('project');
      const target = urlProjectId
        ? db.projects.find(p => p.id === urlProjectId) || db.projects[0]
        : db.projects[0];
      const mapped = mapProject(target);
      setSelectedProject(mapped);
      db.loadProjectDetails(target.id);
    }
  }, [db.projects.length]);

  // ── Read URL params on mount: ?project=UUID&role=homeowner ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'homeowner') {
      setUserRole('HOMEOWNER');
      setActiveTab('DASHBOARD');
    }
  }, []);

  const handleAddDailyLog = useCallback(async (log: DailyLog) => {
    // Try to save to Supabase
    const saved = await db.submitDailyLog({
      project_id: selectedProject.id,
      date: log.date,
      content: log.notes,
      notes: log.notes,
      weather: `${log.weatherAM}/${log.weatherPM}`,
      temperature: log.temperature,
      main_workers: log.workerCount.main,
      helper_workers: log.workerCount.helper,
      task_category: log.taskCategory,
      task_progress: log.taskProgress,
      photo_urls: log.sitePhotos,
      contractor_photo_urls: log.contractorPhotos,
      video_urls: log.videos,
      voice_notes: log.voiceNotes,
      machines: log.machines,
      materials: log.materials,
      status: log.status,
      reporter_name: log.reporterName,
      comments: log.comments,
      created_by: log.createdBy,
      editable: log.editable,
    });
    if (!saved) {
      // Fallback: local state only
      setDailyLogs(prev => [log, ...prev]);
    }
    showToast('Đã thêm nhật ký mới');
  }, [showToast, selectedProject.id, db]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)));
  }, [tasks, searchQuery]);

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.status === 'DONE').length;
    const issues = tasks.reduce((s, t) => s + t.issues.filter(i => i.status === 'OPEN').length, 0);
    const review = tasks.filter(t => t.status === 'REVIEW').length;
    return { progress: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0, done, total: tasks.length, issues, review };
  }, [tasks]);

  const openTask = (task: CTask) => { setSelectedTask(task); setIsDrawerOpen(true); };
  const handleUpdateTask = async (u: CTask) => {
    // Optimistic update — always update local state immediately
    setTasks(prev => prev.map(t => t.id === u.id ? u : t));
    setSelectedTask(u);
    // Persist to Supabase (only if task exists in DB — mock IDs like 't1' won't)
    try {
      // Check if date/duration fields changed — persist them separately
      const hasDateFields = u.plannedStart || u.plannedEnd || u.startDate || u.endDate || u.duration || u.days;
      if (hasDateFields) {
        await db.updateTaskDates(u.id, {
          planned_start: u.plannedStart || u.startDate,
          planned_end: u.plannedEnd || u.endDate,
          start_date: u.startDate || u.plannedStart,
          end_date: u.endDate || u.plannedEnd,
          duration: u.duration || u.days,
          days: u.days || u.duration,
        });
      }
      const ok = await db.updateTaskStatusChecklist(u.id, u.status, u.checklist, u.issues);
      if (ok) showToast('Đã lưu thay đổi');
      else if (!u.id.startsWith('t')) showToast('Lỗi khi lưu vào CSDL', 'error');
      else showToast('Đã cập nhật (chế độ demo)', 'info');
    } catch {
      if (!u.id.startsWith('t')) showToast('Lỗi khi lưu', 'error');
      else showToast('Đã cập nhật (chế độ demo)', 'info');
    }
  };

  // Role-based tabs
  const getTabsForRole = (): { id: ViewTab; label: string; icon: React.ReactNode }[] => {
    if (userRole === 'HOMEOWNER') return [
      { id: 'DASHBOARD', label: 'Nhà của tôi', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'AI_GANTT', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
      { id: 'PAYMENTS', label: 'Thanh toán', icon: <DollarSign className="w-4 h-4" /> },
    ];
    if (userRole === 'ENGINEER') return [
      { id: 'KANBAN', label: 'Kanban', icon: <ListChecks className="w-4 h-4" /> },
      { id: 'AI_GANTT', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
      { id: 'LOGS', label: 'Báo cáo', icon: <FileText className="w-4 h-4" /> },
    ];
    return [
      { id: 'DASHBOARD', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'KANBAN', label: 'Kanban', icon: <ListChecks className="w-4 h-4" /> },
      { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
      { id: 'COST', label: 'Chi phí', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'PAYMENTS', label: 'Thanh toán', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'AI_GANTT', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'SUBS', label: 'Thầu phụ', icon: <Users className="w-4 h-4" /> },
      { id: 'ATTENDANCE', label: 'Chấm công', icon: <Users className="w-4 h-4" /> },
      { id: 'REPORTS', label: 'Báo cáo', icon: <Download className="w-4 h-4" /> },
    ];
  };

  const VIEW_TABS = getTabsForRole();

  // Auto-switch to right default tab when role changes
  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (role === 'HOMEOWNER') setActiveTab('DASHBOARD');
    else if (role === 'ENGINEER') setActiveTab('KANBAN');
    else setActiveTab('DASHBOARD');
  };

  // Show loading skeleton while Supabase data loads
  if (db.loading && tasks.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto w-full space-y-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div><h1 className="text-xl font-bold text-slate-800">Quản lý Thi công</h1></div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto w-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý Thi công</h1>
          <p className="text-sm text-slate-400 mt-0.5">{selectedProject.name} • {selectedProject.address}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {userRole === 'MANAGER' && (
            <div className="flex gap-2">
              <button onClick={() => setIsShareQROpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all h-[38px]"><QrCode className="w-4 h-4 text-emerald-600" /> Chia sẻ QR</button>
              <button onClick={() => setIsQuotationModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all h-[38px]"><FileSpreadsheet className="w-4 h-4" /> AI Tiến Độ</button>
              <button onClick={() => setIsCreateProjectOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all h-[38px]"><Plus className="w-4 h-4" /> Tạo Dự Án</button>
            </div>
          )}
          {userRole !== 'HOMEOWNER' && (
            <div className="relative flex items-center gap-1">
              <select value={selectedProject.id} onChange={e => { const p = dbProjects.find(p => p.id === e.target.value) || dbProjects[0]; setSelectedProject(p); db.loadProjectDetails(p.id); }} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-medium text-slate-700 appearance-none pr-8 h-[38px]">
                {dbProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button onClick={() => setIsEditProjectOpen(true)} title="Sửa dự án" className="w-[38px] h-[38px] flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-slate-500 hover:text-indigo-600">
                <FileText className="w-4 h-4" />
              </button>
              <button onClick={() => setConfirmDialog({
                title: 'Xóa dự án?',
                message: `Bạn có chắc muốn xóa dự án "${selectedProject.name}"? Toàn bộ dữ liệu (hạng mục, nhật ký, thanh toán,...) sẽ bị xóa vĩnh viễn.`,
                confirmLabel: 'Xóa vĩnh viễn',
                confirmColor: 'bg-rose-600 hover:bg-rose-700',
                onConfirm: async () => {
                  const ok = await db.deleteProject(selectedProject.id);
                  if (ok) {
                    showToast(`Đã xóa dự án "${selectedProject.name}"`, 'success');
                    await db.loadProjects();
                    const remaining = db.projects.filter(p => p.id !== selectedProject.id);
                    if (remaining.length > 0) {
                      const next = mapProject(remaining[0]);
                      setSelectedProject(next);
                      db.loadProjectDetails(next.id);
                    } else {
                      setSelectedProject(PROJECTS[0]);
                    }
                  } else {
                    showToast('Lỗi khi xóa dự án', 'error');
                  }
                },
              })} title="Xóa dự án" className="w-[38px] h-[38px] flex items-center justify-center border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 transition-all text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {userRole !== 'HOMEOWNER' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm hạng mục..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 h-[38px] w-48" />
            </div>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['HOMEOWNER', 'ENGINEER', 'MANAGER'] as UserRole[]).map(role => (
              <button key={role} onClick={() => handleRoleChange(role)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${userRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {role === 'HOMEOWNER' ? 'Chủ nhà' : role === 'ENGINEER' ? 'Kỹ sư' : 'Quản lý'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats (hide for homeowner) */}
      {userRole !== 'HOMEOWNER' && activeTab !== 'DASHBOARD' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <TrendingUp className="w-5 h-5 text-indigo-500" />, value: `${stats.progress}%`, label: 'Tiến độ', bg: 'bg-indigo-50' },
            { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, value: `${stats.done}/${stats.total}`, label: 'Hoàn thành', bg: 'bg-emerald-50' },
            { icon: <Eye className="w-5 h-5 text-amber-500" />, value: `${stats.review}`, label: 'Chờ duyệt', bg: 'bg-amber-50' },
            { icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, value: `${stats.issues}`, label: 'Lỗi mở', bg: 'bg-rose-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
              <div><p className="text-lg font-bold text-slate-800">{s.value}</p><p className="text-[10px] text-slate-400 font-bold">{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* View Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {VIEW_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab + userRole} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {/* Manager Dashboard */}
            {activeTab === 'DASHBOARD' && userRole === 'MANAGER' && (
              <div className="space-y-6">
                <ManagerDashboard projects={dbProjects} finance={dbFinance} approvals={dbApprovals} notifications={dbNotifications} onSelectProject={p => { setSelectedProject(p); db.loadProjectDetails(p.id); setActiveTab('KANBAN'); }} />
                <ProjectOverview project={selectedProject} subcontractors={dbSubs} milestones={dbMilestones} />
              </div>
            )}
            {/* Homeowner Dashboard */}
            {activeTab === 'DASHBOARD' && userRole === 'HOMEOWNER' && (
              <ClientCountdown project={selectedProject} milestones={dbMilestones} dailyLogs={dailyLogs} phases={dbPhases} tasks={tasks} />
            )}
            {/* Kanban */}
            {activeTab === 'KANBAN' && <KanbanView tasks={filteredTasks} onTaskClick={openTask} onMoveTask={(taskId, newStatus) => {
              const task = tasks.find(t => t.id === taskId);
              if (task && task.status !== newStatus) {
                const updated = { ...task, status: newStatus, progress: newStatus === 'DONE' ? 100 : newStatus === 'REVIEW' ? 90 : newStatus === 'DOING' ? Math.max(task.progress, 10) : task.progress };
                handleUpdateTask(updated);
                showToast(`Chuyển "${task.name}" → ${statusConfig[newStatus].label}`);
              }
            }} />}
            {/* Cost */}
            {activeTab === 'COST' && <CostOverview tasks={tasks} project={selectedProject} milestones={dbMilestones} />}
            {/* Progress */}
            {activeTab === 'PROGRESS' && <ProgressTimeline tasks={tasks} />}
            {/* Engineer Daily Report */}
            {activeTab === 'LOGS' && userRole === 'ENGINEER' && <EngineerDailyReport tasks={tasks} project={selectedProject} />}
            {/* Manager Logs — now uses DailyLogView */}
            {activeTab === 'LOGS' && userRole !== 'ENGINEER' && (
              <DailyLogView logs={dailyLogs} onAddLog={handleAddDailyLog} canEdit={true} />
            )}
            {/* Diary tab — all roles */}
            {activeTab === 'DIARY' && (
              <DailyLogView logs={dailyLogs} onAddLog={userRole !== 'HOMEOWNER' ? handleAddDailyLog : undefined} canEdit={userRole !== 'HOMEOWNER'} />
            )}
            {/* Payment History */}
            {activeTab === 'PAYMENTS' && (
              <div className="space-y-6">
                <PaymentHistory payments={dbPayments} />
                <ContractorProgressChart subcontractors={dbSubs} />
              </div>
            )}
            {/* Subcontractors */}
            {activeTab === 'SUBS' && (
              <div className="space-y-6">
                <ContractorProgressChart subcontractors={dbSubs} />
                <SubcontractorView subcontractors={dbSubs} />
              </div>
            )}
            {/* Attendance */}
            {activeTab === 'ATTENDANCE' && <AttendanceView attendance={dbAttendance} />}
            {/* Reports */}
            {activeTab === 'REPORTS' && <ReportsView tasks={tasks} projectName={selectedProject.name} />}
            {/* AI Master Architect Board */}
            {activeTab === 'AI_GANTT' && (
              <ProjectManagementAIModule
                projectId={selectedProject.id}
                externalTasks={tasks}
                readOnly={userRole === 'HOMEOWNER'}
                onUpdateTask={(id, updates) => {
                  const updated = tasks.find(t => t.id === id);
                  if (updated) handleUpdateTask({ ...updated, ...updates });
                }}
                onOpenImport={userRole !== 'HOMEOWNER' ? () => setIsQuotationModalOpen(true) : undefined}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <TaskDetailDrawer task={selectedTask} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onUpdate={handleUpdateTask} userRole={userRole} />

      <ShareQRModal isOpen={isShareQROpen} onClose={() => setIsShareQROpen(false)} project={selectedProject} />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={async (data) => {
          const newId = await db.createProject({
            name: data.name, address: data.address,
            owner_name: data.ownerName, engineer_name: '',
            start_date: data.startDate || null,
            handover_date: data.handoverDate || null,
            contract_value: data.contractValue || 0,
            budget: data.budget || 0,
            spent: 0, progress: 0, status: 'in_progress',
          } as any);
          if (newId) {
            showToast(`Đã tạo dự án "${data.name}"`, 'success');
            db.loadProjects();
          } else {
            throw new Error('Lỗi khi tạo dự án vào CSDL');
          }
        }}
      />

      <ImportQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onGenerate={async (generatedTasks) => {
          // For existing projects: replace timeline (delete old tasks, keep logs)
          const ok = await db.replaceTimelineTasks(selectedProject.id, generatedTasks, selectedProject.startDate);
          if (ok) {
            showToast(`Đã cập nhật ${generatedTasks.length} hạng mục (nhật ký thi công không bị xóa)`, 'success');
            setActiveTab('AI_GANTT');
          } else {
            showToast('Lỗi khi lưu timeline vào CSDL', 'error');
          }
        }}
        onCreateProject={async (info, tasks) => {
          const newId = await db.createProject({
            name: info.name, address: info.address,
            owner_name: info.ownerName, engineer_name: '',
            start_date: info.startDate || null,
            handover_date: info.handoverDate || null,
            contract_value: info.contractValue || 0,
            budget: info.budget || 0,
            spent: 0, progress: 0, status: 'in_progress',
          } as any);
          if (!newId) throw new Error('Lỗi khi tạo dự án');
          const ok = await db.createTimelineTasks(newId, tasks, info.startDate);
          if (ok) {
            await db.loadProjects();
            showToast(`Đã tạo dự án "${info.name}" với ${tasks.length} hạng mục`, 'success');
            setActiveTab('AI_GANTT');
          }
        }}
      />

      {/* Edit Project Modal */}
      {isEditProjectOpen && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => setIsEditProjectOpen(false)}
          onSave={async (updates) => {
            const ok = await db.updateProject(selectedProject.id, {
              name: updates.name,
              address: updates.address,
              owner_name: updates.ownerName,
              contract_value: updates.contractValue,
              budget: updates.budget,
              start_date: updates.startDate || null,
              handover_date: updates.handoverDate || null,
            } as any);
            if (ok) {
              setSelectedProject(prev => ({ ...prev, ...updates }));
              await db.loadProjects();
              showToast('Đã cập nhật dự án', 'success');
            } else {
              showToast('Lỗi khi cập nhật dự án', 'error');
            }
          }}
        />
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog isOpen={true} title={confirmDialog.title} message={confirmDialog.message} confirmLabel={confirmDialog.confirmLabel} confirmColor={confirmDialog.confirmColor} onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} onCancel={() => setConfirmDialog(null)} />
      )}
    </div>
    </ErrorBoundary>
  );
};
