import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, FinanceData, Approval, Notification } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, AlertTriangle, ChevronRight, Folder, Clock, Activity } from 'lucide-react';
import { fmt } from './types';

interface Props {
  projects: Project[];
  finance: FinanceData;
  approvals: Approval[];
  notifications: Notification[];
  onSelectProject: (p: Project) => void;
  canViewFinance?: boolean;
}

// Tổng quan Thi Công — chỉ số liệu công trình + 1 con số tổng quan tiền (giá trị hợp đồng).
// Chi tiết chi phí/công nợ/NCC/khách hàng thuộc riêng module Tài chính (/finance), không lặp lại ở đây.
export function ManagerDashboard({ projects, notifications, onSelectProject, canViewFinance = false }: Props) {
  const navigate = useNavigate();
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  const delayedProjects = projects.filter(p => p.riskLevel !== 'green').length;
  const totalContract = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          TỔNG QUAN DỰ ÁN
        </h2>
        {/* Chỉ hiện với role có quyền vào /finance — trước đây hiện cho mọi
            role rồi bị RoleGuard bật lại về /construction ngay khi bấm,
            với Quản lý thi công/Giám Sát nút này chỉ là ngõ cụt. */}
        {canViewFinance && (
          <button onClick={() => navigate('/finance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
            <DollarSign className="w-3.5 h-3.5" /> Xem chi tiết Tài chính <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metric cards — chỉ số liệu thi công + 1 con số tổng quan tiền, không đi vào chi tiết tài chính */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng công trình', value: totalProjects, icon: <Folder className="w-4 h-4" /> },
          { label: 'Đang thi công', value: activeProjects, icon: <Activity className="w-4 h-4" /> },
          { label: 'Công trình trễ', value: delayedProjects, icon: <Clock className="w-4 h-4 text-rose-500" /> },
          { label: 'Tổng hợp đồng', value: fmt(totalContract), icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
        ].map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">{c.icon}<span className="text-xs font-bold uppercase">{c.label}</span></div>
            <div className="text-xl font-black text-slate-800">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Chart — tiến độ thi công theo công trình (không phải số liệu tài chính) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tiến độ theo công trình</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={projects.map(p => ({ name: p.name.slice(0, 15), 'Tiến độ': p.progress }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
            <Bar dataKey="Tiến độ" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công trình cần theo dõi</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200">
                <tr><th className="px-3 py-2">Mã</th><th className="px-3 py-2">Công trình</th><th className="px-3 py-2">Tiến độ</th><th className="px-3 py-2 text-center">Rủi ro</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.filter(p => p.riskLevel !== 'green').slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectProject(p)}>
                    <td className="px-3 py-2 font-mono font-bold text-slate-500">{p.projectCode || 'N/A'}</td>
                    <td className="px-3 py-2 font-bold text-slate-700">{p.name}</td>
                    <td className="px-3 py-2"><span className="text-amber-600 font-bold">{p.progress}%</span></td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.riskLevel === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.riskLevel === 'red' ? 'Cao' : 'Trung bình'}
                      </span>
                    </td>
                  </tr>
                ))}
                {projects.filter(p => p.riskLevel !== 'green').length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">Không có công trình cần theo dõi</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cảnh báo vận hành</h4></div>
          <div className="flex-1 p-4 flex flex-col justify-center items-center text-slate-400 text-sm">
            {notifications.filter(n => n.level === 'action').length > 0 ? (
              <div className="w-full space-y-2">
                {notifications.filter(n => n.level === 'action').map(n => (
                  <div key={n.id} className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div><p className="font-bold text-xs">{n.msg}</p><p className="text-[10px] mt-1 opacity-80">{n.time}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Chưa có cảnh báo lên.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
