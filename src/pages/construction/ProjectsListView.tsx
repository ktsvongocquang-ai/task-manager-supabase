import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Download, Upload, FileSpreadsheet, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Pagination } from '../../components/Pagination';
import { readExcelFile, exportRowsToExcel } from '../../utils/excelIO';
import { ProjectDossierModal } from './ProjectDossierModal';
import type { Project } from './types';
import { fmt } from './types';

// ═══════════════════════════════════════════════════════════
// Trang danh sách "Công trình" — bộ lọc 6 điều kiện + Tìm nhanh + phân trang + Excel,
// khớp pattern đã có ở Finance (ExpensesTab) + tái dùng Pagination/excelIO dùng chung.
// ═══════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, string> = {
  preparing: 'Chuẩn bị', in_progress: 'Đang thi công', paused: 'Tạm dừng',
  completed: 'Hoàn thành', warranty: 'Bảo hành',
};
const statusLabel = (s: string) => STATUS_LABELS[s] || s;

const todayStr = () => new Date().toISOString().slice(0, 10);
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Props {
  projects: Project[];
  onOpenProject: (p: Project) => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onCreateNew: () => void;
  bulkCreateProjects: (rows: any[]) => Promise<number>;
  refreshProjects?: () => Promise<void>;
}

export function ProjectsListView({ projects, onOpenProject, onEditProject, onDeleteProject, onCreateNew, bulkCreateProjects, refreshProjects }: Props) {
  const [dossierProject, setDossierProject] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fType, setFType] = useState('');
  const [fCustomer, setFCustomer] = useState('');
  const [fManager, setFManager] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [progressFrom, setProgressFrom] = useState('');
  const [progressTo, setProgressTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [custRes, lookupRes] = await Promise.all([
        supabase.from('customers').select('id,name').order('name'),
        supabase.from('finance_lookups').select('label').eq('list_key', 'project_type').order('sort_order'),
      ]);
      if (custRes.data) setCustomers(custRes.data as { id: string; name: string }[]);
      if (lookupRes.data) setProjectTypes((lookupRes.data as { label: string }[]).map(l => l.label));
    })();
  }, []);

  const customerName = (id?: string | null) => customers.find(c => c.id === id)?.name || '--';
  const statusOptions = useMemo(() => Array.from(new Set(projects.map(p => p.status).filter(Boolean))), [projects]);
  const managerOptions = useMemo(() => Array.from(new Set(projects.map(p => p.managerName).filter(Boolean))) as string[], [projects]);

  const resetFilters = () => {
    setSearch(''); setFStatus(''); setFType(''); setFCustomer(''); setFManager('');
    setDateFrom(''); setDateTo(''); setProgressFrom(''); setProgressTo(''); setPage(1);
  };

  const filtered = projects.filter(p => {
    if (fStatus && p.status !== fStatus) return false;
    if (fType && p.projectType !== fType) return false;
    if (fCustomer && p.customerId !== fCustomer) return false;
    if (fManager && p.managerName !== fManager) return false;
    if (dateFrom && p.startDate && p.startDate < dateFrom) return false;
    if (dateTo && p.startDate && p.startDate > dateTo) return false;
    if (progressFrom && p.progress < Number(progressFrom)) return false;
    if (progressTo && p.progress > Number(progressTo)) return false;
    if (search) {
      const q = normalize(search);
      const hay = normalize(`${p.projectCode || ''} ${p.name} ${p.address || ''} ${statusLabel(p.status)}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleTemplate = () => {
    exportRowsToExcel([{
      'Tên công trình': 'VD: Nhà cô Lan - Q.7', 'Mã khách hàng (tên)': customers[0]?.name || '', 'Địa chỉ': '',
      'Loại công trình': projectTypes[0] || '', 'Ngày bắt đầu': todayStr(), 'Ngày dự kiến hoàn thành': '',
      'Giá trị hợp đồng': 1000000000, 'Dự toán chi phí': 0, 'Người phụ trách': '', 'Trạng thái': 'preparing',
      'Tiến độ %': 0, 'Ghi chú': '',
    }], 'Mau_Cong_trinh.xlsx', 'Mẫu Công trình');
  };

  const handleExport = () => {
    const rows = filtered.map(p => ({
      'Mã công trình': p.projectCode || '', 'Tên công trình': p.name, 'Mã khách hàng': customerName(p.customerId),
      'Địa chỉ': p.address || '', 'Loại công trình': p.projectType || '', 'Ngày bắt đầu': p.startDate || '',
      'Ngày dự kiến hoàn thành': p.handoverDate || '', 'Giá trị hợp đồng': p.contractValue, 'Dự toán chi phí': p.budget,
      'Người phụ trách': p.managerName || '', 'Trạng thái': statusLabel(p.status), 'Tiến độ %': p.progress,
    }));
    exportRowsToExcel(rows, `Cong_trinh_${todayStr()}.xlsx`, 'Công trình');
  };

  const handleImport = async (file: File) => {
    const rows = await readExcelFile(file);
    let skipped = 0;
    const valid = rows.map(r => {
      const name = String(r['Tên công trình'] || '').trim();
      if (!name) { skipped++; return null; }
      const custName = String(r['Mã khách hàng (tên)'] || r['Mã khách hàng'] || '').trim().toLowerCase();
      const customer = customers.find(c => c.name.trim().toLowerCase() === custName);
      return {
        name, address: r['Địa chỉ'] || '', project_type: r['Loại công trình'] || null,
        customer_id: customer?.id || null, owner_name: customer?.name || '',
        start_date: r['Ngày bắt đầu'] || null, handover_date: r['Ngày dự kiến hoàn thành'] || null,
        contract_value: Number(r['Giá trị hợp đồng']) || 0, budget: Number(r['Dự toán chi phí']) || 0,
        manager_name: r['Người phụ trách'] || '', engineer_name: '',
        status: String(r['Trạng thái'] || 'preparing'), progress: Number(r['Tiến độ %']) || 0, spent: 0,
      };
    }).filter(Boolean);
    const created = await bulkCreateProjects(valid as any[]);
    setImportMsg(`Đã nhập ${created} công trình${skipped > 0 ? `, bỏ qua ${skipped} dòng thiếu Tên công trình` : ''}.`);
    setTimeout(() => setImportMsg(''), 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Công trình</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý công trình, hợp đồng, tiến độ và người phụ trách.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {importMsg && <span className="text-xs text-emerald-600 font-medium">{importMsg}</span>}
          <button onClick={handleTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Nhập từ Excel</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
          <button onClick={handleExport} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel</button>
          <button onClick={onCreateNew} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Thêm mới</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Gõ tên, mã, trạng thái hoặc nội dung cần tìm..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-indigo-600 shrink-0">↺ Đặt lại</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <select value={fType} onChange={e => { setFType(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả loại công trình</option>
            {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fCustomer} onChange={e => { setFCustomer(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả khách hàng</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={fManager} onChange={e => { setFManager(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả người phụ trách</option>
            {managerOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Ngày bắt đầu:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Tiến độ %:</span>
            <input type="number" min={0} max={100} value={progressFrom} onChange={e => { setProgressFrom(e.target.value); setPage(1); }} placeholder="Từ" className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="number" min={0} max={100} value={progressTo} onChange={e => { setProgressTo(e.target.value); setPage(1); }} placeholder="Đến" className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="text-left px-3 py-2.5 font-bold">Mã công trình</th>
              <th className="text-left px-3 py-2.5 font-bold">Tên công trình</th>
              <th className="text-left px-3 py-2.5 font-bold">Mã khách hàng</th>
              <th className="text-left px-3 py-2.5 font-bold">Loại công trình</th>
              <th className="text-right px-3 py-2.5 font-bold">Giá trị hợp đồng</th>
              <th className="text-left px-3 py-2.5 font-bold">Trạng thái</th>
              <th className="text-left px-3 py-2.5 font-bold">Tiến độ %</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-mono text-slate-500">{p.projectCode || '--'}</td>
                <td className="px-3 py-2.5 font-bold text-slate-700">{p.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{customerName(p.customerId)}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.projectType || '--'}</td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-700">{fmt(p.contractValue)}</td>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">{statusLabel(p.status)}</span></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-slate-500">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setDossierProject(p)} title="Xem hồ sơ" className="p-1.5 text-slate-400 hover:text-indigo-600"><FolderOpen className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onEditProject(p)} title="Sửa" className="p-1.5 text-slate-400 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDeleteProject(p)} title="Xoá" className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">Không có công trình phù hợp bộ lọc</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={n => { setPageSize(n); setPage(1); }} />

      {dossierProject && (
        <ProjectDossierModal
          project={dossierProject}
          onClose={() => setDossierProject(null)}
          onEditProject={onEditProject}
          onViewKanban={onOpenProject}
          onUpdated={refreshProjects}
        />
      )}
    </div>
  );
}
