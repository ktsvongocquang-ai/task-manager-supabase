import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  X, Image as ImageIcon, Users, UserCircle2, MapPin, Building2, Upload, FileText,
  FolderOpen, Pencil, Wallet, TrendingDown, TrendingUp, CheckCircle2, PiggyBank, CreditCard,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { uploadFile } from '../../utils/uploadUtils';
import type { Project } from './types';
import { fmt, statusConfig, type TaskStatus } from './types';

// ═══════════════════════════════════════════════════════════
// "Hồ sơ công trình" — modal tổng hợp 1 công trình: ảnh/thông tin, các thẻ tài chính,
// biểu đồ tiến độ/hợp đồng-chi phí/công nợ, danh sách hạng mục/công việc/chi phí/thu tiền
// liên quan, và khu vực tài liệu (ảnh công trình + hồ sơ hợp đồng, dùng chung bucket
// "project-media" đã có sẵn từ tính năng "Thêm nhiều công trình nhanh").
// ═══════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, string> = {
  preparing: 'Chuẩn bị', in_progress: 'Đang thi công', paused: 'Tạm dừng',
  completed: 'Hoàn thành', warranty: 'Bảo hành',
};

interface ItemRow {
  id: string; name: string; progress: number; budget: number; actual_cost: number;
  assignee: string; status: string;
}
interface TaskRow {
  id: string; item_id: string | null; name: string; status: string; progress: number;
  start_date: string; end_date: string; assignee?: string;
}
interface ExpenseRow { id: string; date: string; description: string; amount: number; amount_paid: number; supplier_name: string | null; payment_status: string; }
interface IncomeRow { id: string; date: string; description: string | null; amount: number; }

