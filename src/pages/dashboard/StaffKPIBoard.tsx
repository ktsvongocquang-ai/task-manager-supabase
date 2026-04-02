import React, { useMemo, useState } from 'react';
import { type Task, type Project } from '../../types';
import { ChevronDown, ChevronUp, Award } from 'lucide-react';

// 4 KPI phases (matching ProjectKPIOverlay)
const PHASES = [
    { key: 'concept',      label: 'Concept',               pct: 15, icon: '💡', color: 'blue' },
    { key: '3d',           label: '3D / Phối cảnh',        pct: 35, icon: '🎨', color: 'violet' },
    { key: '2d',           label: '2D / Triển khai',       pct: 27, icon: '📐', color: 'amber' },
    { key: 'construction', label: 'Construction / Hồ sơ TC', pct: 23, icon: '🏗️', color: 'emerald' },
];

// Detect phase from task's target field or fallback to name
function detectPhase(task: Task): string {
    const tgt = (task.target || '').toLowerCase();
    if (['concept', '3d', '2d', 'construction'].includes(tgt)) return tgt;
    const name = (task.name || '').toLowerCase();
    if (name.includes('concept') || name.includes('moodboard') || name.includes('ý tưởng')) return 'concept';
    if (name.includes('3d') || name.includes('render') || name.includes('phối cảnh')) return '3d';
    if (name.includes('2d') || name.includes('triển khai') || name.includes('mep') || name.includes('bản vẽ')) return '2d';
    if (name.includes('hồ sơ') || name.includes('thi công') || name.includes('construction') || name.includes('giám sát')) return 'construction';
    return '';
}

interface StaffKPIBoardProps {
    allTasks: Task[];
    allProjects: Project[];
    allProfiles: any[];
    monthFilter: string;
    currentProfile: any;
}

interface StaffRow {
    id: string;
    name: string;
    projects: number;
    totalTasks: number;
    completed: number;
    onTime: number;
    late: number;
    // Tasks grouped by phase
    tasksByPhase: Record<string, Task[]>;
    // Per-project KPI summaries
    projectSummaries: { name: string; code: string; kpiDays: number; daysUsed: number; remaining: number; status: string }[];
}

