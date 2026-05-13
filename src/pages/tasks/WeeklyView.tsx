import { useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, CalendarDays, ChevronDown, Calendar } from 'lucide-react'
import { supabase } from '../../services/supabase'
import type { Task, Project } from '../../types'
import { format } from 'date-fns'

interface Props {
    tasks: Task[]
    projects: Project[]
    profiles: any[]
    onRefresh: () => void
    onAddTask?: (defaultValues: any) => void
    onEditTask?: (task: Task) => void
}

const ALL_STATUSES = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ duyệt', 'Tạm dừng', 'Hoàn thành']

// ─── helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function getWeekRange(offset: number) {
    const now = new Date(TODAY)
    const day = now.getDay()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((day + 6) % 7) + offset * 7)
    mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    sun.setHours(23, 59, 59, 999)
    return { mon, sun }
}

function getWeekNum(d: Date) {
    const s = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - s.getTime()) / 86400000 + s.getDay() + 1) / 7)
}

function fmtShort(d: Date) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function diffDays(a: Date, b: Date) {
    return Math.round((b.getTime() - a.getTime()) / 86400000)
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_FULL   = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    'Hoàn thành':     { label: 'Hoàn thành',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'Đang thực hiện': { label: 'Đang thực hiện', bg: 'bg-blue-100',    text: 'text-blue-700'    },
    'Chờ duyệt':      { label: 'Chờ duyệt',      bg: 'bg-amber-100',   text: 'text-amber-700'   },
    'Cần làm':        { label: 'Cần làm',         bg: 'bg-slate-100',   text: 'text-slate-600'   },
    'Chưa bắt đầu':   { label: 'Chưa bắt đầu',   bg: 'bg-slate-100',   text: 'text-slate-600'   },
    'Tạm dừng':       { label: 'Tạm dừng',        bg: 'bg-orange-100',  text: 'text-orange-700'  },
}

function getStatusBadge(status: string) {
    return STATUS_MAP[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600' }
}

function getPctColor(p: number) {
    if (p === 100) return 'bg-emerald-500'
    if (p >= 60)   return 'bg-blue-500'
    if (p >= 30)   return 'bg-amber-500'
    return 'bg-slate-300'
}

const PHASE_MAP: Record<string, { label: string; color: string }> = {
    'concept':      { label: 'Concept',       color: 'bg-purple-100 text-purple-700' },
    'Concept':      { label: 'Concept',       color: 'bg-purple-100 text-purple-700' },
    '3d':           { label: '3D',            color: 'bg-sky-100 text-sky-700' },
    '2d':           { label: '2D',            color: 'bg-teal-100 text-teal-700' },
    'construction': { label: 'Thi công',      color: 'bg-orange-100 text-orange-700' },
}

function getPhaseLabel(target: string | null | undefined) {
    if (!target) return null
    return PHASE_MAP[target] || null
}

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',     'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',     'bg-emerald-100 text-emerald-700',
]

function getAvatarColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Avatar({ name }: { name: string }) {
    const cls = getAvatarColor(name)
    return (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cls}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    )
}

// ─── main component ───────────────────────────────────────────────────────────

