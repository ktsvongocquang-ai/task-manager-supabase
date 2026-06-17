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
interface ProjectTimelineTabProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    managerName?: string;
    onUpdateProject?: () => void;
}

export const ProjectTimelineTab: React.FC<ProjectTimelineTabProps> = ({
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
        if (!isOpen || !project) return grouped;
        projectTasks.forEach(t => {
            // Manual override > auto-detect
            const phaseKey = kpiState.taskPhaseMap[t.id] || detectPhase(t);
            if (grouped[phaseKey]) grouped[phaseKey].push(t);
            else grouped['_unassigned'].push(t);
        });
        return grouped;
    }, [projectTasks, kpiState.taskPhaseMap, isOpen, project]);

    if (!isOpen || !project) return null;

    // Save handler
    const triggerSave = (stateToSave: KPIState) => {
        if (!onUpdateProject) return;
        setSaving(true);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                let currentOtherInfo: any = {};
                try { if (project.other_info) currentOtherInfo = JSON.parse(project.other_info); } catch (e) {}
                const newOtherInfo = { ...currentOtherInfo, kpiData: stateToSave };
                await supabase.from('projects').update({ other_info: JSON.stringify(newOtherInfo) }).eq('id', project.id);
                onUpdateProject();
            } finally {
                setSaving(false);
            }
        }, 1500);
    };

    const updateState = (updater: (prev: KPIState) => KPIState) => {
        setKpiState(prev => {
            const next = updater(prev);
            triggerSave(next);
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
        <div className="w-full flex flex-col h-full bg-[#F3F4F6] sm:rounded-b-3xl relative">
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 custom-scrollbar">
                
                {/* Stats Bar */}
                <div className="bg-white p-5 rounded-[1.25rem] shadow-sm border border-slate-100 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[12px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Tổng tiến độ (Ngày công)</h2>
                        <div className="text-[32px] font-bold text-slate-800 leading-none flex items-baseline gap-1">
                            {totalPhaseDays} <span className="text-[13px] font-bold text-slate-400">/{totalEstimatedDays} ng</span>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2.5 bg-indigo-50 rounded-full mb-5 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: totalEstimatedDays > 0 ? `${Math.min(100, (totalPhaseDays / totalEstimatedDays) * 100)}%` : '0%' }}></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-indigo-50/50 border border-indigo-50 rounded-xl py-3 flex flex-col items-center justify-center">
                            <span className="text-[20px] font-bold text-indigo-600 leading-none mb-1.5">{totalPhaseDays}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Ngày làm</span>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-50 rounded-xl py-3 flex flex-col items-center justify-center">
                            <span className="text-[20px] font-bold text-amber-500 leading-none mb-1.5">{kpiState.paused_days}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Ngày dừng</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center">
                            <span className="text-[20px] font-bold text-slate-600 leading-none mb-1.5">{totalEstimatedDays}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Dự kiến</span>
                        </div>
                    </div>
                </div>

                {/* Paused Config */}
                <div className="bg-white border border-slate-100 rounded-[1.25rem] p-4 shadow-sm flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                            <PauseCircle size={16} fill="currentColor" className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-800">Tạm dừng / chờ khách</h4>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">Gộp chờ khách + chuyển dự án</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: Math.max(0, s.paused_days - 1) }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                        <span className="font-bold text-sm text-slate-800 w-5 text-center">{kpiState.paused_days}</span>
                        <button type="button" onClick={() => updateState(s => ({ ...s, paused_days: s.paused_days + 1 }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                </div>

                <h3 className="text-[13px] font-bold text-slate-800 mb-3 px-1">Giai đoạn</h3>

                {/* ── Phases with linked tasks ── */}
                <div className="space-y-3">
                    {DEFAULT_PHASES.map((phase) => {
                        const pState = kpiState.phases[phase.key] || { days_used: 0, days_estimated: 0 };
                        const phaseTasks = tasksByPhase[phase.key] || [];
                        const isExpanded = expandedPhases[phase.key];
                        
                        const isDone = pState.days_used >= (pState.days_estimated || 1) && pState.days_used > 0;
                        const isActive = pState.days_used > 0 && !isDone;

                        return (
                            <div key={phase.key} className="bg-white border border-slate-100 rounded-[1.25rem] overflow-hidden shadow-sm">
                                <div className="p-4 flex flex-col gap-3.5" onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.key]: !prev[phase.key] }))}>
                                    
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isDone ? 'bg-emerald-500' : isActive ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                                            <h4 className="font-bold text-slate-800 text-[15px]">{phase.name}</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wide uppercase ${isDone ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {isDone ? 'XONG' : isActive ? 'ĐANG' : 'CHỜ'}
                                        </span>
                                    </div>
                                    
                                    {/* Row 2: Subtext and Actual Days Buttons */}
                                    <div className={`flex items-center justify-between ${isExpanded ? 'border-b border-dashed border-slate-200 pb-3.5' : 'pb-1'}`}>
                                        <div className="text-[12px] font-semibold text-slate-500 flex items-center gap-1">
                                            Làm <span className="text-slate-800 font-bold">{pState.days_used || 0}</span><span className="text-indigo-500 font-bold">/{pState.days_estimated || 0} ng</span> 
                                            <span className="text-indigo-500 ml-0.5">✏️</span>
                                            <span className="text-slate-300 mx-0.5">•</span> 
                                            {phaseTasks.length} task
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: Math.max(0, (s.phases[phase.key]?.days_used || 0) - 1) } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                                            <span className="font-bold text-sm text-slate-800 w-5 text-center">{pState.days_used || 0}</span>
                                            <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_used: (s.phases[phase.key]?.days_used || 0) + 1 } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Plus size={14} strokeWidth={3} /></button>
                                        </div>
                                    </div>
                                </div>
                                    
                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-1 flex flex-col gap-4">
                                            {/* Estimated days editor */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-[13px] font-bold text-slate-800">Dự kiến giai đoạn này</div>
                                                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: Math.max(0, (s.phases[phase.key]?.days_estimated || 0) - 1) } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Minus size={14} strokeWidth={3}/></button>
                                                    <span className="font-bold text-sm text-slate-800 w-5 text-center">{pState.days_estimated || 0}</span>
                                                    <button type="button" onClick={() => updateState(s => ({ ...s, phases: { ...s.phases, [phase.key]: { ...s.phases[phase.key], days_estimated: (s.phases[phase.key]?.days_estimated || 0) + 1 } } }))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-indigo-500 bg-white hover:bg-slate-50 transition-colors"><Plus size={14} strokeWidth={3}/></button>
                                                    <span className="text-[11px] font-semibold text-slate-500 ml-1">ngày</span>
                                                </div>
                                            </div>

                                            {/* Linked Tasks List */}
                                            {phaseTasks.length > 0 && (
                                                <div className="space-y-2 mt-2">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhiệm vụ thuộc giai đoạn này</div>
                                                    {phaseTasks.map(t => (
                                                        <div key={t.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status?.includes('Hoàn thành') ? 'bg-emerald-500' : t.status?.includes('Đang') ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                                <span className={`text-[13px] font-bold truncate ${t.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 shrink-0">({t.task_code})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${t.status?.includes('Hoàn thành') ? 'bg-emerald-100 text-emerald-600' : t.status?.includes('Đang') ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer helper text */}
                    <p className="text-center text-[11px] font-medium text-slate-400 mt-6 mb-2">
                        Bấm số <span className="text-indigo-500 font-bold">/0 ng ✏️</span> để nhập dự kiến cho từng giai đoạn.
                    </p>

                    {/* Unassigned tasks */}
                    {(tasksByPhase['_unassigned'] || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[1.25rem] p-4 shadow-sm mt-4">
                            <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                ⚠ Nhiệm vụ chưa gán giai đoạn ({tasksByPhase['_unassigned'].length})
                            </h4>
                            <div className="space-y-2">
                                {tasksByPhase['_unassigned'].map(t => (
                                    <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                            <span className="text-[13px] font-bold text-slate-700 truncate">{t.name}</span>
                                        </div>
                                        <select 
                                            value=""
                                            onChange={e => { if (e.target.value) assignTaskToPhase(t.id, e.target.value); }}
                                            className="text-[10px] font-bold bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer shrink-0 ml-2"
                                        >
                                            <option value="">Gán giai đoạn...</option>
                                            {DEFAULT_PHASES.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {saving && (
                    <div className="absolute top-4 right-20 flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold shadow-sm">
                        <div className="w-2 h-2 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                        Đang lưu...
                    </div>
                )}
            </div>
        </div>
    );
}