export const StaffKPIBoard: React.FC<StaffKPIBoardProps> = ({
    allTasks, allProjects, allProfiles, monthFilter, currentProfile
}) => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc'].includes(currentProfile?.role?.trim() || '');

    const projectMap = useMemo(() => {
        const m: Record<string, Project> = {};
        allProjects.forEach(p => { m[p.id] = p; });
        return m;
    }, [allProjects]);

    const staffData = useMemo(() => {
        const rows: StaffRow[] = [];

        let filtered = allTasks;
        if (monthFilter) {
            filtered = allTasks.filter(t => {
                const d = t.completion_date || t.due_date || t.start_date || t.created_at || '';
                return d.startsWith(monthFilter);
            });
        }

        const profilesToShow = isManagerOrAdmin 
            ? allProfiles 
            : allProfiles.filter(p => p.id === currentProfile?.id);

        profilesToShow.forEach(profile => {
            const myTasks = filtered.filter(t => t.assignee_id === profile.id && !t.parent_id);
            const leadProjectIds = new Set(myTasks.map(t => t.project_id));
            const completed = myTasks.filter(t => t.status?.includes('Hoàn thành'));

            let onTime = 0, late = 0;
            completed.forEach(t => {
                if (!t.due_date) { onTime++; return; }
                const done = t.completion_date ? new Date(t.completion_date) : new Date();
                if (done <= new Date(t.due_date)) onTime++; else late++;
            });

            // Group tasks by phase
            const tasksByPhase: Record<string, Task[]> = { concept: [], '3d': [], '2d': [], construction: [], '': [] };
            myTasks.forEach(t => {
                const p = detectPhase(t);
                if (tasksByPhase[p]) tasksByPhase[p].push(t);
                else tasksByPhase[''].push(t);
            });

            // Per-project KPI
            const projectSummaries: StaffRow['projectSummaries'] = [];
            leadProjectIds.forEach(projId => {
                const proj = projectMap[projId];
                if (!proj) return;
                const revenue = proj.budget || 0;
                if (revenue <= 0) return;

                let otherInfo: any = {};
                try { if (proj.other_info) otherInfo = JSON.parse(proj.other_info); } catch(e) {}
                const kpiData = otherInfo.kpiData || {};
                const projectType = otherInfo.project_type || '';
                const pName = proj.name.toLowerCase();

                let coeff = 1.0;
                if (projectType.includes('Dịch vụ') || pName.includes('dịch vụ') || pName.includes('nhà hàng') || pName.includes('cafe')) coeff = 0.8;
                else if (projectType.includes('Nhà ở') || pName.includes('nhà ở') || pName.includes('biệt thự')) coeff = 1.3;

                const kpiDays = Math.round((revenue / 30000000) * 26 * coeff);
                const phases = kpiData.phases || {};
                const totalPhaseDays = Object.values(phases).reduce((a: number, p: any) => a + ((p as any).days_used || 0), 0);
                const pausedDays = kpiData.paused_days || 0;
                const daysUsed = totalPhaseDays + pausedDays;
                const remaining = kpiDays - daysUsed;

                projectSummaries.push({
                    name: proj.name,
                    code: proj.project_code,
                    kpiDays,
                    daysUsed,
                    remaining,
                    status: daysUsed > kpiDays ? 'over' : remaining <= 3 ? 'warn' : 'ok',
                });
            });

            rows.push({
                id: profile.id,
                name: profile.full_name || profile.email || 'N/A',
                projects: leadProjectIds.size,
                totalTasks: myTasks.length,
                completed: completed.length,
                onTime,
                late,
                tasksByPhase,
                projectSummaries,
            });
        });

        return rows.sort((a, b) => b.totalTasks - a.totalTasks);
    }, [allTasks, allProjects, allProfiles, monthFilter, currentProfile, isManagerOrAdmin, projectMap]);

    const displayData = showAll || !isManagerOrAdmin ? staffData : staffData.slice(0, 6);

    if (staffData.length === 0) return null;

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Award size={16} className="text-indigo-500" />
                    Bảng đánh giá hiệu quả nhân sự
                    {monthFilter && <span className="text-indigo-500 ml-1">({monthFilter})</span>}
                </h3>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100">
                    {staffData.length} nhân sự
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 font-bold text-slate-500 sticky left-0 bg-slate-50 z-10 min-w-[120px]">Nhân sự</th>
                            <th className="text-center px-2 py-2.5 font-bold text-indigo-500" title="Dự án">DA</th>
                            <th className="text-center px-2 py-2.5 font-bold text-emerald-500" title="Hoàn thành / Tổng">HT</th>
                            <th className="text-center px-2 py-2.5 font-bold text-emerald-500" title="Đúng hạn">✓</th>
                            <th className="text-center px-2 py-2.5 font-bold text-rose-500" title="Trễ hạn">!</th>
                            <th className="text-center px-2 py-2.5" title="Concept">💡</th>
                            <th className="text-center px-2 py-2.5" title="3D / Phối cảnh">🎨</th>
                            <th className="text-center px-2 py-2.5" title="2D / Triển khai">📐</th>
                            <th className="text-center px-2 py-2.5" title="Construction / Hồ sơ TC">🏗️</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, idx) => {
                            const isExpanded = expandedRow === row.id;
                            const isCurrentUser = row.id === currentProfile?.id;

                            return (
                                <React.Fragment key={row.id}>
                                    <tr
                                        className={`border-b border-slate-50 cursor-pointer transition-colors ${isCurrentUser ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                                    >
                                        {/* Name */}
                                        <td className={`px-4 py-3 font-bold text-slate-800 sticky left-0 z-10 ${isCurrentUser ? 'bg-indigo-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${isCurrentUser ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                                    {row.name.split(' ').pop()?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate leading-tight">{row.name.split(' ').pop()}</div>
                                                    {isCurrentUser && <div className="text-[9px] text-indigo-500 font-bold">BẠN</div>}
                                                </div>
                                                <div className="text-slate-300 ml-auto shrink-0">
                                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center px-2 py-2.5"><span className="font-bold text-indigo-600">{row.projects}</span></td>
                                        <td className="text-center px-2 py-2.5">
                                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold text-[10px]">{row.completed}/{row.totalTasks}</span>
                                        </td>
                                        <td className="text-center px-2 py-2.5"><span className="text-emerald-600 font-bold">{row.onTime}</span></td>
                                        <td className="text-center px-2 py-2.5">
                                            {row.late > 0
                                                ? <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-bold text-[10px]">{row.late}</span>
                                                : <span className="text-slate-300">0</span>}
                                        </td>
                                        {/* Phase task counts */}
                                        {PHASES.map(ph => {
                                            const count = (row.tasksByPhase[ph.key] || []).length;
                                            return (
                                                <td key={ph.key} className="text-center px-2 py-2.5">
                                                    {count > 0
                                                        ? <span className="font-bold text-slate-700">{count}</span>
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* ── Expanded: Phase breakdown + project KPI ── */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={9} className="bg-slate-50/80 px-4 py-4 border-b border-slate-100">
                                                {/* Per-project KPI */}
                                                {row.projectSummaries.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📊 KPI Dự án</div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {row.projectSummaries.map((ps, i) => {
                                                                const pct = ps.kpiDays > 0 ? Math.min(100, Math.round((ps.daysUsed / ps.kpiDays) * 100)) : 0;
                                                                return (
                                                                    <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <span className="text-xs font-black text-slate-800">{ps.name} <span className="text-slate-400 font-normal">({ps.code})</span></span>
                                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ps.status === 'over' ? 'bg-rose-50 text-rose-600 border border-rose-200' : ps.status === 'warn' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                                                                {ps.status === 'over' ? `Vượt ${Math.abs(ps.remaining)} ng` : `Còn ${ps.remaining} ng`}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                                <div className={`h-full rounded-full ${ps.status === 'over' ? 'bg-rose-500' : ps.status === 'warn' ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-slate-500">{ps.daysUsed}/{ps.kpiDays}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tasks by Phase */}
                                                <div className="space-y-3">
                                                    {PHASES.map(ph => {
                                                        const tasks = row.tasksByPhase[ph.key] || [];
                                                        if (tasks.length === 0) return null;
                                                        return (
                                                            <div key={ph.key}>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span>{ph.icon}</span>
                                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{ph.label}</span>
                                                                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                                    {tasks.map(t => {
                                                                        const proj = projectMap[t.project_id];
                                                                        const isDone = t.status?.includes('Hoàn thành');
                                                                        const isLate = !isDone && t.due_date && new Date(t.due_date) < new Date();
                                                                        return (
                                                                            <div key={t.id} className={`flex items-center justify-between bg-white rounded-lg px-3 py-2 border shadow-sm ${isDone ? 'border-emerald-100' : isLate ? 'border-rose-100' : 'border-slate-100'}`}>
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : isLate ? 'bg-rose-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                                    <span className={`text-xs font-bold truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                                                                                    <span className="text-[9px] text-slate-400 shrink-0">({t.task_code})</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                                    {proj && <span className="text-[9px] text-indigo-500 font-medium truncate max-w-[80px]">{proj.name}</span>}
                                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isDone ? 'bg-emerald-50 text-emerald-600' : isLate ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
                                                                                        {isDone ? '✓' : isLate ? 'Trễ' : t.status?.includes('Đang') ? 'Đang' : 'Chờ'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Unassigned phase tasks */}
                                                    {(row.tasksByPhase[''] || []).length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span>📋</span>
                                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Chưa gán giai đoạn</span>
                                                                <span className="bg-amber-100 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{row.tasksByPhase[''].length}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                                {row.tasksByPhase[''].map(t => {
                                                                    const isDone = t.status?.includes('Hoàn thành');
                                                                    return (
                                                                        <div key={t.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-sm">
                                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                                                            <span className="text-xs font-bold text-slate-700 truncate">{t.name}</span>
                                                                            <span className="text-[9px] text-slate-400">({t.task_code})</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Performance bar */}
                                                {row.completed > 0 && (
                                                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-200/60">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Hiệu suất:</span>
                                                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${row.onTime / row.completed >= 0.8 ? 'bg-emerald-500' : row.onTime / row.completed >= 0.5 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                                                style={{ width: `${Math.round((row.onTime / row.completed) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-black ${row.onTime / row.completed >= 0.8 ? 'text-emerald-600' : row.onTime / row.completed >= 0.5 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {Math.round((row.onTime / row.completed) * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {isManagerOrAdmin && staffData.length > 6 && (
                <div className="px-6 py-3 border-t border-slate-100 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                    >
                        {showAll ? 'Thu gọn' : `Xem tất cả (${staffData.length} nhân sự)`}
                        {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
};
