import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { type Task, type ActivityLog } from '../../types'
import {
    FolderKanban,
    CheckSquare,
    Clock,
    AlertTriangle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts'

const COLORS_STATUS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
const COLORS_PRIORITY = ['#3b82f6', '#f59e0b', '#ef4444']

export const Dashboard = () => {
    const { profile } = useAuthStore()
    const [stats, setStats] = useState({
        totalProjects: 0, totalTasks: 0, completedTasks: 0, ongoingTasks: 0, overdueTasks: 0,
        notStartedTasks: 0, pausedTasks: 0, totalTaskCount: 0
    })
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
    const [urgentTasks, setUrgentTasks] = useState<any[]>([])
    const [taskStatusData, setTaskStatusData] = useState<any[]>([])
    const [projectProgressData, setProjectProgressData] = useState<any[]>([])
    const [taskPriorityData, setTaskPriorityData] = useState<any[]>([])
    const [employeeData, setEmployeeData] = useState<any[]>([])
    const [trendData, setTrendData] = useState<any[]>([])
    const [projectCompareData, setProjectCompareData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchDashboardData() }, [profile])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [{ data: projects }, { data: tasks }, { data: profiles }] = await Promise.all([
                supabase.from('projects').select('*'),
                supabase.from('tasks').select('*'),
                supabase.from('profiles').select('*')
            ])

            const allTasks = (tasks || []) as Task[]
            const allProjects = projects || []
            const today = new Date(); today.setHours(0, 0, 0, 0)

            let completed = 0, ongoing = 0, overdue = 0, notStarted = 0, paused = 0
            const statusMap: Record<string, number> = {}
            const priorityMap: Record<string, number> = {}

            allTasks.forEach((t: Task) => {
                const status = t.status || ''
                statusMap[status] = (statusMap[status] || 0) + 1
                if (t.priority) priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1
                if (status.includes('Hoàn thành')) completed++
                else if (status.includes('Đang')) ongoing++
                else if (status.includes('Tạm dừng')) paused++
                else if (status.includes('Chưa')) notStarted++
                if (!status.includes('Hoàn thành') && t.due_date) {
                    if (new Date(t.due_date) < today) overdue++
                }
            })

            setStats({
                totalProjects: allProjects.length, totalTasks: allTasks.length,
                completedTasks: completed, ongoingTasks: ongoing, overdueTasks: overdue,
                notStartedTasks: notStarted, pausedTasks: paused, totalTaskCount: allTasks.length
            })

            setTaskStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })))
            setTaskPriorityData(Object.entries(priorityMap).map(([name, value]) => ({ name, value })))

            const projProgress = allProjects.map((p: any) => {
                const projTasks = allTasks.filter(t => t.project_id === p.id)
                const total = projTasks.length
                const done = projTasks.filter(t => t.status?.includes('Hoàn thành')).length
                return { name: p.project_code || p.name?.substring(0, 10), 'Khối lượng': total > 0 ? Math.round((done / total) * 100) : 0 }
            }).slice(0, 8)
            setProjectProgressData(projProgress)

            const empMap: Record<string, { total: number, done: number }> = {}
            allTasks.forEach((t: any) => {
                if (!t.assignee_id) return
                if (!empMap[t.assignee_id]) empMap[t.assignee_id] = { total: 0, done: 0 }
                empMap[t.assignee_id].total++
                if (t.status?.includes('Hoàn thành')) empMap[t.assignee_id].done++
            })
            setEmployeeData(Object.entries(empMap).map(([id, data]) => {
                const prof = profiles?.find((p: any) => p.id === id)
                return { name: prof?.full_name?.split(' ').pop() || id.substring(0, 6), 'Tổng số nhiệm vụ': data.total, 'Việc hoàn thành (%)': data.total > 0 ? Math.round((data.done / data.total) * 100) : 0 }
            }).slice(0, 6))

            const monthMap: Record<string, number> = {}
            allTasks.forEach((t: any) => { if (t.status?.includes('Hoàn thành') && t.report_date) { const m = t.report_date.substring(0, 7); monthMap[m] = (monthMap[m] || 0) + 1 } })
            setTrendData(Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, count]) => ({ name: month, 'Hoàn thành': count })))

            setProjectCompareData(allProjects.map((p: any) => {
                const projTasks = allTasks.filter(t => t.project_id === p.id)
                return { name: p.project_code || p.name?.substring(0, 8), 'Đang thực hiện': projTasks.filter(t => t.status?.includes('Đang')).length, 'Hoàn thành': projTasks.filter(t => t.status?.includes('Hoàn thành')).length }
            }).slice(0, 6))

            setUrgentTasks(allTasks.filter(t => {
                if (t.status?.includes('Hoàn thành')) return false
                return t.priority === 'Cao' || t.priority === 'Khẩn cấp' || (t.due_date && new Date(t.due_date) < today)
            }).slice(0, 6))

            const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)
            if (logs) setRecentActivities(logs as ActivityLog[])
        } catch (error) { console.error('Error:', error) } finally { setLoading(false) }
    }

    const formatTimeAgo = (isoString: string) => {
        if (!isoString) return ''
        const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
        if (seconds < 60) return 'Vừa xong'
        const m = Math.floor(seconds / 60); if (m < 60) return `${m} phút trước`
        const h = Math.floor(m / 60); if (h < 24) return `${h} giờ trước`
        return `${Math.floor(h / 24)} ngày trước`
    }

    const getStatusBadge = (s: string) => {
        if (s?.includes('Hoàn thành')) return 'bg-emerald-100 text-emerald-700'
        if (s?.includes('Đang')) return 'bg-blue-100 text-blue-700'
        if (s?.includes('Tạm dừng')) return 'bg-amber-100 text-amber-700'
        return 'bg-slate-100 text-slate-600'
    }

    const getPriorityBadge = (p: string) => {
        if (p === 'Khẩn cấp') return 'bg-red-500 text-white'
        if (p === 'Cao') return 'bg-orange-500 text-white'
        if (p === 'Trung bình') return 'bg-yellow-100 text-yellow-700'
        return 'bg-slate-100 text-slate-600'
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Stats Cards - Matching screenshot exactly */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blue - Total Projects */}
                <div className="bg-blue-500 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-white/20 p-2.5 rounded-xl"><FolderKanban size={22} /></div>
                    </div>
                    <div className="text-3xl font-bold">{stats.totalProjects}</div>
                    <div className="text-sm text-white/80 mt-1 uppercase tracking-wide text-[11px]">Tổng Dự Án</div>
                    <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 flex items-center justify-between">
                        <span>● Hoàn thành: {stats.completedTasks}</span>
                        <span>▲ Tỷ lệ: {stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%</span>
                    </div>
                </div>

                {/* Green - Total Tasks */}
                <div className="bg-emerald-500 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-white/20 p-2.5 rounded-xl"><CheckSquare size={22} /></div>
                    </div>
                    <div className="text-3xl font-bold">{stats.totalTasks}</div>
                    <div className="text-sm text-white/80 mt-1 uppercase tracking-wide text-[11px]">Tổng Nhiệm Vụ</div>
                    <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 flex items-center justify-between">
                        <span>● Hoàn thành: {stats.completedTasks}</span>
                        <span>▲ Tỷ lệ: {stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%</span>
                    </div>
                </div>

                {/* Orange - Ongoing Tasks */}
                <div className="bg-orange-400 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-white/20 p-2.5 rounded-xl"><Clock size={22} /></div>
                    </div>
                    <div className="text-3xl font-bold">{stats.ongoingTasks}</div>
                    <div className="text-sm text-white/80 mt-1 uppercase tracking-wide text-[11px]">Nhiệm Vụ Đang Làm</div>
                    <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 flex items-center justify-between">
                        <span>● Chưa bắt đầu: {stats.notStartedTasks}</span>
                        <span>● Tạm dừng: {stats.pausedTasks}</span>
                    </div>
                </div>

                {/* Red - Overdue */}
                <div className={`${stats.overdueTasks > 0 ? 'bg-red-500' : 'bg-red-500'} text-white rounded-2xl p-5 shadow-lg relative overflow-hidden`}>
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-white/20 p-2.5 rounded-xl"><AlertTriangle size={22} /></div>
                    </div>
                    <div className="text-3xl font-bold">{stats.overdueTasks}</div>
                    <div className="text-sm text-white/80 mt-1 uppercase tracking-wide text-[11px]">Nhiệm Vụ Quá Hạn</div>
                    <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 flex items-center justify-between">
                        <span>● Tổng nhiệm vụ: {stats.totalTasks}</span>
                        <span>▲ Tỷ lệ: {stats.totalTasks > 0 ? Math.round(stats.overdueTasks / stats.totalTasks * 100) : 0}%</span>
                    </div>
                </div>
            </div>

            {/* Row 2: Activity + Urgent Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">Hoạt động gần đây</h3>
                    </div>
                    <div className="p-5 max-h-[420px] overflow-y-auto">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">Chưa có hoạt động nào.</div>
                        ) : (
                            <div className="space-y-5">
                                {recentActivities.map((a) => (
                                    <div key={a.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500 z-10 ring-4 ring-white"></div>
                                            <div className="w-px flex-1 bg-slate-200"></div>
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <p className="text-sm font-semibold text-slate-800">{a.action}</p>
                                            <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">{a.details}</p>
                                            <p className="text-[11px] text-slate-400 mt-1">{formatTimeAgo(a.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Urgent Tasks - Card style like screenshot */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">Nhiệm vụ ưu tiên cao</h3>
                    </div>
                    <div className="p-4 max-h-[420px] overflow-y-auto">
                        {urgentTasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">🎉 Không có việc khẩn cấp!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {urgentTasks.map((task: any) => (
                                    <div key={task.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{task.task_code}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-2">{task.name}</h4>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(task.status)}`}>{task.status}</span>
                                            <span>{task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                        </div>
                                        {/* Progress bar with green fill */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${task.completion_pct || 0}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-semibold text-emerald-600">{task.completion_pct || 0}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Trạng thái nhiệm vụ</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} />)}
                        </Pie><Tooltip /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Phân bổ tiến độ dự án</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={projectProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                            <Bar dataKey="Khối lượng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Phân bổ ưu tiên nhiệm vụ</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={taskPriorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {taskPriorityData.map((_, i) => <Cell key={i} fill={COLORS_PRIORITY[i % COLORS_PRIORITY.length]} />)}
                        </Pie><Tooltip /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Hiệu quả nhân viên</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={employeeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Tổng số nhiệm vụ" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Việc hoàn thành (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Xu hướng hoàn thành</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                            <Line type="monotone" dataKey="Hoàn thành" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">So sánh dự án</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={projectCompareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Đang thực hiện" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
