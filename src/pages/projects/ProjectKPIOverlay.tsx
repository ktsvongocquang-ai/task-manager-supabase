import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Project, type Task } from '../../types';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { X, Plus, Minus, ChevronDown, Play, PauseCircle, Clock } from 'lucide-react';

// ── Phase definition ───────────────────────────────────────────────────────────
const DEFAULT_PHASES = [
    { key: 'concept', name: 'Concept', kpiPct: 15 },       // 15% of total KPI days
    { key: '3d', name: '3D / Phối cảnh', kpiPct: 35 },     // 35%
    { key: '2d', name: '2D / Triển khai', kpiPct: 27 },     // 27%
    { key: 'construction', name: 'Construction / Hồ sơ TC', kpiPct: 23 }, // 23%
];

// Auto-detect which phase a task belongs to from its target/name
function detectPhase(task: Task): string {
    // Direct target match (set from the task form dropdown)
    const tgt = (task.target || '').toLowerCase();
    if (['concept', '3d', '2d', 'construction'].includes(tgt)) return tgt;
    
    // Fallback: detect from name
    const str = (task.name || '').toLowerCase();
    if (str.includes('concept') || str.includes('moodboard') || str.includes('ý tưởng') || str.includes('phương án')) return 'concept';
    if (str.includes('3d') || str.includes('render') || str.includes('phối cảnh') || str.includes('nội thất 3d')) return '3d';
    if (str.includes('2d') || str.includes('triển khai') || str.includes('mep') || str.includes('bản vẽ') || str.includes('kỹ thuật') || str.includes('hồ sơ') || str.includes('tender')) return '2d';
    if (str.includes('giám sát') || str.includes('thi công') || str.includes('construction') || str.includes('nghiệm thu')) return 'construction';
    return ''; // unassigned
}

// ── KPI State stored in other_info ─────────────────────────────────────────────
interface KPIPhaseState {
    days_used: number;
    days_estimated?: number;
}
interface KPIState {
    paused_days: number;
    is_paused: boolean;
    phases: Record<string, KPIPhaseState>;
    // Manual phase assignment overrides { taskId: phaseKey }
    taskPhaseMap: Record<string, string>;
}

const DEFAULT_KPI_STATE: KPIState = {
    paused_days: 0,
    is_paused: false,
    phases: {
        'concept': { days_used: 0, days_estimated: 0 },
        '3d': { days_used: 0, days_estimated: 0 },
        '2d': { days_used: 0, days_estimated: 0 },
        'construction': { days_used: 0, days_estimated: 0 },
    },
    taskPhaseMap: {},
};

// ── Component ──────────────────────────────────────────────────────────────────
interface ProjectKPIOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    managerName?: string;
    onUpdateProject?: () => void;
}

