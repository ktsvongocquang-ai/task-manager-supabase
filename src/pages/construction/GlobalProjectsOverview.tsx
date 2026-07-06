import React, { useState, useMemo } from 'react';
import { Project } from './types';
import { Search, Filter, Folder, DollarSign, TrendingUp, AlertTriangle, RefreshCw, Download, CheckCircle2, ChevronRight } from 'lucide-react';
import { fmt } from './types';

interface Props {
  projects: Project[];
  onSelectProject: (p: Project) => void;
}

export function GlobalProjectsOverview({ projects, onSelectProject }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tab, setTab] = useState<'need_attention' | 'finance' | 'progress' | 'docs' | 'all'>('all');

  const totalContract = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Dummy values for now
  const totalCollected = projects.reduce((sum, p) => sum + ((p.contractValue || 0) * 0.4), 0);
  const totalReceivables = totalContract - totalCollected;
  const totalProfit = totalContract - totalBudget;

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.projectCode && p.projectCode.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      if (tab === 'need_attention') return matchSearch && matchStatus && p.riskLevel !== 'green';
      if (tab === 'finance') return matchSearch && matchStatus;
      if (tab === 'progress') return matchSearch && matchStatus && p.progress < 50;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter, tab]);

  return (
    <div className="space-y-6">
      {/* HEADER STATS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tổng hợp công trình</h1>
            <p className="text-sm text-slate-500">Phân tích doanh thu, hợp đồng, chi phí, công nợ và lợi nhuận.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /> Làm mới</button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"><Download className="w-4 h-4" /> Xuất Excel</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><Folder className="w-4 h-4" /><span className="text-xs font-bold uppercase">Công trình</span></div>
            <div className="text-xl font-black text-slate-800">{projects.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs font-bold uppercase">Hợp đồng</span></div>
            <div className="text-xl font-black text-emerald-600">{fmt(totalContract)}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp className="w-4 h-4 text-rose-500" /><span className="text-xs font-bold uppercase">Chi phí</span></div>
            <div className="text-xl font-black text-rose-600">{fmt(totalSpent)} <span className="text-xs font-normal text-slate-400">/ {fmt(totalBudget)}</span></div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span className="text-xs font-bold uppercase">Đã thu</span></div>
            <div className="text-xl font-black text-teal-600">{fmt(totalCollected)}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-xs font-bold uppercase">Cần phải thu</span></div>
            <div className="text-xl font-black text-amber-600">{fmt(totalReceivables)}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp className="w-4 h-4 text-indigo-500" /><span className="text-xs font-bold uppercase">Lợi nhuận</span></div>
            <div className="text-xl font-black text-indigo-600">{fmt(totalProfit)}</div>
          </div>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Bộ lọc tổng hợp</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm tên công trình, mã..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2">
            <option value="all">Trạng thái: Tất cả</option>
            <option value="in_progress">Đang thi công</option>
            <option value="completed">Đã bàn giao</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2">
            <option value="all">Loại công trình: Tất cả</option>
            <option value="villa">Biệt thự</option>
            <option value="townhouse">Nhà phố</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2">
            <option>Người phụ trách: Tất cả</option>
          </select>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'need_attention', label: 'Cần theo dõi' },
          { id: 'finance', label: 'Tài chính' },
          { id: 'progress', label: 'Tiến độ thấp' },
          { id: 'docs', label: 'Thiếu hồ sơ' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROJECT LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">Không có công trình phù hợp bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Công trình</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hợp đồng</th>
                  <th className="px-4 py-3 text-right">Đã thu</th>
                  <th className="px-4 py-3 text-right">Chi phí</th>
                  <th className="px-4 py-3 text-center">Tiến độ</th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{p.projectCode || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.address}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.status === 'completed' ? 'Hoàn thành' : 'Đang thi công'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(p.contractValue)}</td>
                    <td className="px-4 py-3 text-right font-medium text-teal-600">{fmt((p.contractValue || 0) * 0.4)}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">{fmt(p.spent || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.progress < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold w-8">{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => onSelectProject(p)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
