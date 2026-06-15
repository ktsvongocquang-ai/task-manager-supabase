import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'
import { DayView } from './DayView'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Folder } from 'lucide-react'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const Schedule = () => {
    const { profile } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState({ task_code: '', project_id: '' })

    // Overflow popover
    const [overflowDay, setOverflowDay] = useState<string | null>(null)
    const overflowRef = useRef<HTMLDivElement>(null)

    // Filter and View
    const [selectedProject, setSelectedProject] = useState('all')
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

    useEffect(() => {
        fetchAll()
    }, [profile])

    // Close overflow on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
                setOverflowDay(null)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchAll = async () => {
        try {
            if (tasks.length === 0) setLoading(true)
            const [{ data: t }, { data: pt }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                profile?.id ? supabase.from('personal_tasks').select('*').eq('user_id', profile.id) : Promise.resolve({ data: [] }),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name, role, email')
            ])

            const companyTasks = (t || []) as Task[];
            const personalTasksMapped = (pt || []).map((t: any) => ({
                id: t.id,
                name: t.title,
                task_code: 'CÁ NHÂN',
                status: t.status === 'done' ? 'Hoàn thành' : (t.status === 'in-progress' ? 'Đang làm' : 'Cần làm'),
                due_date: t.due_date,
                project_id: 'personal',
                assignee_id: profile?.id,
                created_at: t.created_at,
            })) as unknown as Task[];

            setTasks([...companyTasks, ...personalTasksMapped])
            setProjects((p || []) as Project[])
            setProfiles(pr || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const generateNextTaskCode = (projectId: string) => {
        const projTasks = tasks.filter(t => t.project_id === projectId);
        let maxId = 0;
        projTasks.forEach(t => {
            const match = t.task_code?.match(/(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        const p = projects.find(x => x.id === projectId)
        const projCode = p?.project_code || ''
        return projCode ? `${projCode}-${String(maxId + 1).padStart(2, '0')}` : '';
    }

    const openEditModal = (t: Task) => {

        setEditingTask(t)
        setInitialTaskData({ task_code: t.task_code, project_id: t.project_id })
        setShowModal(true)
    }

    const openAddModal = (dateStr: string) => {
        setEditingTask(null)
        setInitialTaskData({ task_code: '', project_id: selectedProject === 'personal' ? 'personal' : '', due_date: dateStr, start_date: dateStr } as any)
        setShowModal(true)
    }

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const isSupporter = t.supporter_id === profile?.id;

        const isManagerOrAdmin = ['Admin', 'Quản lý', 'Giám đốc', 'Quản lý thiết kế', 'Quản lý thi công'].includes(userRole?.trim() || '');

        let isVisible = true;
        if (!isManagerOrAdmin) {
            isVisible = Boolean(isAssigned || isSupporter);
        }

        if (!isVisible) return false;

        if (selectedProject !== 'all' && t.project_id !== selectedProject) return false;

        return true;
    }).sort((a, b) => {
        const codeA = a.task_code || '';
        const codeB = b.task_code || '';
        if (!codeA && !codeB) return (a.created_at || '').localeCompare(b.created_at || '');
        if (!codeA) return 1;
        if (!codeB) return -1;
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    })

    const prevPeriod = () => {
        if (viewMode === 'day') setCurrentDate(prev => new Date(prev.getTime() - 86400000))
        else setCurrentDate(prev => subMonths(prev, 1))
    }
    const nextPeriod = () => {
        if (viewMode === 'day') setCurrentDate(prev => new Date(prev.getTime() + 86400000))
        else setCurrentDate(prev => addMonths(prev, 1))
    }
    const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); }

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    let calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    while (calendarDays.length < 42) {
        calendarDays.push(new Date(calendarDays[calendarDays.length - 1].getTime() + 24 * 60 * 60 * 1000))
    }

    const getDotColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-500'
        if (status?.includes('Đang')) return 'bg-blue-500'
        if (status?.includes('Tạm dừng')) return 'bg-amber-500'
        if (status?.includes('Hủy')) return 'bg-red-400'
        return 'bg-slate-400'
    }

    const getStatusColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status?.includes('Đang')) return 'bg-blue-100 text-blue-700 border-blue-200'
        if (status?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700 border-amber-200'
        if (status?.includes('Hủy')) return 'bg-red-100 text-red-700 border-red-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getEventBg = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
        if (status?.includes('Đang')) return 'bg-blue-50 hover:bg-blue-100 text-blue-800'
        if (status?.includes('Tạm dừng')) return 'bg-amber-50 hover:bg-amber-100 text-amber-800'
        if (status?.includes('Hủy')) return 'bg-red-50 hover:bg-red-100 text-red-800'
        return 'bg-slate-50 hover:bg-slate-100 text-slate-700'
    }

    // Auto scroll mobile calendar to selected date
    useEffect(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const el = document.getElementById(`day-btn-${dateStr}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [selectedDate])

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="min-h-0 flex flex-col h-full overflow-hidden">
            {/* Desktop Calendar Grid — full frame with inline header */}
            <div className="hidden md:flex flex-1 bg-white overflow-hidden flex-col min-h-0">
                {/* Inline Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                        >
                            Hôm nay
                        </button>
                        <div className="flex items-center">
                            <button onClick={prevPeriod} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextPeriod} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 capitalize">
                            {viewMode === 'day' ? format(currentDate, 'EEEE, dd/MM/yyyy', { locale: vi }) : `Tháng ${format(currentDate, 'M, yyyy', { locale: vi })}`}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as any)}
                            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                        >
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                        </select>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer max-w-[200px]"
                        >
                            <option value="all">Tất cả dự án</option>
                            <option value="personal">Việc cá nhân</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* Views */}
                {viewMode === 'day' && (
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <DayView 
                            currentDate={currentDate} 
                            tasks={filteredTasks} 
                            onTaskClick={openEditModal} 
                            onEmptyClick={(dateStr, timeStr) => {
                                setEditingTask(null)
                                setInitialTaskData({ task_code: '', project_id: selectedProject === 'personal' ? 'personal' : '', due_date: dateStr, start_date: dateStr, start_time: timeStr, due_time: '' } as any)
                                setShowModal(true)
                            }}
                        />
                    </div>
                )}
                {viewMode === 'month' && (
                    <>
                        {/* Weekdays Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 shrink-0">
                    {WEEKDAYS.map((day, i) => (
                        <div key={day} className={`py-2.5 text-center text-xs font-semibold tracking-wide uppercase ${i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-500'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const dayTasks = filteredTasks.filter(t => t.due_date && t.due_date.startsWith(dateStr))
                        const isCurrentMonth = isSameMonth(day, currentDate)
                        const isToday = isSameDay(day, new Date())
                        const isWeekend = idx % 7 === 0 || idx % 7 === 6

                        // Show max tasks based on available space - compact mode
                        const maxVisible = 4
                        const visibleTasks = dayTasks.slice(0, maxVisible)
                        const overflowCount = dayTasks.length - maxVisible
                        const showOverflow = overflowDay === dateStr

                        return (
                            <div
                                key={day.toString()}
                                onDoubleClick={() => openAddModal(dateStr)}
                                className={`border-b border-r border-slate-100 flex flex-col relative group overflow-hidden cursor-cell
                                    ${!isCurrentMonth ? 'bg-slate-50/30' : isWeekend ? 'bg-slate-50/50' : 'bg-white'} 
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                    ${idx >= 35 ? 'border-b-0' : ''}
                                `}
                            >
                                {/* Day Number */}
                                <div className="px-2 pt-1.5 pb-0.5 flex items-center justify-between shrink-0">
                                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full leading-none
                                        ${isToday ? 'bg-blue-600 text-white font-bold' : !isCurrentMonth ? 'text-slate-300' : isWeekend ? 'text-slate-400' : 'text-slate-600'}`
                                    }>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Tasks - compact single-line items */}
                                <div className="flex-1 px-1 pb-1 space-y-px overflow-hidden min-h-0">
                                    {visibleTasks.map(task => {
                                        const isPersonal = task.task_code === 'CÁ NHÂN'
                                        const isDone = task.status?.includes('Hoàn thành')
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                className={`flex items-center gap-1 px-1.5 py-[3px] rounded cursor-pointer transition-colors text-[11px] leading-tight group/item ${getEventBg(task.status || '')}`}
                                                title={`${task.task_code} — ${task.name}\n${task.status}${isPersonal ? '' : '\nDự án: ' + (projects.find(p => p.id === task.project_id)?.name || '')}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(task.status || '')}`}></span>
                                                <span className={`truncate font-medium ${isDone ? 'line-through opacity-60' : ''}`}>
                                                    {isPersonal ? '' : <span className="font-semibold opacity-70">{task.task_code} </span>}
                                                    {task.name}
                                                </span>
                                            </div>
                                        )
                                    })}

                                    {/* +N more button */}
                                    {overflowCount > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOverflowDay(showOverflow ? null : dateStr); }}
                                            className="w-full text-left px-1.5 py-[2px] text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            +{overflowCount} nhiệm vụ khác
                                        </button>
                                    )}

                                    {/* Overflow Popover */}
                                    {showOverflow && (
                                        <div
                                            ref={overflowRef}
                                            className="absolute left-1 right-1 top-8 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="text-xs font-bold text-slate-500 mb-2 px-1">
                                                {format(day, 'EEEE, dd/MM', { locale: vi })} — {dayTasks.length} nhiệm vụ
                                            </div>
                                            <div className="space-y-1">
                                                {dayTasks.map(task => {
                                                    const isDone = task.status?.includes('Hoàn thành')
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(task); setOverflowDay(null); }}
                                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors text-[11px] ${getEventBg(task.status || '')}`}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(task.status || '')}`}></span>
                                                            <span className={`truncate font-medium ${isDone ? 'line-through opacity-60' : ''}`}>
                                                                <span className="font-semibold opacity-70">{task.task_code} </span>
                                                                {task.name}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                </>)}
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex-1 min-h-0 flex flex-col space-y-3 relative">
                {/* Mobile Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={goToToday} className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md">
                            Hôm nay
                        </button>
                        <button onClick={prevPeriod} className="p-1 text-slate-500"><ChevronLeft size={18} /></button>
                        <button onClick={nextPeriod} className="p-1 text-slate-500"><ChevronRight size={18} /></button>
                        <h2 className="text-sm font-semibold text-slate-800 capitalize truncate max-w-[120px]">
                            {viewMode === 'day' ? format(currentDate, 'dd/MM/yyyy', { locale: vi }) : `Tháng ${format(currentDate, 'M, yyyy', { locale: vi })}`}
                        </h2>
                    </div>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-600 bg-white max-w-[120px] appearance-none"
                    >
                        <option value="all">Tất cả</option>
                        <option value="personal">Cá nhân</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Mini Month Grid */}
                <div className="bg-white p-3 pt-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    {/* Weekdays Header */}
                    <div className="grid grid-cols-7 mb-3">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {calendarDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate)
                            const isToday = isSameDay(day, new Date())
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const dateStr = format(day, 'yyyy-MM-dd')
                            const dayTasks = filteredTasks.filter(t => {
                                if (!t.due_date) return false;
                                const startD = (t.start_date || t.due_date).substring(0, 10);
                                const endD = t.due_date.substring(0, 10);
                                return startD <= dateStr && endD >= dateStr;
                            })
                            const hasTasks = dayTasks.length > 0;

                            return (
                                <button
                                    id={`day-btn-${dateStr}`}
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105 z-10 font-bold' : 
                                          !isCurrentMonth ? 'text-slate-300 opacity-50' : 
                                          isToday ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium'}
                                    `}
                                >
                                    <span className="text-[14px] leading-none mb-0.5">
                                        {format(day, 'd')}
                                    </span>
                                    {hasTasks && (
                                        <div className="flex gap-0.5 absolute bottom-1 w-full justify-center">
                                            {dayTasks.slice(0, 3).map((t, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-200' : getDotColor(t.status || '')}`} />
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-200' : 'bg-slate-300'}`} />
                                            )}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Selected Day Tasks */}
                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pb-20 custom-scrollbar px-1">
                    {(() => {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd')
                        const dayTasks = filteredTasks.filter(t => {
                            if (!t.due_date) return false;
                            const startD = (t.start_date || t.due_date).substring(0, 10);
                            const endD = t.due_date.substring(0, 10);
                            return startD <= dateStr && endD >= dateStr;
                        }).sort((a,b) => (a.status || '').localeCompare(b.status || ''));
                        
                        if (dayTasks.length === 0) {
                            return (
                                <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-2">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                        <div className="text-3xl opacity-50">🏝️</div>
                                    </div>
                                    <p className="text-base font-bold text-slate-600 mb-1 tracking-tight">Không có nhiệm vụ</p>
                                    <p className="text-[13px] font-medium text-slate-400">Bạn được nghỉ ngơi vào ngày này!</p>
                                </div>
                            )
                        }

                        return dayTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => openEditModal(task)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 hover:bg-slate-50 active:scale-[0.98] group bg-white border border-slate-200 shadow-sm relative overflow-hidden`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getDotColor(task.status || '')}`}></div>
                                <div className="flex flex-col gap-2 pl-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{task.task_code}</span>
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(task.status || '')}`}>
                                                {task.status}
                                            </span>
                                            {task.project_id && task.project_id !== 'personal' && (
                                                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wide px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 max-w-[140px]">
                                                    <Folder size={10} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{projects.find(p => p.id === task.project_id)?.name}</span>
                                                </span>
                                            )}
                                        </div>
                                        {task.assignee_id && (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 shadow-sm ml-2">
                                                {profiles.find(p => p.id === task.assignee_id)?.full_name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className={`text-[15px] font-bold line-clamp-2 leading-snug transition-colors pr-2 ${task.status?.includes('Hoàn thành') ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                                        {task.name}
                                    </h4>
                                </div>
                            </div>
                        ))
                    })()}
                </div>
            </div>

            {/* Modal */}
            <AddEditTaskModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSaved={() => {
                    setShowModal(false);
                    fetchAll();
                }}
                editingTask={editingTask}
                initialData={initialTaskData}
                projects={projects}
                profiles={profiles}
                currentUserProfile={profile}
                generateNextTaskCode={generateNextTaskCode}
            />
        </div>
    )
}