export const ProjectKPIOverlay: React.FC<ProjectKPIOverlayProps> = ({
    isOpen, onClose, project, tasks, managerName, onUpdateProject
}) => {
    const [kpiState, setKpiState] = useState<KPIState>(DEFAULT_KPI_STATE);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({ concept: true });
    const [saving, setSaving] = useState(false);

    // Load KPI state from project.other_info
    useEffect(() => {
        if (!project) return;
        try {
            if (project.other_info) {
                const parsed = JSON.parse(project.other_info);
                if (parsed?.kpiData) {
                    setKpiState({
                        ...DEFAULT_KPI_STATE,
                        ...parsed.kpiData,
                        phases: { ...DEFAULT_KPI_STATE.phases, ...(parsed.kpiData.phases || {}) },
                        taskPhaseMap: parsed.kpiData.taskPhaseMap || {},
                    });
                    return;
                }
            }
        } catch (e) {}
        setKpiState(DEFAULT_KPI_STATE);
    }, [project, isOpen]);

    // Ref for debounced save — MUST be before early return (hooks rule)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get project tasks (only parent tasks, no subtasks) — MUST be before early return
    const projectTasks = (isOpen && project) ? tasks.filter(t => t.project_id === project.id && !t.parent_id) : [];

    // Group tasks by phase — MUST be before early return (hooks rule)
    const tasksByPhase = useMemo(() => {
        const grouped: Record<string, Task[]> = { concept: [], '3d': [], '2d': [], 'construction': [], '_unassigned': [] };
        projectTasks.forEach(t => {
            // Manual override > auto-detect
            const phase = kpiState.taskPhaseMap[t.id] || detectPhase(t);
            if (phase && grouped[phase]) grouped[phase].push(t);
            else grouped['_unassigned'].push(t);
        });
        return grouped;
    }, [projectTasks.length, kpiState.taskPhaseMap, isOpen, project?.id]);

    if (!isOpen || !project) return null;

    // Save handler - silently persist without triggering parent re-render
    const handleSave = async (newState: KPIState) => {
        setSaving(true);
        try {
            let currentOtherInfo: any = {};
            try { if (project.other_info) currentOtherInfo = JSON.parse(project.other_info); } catch (e) {}
            const merged = { ...currentOtherInfo, kpiData: newState };
            await supabase.from('projects').update({ other_info: JSON.stringify(merged) }).eq('id', project.id);
            // DO NOT call onUpdateProject here — it re-fetches projects and kills the overlay
        } catch (err) {
            console.error('Error saving KPI:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateState = (updater: (prev: KPIState) => KPIState) => {
        setKpiState(prev => {
            const next = updater(prev);
            // Debounce save: wait 500ms after last change before persisting
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => handleSave(next), 500);
            return next;
        });
    };

    // Assign a task to a phase
    const assignTaskToPhase = (taskId: string, phaseKey: string) => {
        updateState(s => ({
            ...s,
            taskPhaseMap: { ...s.taskPhaseMap, [taskId]: phaseKey }
        }));
    };

    // ── Time metrics ────────────────────────────────────────────────────────────
    const totalPhaseDays = Object.values(kpiState.phases).reduce((a, p) => a + (p.days_used || 0), 0);
    const totalEstimatedDays = Object.values(kpiState.phases).reduce((a, p) => a + (p.days_estimated || 0), 0);
    const totalDaysUsed = totalPhaseDays + (kpiState.paused_days || 0);

    return (
        <div className="fixed inset-0 z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4 text-left">
                    <div className="relative transform bg-slate-50 sm:border border-slate-200 sm:rounded-3xl sm:shadow-2xl transition-all w-full sm:max-w-4xl">
                {/* Header */}
                <div className="sticky top-0 z-20 px-4 sm:px-8 py-5 sm:py-6 pb-2 relative flex justify-between items-start gap-2 bg-slate-50/90 backdrop-blur-md sm:rounded-t-3xl shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={20} className="text-indigo-500" />
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight truncate">{project.name}</h2>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {project.project_code} • Quản lý: {managerName || 'Chưa gán'} • Bắt đầu: {project.start_date ? format(parseISO(project.start_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                    </div>
                    <div className="text-right pr-6 sm:pr-10 shrink-0">
                        <div className="text-3xl sm:text-5xl font-black leading-none text-indigo-500">{totalDaysUsed}</div>
                        <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">tổng thực tế</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block">{totalPhaseDays} ng làm + {kpiState.paused_days} ng dừng / Dự kiến {totalEstimatedDays} ng</div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 sm:top-6 right-2 sm:right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"><X size={20} className="sm:w-6 sm:h-6" /></button>
                </div>

                {/* Progress Bar */}
                <div className="px-4 sm:px-8 pb-4">
                    <div className="bg-indigo-50 border-indigo-100 border rounded-2xl p-3 sm:p-4 mt-2 sm:mt-4 shadow-sm">
                        <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 animate-pulse bg-indigo-500 rounded-full inline-block"></span>
                            {totalDaysUsed > 0 ? `${totalPhaseDays} ngày làm + ${kpiState.paused_days} ngày dừng = ${totalDaysUsed} ngày tổng cộng.` : 'Chưa ghi nhận ngày làm việc nào. Nhấn +/- ở từng giai đoạn để bắt đầu.'}
                        </h3>
                        {totalDaysUsed > 0 && (
                            <>
                                <div className="h-4 bg-indigo-200/50 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${totalDaysUsed > 0 ? Math.round((totalPhaseDays / totalDaysUsed) * 100) : 0}%` }}></div>
                                    <div className="h-full bg-amber-400 opacity-60 flex-none" style={{ width: `${totalDaysUsed > 0 ? Math.round((kpiState.paused_days / totalDaysUsed) * 100) : 0}%` }}></div>
                                </div>
                                <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-indigo-500"></div> Ngày làm: {totalPhaseDays}</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-400"></div> Tạm dừng: {kpiState.paused_days}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="px-4 sm:px-8 pb-6 sm:pb-8 space-y-4">
                    {/* Value Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Dự kiến</div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-600">{totalEstimatedDays} ng</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Thực tế làm</div>
                            <div className="text-2xl sm:text-3xl font-black text-indigo-600">{totalPhaseDays} ng</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Ngày dừng</div>
                            <div className="text-2xl sm:text-3xl font-black text-amber-500">{kpiState.paused_days} ng</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Tổng cộng (TT)</div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-800">{totalDaysUsed} ng</div>
                        </div>
                    </div>

                    {/* Paused Config */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-0.5">Tạm dừng / Chờ khách phản hồi</h4>
                            <p className="text-[11px] sm:text-xs text-slate-500">Gộp cả chờ khách + chuyển dự án — thời gian dự án không thể tiếp tục.</p>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: Math.max(0, s.paused_days - 1) }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-rose-500 transition-colors text-slate-400"><Minus size={14} /></button>
                                <span className="font-bold text-lg text-slate-700 w-6 text-center">{kpiState.paused_days}</span>
                                <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: s.paused_days + 1 }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-emerald-500 transition-colors text-slate-400"><Plus size={14} /></button>
                                <span className="text-xs text-slate-500 font-bold ml-1">ngày</span>
                            </div>
                            <button type="button"
                                onClick={() => updateState(s => ({ ...s, is_paused: !s.is_paused }))}
                                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 ${kpiState.is_paused ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                            >
                                {kpiState.is_paused ? <PauseCircle size={14} /> : <Play size={14} />}
                                {kpiState.is_paused ? 'ĐANG DỪNG' : 'BÌNH THƯỜNG'}
                            </button>
                        </div>
                    </div>

                    {/* ── Phases with linked tasks ── */}
                    <div className="space-y-3">
                        {DEFAULT_PHASES.map((phase) => {
                            const pState = kpiState.phases[phase.key] || { days_used: 0 };
                            const phaseTasks = tasksByPhase[phase.key] || [];
                            const isActive = pState.days_used > 0 || phaseTasks.length > 0;
                            const isExpanded = expandedPhases[phase.key];

                            return (
                                <div key={phase.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer select-none gap-2 sm:gap-0" onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.key]: !prev[phase.key] }))}>
                                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                            <div className={`w-3 h-3 rounded shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate">{phase.name}</h4>
                                                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                                                    {pState.days_used} ngày • {phaseTasks.length} task
                                                </div>
                                            </div>
                                            {/* Expand arrow on mobile logic: show here if flex-col is active and taking space, but actually it's easier to put at the very end of the row */}
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pl-5 sm:pl-0">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end leading-none">
                                                    <span className="text-sm font-black text-indigo-600">{pState.days_used || 0} <span className="text-[10px] font-semibold text-indigo-400">ng</span></span>
                                                    <span className="text-[10px] font-bold text-slate-400">/ {pState.days_estimated || 0} dự kiến</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center border ${pState.days_used === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                                    {pState.days_used === 0 ? 'Chờ' : 'Đang'}
                                                </span>
                                            </div>
                                            <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={18} /></div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-slate-50 border-t border-slate-100 p-3 sm:p-4 space-y-3">
                                            {/* Days +/- */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200/60 pb-4">
                                                {/* Dự kiến */}
                                                <div className="flex justify-between items-center bg-slate-100 rounded-xl px-4 py-2 border border-slate-200">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dự kiến</span>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: Math.max(0, (s.phases[phase.key]?.days_estimated || 0) - 1) } } }))} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-white hover:text-rose-500 text-slate-500 bg-white transition-colors"><Minus size={14}/></button>
                                                        <span className="font-bold text-slate-700 w-6 text-center">{pState.days_estimated || 0}</span>
                                                        <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: (s.phases[phase.key]?.days_estimated || 0) + 1 } } }))} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-white hover:text-indigo-500 text-slate-500 bg-white transition-colors"><Plus size={14}/></button>
                                                    </div>
                                                </div>
                                                {/* Thực tế */}
                                                <div className="flex justify-between items-center bg-indigo-50 rounded-xl px-4 py-2 border border-indigo-100">
                                                    <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Thực tế</span>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: Math.max(0, (s.phases[phase.key]?.days_used || 0) - 1) } } }))} className="w-7 h-7 rounded-full border border-indigo-200 flex items-center justify-center hover:bg-white hover:text-rose-500 text-indigo-500 bg-white transition-colors"><Minus size={14}/></button>
                                                        <span className="font-bold text-indigo-700 w-6 text-center">{pState.days_used || 0}</span>
                                                        <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: (s.phases[phase.key]?.days_used || 0) + 1 } } }))} className="w-7 h-7 rounded-full border border-indigo-200 flex items-center justify-center hover:bg-white hover:text-indigo-500 text-indigo-500 bg-white transition-colors"><Plus size={14}/></button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Linked Tasks from project */}
                                            {phaseTasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhiệm vụ thuộc giai đoạn này</div>
                                                    {phaseTasks.map(t => (
                                                        <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                <span className={`text-sm font-bold truncate ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.status?.includes('Hoàn thành') ? 'bg-emerald-50 text-emerald-600' : t.status?.includes('Đang') ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>{t.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">Chưa có nhiệm vụ nào được gán vào giai đoạn này.</p>
                                            )}

                                            {/* Footer */}
                                            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-200/60 pt-3 font-bold">
                                                <span>Tổng: {phaseTasks.length} task</span>
                                                <span className="text-indigo-400">
                                                    Đã dùng: {pState.days_used} ngày
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Unassigned tasks */}
                    {(tasksByPhase['_unassigned'] || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                ⚠ Nhiệm vụ chưa gán giai đoạn ({tasksByPhase['_unassigned'].length})
                            </h4>
                            <div className="space-y-2">
                                {tasksByPhase['_unassigned'].map(t => (
                                    <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                            <span className="text-sm font-bold text-slate-700 truncate">{t.name}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                        </div>
                                        <select 
                                            value=""
                                            onChange={e => { if (e.target.value) assignTaskToPhase(t.id, e.target.value); }}
                                            className="text-[11px] font-bold bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                                        >
                                            <option value="">Gán giai đoạn...</option>
                                            {DEFAULT_PHASES.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {saving && (
                    <div className="absolute top-4 right-20 flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold shadow-sm">
                        <div className="w-2 h-2 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                        Đang lưu...
                    </div>
                )}
            </div>
        </div>
        </div>
        </div>
    );
}
