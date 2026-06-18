import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { DEFAULT_PHASES, detectPhase, addWorkingDays, getNextWorkingDay } from '../../utils/phaseUtils'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar, ChevronDown, Folder, CheckCircle2, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { QuickTaskModal } from './QuickTaskModal'
import { Plus, Trash2 } from 'lucide-react'

const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const Gantt = () => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [zoom, setZoom] = useState(100)
    const [viewMode, setViewMode] = useState<'month' | 'week'>('week')
    const [profiles, setProfiles] = useState<any[]>([])
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'task' | 'project' | 'phase', startX: number, deltaDays: number, action: 'move' | 'resize-left' | 'resize-right' } | null>(null)
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null)
    const [editValue, setEditValue] = useState<string>('')

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    
    const visibleDates = useMemo(() => {
        const result = [];
        if (viewMode === 'month') {
            const y = currentDate.getFullYear();
            const m = currentDate.getMonth();
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                result.push(new Date(y, m, i, 0, 0, 0));
            }
        } else {
            const d = new Date(currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
            for (let i = 0; i < 7; i++) {
                const nextDay = new Date(monday);
                nextDay.setDate(monday.getDate() + i);
                result.push(nextDay);
            }
        }
        return result;
    }, [currentDate, viewMode]);

    const totalDays = visibleDates.length;

    const isToday = (d: Date) => {
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    const getDayName = (d: Date) => DAY_NAMES[d.getDay()];

    const parseDateStr = (dateStr?: string | null) => {
        if (!dateStr) return null;
        return new Date(dateStr);
    };

    const getTimelineRange = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        if (visibleDates.length === 0) return null;
        
        const firstVisible = visibleDates[0];
        const lastVisible = visibleDates[visibleDates.length - 1];

        // Normalize hours for accurate comparison
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end); e.setHours(23,59,59,999);
        const f = new Date(firstVisible); f.setHours(0,0,0,0);
        const l = new Date(lastVisible); l.setHours(23,59,59,999);

        if (e < f || s > l) return null;

        let startIndex = 0;
        let endIndex = visibleDates.length - 1;

        for (let i = 0; i < visibleDates.length; i++) {
            if (visibleDates[i].getTime() >= s.getTime()) {
                startIndex = i;
                break;
            }
        }
        if (s.getTime() < f.getTime()) startIndex = 0;

        for (let i = visibleDates.length - 1; i >= 0; i--) {
            if (visibleDates[i].getTime() <= e.getTime()) {
                endIndex = i;
                break;
            }
        }
        if (e.getTime() > l.getTime()) endIndex = visibleDates.length - 1;

        return { startIndex, duration: Math.max(1, endIndex - startIndex + 1) };
    };

    
    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    }
    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    }
    const resetDate = () => setCurrentDate(new Date())

    const filteredProjectsBase = selectedProjectId
        ? projects.filter(p => p.id === selectedProjectId)
        : projects;

    const updatedProjects = useMemo(() => filteredProjectsBase.map((p): Project & { computed_start?: string, computed_end?: string } => {
        const pTasks = tasks.filter(t => t.project_id === p.id)
        if (pTasks.length === 0) return p

        let validTasks = pTasks.filter(t => t.start_date || t.due_date);
        if (validTasks.length === 0) return p;

        const startDates = validTasks.map(t => t.start_date ? parseDateStr(t.start_date)!.getTime() : parseDateStr(t.due_date!)!.getTime())
        const endDates = validTasks.map(t => t.due_date ? parseDateStr(t.due_date)!.getTime() : parseDateStr(t.start_date!)!.getTime())

        const minDate = new Date(Math.min(...startDates))
        const maxDate = new Date(Math.max(...endDates))

        return {
            ...p,
            computed_start: minDate.toISOString(),
            computed_end: maxDate.toISOString()
        }
    }), [filteredProjectsBase, tasks])

    const ganttItems = useMemo(() => {
        let items: any[] = []

        updatedProjects.forEach(p => {
            const startDate = p.start_date || p.computed_start
            const endDate = p.end_date || p.computed_end || p.start_date

            const start = parseDateStr(startDate);
            const end = parseDateStr(endDate);

            const range = getTimelineRange(start, end);

            const pTasksForPct = tasks.filter(t => t.project_id === p.id);
            let projectPct = 0;
            if (pTasksForPct.length > 0) {
                const totalPct = pTasksForPct.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                projectPct = Math.round(totalPct / pTasksForPct.length);
            }

            items.push({
                id: p.id,
                name: p.name,
                startIndex: range?.startIndex ?? null,
                duration: range?.duration ?? 0,
                actualStartIndex: getTimelineRange(p.computed_start ? parseDateStr(p.computed_start) : null, p.computed_end ? parseDateStr(p.computed_end) : null)?.startIndex ?? null,
                actualDuration: getTimelineRange(p.computed_start ? parseDateStr(p.computed_start) : null, p.computed_end ? parseDateStr(p.computed_end) : null)?.duration ?? 0,
                color: 'bg-red-500',
                isProject: true,
                isExpanded: expandedProjects.has(p.id),
                taskCount: tasks.filter(t => t.project_id === p.id && !t.parent_id).length,
                startDate: startDate,
                endDate: endDate,
                type: 'project',
                projectCode: p.project_code,
                projectPct: projectPct
            })

            if (expandedProjects.has(p.id)) {
                let kpiState: any = null;
                try {
                    if (p.other_info) {
                        const info = JSON.parse(p.other_info);
                        if (info.kpiData) kpiState = info.kpiData;
                    }
                } catch(e) {}

                let currentPhaseStartDate = p.start_date ? parseDateStr(p.start_date)! : new Date();
                const phasesToRender = [...DEFAULT_PHASES];

                phasesToRender.forEach((phaseDef) => {
                    const phaseKey = phaseDef.key;
                    let phaseTasks = tasks.filter(t => t.project_id === p.id && (kpiState?.taskPhaseMap?.[t.id] || detectPhase(t)) === phaseKey);

                    if (phaseKey === '_unassigned' && phaseTasks.length === 0) return;

                    const phaseState = kpiState?.phases?.[phaseKey] || { days_used: 0, days_estimated: 0 };
                    const expectedDays = phaseKey === '_unassigned' ? 0 : (phaseState.days_estimated || 0);
                    const hasExpectedTimeline = expectedDays > 0;
                    
                    if (!hasExpectedTimeline && phaseTasks.length === 0) return;

                    const phaseEndDate = hasExpectedTimeline ? addWorkingDays(currentPhaseStartDate, expectedDays) : currentPhaseStartDate;
                    const pRange = hasExpectedTimeline ? getTimelineRange(currentPhaseStartDate, phaseEndDate) : null;

                    let phasePct = 0;
                    if (phaseTasks.length > 0) {
                        const totalPct = phaseTasks.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                        phasePct = Math.round(totalPct / phaseTasks.length);
                    }

                    const fakePhaseId = `phase_${p.id}_${phaseKey}`;
                    
                    items.push({
                        id: fakePhaseId,
                        phaseKey: phaseKey,
                        name: phaseDef.name,
                        startIndex: pRange?.startIndex ?? null,
                        duration: pRange?.duration ?? 0,
                        color: phasePct === 100 ? 'bg-orange-300' : 'bg-orange-500',
                        isProject: false,
                        isPhase: true,
                        isExpanded: expandedPhases.has(fakePhaseId),
                        task: { completion_pct: phasePct, id: fakePhaseId, project_id: p.id },
                        startDate: hasExpectedTimeline ? currentPhaseStartDate.toISOString() : null,
                        endDate: hasExpectedTimeline ? phaseEndDate.toISOString() : null,
                        type: 'phase',
                        projectCode: p.project_code
                    });

                    if (hasExpectedTimeline) {
                        currentPhaseStartDate = getNextWorkingDay(phaseEndDate);
                    }

                    if (expandedPhases.has(fakePhaseId)) {
                        phaseTasks.sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));
                        
                        phaseTasks.forEach(t => {
                            const tStart = parseDateStr(t.start_date);
                            const tEnd = parseDateStr(t.due_date);
                            const tRange = getTimelineRange(tStart, tEnd);
                            const tIsCompleted = t.status?.includes('Hoàn thành');

                            items.push({
                                id: t.id,
                                name: t.name || t.task_code,
                                startIndex: tRange?.startIndex ?? null,
                                duration: tRange?.duration ?? 0,
                                color: tIsCompleted ? 'bg-slate-300' : 'bg-blue-500',
                                isProject: false,
                                isPhase: false,
                                task: t,
                                startDate: t.start_date || t.due_date,
                                endDate: t.due_date || t.start_date,
                                type: 'task',
                            });
                        });
                    }
                });
            }
        });

        return items
    }, [updatedProjects, expandedProjects, expandedPhases, tasks, visibleDates]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev)
            if (next.has(phaseId)) next.delete(phaseId)
            else next.add(phaseId)
            return next
        })
    }

    const handleConfirmComplete = async () => {
        if (!taskToComplete) return;
        const { error } = await supabase.from('tasks').update({
            status: 'Hoàn thành',
            completion_pct: 100,
            completion_date: new Date().toISOString().split('T')[0]
        }).eq('id', taskToComplete.id);

        if (!error) {
            setTaskToComplete(null);
            fetchData();
        }
    }

    const getAssigneeName = (id: string | null) => {
        if (!id) return 'Chưa gán'
        const p = profiles.find(x => x.id === id)
        return p?.full_name || 'N/A'
    }

    const handleCellClick = (item: any, field: string, currentValue: string, e: React.MouseEvent) => {
        if (item.type === 'project') return; // Don't allow inline edits for projects
        e.stopPropagation();
        setEditingCell({ id: item.id, field });
        setEditValue(currentValue || '');
    };

    const saveCellEdit = async (item: any) => {
        if (!editingCell) return;
        const { id, field } = editingCell;
        
        let updatePayload: any = {};
        
        if (field === 'assignee_id') {
            updatePayload.assignee_id = editValue;
        } else if (field === 'start_date') {
            updatePayload.start_date = editValue ? new Date(editValue).toISOString() : null;
        } else if (field === 'end_date') {
            updatePayload.due_date = editValue ? new Date(editValue).toISOString() : null;
        } else if (field === 'duration') {
            if (!item.startDate) return; // Cannot calc duration without start
            const daysCount = parseInt(editValue, 10);
            if (isNaN(daysCount) || daysCount < 1) return;
            const newEnd = parseDateStr(item.startDate);
            newEnd.setDate(newEnd.getDate() + (daysCount - 1));
            updatePayload.due_date = newEnd.toISOString();
        }

        if (Object.keys(updatePayload).length > 0) {
            const table = 'tasks';
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatePayload } : t));
            await supabase.from(table).update(updatePayload).eq('id', id);
        }

        setEditingCell(null);
    };

    const handleQuickAdd = async (parentId: string | null, projectId: string, targetPhase: string | null, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const newTask: any = {
            name: 'Nhiệm vụ mới',
            project_id: projectId,
            parent_id: parentId,
            status: 'Chưa bắt đầu',
            priority: 'Bình thường',
            task_code: `T${Date.now()}`
        };

        if (targetPhase) {
            newTask.target = targetPhase;
        }

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        
        if (!error && data) {
            setTasks(prev => [...prev, data[0] as Task]);
            // Automatically expand the phase so the user can see it
            setExpandedPhases(prev => new Set(prev).add(parentId));
        }
    };

    const cellWidth = Math.max(20, Math.round(28 * zoom / 100))

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }
    return (
        <div className="w-full h-[calc(100vh-140px)] flex flex-col space-y-4 pb-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" /> Sơ đồ Gantt
                </h1>

                <div className="flex items-center gap-2">
                    {/* Zoom Control Group - Dark rounded rectangle like screenshot */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-xl shadow-lg">
                        <span className="text-[10px] font-bold text-white mr-2 uppercase tracking-tighter">Zoom: {zoom}%</span>
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-slate-400 hover:text-white transition-colors">
                            <ZoomOut size={16} />
                        </button>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="text-slate-400 hover:text-white transition-colors">
                            <ZoomIn size={16} />
                        </button>
                        <div className="w-px h-4 bg-slate-600 mx-1"></div>
                        <button onClick={resetMonth} className="text-[10px] font-bold text-blue-300 hover:text-blue-100 hover:underline px-2 py-0.5 rounded transition-all uppercase whitespace-nowrap">
                            Đặt lại
                        </button>
                    </div>

                    {/* Project Filter - New Styled Dropdown */}
                    <div className="relative">
                        <Folder size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value || null)}
                            className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 appearance-none cursor-pointer hover:bg-slate-50 transition-colors font-medium text-slate-700"
                        >
                            <option value="">Tất cả dự án</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Header */}
            <div className="bg-white/70 backdrop-blur-md border border-white/20 p-4 rounded-[2rem] shadow-xl flex items-center justify-center gap-12 group">
                <button
                    onClick={prevMonth}
                    className="w-12 h-12 bg-white text-gray-700 hover:text-blue-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:shadow-blue-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-gray-900 min-w-[220px] text-center uppercase tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {MONTHS_VI[month]} {year}
                    </h2>
                    <div className="w-12 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1 opacity-20"></div>
                </div>
                <button
                    onClick={nextMonth}
                    className="w-12 h-12 bg-white text-gray-700 hover:text-blue-600 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:shadow-blue-100"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Desktop Gantt Grid Container (Unified Sticky) */}
            <div className="hidden md:flex flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                <div 
                    className="flex-1 overflow-auto flex flex-col" 
                    style={{ height: '100%' }}
                    ref={scrollContainerRef}
                >
                    <div className="min-w-max flex flex-col relative">
                        {/* Unified Header */}
                        <div className="flex sticky top-0 z-40 bg-white h-[66px] w-max">
                            {/* Left Header - Sticky Left */}
                            <div className="sticky left-0 z-50 flex bg-slate-50 w-[420px] border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="w-[200px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50">
                                    MÔ TẢ
                                </div>
                                <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    BẮT ĐẦU
                                </div>
                                <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    KẾT THÚC
                                </div>
                                <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                                    NGÀY
                                </div>
                                <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50">
                                    TIẾN %
                                </div>
                            </div>
                            
                            {/* Right Header */}
                            <div className="flex flex-col border-b border-slate-200">
                                {/* Month Label */}
                                {/* Dynamic Header Label */}
                                <div className="flex items-center justify-center font-bold text-slate-700 text-xs border-b border-slate-200 bg-slate-100" style={{ height: '25px', width: `${totalDays * cellWidth}px` }}>
                                    {viewMode === 'month' ? `Tháng ${visibleDates[0]?.getMonth() + 1} ${visibleDates[0]?.getFullYear()}` : `Tuần ${Math.ceil((visibleDates[0]?.getDate() - 1) / 7) + 1} Tháng ${visibleDates[0]?.getMonth() + 1} (${format(visibleDates[0] || new Date(), 'dd/MM')} - ${format(visibleDates[6] || new Date(), 'dd/MM')})`}
                                </div>
                                {/* Days Label */}
                                <div className="relative flex-1" style={{ width: `${totalDays * cellWidth}px` }}>
                                    {visibleDates.map((d, idx) => (
                                        <div key={idx} className={`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-200 transition-colors ${isToday(d) ? 'bg-orange-500' : isWeekend(d) ? 'bg-slate-100/50' : 'bg-blue-50/50'}`} style={{ left: `${idx * cellWidth}px`, width: `${cellWidth}px` }}>
                                            <div className={`text-[11px] font-bold ${isToday(d) ? 'text-white' : 'text-slate-700'}`}>{d.getDate()}</div>
                                            <div className={`text-[8px] font-bold uppercase tracking-tighter ${isToday(d) ? 'text-white/80' : isWeekend(d) ? 'text-red-400' : 'text-blue-400'}`}>{getDayName(d)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Unified Rows */}
                        <div className="flex flex-col pb-24 w-max">
                            {ganttItems.length === 0 ? (
                                <div className="h-[200px]"></div>
                            ) : (
                                ganttItems.map((item) => {
                                    const sDate = parseDateStr(item.startDate); const formattedStart = sDate ? format(sDate, 'dd/MM/yyyy') : '';
                                    const eDate = parseDateStr(item.endDate); const formattedEnd = eDate ? format(eDate, 'dd/MM/yyyy') : '';
                                    const tDays = (sDate && eDate) ? Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className="flex h-9 border-b border-slate-200 hover:bg-slate-50 transition-colors group/row w-max">
                                            {/* Left Cells - Sticky Left */}
                                            <div className={`sticky left-0 z-30 flex w-[420px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${item.type === 'project' ? 'bg-[#e0e4db]' : item.type === 'phase' ? 'bg-slate-100' : 'bg-white'}`}>
                                                <div className="w-[200px] px-3 py-2 border-r border-slate-200 flex flex-col justify-center overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        {item.type === 'project' && (
                                                            <button onClick={() => toggleProject(item.id)} className="w-4 h-4 flex items-center justify-center hover:bg-slate-200 rounded text-slate-500 flex-shrink-0">
                                                                {expandedProjects.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            </button>
                                                        )}
                                                        {item.type === 'phase' && <div className="w-4 h-4 flex-shrink-0" />}
                                                        <span 
                                                            className={`truncate text-[11px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} hover:text-blue-600 cursor-pointer`}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={`w-[70px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}>
                                                    {formattedStart || '—'}
                                                </div>

                                                <div className={`w-[70px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}>
                                                    {formattedEnd || '—'}
                                                </div>

                                                <div className={`w-[40px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {tDays > 0 ? tDays : '-'}
                                                </div>

                                                <div className={`w-[40px] px-1 py-2 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {item.type !== 'project' ? `${progressAmount}%` : `${item.projectPct || 0}%`}
                                                </div>
                                            </div>
                                            
                                            {/* Right Cells */}
                                            <div className="relative" style={{ width: `${totalDays * cellWidth}px` }}>
                                                {/* Background Weekend Shading (UNDER bars) */}
                                                {visibleDates.map((d, idx) => (
                                                    isWeekend(d) ? <div key={`bg-${idx}`} className="absolute top-0 bottom-0 pointer-events-none bg-slate-50/50" style={{ left: `${idx * cellWidth}px`, width: `${cellWidth}px` }} /> : null
                                                ))}

                                                {/* Parent Project Outline */}
                                                {item.isPhase && (
                                                    <div
                                                        className="absolute top-[2px] bottom-[2px] rounded-sm pointer-events-none opacity-20 border border-slate-400"
                                                        style={{
                                                            left: `${(ganttItems.find(p => p.id === item.task?.project_id)?.actualStartIndex ?? 0) * cellWidth}px`,
                                                            width: `${(ganttItems.find(p => p.id === item.task?.project_id)?.actualDuration ?? 0) * cellWidth}px`,
                                                            backgroundColor: 'transparent'
                                                        }}
                                                    />
                                                )}

                                                {/* Gray Expected Timeline Bar (Only for projects) */}
                                                {item.type === 'project' && item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        className="absolute top-2.5 bottom-2.5 rounded-sm bg-slate-300/40 shadow-inner"
                                                        style={{ left: `${item.startIndex * cellWidth}px`, width: `${item.duration * cellWidth}px` }}
                                                        title="Timeline dự kiến"
                                                    />
                                                )}

                                                {/* Colored Timeline Bar */}
                                                {item.type === 'project' && item.actualStartIndex !== null && item.actualDuration > 0 && (
                                                    <div
                                                        className="absolute top-1.5 bottom-1.5 rounded-sm shadow-sm flex items-center transition-colors bg-[#4a80bc] border border-[#3a689b]"
                                                        style={{ left: `${item.actualStartIndex * cellWidth}px`, width: `${item.actualDuration * cellWidth}px` }}
                                                        title="Timeline thực tế"
                                                    />
                                                )}

                                                {/* Default Colored Timeline Bar (for phases) */}
                                                {item.type !== 'project' && item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        className={`absolute top-1.5 bottom-1.5 rounded-sm shadow-sm flex items-center px-2 cursor-pointer transition-all hover:brightness-95 hover:shadow-md border ${item.task?.status?.includes('Hoàn thành') ? 'bg-emerald-500 border-emerald-600' : 'bg-[#5da0ea] border-[#4b82c3]'}`}
                                                        style={{ left: `${item.startIndex * cellWidth}px`, width: `${item.duration * cellWidth}px` }}
                                                        onDoubleClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (item.type === 'task' || item.type === 'phase') {
                                                                if (item.task) {
                                                                    setEditingTask(item.task); 
                                                                    setIsEditModalOpen(true); 
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {progressAmount > 0 && (
                                                            <span className="text-[8px] font-bold text-slate-800 whitespace-nowrap z-10 select-none block truncate w-full text-center drop-shadow-sm">
                                                                {progressAmount}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                
                                                {/* Grid Lines Overlay (OVER bars) - CARO EFFECT */}
                                                <div className="absolute inset-0 pointer-events-none z-20">
                                                    {visibleDates.map((d, idx) => (
                                                        <div key={`grid-${idx}`} className="absolute top-0 bottom-0 border-r border-slate-300" style={{ left: `${idx * cellWidth}px`, width: `${cellWidth}px` }} />
                                                    ))}
                                                </div>
                                                
                                                {/* Today Line inside Row */}
                                                {(() => {
                                                    const todayIdx = visibleDates.findIndex(d => isToday(d));
                                                    if (todayIdx !== -1) {
                                                        return (
                                                            <div 
                                                                className="absolute top-0 bottom-0 border-l-2 border-orange-500/80 pointer-events-none z-30"
                                                                style={{ left: `${todayIdx * cellWidth + (cellWidth / 2)}px` }}
                                                            />
                                                        )
                                                    }
                                                    return null;
                                                })()}
    </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
{/* Mobile List Timeline View */}
            <div className="md:hidden space-y-4 px-1">
                {ganttItems.filter(item => item.type === 'project').length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/30 rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Calendar size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                    </div>
                ) : (
                    ganttItems.filter(item => item.type === 'project').map(item => {
                        const projectPhases = ganttItems.filter(p => p.type === 'phase' && p.projectCode === item.projectCode);
                        const sDate = parseDateStr(item.startDate); const formattedStart = sDate ? format(sDate, 'dd/MM/yyyy') : '';
                        const eDate = parseDateStr(item.endDate); const formattedEnd = eDate ? format(eDate, 'dd/MM/yyyy') : '';
                        const totalDays = (sDate && eDate) ? Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                        
                        return (
                            <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-[#e0e4db] p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight uppercase truncate">{item.name}</h3>
                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Mã DA: {item.projectCode}</div>
                                    </div>
                                    <div className="bg-[#4a80bc]/10 text-[#4a80bc] px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 shadow-sm">
                                        {totalDays} ngày
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[8px] mb-0.5">BẮT ĐẦU</span>
                                        <span className="text-slate-700">{formattedStart || '—'}</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300" />    
                                    <div className="flex flex-col items-end">
                                        <span className="text-slate-400 text-[8px] mb-0.5">KẾT THÚC</span>
                                        <span className="text-slate-700">{formattedEnd || '—'}</span>
                                    </div>
                                </div>
                                
                                {/* Phased/Tasks summary */}
                                {projectPhases.length > 0 && (
                                    <div className="space-y-2 mt-2 pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Các giai đoạn</h4>
                                        {projectPhases.map(phase => {
                                            const phaseStart = phase.startDate ? format(parseDateStr(phase.startDate)!, 'dd/MM') : '';
                                            const phaseEnd = phase.endDate ? format(parseDateStr(phase.endDate)!, 'dd/MM') : '';
                                            const isDone = phase.task?.status?.includes('Hoàn thành');
                                            return (
                                                <div key={phase.id} className={`rounded-xl p-3 border transition-colors ${isDone ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100 shadow-sm ring-1 ring-blue-50'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className={`text-xs font-bold line-clamp-2 pr-2 ${isDone ? 'text-slate-500' : 'text-slate-700'}`}>{phase.name}</h4>
                                                        <span className={`shrink-0 text-[9px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded flex items-center gap-1 ${isDone ? 'text-slate-400 bg-white border border-slate-200' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}>
                                                            {isDone && <CheckCircle2 size={10} className="text-emerald-500" />}
                                                            {phaseStart} - {phaseEnd}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Completion Confirmation Modal */}
            {
                taskToComplete && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 pb-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Hoàn thành nhiệm vụ?</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Bạn có chắc chắn muốn đánh dấu "{taskToComplete.name}" là đã hoàn thành không?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setTaskToComplete(null)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        onClick={handleConfirmComplete}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all"
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Task Modal */}
            <QuickTaskModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                onSaved={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                    fetchData();
                }}
                editingTask={editingTask}
                profiles={profiles}
                currentUserProfile={currentUserProfile}
                projects={projects}
            />
        </div >
    )
}

export default Gantt;