export const WeeklyView = ({ tasks, projects, profiles, onRefresh, onAddTask, onEditTask }: Props) => {
    const [weekOffset, setWeekOffset] = useState(0)
    const [sortMode, setSortMode]     = useState<'time' | 'project' | 'person' | 'alert'>('time')
    const [filterPerson, setFilterPerson]   = useState('')
    const [filterProject, setFilterProject] = useState('')
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
    const [expandedDone, setExpandedDone] = useState<Set<string>>(new Set())
    const scrollRef = useRef<HTMLDivElement>(null)

    const toggleDone = (key: string) => {
        setExpandedDone(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const toggleGroup = (key: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const { mon, sun } = getWeekRange(weekOffset)
    const wn = getWeekNum(mon)

    const getAssigneeId = (id: string | string[] | null): string => {
        if (!id) return ''
        return Array.isArray(id) ? id[0] : id
    }

    const getAssigneeName = (id: string | string[] | null) => {
        if (!id) return 'Chưa gán'
        const resolvedId = Array.isArray(id) ? id[0] : id
        return profiles.find(p => p.id === resolvedId)?.full_name || 'N/A'
    }

    const getProjectName = (id: string) => {
        return projects.find(p => p.id === id)?.name || ''
    }
    const getProjectCode = (id: string) => {
        return (projects.find(p => p.id === id) as any)?.project_code || ''
    }

    // Tasks relevant to this week:
    // 1. due_date falls in this week
    // 2. span across this week (start_date <= sun AND due_date >= mon)
    // 3. overdue + not done (carried into this week)
    const weekTasks = useMemo(() => {
        const monStr = format(mon, 'yyyy-MM-dd')
        const sunStr = format(sun, 'yyyy-MM-dd')
        return tasks.filter(t => {
            if (!t.due_date) return false
            const startRaw = ((t as any).start_date || t.due_date) as string
            const startStr = startRaw.substring(0, 10)
            const dueStr = t.due_date.substring(0, 10)
            
            const spansWeek = startStr <= sunStr && dueStr >= monStr
            const isOverdue = dueStr < monStr && t.status !== 'Hoàn thành' && t.status !== 'Lưu trữ'
            if (!spansWeek && !isOverdue) return false
            
            const assigneeId = getAssigneeId(t.assignee_id)
            if (filterPerson  && assigneeId !== filterPerson)  return false
            if (filterProject && t.project_id  !== filterProject) return false
            return true
        })
    }, [tasks, weekOffset, filterPerson, filterProject, mon, sun])

    const stats = {
        total:   weekTasks.length,
        done:    weekTasks.filter(t => t.status === 'Hoàn thành').length,
        inprog:  weekTasks.filter(t => t.status === 'Đang thực hiện').length,
        pending: weekTasks.filter(t => t.status === 'Chưa bắt đầu' || t.status === 'Cần làm').length,
        overdue: weekTasks.filter(t => t.due_date && new Date(t.due_date) < TODAY && t.status !== 'Hoàn thành').length,
    }

    const alerts = useMemo(() => weekTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return (d < TODAY && t.status !== 'Hoàn thành') ||
               (diffDays(TODAY, d) <= 1 && t.status !== 'Hoàn thành')
    }), [weekTasks])

    const groupedTasks = useMemo(() => {
        const sourceList = sortMode === 'alert' ? alerts : weekTasks;
        let groups: { key: string, label: string, tasks: Task[], isLateGroup?: boolean, defaultValues?: any }[] = [];

        if (sortMode === 'time' || sortMode === 'alert') {
            const lateTasks = sourceList.filter(t => new Date(t.due_date!) < mon);
            if (lateTasks.length > 0) {
                groups.push({ key: 'Trễ hạn', label: 'Trễ hạn', tasks: lateTasks.sort((a,b) => (a.due_date||'').localeCompare(b.due_date||'')), isLateGroup: true });
            }
            for (let i = 0; i < 7; i++) {
                const d = new Date(mon); d.setDate(mon.getDate() + i);
                const dStr = format(d, 'yyyy-MM-dd');
                const key = `${DAY_FULL[d.getDay()]} ${fmtShort(d)}`;
                const dayTasks = sourceList.filter(t => {
                    const tDate = new Date(t.due_date!);
                    if (tDate < mon) return false; 
                    return t.due_date!.substring(0, 10) === dStr;
                }).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                
                groups.push({ key, label: key, tasks: dayTasks, defaultValues: { start_date: dStr, due_date: dStr } });
            }
        } else if (sortMode === 'project') {
            const projectIds = Array.from(new Set(sourceList.map(t => t.project_id)));
            groups = projectIds.map(pid => {
                const label = `${getProjectCode(pid)} - ${getProjectName(pid)}`;
                const tks = sourceList.filter(t => t.project_id === pid).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                return { key: pid, label, tasks: tks, defaultValues: { project_id: pid } };
            }).sort((a, b) => a.label.localeCompare(b.label));
        } else if (sortMode === 'person') {
            const personIds = Array.from(new Set(sourceList.map(t => getAssigneeId(t.assignee_id))));
            groups = personIds.map(pid => {
                const label = getAssigneeName(pid);
                const tks = sourceList.filter(t => getAssigneeId(t.assignee_id) === pid).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                return { key: pid, label, tasks: tks, defaultValues: { assignee_id: pid } };
            }).sort((a, b) => a.label.localeCompare(b.label));
        }

        return groups;
    }, [weekTasks, alerts, sortMode, mon])

    const openGoogleCalendar = (task: Task) => {
        const title = encodeURIComponent(task.name || '')
        const details = encodeURIComponent([task.task_code, (task as any).description].filter(Boolean).join('\n'))
        const startDate = ((task as any).start_date || task.due_date || '').substring(0, 10).replace(/-/g, '')
        const endDate = task.due_date
            ? (() => { const d = new Date(task.due_date); d.setDate(d.getDate() + 1); return d.toISOString().substring(0, 10).replace(/-/g, '') })()
            : startDate
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`, '_blank')
    }

    // Map old/new priority → { label, cls }
    const getPriority = (raw: string | null | undefined) => {
        const HIGH_OLD = ['Khẩn cấp', 'Cao', 'high', 'JUX']
        const val = HIGH_OLD.includes(raw || '') ? 'JUX' : 'DQH'
        return {
            label: val,
            cls: val === 'JUX' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
        }
    }

    const updateProgress = async (taskId: string, delta: number) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return
        const newPct = Math.min(100, Math.max(0, (task.completion_pct || 0) + delta))
        const newStatus = newPct === 100 ? 'Hoàn thành' : newPct === 0 ? 'Chưa bắt đầu' : 'Đang thực hiện'
        setSaving(s => ({ ...s, [taskId]: true }))
        await supabase.from('tasks').update({ completion_pct: newPct, status: newStatus }).eq('id', taskId)
        setSaving(s => ({ ...s, [taskId]: false }))
        onRefresh()
    }

    const updateStatus = async (taskId: string, newStatus: string) => {
        const newPct = newStatus === 'Hoàn thành' ? 100 : undefined
        const updates: any = { status: newStatus }
        if (newPct !== undefined) updates.completion_pct = newPct
        setSaving(s => ({ ...s, [taskId]: true }))
        await supabase.from('tasks').update(updates).eq('id', taskId)
        setSaving(s => ({ ...s, [taskId]: false }))
        onRefresh()
    }

    const updateAssignee = async (taskId: string, newAssigneeId: string) => {
        setSaving(s => ({ ...s, [taskId]: true }))
        await supabase.from('tasks').update({ assignee_id: newAssigneeId || null }).eq('id', taskId)
        setSaving(s => ({ ...s, [taskId]: false }))
        onRefresh()
    }

    const uniquePersonIds = [...new Set(weekTasks.map(t => getAssigneeId(t.assignee_id)).filter(Boolean))]
    const uniqueProjects  = [...new Set(weekTasks.map(t => t.project_id).filter(Boolean))]

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 md:px-5 py-3 md:py-4 border-b border-slate-100">
                <div className="font-semibold text-slate-800 text-sm">
                    Tuần {wn} — {fmtShort(mon)} đến {fmtShort(sun)}/{sun.getFullYear()}
                </div>
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar-hide">
                    {onAddTask && (
                        <button
                            onClick={() => onAddTask({})}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 h-7 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm mr-auto md:mr-2 shrink-0"
                        >
                            <span className="text-[14px] leading-none mb-[2px]">+</span> Tạo mới nhiệm vụ
                        </button>
                    )}
                    <button onClick={() => setWeekOffset(o => o - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0">
                        <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setWeekOffset(0)}
                        className="px-3 h-7 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors whitespace-nowrap shrink-0">
                        Tuần này
                    </button>
                    <button onClick={() => setWeekOffset(o => o + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0">
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
                {[
                    { label: 'Tổng task',     value: stats.total,   color: 'text-slate-800' },
                    { label: 'Hoàn thành',    value: stats.done,    color: 'text-emerald-600' },
                    { label: 'Đang làm',      value: stats.inprog,  color: 'text-blue-600' },
                    { label: 'Chưa bắt đầu',  value: stats.pending, color: 'text-slate-500' },
                    { label: 'Trễ hạn',       value: stats.overdue, color: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className="px-4 py-3 text-center">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{s.label}</div>
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Filters + Sort ── */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 flex-wrap">
                <select
                    value={filterPerson}
                    onChange={e => setFilterPerson(e.target.value)}
                    className="h-8 text-xs px-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 flex-1 min-w-[130px] max-w-[200px]"
                >
                    <option value="">Tất cả nhân sự</option>
                    {uniquePersonIds.map(id => {
                        const p = profiles.find(x => x.id === id)
                        return <option key={id} value={id}>{p?.full_name || p?.email || id}</option>
                    })}
                </select>

                <select
                    value={filterProject}
                    onChange={e => setFilterProject(e.target.value)}
                    className="h-8 text-xs px-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 flex-1 min-w-[130px] max-w-[200px]"
                >
                    <option value="">Tất cả dự án</option>
                    {uniqueProjects.map(id => (
                        <option key={id} value={id}>{getProjectCode(id)} – {getProjectName(id)}</option>
                    ))}
                </select>

                <div className="flex items-center gap-1 ml-auto">
                    {([['time', 'Ngày'], ['project', 'Dự án'], ['person', 'Nhân sự'], ['alert', `Cần xử lý (${alerts.length})`]] as const).map(([key, label]) => {
                        const isAlert = key === 'alert';
                        return (
                            <button key={key} onClick={() => {
                                setSortMode(key as any)
                                setCollapsedGroups(new Set())
                                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                                className={`px-3 h-7 text-xs font-medium rounded-lg border transition-colors ${
                                    sortMode === key
                                        ? (isAlert ? 'bg-red-50 border-red-300 text-red-700' : 'bg-indigo-50 border-indigo-300 text-indigo-700')
                                        : (isAlert ? 'bg-white border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')
                                }`}>
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="hidden md:grid grid-cols-[1fr_1fr_64px_90px_110px_110px] gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100">
                {['Nhiệm vụ', 'Mô tả', 'Hạn chót', 'Tiến độ', 'Phụ trách', 'Trạng thái'].map(h => (
                    <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
                ))}
            </div>

            {/* ── Task Rows ── */}
            {weekTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CalendarDays size={32} className="mb-3 opacity-40" />
                    <div className="text-sm">Không có task trong tuần này</div>
                </div>
            ) : (
                <div className="pb-4 min-h-[300px]" ref={scrollRef}>
                    {groupedTasks.map(group => {
                        const isCollapsed = collapsedGroups.has(group.key);
                        return (
                            <div key={group.key} className="mb-1">
                                {/* Group Header */}
                                <div className={`flex items-center justify-between px-5 py-2 ${group.isLateGroup ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-800'} border-y sticky top-0 z-10 shadow-sm`}>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer flex-1 select-none"
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''} ${group.isLateGroup ? 'text-red-400' : 'text-slate-400'}`} />
                                        <span className={`text-sm font-bold uppercase tracking-wide ${group.isLateGroup ? 'text-red-700' : 'text-slate-700'}`}>
                                            {group.label}
                                        </span>
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                            {group.tasks.filter(t => t.status !== 'Hoàn thành').length}
                                        </span>
                                    </div>
                                    
                                    {onAddTask && (
                                        <button 
                                            onClick={() => onAddTask(group.defaultValues)}
                                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1 rounded transition-colors flex items-center gap-1 border border-emerald-200 shrink-0"
                                        >
                                            + task
                                        </button>
                                    )}
                                </div>

                                {/* Group Tasks - smooth collapse */}
                                <div
                                    className="bg-white overflow-hidden transition-all duration-200 ease-in-out"
                                    style={{ maxHeight: isCollapsed ? '0px' : '9999px', opacity: isCollapsed ? 0 : 1 }}
                                >
                                        {(() => {
                                            const activeTasks = group.tasks.filter(t => t.status !== 'Hoàn thành')
                                            const doneTasks   = group.tasks.filter(t => t.status === 'Hoàn thành')
                                            const isDoneOpen  = expandedDone.has(group.key)

                                            const TaskRow = ({ t }: { t: Task }) => {
                                                const d = new Date(t.due_date!)
                                                const isLate = d < TODAY && t.status !== 'Hoàn thành'
                                                const isDone = t.status === 'Hoàn thành'
                                                const pct = t.completion_pct || 0
                                                const assigneeName = getAssigneeName(t.assignee_id)
                                                const badge = getStatusBadge(t.status)
                                                return (
                                                    <div className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${isDone ? 'opacity-60' : ''}`}>
                                                        {/* Mobile */}
                                                        <div className="md:hidden flex items-start gap-3 px-4 py-2">
                                                            <div className="w-6 h-6 shrink-0 mt-0.5"><Avatar name={assigneeName} /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'} truncate cursor-pointer`} onClick={() => onEditTask?.(t)}>
                                                                    {t.name || t.task_code || 'Chưa có tên'}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                    {getPhaseLabel((t as any).target) && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getPhaseLabel((t as any).target)!.color}`}>{getPhaseLabel((t as any).target)!.label}</span>}
                                                                    {(() => { const { label, cls } = getPriority(t.priority); return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${cls}`}>{label}</span> })()}
                                                                    <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded truncate max-w-[120px]">{getProjectName(t.project_id)}</span>
                                                                    <span className={`text-[10px] font-medium ${isLate ? 'text-red-600' : 'text-slate-500'}`}>{fmtShort(d)}</span>
                                                                    <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)} className={`text-[9px] font-medium px-1.5 py-0.5 rounded border-0 ${badge.bg} ${badge.text} cursor-pointer focus:outline-none`}>
                                                                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-1.5">
                                                                    <button onClick={() => updateProgress(t.id, -10)} className="w-5 h-5 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">−</button>
                                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${getPctColor(pct)}`} style={{ width: `${pct}%` }} /></div>
                                                                    <span className="text-[10px] text-slate-500 w-6 text-right">{pct}%</span>
                                                                    <button onClick={() => updateProgress(t.id, 10)} className="w-5 h-5 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Desktop */}
                                                        <div className="hidden md:grid grid-cols-[1fr_1fr_64px_90px_110px_110px_50px_32px] gap-2 px-5 py-2 items-center">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    {getPhaseLabel((t as any).target) && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${getPhaseLabel((t as any).target)!.color}`}>{getPhaseLabel((t as any).target)!.label}</span>}
                                                                    <div className={`text-xs font-semibold truncate min-w-0 flex-1 cursor-pointer ${isDone ? 'line-through text-slate-400' : 'text-slate-800 hover:text-indigo-600 hover:underline'}`} onClick={() => onEditTask?.(t)}>
                                                                        {t.name || t.task_code || 'Chưa có tên'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 mt-0.5 truncate">{getProjectName(t.project_id)}</div>
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 truncate">{(t as any).description || <span className="text-slate-300 italic">—</span>}</div>
                                                            <span className={`text-[11px] font-semibold ${isLate ? 'text-red-600' : 'text-slate-600'}`}>{fmtShort(d)}</span>
                                                            <div>
                                                                <div className="flex items-center gap-1 mb-1">
                                                                    <button onClick={() => updateProgress(t.id, -10)} className="w-4 h-4 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600">−</button>
                                                                    <span className="text-[10px] font-semibold text-slate-700 w-6 text-center">{saving[t.id] ? '...' : `${pct}%`}</span>
                                                                    <button onClick={() => updateProgress(t.id, 10)} className="w-4 h-4 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600">+</button>
                                                                </div>
                                                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${getPctColor(pct)}`} style={{ width: `${pct}%` }} /></div>
                                                            </div>
                                                            <select value={getAssigneeId(t.assignee_id)} onChange={e => updateAssignee(t.id, e.target.value)} className="text-[11px] font-medium text-slate-600 bg-transparent border border-slate-200 rounded px-1 py-0.5 cursor-pointer focus:outline-none truncate min-w-0">
                                                                <option value="">Chưa gán</option>
                                                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                                                            </select>
                                                            <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.bg} ${badge.text} whitespace-nowrap text-center cursor-pointer border-0 focus:outline-none`}>
                                                                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {(() => { const { label, cls } = getPriority(t.priority); return <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-center ${cls}`}>{label}</span> })()}
                                                            <button onClick={() => openGoogleCalendar(t)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-400 hover:text-blue-500 transition-colors" title="Thêm vào Google Calendar">
                                                                <Calendar size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <>
                                                    {activeTasks.length === 0 && doneTasks.length === 0 && (
                                                        <div className="px-5 py-3 text-xs text-slate-400 italic">Không có nhiệm vụ</div>
                                                    )}
                                                    {activeTasks.map(t => <TaskRow key={t.id} t={t} />)}
                                                    {doneTasks.length > 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => toggleDone(group.key)}
                                                                className="flex items-center gap-2 px-5 py-2.5 w-full text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
                                                            >
                                                                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isDoneOpen ? '' : '-rotate-90'}`} />
                                                                <span className="text-xs text-slate-500">Đã hoàn tất {doneTasks.length} mục</span>
                                                            </button>
                                                            {isDoneOpen && doneTasks.map(t => <TaskRow key={t.id} t={t} />)}
                                                        </>
                                                    )}
                                                </>
                                            )
                                        })()}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