const DONUT_EMPTY = [{ name: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0' }];

function Donut({ data, height = 180 }: { data: { name: string; value: number; color: string }[]; height?: number }) {
  const shown = data.filter(d => d.value > 0);
  const rows = shown.length ? shown : DONUT_EMPTY;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
          {rows.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StatCard({ icon, label, value, tone = 'text-slate-800' }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold truncate">{label}</p>
        <p className={`text-sm font-bold ${tone} truncate`}>{value}</p>
      </div>
    </div>
  );
}

interface Props {
  project: Project;
  onClose: () => void;
  onEditProject?: (p: Project) => void;
  onViewKanban?: (p: Project) => void;
  onUpdated?: () => void;
}

export function ProjectDossierModal({ project, onClose, onEditProject, onViewKanban, onUpdated }: Props) {
  const [customerName, setCustomerName] = useState('--');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'photo' | 'contract' | null>(null);
  const [photoUrl, setPhotoUrl] = useState(project.photoUrl || '');
  const [contractDocUrl, setContractDocUrl] = useState(project.contractDocUrl || '');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [custRes, itemsRes, tasksRes, expRes, incRes] = await Promise.all([
        project.customerId ? supabase.from('customers').select('name').eq('id', project.customerId).single() : Promise.resolve({ data: null } as any),
        supabase.from('construction_items').select('id,name,progress,budget,actual_cost,assignee,status').eq('project_id', project.id).order('created_at'),
        supabase.from('construction_tasks').select('id,item_id,name,status,progress,start_date,end_date').eq('project_id', project.id).order('created_at'),
        supabase.from('construction_expenses').select('id,date,description,amount,amount_paid,supplier_name,payment_status').eq('project_id', project.id).order('date', { ascending: false }),
        supabase.from('construction_incomes').select('id,date,description,amount').eq('project_id', project.id).order('date', { ascending: false }),
      ]);
      if (cancelled) return;
      setCustomerName(custRes.data?.name || '--');
      setItems((itemsRes.data as ItemRow[]) || []);
      setTasks((tasksRes.data as TaskRow[]) || []);
      setExpenses((expRes.data as ExpenseRow[]) || []);
      setIncomes((incRes.data as IncomeRow[]) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [project.id, project.customerId]);

  const totalCost = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const paidToSuppliers = expenses.reduce((s, e) => s + (e.amount_paid || 0), 0);
  const owedToSuppliers = Math.max(0, totalCost - paidToSuppliers);
  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const stillToCollect = Math.max(0, project.contractValue - totalIncome);
  const overCollected = Math.max(0, totalIncome - project.contractValue);
  const expectedProfit = project.contractValue - totalCost;
  const currentCashflow = totalIncome - paidToSuppliers;

  const uploadDoc = async (file: File, kind: 'photo' | 'contract') => {
    setUploading(kind);
    const path = `construction/${project.id}/${kind}-${Date.now()}-${file.name}`;
    const url = await uploadFile(file, 'project-media', path);
    setUploading(null);
    if (!url) return;
    const field = kind === 'photo' ? 'photo_url' : 'contract_doc_url';
    const { error } = await supabase.from('construction_projects').update({ [field]: url }).eq('id', project.id);
    if (error) return;
    if (kind === 'photo') setPhotoUrl(url); else setContractDocUrl(url);
    onUpdated?.();
  };

  const itemProgressData = items.map(it => ({ name: it.name.slice(0, 12) || '(chưa đặt tên)', ['Tiến độ %']: it.progress || 0 }));
  const taskStatusData = (['TODO', 'DOING', 'REVIEW', 'DONE'] as TaskStatus[]).map(s => ({
    name: statusConfig[s].label,
    value: tasks.filter(t => (t.status as TaskStatus) === s).length,
    color: { TODO: '#94a3b8', DOING: '#3b82f6', REVIEW: '#f59e0b', DONE: '#10b981' }[s],
  }));

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
          className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Hồ sơ công trình {project.projectCode || ''}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            {/* Ảnh + thông tin chính */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2 min-h-[220px]">
                {photoUrl ? (
                  <img src={photoUrl} alt="Ảnh công trình" className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Ảnh công trình</p>
                    <p className="text-xs text-slate-400">Chưa có ảnh công trình</p>
                  </>
                )}
                <button onClick={() => photoInputRef.current?.click()} disabled={uploading === 'photo'}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50">
                  {uploading === 'photo' ? 'Đang tải lên...' : photoUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'photo'); e.target.value = ''; }} />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold">{project.projectCode || '--'}</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">{STATUS_LABELS[project.status] || project.status}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="text-xs text-slate-400 font-bold">{project.progress}%</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Khách hàng</p><p className="font-bold text-slate-700">{customerName}</p></div></div>
                  <div className="flex items-center gap-2 text-sm"><UserCircle2 className="w-4 h-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Người phụ trách</p><p className="font-bold text-slate-700">{project.managerName || '—'}</p></div></div>
                  <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Địa chỉ</p><p className="font-bold text-slate-700">{project.address || '--'}</p></div></div>
                  <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Loại công trình</p><p className="font-bold text-slate-700">{project.projectType || '--'}</p></div></div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {onEditProject && <button onClick={() => { onEditProject(project); onClose(); }} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Sửa công trình</button>}
                  {onViewKanban && <button onClick={() => { onViewKanban(project); onClose(); }} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Xem Kanban</button>}
                  <button onClick={() => contractInputRef.current?.click()} disabled={uploading === 'contract'} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                    <Upload className="w-3.5 h-3.5" /> {uploading === 'contract' ? 'Đang tải lên...' : 'Tải hồ sơ/hợp đồng'}
                  </button>
                  <input ref={contractInputRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, 'contract'); e.target.value = ''; }} />
                  {contractDocUrl && <a href={contractDocUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Xem tài liệu</a>}
                </div>
              </div>
            </div>

            {/* Thẻ tài chính */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <StatCard icon={<Wallet className="w-4 h-4 text-indigo-500" />} label="Giá trị hợp đồng" value={fmt(project.contractValue)} />
              <StatCard icon={<TrendingDown className="w-4 h-4 text-rose-500" />} label="Tổng chi phí" value={fmt(totalCost)} />
              <StatCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} label="Đã thanh toán NCC" value={fmt(paidToSuppliers)} />
              <StatCard icon={<CreditCard className="w-4 h-4 text-amber-500" />} label="Còn phải trả NCC" value={fmt(owedToSuppliers)} tone="text-amber-600" />
              <StatCard icon={<Wallet className="w-4 h-4 text-emerald-500" />} label="Đã thu" value={fmt(totalIncome)} />
              <StatCard icon={<CreditCard className="w-4 h-4 text-rose-500" />} label="Còn phải thu" value={fmt(stillToCollect)} tone="text-rose-600" />
              <StatCard icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} label="Thu vượt" value={fmt(overCollected)} />
              <StatCard icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} label="Lợi nhuận dự kiến" value={fmt(expectedProfit)} tone={expectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
              <StatCard icon={<PiggyBank className="w-4 h-4 text-indigo-500" />} label="Dòng tiền hiện tại" value={fmt(currentCashflow)} />
            </div>

            {/* Biểu đồ tổng quan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiến độ tổng</h4>
                <Donut data={[{ name: 'Đã hoàn thành', value: project.progress, color: '#10b981' }, { name: 'Còn lại', value: 100 - project.progress, color: '#f59e0b' }]} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hợp đồng / Chi phí</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart layout="vertical" data={[
                    { name: 'Hợp đồng', value: project.contractValue, fill: '#eab308' },
                    { name: 'Chi phí', value: totalCost, fill: '#94a3b8' },
                    { name: 'Lợi nhuận', value: expectedProfit, fill: '#dc2626' },
                  ]} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đã thu / Công nợ</h4>
                <Donut data={[{ name: 'Đã thu', value: totalIncome, color: '#eab308' }, { name: 'Còn phải thu', value: stillToCollect, color: '#f97316' }]} />
              </div>
            </div>

            {/* Tiến độ hạng mục + trạng thái công việc */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiến độ hạng mục</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart layout="vertical" data={itemProgressData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                    <Bar dataKey="Tiến độ %" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trạng thái công việc</h4>
                <Donut data={taskStatusData} height={220} />
              </div>
            </div>

            {/* Hạng mục + Công việc liên quan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Hạng mục liên quan</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{items.length}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {items.map(it => (
                    <div key={it.id} className="border border-slate-100 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-700 text-sm">{it.name}</p>
                        <span className="text-[10px] text-slate-400">{it.status || 'Chưa rõ'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${it.progress || 0}%` }} /></div>
                        <span className="text-[10px] text-slate-400">{it.progress || 0}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Dự kiến {fmt(it.budget)} · Thực tế {fmt(it.actual_cost)}</p>
                    </div>
                  ))}
                  {!loading && items.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Chưa có dữ liệu</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Công việc liên quan</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{tasks.length}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {tasks.map(t => {
                    const meta = statusConfig[(t.status as TaskStatus)] || statusConfig.TODO;
                    return (
                      <div key={t.id} className="border border-slate-100 rounded-lg p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-700 text-sm">{t.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${t.progress || 0}%` }} /></div>
                          <span className="text-[10px] text-slate-400">{t.progress || 0}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {!loading && tasks.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Chưa có dữ liệu</p>}
                </div>
              </div>
            </div>

            {/* Chi phí + Thu tiền liên quan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Chi phí liên quan</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{expenses.length}</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {expenses.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                      <div className="min-w-0"><p className="font-medium text-slate-700 truncate">{e.description || e.supplier_name || '--'}</p><p className="text-[10px] text-slate-400">{e.date}</p></div>
                      <p className="font-bold text-rose-600 shrink-0 ml-2">{fmt(e.amount)}</p>
                    </div>
                  ))}
                  {!loading && expenses.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Chưa có dữ liệu</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Thu tiền liên quan</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{incomes.length}</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {incomes.map(i => (
                    <div key={i.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                      <div className="min-w-0"><p className="font-medium text-slate-700 truncate">{i.description || '--'}</p><p className="text-[10px] text-slate-400">{i.date}</p></div>
                      <p className="font-bold text-emerald-600 shrink-0 ml-2">{fmt(i.amount)}</p>
                    </div>
                  ))}
                  {!loading && incomes.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Chưa có dữ liệu</p>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
