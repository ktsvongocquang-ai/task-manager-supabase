import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, CalendarDays } from 'lucide-react'
import { supabase } from '../../services/supabase'
import type { Task, Project } from '../../types'

interface Props {
    tasks: Task[]
    projects: Project[]
    profiles: any[]
    onRefresh: () => void
}

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

export const WeeklyView = ({ tasks, projects, profiles, onRefresh }: Props) => {
    const [weekOffset, setWeekOffset] = useState(0)
    const [sortMode, setSortMode]     = useState<'time' | 'project' | 'person'>('time')
    const [filterPerson, setFilterPerson]   = useState('')
    const [filterProject, setFilterProject] = useState('')
    const [saving, setSaving] = useState<Record<string, boolean>>({})

    const { mon, sun } = getWeekRange(weekOffset)
    const wn = getWeekNum(mon)

    const weekDayRow = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon); d.setDate(mon.getDate() + i)
        return `${DAY_LABELS[d.getDay()]} ${fmtShort(d)}`
    }).join('  ·  ')

    // Tasks relevant to this week:
    // 1. due_date falls in this week
    // 2. span across this week (start_date <= sun AND due_date >= mon)
    // 3. overdue + not done (carried into this week)
    const weekTasks = useMemo(() => {
        const monStr = mon.toISOString().split('T')[0]
        const sunStr = sun.toISOString().split('T')[0]
        return tasks.filter(t => {
            if (!t.due_date) return false
            const startStr = (t as any).start_date || t.due_date
            const spansWeek = startStr <= sunStr && t.due_date >= monStr
            const isOverdue = t.due_date < monStr && t.status !== 'Hoàn thành' && t.status !== 'Lưu trữ'
            if (!spansWeek && !isOverdue) return false
            if (filterPerson  && t.assignee_id !== filterPerson)  return false
            if (filterProject && t.project_id  !== filterProject) return false
            return true
        })
    }, [tasks, weekOffset, filterPerson, filterProject])

    const getAssigneeName = (id: string | string[] | null) => {
        if (!id) return 'Chưa gán'
        const resolvedId = Array.isArray(id) ? id[0] : id
        return profiles.find(p => p.id === resolvedId)?.full_name || 'N/A'
    }

    const getAssigneeId = (id: string | string[] | null): string => {
        if (!id) return ''
        return Array.isArray(id) ? id[0] : id
    }

    const getProjectName = (id: string) => {
        return projects.find(p => p.id === id)?.name || ''
    }
    const getProjectCode = (id: string) => {
        return (projects.find(p => p.id === id) as any)?.project_code || ''
    }

    const stats = {
        total:   weekTasks.length,
        done:    weekTasks.filter(t => t.status === 'Hoàn thành').length,
        inprog:  weekTasks.filter(t => t.status === 'Đang thực hiện').length,
        pending: weekTasks.filter(t => t.status === 'Chưa bắt đầu' || t.status === 'Cần làm').length,
        overdue: weekTasks.filter(t => t.due_date && new Date(t.due_date) < TODAY && t.status !== 'Hoàn thành').length,
    }

    const alerts = weekTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return (d < TODAY && t.status !== 'Hoàn thành') ||
               (diffDays(TODAY, d) <= 1 && t.status !== 'Hoàn thành')
    })

    const sorted = useMemo(() => {
        return [...weekTasks].sort((a, b) => {
            if (sortMode === 'time')    return (a.due_date || '').localeCompare(b.due_date || '')
            if (sortMode === 'project') return (a.project_id || '').localeCompare(b.project_id || '') || (a.due_date || '').localeCompare(b.due_date || '')
            return getAssigneeName(a.assignee_id).localeCompare(getAssigneeName(b.assignee_id)) || (a.due_date || '').localeCompare(b.due_date || '')
        })
    }, [weekTasks, sortMode])

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

    // Grouping
    let lastGroup = ''
    const uniquePersonIds = [...new Set(weekTasks.map(t => getAssigneeId(t.assignee_id)).filter(Boolean))]
    const uniqueProjects  = [...new Set(weekTasks.map(t => t.project_id).filter(Boolean))]

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                    <div className="font-semibold text-slate-800 text-sm">
                        Tuần {wn} — {fmtShort(mon)} đến {fmtShort(sun)}/{sun.getFullYear()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{weekDayRow}</div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setWeekOffset(o => o - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                        <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setWeekOffset(0)}
                        className="px-3 h-7 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors whitespace-nowrap">
                        Tuần này
                    </button>
                    <button onClick={() => setWeekOffset(o => o + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
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
                    {([['time', 'Ngày'], ['project', 'Dự án'], ['person', 'Nhân sự']] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setSortMode(key)}
                            className={`px-3 h-7 text-xs font-medium rounded-lg border transition-colors ${
                                sortMode === key
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Alert Zone ── */}
            {alerts.length > 0 && (
                <div className="border-b border-red-100">
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50">
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        <span className="text-xs font-semibold text-red-700">Cần xử lý ngay ({alerts.length})</span>
                    </div>
                    {alerts.map(t => {
                        const d = new Date(t.due_date!)
                        const isLate = d < TODAY
                        const dStr = isLate
                            ? `Trễ ${Math.abs(diffDays(TODAY, d))} ngày`
                            : 'Hôm nay hết hạn'
                        const assigneeName = getAssigneeName(t.assignee_id)
                        const pct = t.completion_pct || 0
                        return (
                            <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-red-50 last:border-0">
                                <Avatar name={assigneeName} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-800 truncate">{t.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                            {getProjectCode(t.project_id)}
                                        </span>
                                        <span className="text-[11px] text-red-600 font-medium">{dStr}</span>
                                        <span className="text-[11px] text-slate-400">{assigneeName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => updateProgress(t.id, -10)}
                                        className="w-6 h-6 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">−</button>
                                    <span className="text-xs font-semibold w-8 text-center">{pct}%</span>
                                    <button onClick={() => updateProgress(t.id, 10)}
                                        className="w-6 h-6 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">+</button>
                                    {saving[t.id] && <span className="text-[10px] text-slate-400 ml-1">Lưu...</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Table Header ── */}
            <div className="hidden md:grid grid-cols-[1fr_64px_100px_120px_110px] gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100">
                {['Nhiệm vụ', 'Hạn chót', 'Tiến độ', 'Phụ trách', 'Trạng thái'].map(h => (
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
                <div>
                    {sorted.map(t => {
                        const d = new Date(t.due_date!)
                        const isLate = d < TODAY && t.status !== 'Hoàn thành'
                        const isDone = t.status === 'Hoàn thành'
                        const pct = t.completion_pct || 0

                        let groupKey = ''
                        if (sortMode === 'time') {
                            groupKey = `${DAY_FULL[d.getDay()]} ${fmtShort(d)}`
                        } else if (sortMode === 'project') {
                            groupKey = `${getProjectCode(t.project_id)} – ${getProjectName(t.project_id)}`
                        } else {
                            groupKey = getAssigneeName(t.assignee_id)
                        }

                        const showGroup = groupKey !== lastGroup
                        lastGroup = groupKey

                        const assigneeName = getAssigneeName(t.assignee_id)
                        const badge = getStatusBadge(t.status)

                        return (
                            <div key={t.id}>
                                {showGroup && (
                                    <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100">
                                        {sortMode === 'project' && (
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                {getProjectCode(t.project_id)}
                                            </span>
                                        )}
                                        {sortMode === 'person' && <Avatar name={assigneeName} />}
                                        <span className="text-xs font-semibold text-slate-600">{groupKey}</span>
                                    </div>
                                )}

                                {/* Mobile row */}
                                <div className="md:hidden flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                                    <Avatar name={assigneeName} />
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800'} truncate`}>{t.name}</div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{getProjectCode(t.project_id)}</span>
                                            <span className={`text-[11px] font-medium ${isLate ? 'text-red-600' : 'text-slate-500'}`}>{fmtShort(d)}</span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <button onClick={() => updateProgress(t.id, -10)}
                                                className="w-6 h-6 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">−</button>
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${getPctColor(pct)}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[11px] text-slate-500 w-7 text-right">{pct}%</span>
                                            <button onClick={() => updateProgress(t.id, 10)}
                                                className="w-6 h-6 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600">+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop row */}
                                <div className="hidden md:grid grid-cols-[1fr_64px_100px_120px_110px] gap-2 px-5 py-3 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50/50 transition-colors">
                                    <div className="min-w-0">
                                        <div className={`text-sm font-medium truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                            {t.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{t.task_code}</div>
                                    </div>

                                    <span className={`text-xs font-semibold ${isLate ? 'text-red-600' : 'text-slate-600'}`}>
                                        {fmtShort(d)}
                                    </span>

                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <button onClick={() => updateProgress(t.id, -10)}
                                                className="w-5 h-5 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 leading-none">−</button>
                                            <span className="text-[11px] font-semibold text-slate-700 w-7 text-center">
                                                {saving[t.id] ? '...' : `${pct}%`}
                                            </span>
                                            <button onClick={() => updateProgress(t.id, 10)}
                                                className="w-5 h-5 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 leading-none">+</button>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${getPctColor(pct)}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Avatar name={assigneeName} />
                                        <span className="text-xs text-slate-600 truncate">{assigneeName}</span>
                                    </div>

                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} whitespace-nowrap text-center`}>
                                        {badge.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
