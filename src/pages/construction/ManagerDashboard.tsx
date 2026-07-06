import React from 'react';
import { Project, FinanceData, Approval, Notification } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Folder, Clock, Activity, FileText } from 'lucide-react';
import { fmt } from './types';

interface Props {
  projects: Project[];
  finance: FinanceData;
  approvals: Approval[];
  notifications: Notification[];
  onSelectProject: (p: Project) => void;
}

export function ManagerDashboard({ projects, finance, approvals, notifications, onSelectProject }: Props) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  const delayedProjects = projects.filter(p => p.riskLevel !== 'green').length;

  const totalContract = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const totalCollected = projects.reduce((sum, p) => sum + ((p.contractValue || 0) * 0.4), 0); // Mock
  const totalReceivables = totalContract - totalCollected;
  const totalProfit = totalContract - totalSpent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          TỔNG QUAN DỰ ÁN
        </h2>
      </div>

      {/* 12 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng công trình', value: totalProjects, icon: <Folder className="w-4 h-4" /> },
          { label: 'Đang thi công', value: activeProjects, icon: <Activity className="w-4 h-4" /> },
          { label: 'Công trình trễ', value: delayedProjects, icon: <Clock className="w-4 h-4 text-rose-500" /> },
          { label: 'Tổng hợp đồng', value: fmt(totalContract), icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
          { label: 'Chi phí phát sinh', value: fmt(totalSpent), icon: <TrendingUp className="w-4 h-4 text-rose-500" /> },
          { label: 'Đã thanh toán NCC', value: fmt(totalSpent * 0.8), icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
          { label: 'Cần phải trả NCC', value: fmt(totalSpent * 0.2), icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
          { label: 'Đã thu', value: fmt(totalCollected), icon: <DollarSign className="w-4 h-4 text-teal-500" /> },
          { label: 'Cần phải thu', value: fmt(totalReceivables), icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
          { label: 'Thu vượt', value: '0 đ', icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: 'Lợi nhuận dự kiến', value: fmt(totalProfit), icon: <TrendingUp className="w-4 h-4 text-indigo-500" /> },
          { label: 'Đang kiểm tháo', value: '0', icon: <FileText className="w-4 h-4" /> },
        ].map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">{c.icon}<span className="text-xs font-bold uppercase">{c.label}</span></div>
            <div className="text-xl font-black text-slate-800">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cơ cấu chi phí theo loại</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[{ name: 'Nhân công', value: 45 }, { name: 'Vật tư', value: 35 }, { name: 'Khác', value: 20 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#6366f1" />
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công trình cần theo dõi</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200">
                <tr><th className="px-3 py-2">Mã</th><th className="px-3 py-2">Công trình</th><th className="px-3 py-2">Tiến độ</th><th className="px-3 py-2 text-right">Chi phí</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.filter(p => p.riskLevel !== 'green').slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono font-bold text-slate-500">{p.projectCode || 'N/A'}</td>
                    <td className="px-3 py-2 font-bold text-slate-700">{p.name}</td>
                    <td className="px-3 py-2"><span className="text-amber-600 font-bold">{p.progress}%</span></td>
                    <td className="px-3 py-2 text-right font-medium">{fmt(p.spent)}</td>
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
