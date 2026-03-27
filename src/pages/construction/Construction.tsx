import React, { useState, useMemo, useEffect, useCallback, Component } from 'react';
import {
  Plus, Camera, Upload, FileText, X, Clock, CheckCircle2,
  AlertTriangle, DollarSign, FileSpreadsheet,
  Eye, ListChecks, BarChart3, Search, Send, Mic,
  Check, ChevronDown, Zap, TrendingUp, FileCheck, Users, Download,
  AlertCircle, CheckCheck, XCircle, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import type { UserRole, TaskStatus, ViewTab, CTask, Project } from './types';
import { fmt, statusConfig, catColors } from './types';
import { PROJECTS, TASKS, APPROVALS, MILESTONES, SUBCONTRACTORS, NOTIFICATIONS, FINANCE, ATTENDANCE, DAILY_LOGS, PAYMENT_RECORDS, CONSTRUCTION_PHASES } from './mockData';
import { ManagerDashboard, EngineerDailyReport, ClientCountdown, SubcontractorView, AttendanceView, ReportsView, DailyLogView, ProjectOverview, PaymentHistory, ContractorProgressChart } from './views';
import { ProjectManagementAIModule } from './ProjectManagement';
import type { DailyLog } from './types';
import { useConstructionData } from '../../hooks/useConstructionData';

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

function CostOverview({ tasks, project }: { tasks: CTask[]; project: Project }) {
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
          {MILESTONES.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : m.status === 'pending_internal' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{m.paymentStatus === 'paid' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</div>
              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-700 truncate">{m.name}</div><div className="text-[10px] text-slate-400">{m.status === 'passed' ? m.approvedDate : m.status === 'pending_internal' ? 'Đang QC...' : 'Sắp tới'}</div></div>
              <div className="text-right shrink-0"><div className="text-xs font-bold text-slate-900">{fmt(m.paymentAmount)}</div><div className={`text-[9px] font-bold uppercase ${m.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>{m.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa'}</div></div>
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
// IMPORT QUOTATION MODAL
// ═══════════════════════════════════════════════════════════

function ImportQuotationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-indigo-500" /> Nhập Báo Giá → AI Tạo Timeline</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100"><Upload className="w-10 h-10 text-indigo-500" /></div>
              <div><h4 className="text-lg font-bold text-slate-800 mb-1">Tải lên Báo Giá (PDF / Excel)</h4><p className="text-xs text-slate-400">AI sẽ tự động bóc tách và tạo Timeline thi công.</p></div>
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"><Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" /><span className="text-xs text-slate-400 font-bold">Kéo thả file hoặc click để chọn</span><p className="text-[10px] text-slate-300 mt-1">PDF, XLSX, XLS • Tối đa 10MB</p></div>
              <div className="text-left bg-indigo-50 rounded-xl p-3 border border-indigo-100"><p className="text-[11px] text-indigo-700 font-medium">💡 <strong>Hoặc paste timeline:</strong></p><textarea placeholder="Dán nội dung timeline / báo giá ở đây..." rows={3} className="w-full mt-2 px-3 py-2 text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white resize-none" /></div>
              <button onClick={() => { alert('Đang phân tích báo giá...'); onClose(); }} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all">🚀 Bắt Đầu Phân Tích AI</button>
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
  // Supabase hook (real data)
  const db = useConstructionData();

  const [userRole, setUserRole] = useState<UserRole>('MANAGER');
  const [activeTab, setActiveTab] = useState<ViewTab>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[0]);
  // Use Supabase data if available, otherwise fall back to mock data
  const [tasks, setTasks] = useState<CTask[]>(TASKS);
  const [selectedTask, setSelectedTask] = useState<CTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void } | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(DAILY_LOGS);

  const showToast = useCallback((message: string, type: ToastType = 'success') => setToast({ message, type }), []);

  const handleAddDailyLog = useCallback((log: DailyLog) => {
    setDailyLogs(prev => [log, ...prev]);
    showToast('Đã thêm nhật ký mới');
  }, [showToast]);

  // Sync Supabase tasks when they load
  useEffect(() => {
    if (db.tasks.length > 0) {
      setTasks(db.tasks.map(t => ({
        id: t.id, name: t.name, category: t.category, status: t.status as TaskStatus,
        subcontractor: t.subcontractor || '', days: t.days, budget: t.budget, spent: t.spent,
        approved: t.approved, dependencies: t.dependencies || [], tags: t.tags || [],
        issues: t.issues || [], checklist: t.checklist || [], progress: t.progress,
        startDate: t.start_date, endDate: t.end_date,
      })));
    }
  }, [db.tasks]);

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
    setTasks(prev => prev.map(t => t.id === u.id ? u : t));
    setSelectedTask(u);
    // Persist to Supabase
    const ok = await db.updateTaskStatusChecklist(u.id, u.status, u.checklist, u.issues);
    if (ok) showToast('Đã lưu thay đổi');
    else showToast('Lỗi khi lưu', 'error');
  };

  // Role-based tabs
  const getTabsForRole = (): { id: ViewTab; label: string; icon: React.ReactNode }[] => {
    if (userRole === 'HOMEOWNER') return [
      { id: 'DASHBOARD', label: 'Nhà của tôi', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
      { id: 'PAYMENTS', label: 'Thanh toán', icon: <DollarSign className="w-4 h-4" /> },
    ];
    if (userRole === 'ENGINEER') return [
      { id: 'KANBAN', label: 'Kanban', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'DIARY', label: 'Nhật ký', icon: <FileText className="w-4 h-4" /> },
      { id: 'LOGS', label: 'Báo cáo', icon: <FileText className="w-4 h-4" /> },
      { id: 'PROGRESS', label: 'Tiến độ', icon: <TrendingUp className="w-4 h-4" /> },
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
              <button onClick={() => setIsQuotationModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all h-[38px]"><FileSpreadsheet className="w-4 h-4" /> AI Tiến Độ</button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all h-[38px]"><Plus className="w-4 h-4" /> Tạo Dự Án</button>
            </div>
          )}
          {userRole !== 'HOMEOWNER' && (
            <div className="relative">
              <select value={selectedProject.id} onChange={e => setSelectedProject(PROJECTS.find(p => p.id === e.target.value) || PROJECTS[0])} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-medium text-slate-700 appearance-none pr-8 h-[38px]">
                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <ManagerDashboard projects={PROJECTS} finance={FINANCE} approvals={APPROVALS} notifications={NOTIFICATIONS} onSelectProject={p => { setSelectedProject(p); setActiveTab('KANBAN'); }} />
                <ProjectOverview project={selectedProject} subcontractors={SUBCONTRACTORS} milestones={MILESTONES} />
              </div>
            )}
            {/* Homeowner Dashboard */}
            {activeTab === 'DASHBOARD' && userRole === 'HOMEOWNER' && (
              <ClientCountdown project={selectedProject} milestones={MILESTONES} dailyLogs={dailyLogs} phases={CONSTRUCTION_PHASES} />
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
            {activeTab === 'COST' && <CostOverview tasks={tasks} project={selectedProject} />}
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
                <PaymentHistory payments={PAYMENT_RECORDS} />
                <ContractorProgressChart subcontractors={SUBCONTRACTORS} />
              </div>
            )}
            {/* Subcontractors */}
            {activeTab === 'SUBS' && (
              <div className="space-y-6">
                <ContractorProgressChart subcontractors={SUBCONTRACTORS} />
                <SubcontractorView subcontractors={SUBCONTRACTORS} />
              </div>
            )}
            {/* Attendance */}
            {activeTab === 'ATTENDANCE' && <AttendanceView attendance={ATTENDANCE[selectedProject.id]} />}
            {/* Reports */}
            {activeTab === 'REPORTS' && <ReportsView tasks={tasks} projectName={selectedProject.name} />}
            {/* AI Master Architect Board */}
            {activeTab === 'AI_GANTT' && <ProjectManagementAIModule />}
          </motion.div>
        </AnimatePresence>
      </div>

      <TaskDetailDrawer task={selectedTask} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onUpdate={handleUpdateTask} userRole={userRole} />
      <ImportQuotationModal isOpen={isQuotationModalOpen} onClose={() => setIsQuotationModalOpen(false)} />

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
