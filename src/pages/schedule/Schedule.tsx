import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type Project } from '../../types'
import { AddEditTaskModal } from '../tasks/AddEditTaskModal'
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const Schedule = () => {
    const { profile } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date())

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState({ task_code: '', project_id: '' })

    // Filters
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchAll()
    }, [profile])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('projects').select('*'),
                supabase.from('profiles').select('id, full_name, role, email, avatar_url')
            ])
            setTasks((t || []) as Task[])
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
            const match = t.task_code.match(/-(\d+)$/);
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

    const filteredTasks = tasks.filter(t => {
        const userRole = profile?.role;
        const isAssigned = t.assignee_id === profile?.id;
        const project = projects.find(p => p.id === t.project_id);
        const isProjectManager = project && project.manager_id === profile?.id;

        let isVisible = true;
        if (userRole === 'Nhân viên') {
            isVisible = Boolean(isAssigned || isProjectManager);
        }

        if (!isVisible) return false;

        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.task_code.toLowerCase().includes(search.toLowerCase())

        return matchSearch
    })

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const getStatusColor = (status: string) => {
        if (status?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status?.includes('Đang')) return 'bg-blue-100 text-blue-700 border-blue-200'
        if (status?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700 border-amber-200'
        if (status?.includes('Hủy')) return 'bg-red-100 text-red-700 border-red-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto min-h-0 flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <h1 className="text-xl font-bold text-slate-800">Lịch Biểu</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm nhiệm vụ..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200">
                        <ChevronRight size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 ml-4 capitalize">
                        Tháng {format(currentDate, 'M yyyy', { locale: vi })}
                    </h2>
                </div>
                {/* Stats matching Kanban top, optional */}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 shrink-0">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)]">
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const dayTasks = filteredTasks.filter(t => t.due_date && t.due_date.startsWith(dateStr))
                        const isCurrentMonth = isSameMonth(day, currentDate)
                        const isToday = isSameDay(day, new Date())

                        return (
                            <div
                                key={day.toString()}
                                className={`border-b border-r border-slate-100 p-2 transition-colors flex flex-col gap-1 overflow-y-auto
                                    ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'} 
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday ? 'bg-indigo-600 text-white' : !isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`
                                    }>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => openEditModal(task)}
                                            className={`text-[10px] px-2 py-1.5 rounded cursor-pointer truncate border shadow-sm hover:shadow transition-shadow font-medium
                                                ${getStatusColor(task.status || '')}
                                            `}
                                            title={task.name}
                                        >
                                            <span className="font-bold mr-1">{task.task_code}</span>
                                            {task.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
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
