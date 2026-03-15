import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../services/supabase'
import { type Task, type Project } from '../../types'
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Calendar, ChevronDown, Folder, CheckCircle2, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'
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

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }, { data: authData }] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name'),
                supabase.auth.getUser()
            ])
            setProjects((p || []) as Project[])
            setProfiles((pr || []) as any[])

            let currentProfile = null;
            if (authData?.user) {
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
                setCurrentUserProfile(userProfile)
                currentProfile = userProfile;
            }

            let fetchedTasks = (t || []) as Task[];
            let fetchedProjects = (p || []) as Project[];

            if (currentProfile?.role === 'Nhân viên') {
                const employeeTasks = fetchedTasks.filter(task =>
                    task.assignee_id === currentProfile?.id ||
                    task.supporter_id === currentProfile?.id
                );
                
                const parentIds = new Set(employeeTasks.map(t => t.parent_id).filter(Boolean));
                
                fetchedTasks = fetchedTasks.filter(task => 
                    task.assignee_id === currentProfile?.id ||
                    task.supporter_id === currentProfile?.id ||
                    parentIds.has(task.id)
                );

                fetchedProjects = fetchedProjects.filter(proj =>
                    fetchedTasks.some(task => task.project_id === proj.id)
                );
            }

            setTasks(fetchedTasks);
            setProjects(fetchedProjects);
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
    }

    const isWeekend = (day: number) => {
        const d = new Date(year, month, day)
        return d.getDay() === 0 || d.getDay() === 6
    }

    const getDayName = (day: number) => {
        const d = new Date(year, month, day)
        return DAY_NAMES[d.getDay()]
    }



    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const resetMonth = () => setCurrentDate(new Date())

    // Calculate Project Dates and filter by selected project
    const filteredProjectsBase = selectedProjectId
        ? projects.filter(p => p.id === selectedProjectId)
        : projects;

    const updatedProjects = filteredProjectsBase.map((p): Project & { computed_start?: string, computed_end?: string } => {
        const pTasks = tasks.filter(t => t.project_id === p.id)
        if (pTasks.length === 0) return p

        let validTasks = pTasks.filter(t => t.start_date || t.due_date);
        if (validTasks.length === 0) return p;

        const startDates = validTasks.map(t => t.start_date ? new Date(t.start_date).getTime() : new Date(t.due_date!).getTime())
        const endDates = validTasks.map(t => t.due_date ? new Date(t.due_date).getTime() : new Date(t.start_date!).getTime())

        const minDate = new Date(Math.min(...startDates))
        const maxDate = new Date(Math.max(...endDates))

        return {
            ...p,
            computed_start: minDate.toISOString(),
            computed_end: maxDate.toISOString()
        }
    })

    const ganttItems = useMemo(() => {
        let items: any[] = []

        updatedProjects.forEach(p => {
            if (!p.computed_start && !p.start_date) return

            const startDate = p.computed_start || p.start_date
            const endDate = p.computed_end || p.end_date || p.start_date

            const start = new Date(startDate!)
            const end = new Date(endDate!)

            if (start.getFullYear() === year && start.getMonth() === month ||
                end.getFullYear() === year && end.getMonth() === month ||
                (start < new Date(year, month, 1) && end > new Date(year, month + 1, 0))) {

                const startDay = start.getMonth() === month ? start.getDate() : 1
                const endDay = end.getMonth() === month ? end.getDate() : daysInMonth
                const duration = Math.max(1, endDay - startDay + 1)

                items.push({
                    id: p.id,
                    name: p.name,
                    startDay,
                    duration,
                    color: 'bg-red-500',
                    isProject: true,
                    isExpanded: expandedProjects.has(p.id),
                    taskCount: tasks.filter(t => t.project_id === p.id && !t.parent_id).length,
                    startDate: startDate,
                    endDate: endDate,
                    type: 'project',
                    projectCode: p.project_code
                })
            }

            if (expandedProjects.has(p.id)) {
                // Get phases (tasks without parent_id)
                const projectPhases = tasks.filter(t => t.project_id === p.id && !t.parent_id)
                    .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }))
                
                projectPhases.forEach(phase => {
                    const phaseStart = phase.start_date ? new Date(phase.start_date) : null
                    const phaseEnd = phase.due_date ? new Date(phase.due_date) : null

                    let renderStartDay = null
                    let renderEndDay = null

                    if (phaseStart && phaseStart.getFullYear() === year && phaseStart.getMonth() === month) {
                        renderStartDay = phaseStart.getDate()
                    } else if (phaseStart && phaseStart < new Date(year, month, 1)) {
                        renderStartDay = 1
                    }

                    if (phaseEnd && phaseEnd.getFullYear() === year && phaseEnd.getMonth() === month) {
                        renderEndDay = phaseEnd.getDate()
                    } else if (phaseEnd && phaseEnd > new Date(year, month + 1, 0)) {
                        renderEndDay = daysInMonth
                    }

                    let duration = 0;
                    if (renderStartDay !== null || renderEndDay !== null) {
                        if (renderStartDay !== null && renderEndDay === null) renderEndDay = renderStartDay;
                        if (renderEndDay !== null && renderStartDay === null) renderStartDay = renderEndDay;
                        duration = Math.max(1, renderEndDay! - renderStartDay! + 1)
                    }
                    const isCompleted = phase.status?.includes('Hoàn thành')

                    items.push({
                        id: phase.id,
                        name: phase.name || phase.task_code,
                        startDay: renderStartDay,
                        duration,
                        color: isCompleted ? 'bg-slate-400' : 'bg-emerald-500',
                        isProject: false,
                        isPhase: true,
                        isExpanded: expandedPhases.has(phase.id),
                        task: phase,
                        startDate: phase.start_date || phase.due_date,
                        endDate: phase.due_date || phase.start_date,
                        type: 'phase',
                        projectCode: p.project_code
                    })

                    // Get subtasks if phase is expanded
                    if (expandedPhases.has(phase.id)) {
                        const phaseTasks = tasks.filter(t => t.parent_id === phase.id)
                            .sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }))
                        
                        phaseTasks.forEach(t => {
                            const tStart = t.start_date ? new Date(t.start_date) : null
                            const tEnd = t.due_date ? new Date(t.due_date) : null

                            let tRenderStartDay = null
                            let tRenderEndDay = null

                            if (tStart && tStart.getFullYear() === year && tStart.getMonth() === month) {
                                tRenderStartDay = tStart.getDate()
                            } else if (tStart && tStart < new Date(year, month, 1)) {
                                tRenderStartDay = 1
                            }

                            if (tEnd && tEnd.getFullYear() === year && tEnd.getMonth() === month) {
                                tRenderEndDay = tEnd.getDate()
                            } else if (tEnd && tEnd > new Date(year, month + 1, 0)) {
                                tRenderEndDay = daysInMonth
                            }

                            let tDuration = 0;
                            if (tRenderStartDay !== null || tRenderEndDay !== null) {
                                if (tRenderStartDay !== null && tRenderEndDay === null) tRenderEndDay = tRenderStartDay;
                                if (tRenderEndDay !== null && tRenderStartDay === null) tRenderStartDay = tRenderEndDay;
                                tDuration = Math.max(1, tRenderEndDay! - tRenderStartDay! + 1)
                            }
                            const tIsCompleted = t.status?.includes('Hoàn thành')

                            items.push({
                                id: t.id,
                                name: t.name || t.task_code,
                                startDay: tRenderStartDay,
                                duration: tDuration,
                                color: tIsCompleted ? 'bg-slate-300' : 'bg-blue-500',
                                isProject: false,
                                isPhase: false,
                                task: t,
                                startDate: t.start_date || t.due_date,
                                endDate: t.due_date || t.start_date,
                                type: 'task',
                                projectCode: p.project_code
                            })
                        })
                    }
                })
            }
        })

        return items
    }, [updatedProjects, tasks, year, month, search, expandedProjects, expandedPhases])

    useEffect(() => {
        if (!draggingItem) return;

        const handleMouseMove = (e: MouseEvent) => {
            const cellWidthNow = Math.max(24, Math.round(36 * zoom / 100));
            const deltaX = e.clientX - draggingItem.startX;
            const deltaDays = Math.round(deltaX / cellWidthNow);
            setDraggingItem(prev => prev ? { ...prev, deltaDays } : null);
        };

        const handleMouseUp = async () => {
            if (draggingItem && draggingItem.deltaDays !== 0) {
                const item = ganttItems.find(i => i.id === draggingItem.id && i.type === draggingItem.type);
                if (item) {
                    const updatePayload: any = {};

                    if (draggingItem.action === 'move') {
                        const newStart = new Date(item.startDate);
                        newStart.setDate(newStart.getDate() + draggingItem.deltaDays);
                        updatePayload.start_date = newStart.toISOString();

                        const newEnd = item.endDate ? new Date(item.endDate) : null;
                        if (newEnd) {
                            newEnd.setDate(newEnd.getDate() + draggingItem.deltaDays);
                            if (item.type === 'project') updatePayload.end_date = newEnd.toISOString();
                            else updatePayload.due_date = newEnd.toISOString();
                        }
                    } else if (draggingItem.action === 'resize-left') {
                        const newStart = new Date(item.startDate);
                        newStart.setDate(newStart.getDate() + draggingItem.deltaDays);

                        // Prevent left edge passing right edge
                        const currentEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
                        if (newStart <= currentEnd) {
                            updatePayload.start_date = newStart.toISOString();
                        }
                    } else if (draggingItem.action === 'resize-right') {
                        const newEnd = item.endDate ? new Date(item.endDate) : new Date(item.startDate);
                        newEnd.setDate(newEnd.getDate() + draggingItem.deltaDays);

                        // Prevent right edge passing left edge
                        const currentStart = new Date(item.startDate);
                        if (newEnd >= currentStart) {
                            if (item.type === 'project') updatePayload.end_date = newEnd.toISOString();
                            else updatePayload.due_date = newEnd.toISOString();
                        }
                    }

                    if (Object.keys(updatePayload).length > 0) {
                        const table = item.type === 'project' ? 'projects' : 'tasks';

                        if (item.type === 'task') {
                            setTasks(prev => prev.map(t => t.id === item.id ? { ...t, ...updatePayload } : t));
                        } else {
                            setProjects(prev => prev.map(p => p.id === item.id ? { ...p, ...updatePayload } : p));
                        }

                        await supabase.from(table).update(updatePayload).eq('id', item.id);
                    }
                }
            }
            setDraggingItem(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingItem, zoom, ganttItems]);

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
            const newEnd = new Date(item.startDate);
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

    const handleQuickAdd = async (parentId: string, projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const newTask = {
            name: 'Nhiệm vụ mới',
            project_id: projectId,
            parent_id: parentId,
            status: 'Chưa bắt đầu',
            priority: 'Bình thường',
            task_code: `T${Date.now()}`
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        
        if (!error && data) {
            setTasks(prev => [...prev, data[0] as Task]);
            // Automatically expand the phase so the user can see it
            setExpandedPhases(prev => new Set(prev).add(parentId));
        }
    };

    const cellWidth = Math.max(24, Math.round(36 * zoom / 100))

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" /> Sơ đồ Gantt
                </h1>

                <div className="flex items-center gap-2">
                    {/* Zoom Control Group - Dark rounded rectangle like screenshot */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-xl shadow-lg">
                        <span className="text-[10px] font-black text-white mr-2 uppercase tracking-tighter">Zoom: {zoom}%</span>
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
                    <h2 className="text-2xl font-black text-gray-900 min-w-[220px] text-center uppercase tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

            {/* Desktop Gantt Grid Container */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-auto relative">
                    <div className="min-w-max">
                        {/* Day Headers - Themed background like screenshot */}
                        <div className="flex border-b border-slate-200 sticky top-0 z-30 bg-white shadow-sm">
                            <div className="flex sticky left-0 z-40 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="w-[300px] px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50">
                                    MÔ TẢ
                                </div>
                                <div className="w-[100px] px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    THỜI GIAN
                                </div>
                                <div className="w-[100px] px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    THỜI GIAN
                                </div>
                                <div className="w-[50px] px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                                    NGÀY
                                </div>
                                <div className="w-[50px] px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50">
                                    TIẾN %
                                </div>
                            </div>
                            {days.map(day => (
                                <div
                                    key={day}
                                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                                    className={`text-center flex flex-col items-center justify-center py-2 border-r border-slate-100 transition-colors ${isToday(day) ? 'bg-orange-500' :
                                        isWeekend(day) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                        }`}
                                >
                                    <div className={`text-[11px] font-black ${isToday(day) ? 'text-white' : 'text-slate-700'}`}>{day}</div>
                                    <div className={`text-[8px] font-bold uppercase tracking-tighter ${isToday(day) ? 'text-white/80' :
                                        isWeekend(day) ? 'text-red-400' : 'text-blue-400'
                                        }`}>
                                        {getDayName(day)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart Rows */}
                        <div className="">
                            {ganttItems.length === 0 ? (
                                <div className="py-24 text-center bg-slate-50/30">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Calendar size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                                </div>
                            ) : (
                                ganttItems.map((item) => {
                                    const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';
                                    const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';
                                    // Calculate total days including weekends
                                    const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className={`flex border-b border-slate-200 hover:bg-slate-50 transition-colors group/row ${item.type === 'project' ? 'bg-[#e0e4db]' : item.type === 'phase' ? 'bg-slate-100' : 'bg-white'}`}>
                                            {/* Left Column Data */}
                                            <div className={`flex sticky left-0 z-20 transition-colors shrink-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${item.type === 'project' ? 'bg-[#e0e4db] group-hover/row:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 group-hover/row:bg-slate-200' : 'bg-white group-hover/row:bg-slate-50'}`}>
                                                
                                                {/* Tên Mô Tả */}
                                                <div className="w-[300px] px-3 py-2 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center relative">
                                                    {item.type === 'project' ? (
                                                        <div
                                                            className="flex items-center gap-2 cursor-pointer w-full select-none"
                                                            onClick={() => toggleProject(item.id)}
                                                        >
                                                            {item.isExpanded ? <ChevronDown size={14} className="text-slate-800 shrink-0" /> : <ChevronRight size={14} className="text-slate-800 shrink-0" />}
                                                            <span className="text-xs font-black text-slate-800 truncate uppercase">{item.name}</span>
                                                        </div>
                                                    ) : item.type === 'phase' ? (
                                                        <div
                                                            className="flex items-center justify-between cursor-pointer w-full select-none pl-4 pr-2"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => togglePhase(item.id)}>
                                                                {item.isExpanded ? <ChevronDown size={14} className="text-slate-700 shrink-0" /> : <ChevronRight size={14} className="text-slate-700 shrink-0" />}
                                                                <span className="text-xs font-bold text-slate-800 truncate uppercase">{item.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => handleQuickAdd(item.id, item.projectCode, e)}
                                                                className="opacity-0 group-hover/row:opacity-100 hover:bg-slate-200 p-1 rounded-md transition-all text-slate-500 hover:text-blue-600"
                                                                title="Thêm nhiệm vụ mới vào giai đoạn này"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-3 w-full pl-10 pr-6 relative group/task">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[11px] text-slate-700 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2" title={item.name} onClick={() => { setEditingTask(item.task); setIsEditModalOpen(true); }}>
                                                                    {item.name}
                                                                </div>
                                                                {/* Assignee if any */}
                                                                <div 
                                                                    className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-1 -ml-1 rounded transition-colors"
                                                                    onDoubleClick={(e) => handleCellClick(item, 'assignee_id', item.task.assignee_id || '', e)}
                                                                >
                                                                    <User size={10} /> 
                                                                    {editingCell?.id === item.id && editingCell?.field === 'assignee_id' ? (
                                                                        <select
                                                                            value={editValue}
                                                                            onChange={(e) => setEditValue(e.target.value)}
                                                                            onBlur={() => saveCellEdit(item)}
                                                                            onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                                            autoFocus
                                                                            className="text-[9px] py-0 px-1 h-5 bg-white border border-blue-400 rounded outline-none"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <option value="">Chọn người gán</option>
                                                                            {profiles.map(p => (
                                                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <span className="truncate max-w-[150px]">{getAssigneeName(item.task.assignee_id)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={(e) => handleQuickAdd(item.task.parent_id, item.projectCode, e)}
                                                                    className="hover:bg-blue-100 p-1 rounded-md transition-all text-blue-500 hover:text-blue-600 bg-white shadow-sm"
                                                                    title="Chèn nhiệm vụ mới"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                                <button 
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('Bạn có chắc chắn muốn xóa tác vụ này?')) {
                                                                            await supabase.from('tasks').delete().eq('id', item.id);
                                                                            setTasks(prev => prev.filter(t => t.id !== item.id));
                                                                        }
                                                                    }}
                                                                    className="hover:bg-red-100 p-1 rounded-md transition-all text-red-500 hover:text-red-600 bg-white shadow-sm"
                                                                    title="Xóa nhiệm vụ"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>                                                    )}
                                                </div>

                                                {/* Bắt Đầu */}
                                                <div 
                                                    className={`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                                    onDoubleClick={(e) => handleCellClick(item, 'start_date', item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', e)}
                                                >
                                                    {editingCell?.id === item.id && editingCell?.field === 'start_date' ? (
                                                        <input 
                                                            type="date"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => saveCellEdit(item)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                            autoFocus
                                                            className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <span className={item.type !== 'project' && !formattedStart ? 'text-slate-300 italic' : ''}>
                                                            {formattedStart || '—'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Kết Thúc */}
                                                <div 
                                                    className={`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                                    onDoubleClick={(e) => handleCellClick(item, 'end_date', item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', e)}
                                                >
                                                    {editingCell?.id === item.id && editingCell?.field === 'end_date' ? (
                                                        <input 
                                                            type="date"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => saveCellEdit(item)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                            autoFocus
                                                            className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <span className={item.type !== 'project' && !formattedEnd ? 'text-slate-300 italic' : ''}>
                                                            {formattedEnd || '—'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Số Lượng Ngày */}
                                                <div 
                                                    className={`w-[50px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}`}
                                                    onDoubleClick={(e) => handleCellClick(item, 'duration', totalDays.toString(), e)}
                                                >
                                                    {editingCell?.id === item.id && editingCell?.field === 'duration' ? (
                                                        <input 
                                                            type="number"
                                                            min="1"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => saveCellEdit(item)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                            autoFocus
                                                            className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        totalDays > 0 ? totalDays : '-'
                                                    )}
                                                </div>

                                                {/* Tiến Độ % */}
                                                <div className={`w-[50px] px-2 py-2 flex-shrink-0 flex items-center justify-center text-[10px] ${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {item.type !== 'project' ? `${progressAmount}%` : '0%'}
                                                </div>
                                                
                                                {/* Dải phân cách mờ */}
                                                <div className="w-px h-full bg-slate-200 absolute right-0 top-0 shadow-[1px_0_3px_rgba(0,0,0,0.1)]"></div>
                                            </div>

                                            {/* Timeline Grid (Right Side) */}
                                            <div className="flex-1 flex relative" style={{ minHeight: '36px' }}>
                                                {Array.from({ length: daysInMonth }).map((_, index) => {
                                                    const day = index + 1;
                                                    // Determine if this day falls within the item's duration
                                                    let isWithinRange = false;
                                                    
                                                    // Determine logical range limits based on dragging
                                                    let logicalStartDay = item.startDay;
                                                    let logicalDuration = item.duration;
                                                    
                                                    if (draggingItem && draggingItem.id === item.id && draggingItem.type === item.type) {
                                                        if (draggingItem.action === 'move') {
                                                            logicalStartDay += draggingItem.deltaDays;
                                                        } else if (draggingItem.action === 'resize-left') {
                                                            const maxDelta = item.duration - 1;
                                                            const delta = Math.min(draggingItem.deltaDays, maxDelta);
                                                            logicalStartDay += delta;
                                                            logicalDuration -= delta;
                                                        } else if (draggingItem.action === 'resize-right') {
                                                            const minDelta = -(item.duration - 1);
                                                            const delta = Math.max(draggingItem.deltaDays, minDelta);
                                                            logicalDuration += delta;
                                                        }
                                                    }
                                                    
                                                    const logicalEndDay = logicalStartDay + logicalDuration - 1;

                                                    if (day >= logicalStartDay && day <= logicalEndDay) {
                                                        isWithinRange = true;
                                                    }

                                                    // Cell Background Color Logic
                                                    let cellBgClass = "";
                                                    if (isWithinRange) {
                                                        if (item.type === 'project') cellBgClass = "bg-[#4a80bc]"; // Xanh biển đậm
                                                        else if (item.type === 'phase') cellBgClass = "bg-[#4a80bc]"; // Xanh biển
                                                        else cellBgClass = "bg-[#71d9a2]"; // Xanh lá mạ
                                                    } else {
                                                        if (isWeekend(day)) cellBgClass = "bg-slate-100/50";
                                                    }
                                                    
                                                    return (
                                                        <div
                                                            key={day}
                                                            style={{ 
                                                                width: `${cellWidth}px`, 
                                                                minWidth: `${cellWidth}px`,
                                                                left: `${(day - 1) * cellWidth}px`
                                                            }}
                                                            className={`absolute top-0 bottom-0 border-r border-slate-200/50 flex flex-col justify-center items-center transition-colors group/cell ${cellBgClass}
                                                                ${isWithinRange && item.type !== 'project' ? 'hover:brightness-95 cursor-grab active:cursor-grabbing' : ''}
                                                            `}
                                                            onMouseDown={(e) => {
                                                                if (isWithinRange && item.type !== 'project') {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    
                                                                    // Determine action (resize if near edges)
                                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                    const clickX = e.clientX - rect.left;
                                                                    let action: 'move' | 'resize-left' | 'resize-right' = 'move';
                                                                    
                                                                    if (day === logicalStartDay && clickX < 10) action = 'resize-left';
                                                                    else if (day === logicalEndDay && clickX > rect.width - 10) action = 'resize-right';
                                                                    
                                                                    setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action });
                                                                }
                                                            }}
                                                            onDoubleClick={() => {
                                                                if (item.type === 'task') {
                                                                    setEditingTask(item.task);
                                                                    setIsEditModalOpen(true);
                                                                }
                                                            }}
                                                        >
                                                            {/* If it's the first day of the range, we can optionally show progress text */}
                                                            {day === logicalStartDay && isWithinRange && item.type !== 'project' && (
                                                                <span className="text-[8px] font-bold text-slate-800 whitespace-nowrap z-10 select-none px-1 block truncate w-full text-center">
                                                                    {progressAmount > 0 ? `${progressAmount}%` : ''}
                                                                </span>
                                                            )}
                                                            
                                                            {/* Resize handle visuals (optional tooltip for edges) */}
                                                            {isWithinRange && day === logicalStartDay && item.type !== 'project' && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 hover:cursor-col-resize z-20"></div>
                                                            )}
                                                            {isWithinRange && day === logicalEndDay && item.type !== 'project' && (
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 hover:cursor-col-resize z-20"></div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
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
                        const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';
                        const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';
                        const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                        
                        return (
                            <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-[#e0e4db] p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight uppercase truncate">{item.name}</h3>
                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Mã DA: {item.projectCode}</div>
                                    </div>
                                    <div className="bg-[#4a80bc]/10 text-[#4a80bc] px-2 py-1 rounded-lg text-[10px] font-black shrink-0 shadow-sm">
                                        {totalDays} ngày
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-500 mb-4">
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
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Các giai đoạn</h4>
                                        {projectPhases.map(phase => {
                                            const phaseStart = phase.startDate ? format(new Date(phase.startDate), 'dd/MM') : '';
                                            const phaseEnd = phase.endDate ? format(new Date(phase.endDate), 'dd/MM') : '';
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
            <AddEditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                onSaved={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                    fetchData();
                }}
                editingTask={editingTask}
                initialData={{ task_code: '', project_id: '' }}
                profiles={profiles}
                currentUserProfile={currentUserProfile}
                projects={projects}
            />
        </div >
    )
}

export default Gantt;
