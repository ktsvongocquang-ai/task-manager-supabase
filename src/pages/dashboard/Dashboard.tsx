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
const COLORS_PRIORITY = ['#ef4444', '#f59e0b', '#3b82f6', '#94a3b8']

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
            setTaskPriorityData(['Khẩn cấp', 'Cao', 'Trung bình', 'Thấp'].map(p => ({
                name: p,
                value: priorityMap[p] || 0
            })))

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
        if (p === 'Khẩn cấp') return 'bg-red-500 text-white shadow-sm'
        if (p === 'Cao') return 'bg-orange-500 text-white shadow-sm'
        if (p === 'Trung bình') return 'bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm'
        return 'bg-slate-100 text-slate-600 border border-slate-200'
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Pro Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Projects */}
                <div className="modern-stat-card group">
                    <div className="card-gradient bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"></div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <FolderKanban size={24} />
                            </div>
                            <div className="flex-1">
                                <span className="stat-number">{stats.totalProjects}</span>
                                <span className="stat-label">Tổng dự án</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckSquare size={10} />
                                </div>
                                <span>Hoàn thành: <strong className="text-gray-900">{stats.completedTasks}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Clock size={10} />
                                </div>
                                <span>Tỷ lệ: <strong className="text-gray-900">{stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Tasks */}
                <div className="modern-stat-card group">
                    <div className="card-gradient bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700"></div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-200 focus-within:">
                                <CheckSquare size={24} />
                            </div>
                            <div className="flex-1">
                                <span className="stat-number">{stats.totalTasks}</span>
                                <span className="stat-label">Tổng nhiệm vụ</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckSquare size={10} />
                                </div>
                                <span>Hoàn thành: <strong className="text-gray-900">{stats.completedTasks}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Clock size={10} />
                                </div>
                                <span>Tỷ lệ: <strong className="text-gray-900">{stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0}%</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Tasks */}
                <div className="modern-stat-card group">
                    <div className="card-gradient bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700"></div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                <Clock size={24} />
                            </div>
                            <div className="flex-1">
                                <span className="stat-number">{stats.ongoingTasks}</span>
                                <span className="stat-label">Đang thực hiện</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    <Clock size={10} />
                                </div>
                                <span>Chưa bắt đầu: <strong className="text-gray-900">{stats.notStartedTasks}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Clock size={10} />
                                </div>
                                <span>Tạm dừng: <strong className="text-gray-900">{stats.pausedTasks}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div className="modern-stat-card group">
                    <div className="card-gradient bg-gradient-to-br from-red-500 via-red-600 to-red-700"></div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-200">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1">
                                <span className="stat-number">{stats.overdueTasks}</span>
                                <span className="stat-label">Nhiệm vụ quá hạn</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertTriangle size={10} />
                                </div>
                                <span>Cần xử lý: <strong className="text-gray-900">GẤP</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <AlertTriangle size={10} />
                                </div>
                                <span>Tỷ lệ lỗi: <strong className="text-gray-900 text-rose-600">{stats.totalTasks > 0 ? Math.round(stats.overdueTasks / stats.totalTasks * 100) : 0}%</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Activities & Urgent Tasks Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 glass-card">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hoạt động gần đây</h3>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <div className="p-6 max-h-[440px] overflow-y-auto custom-scrollbar">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs italic">Chưa có hoạt động nào.</div>
                        ) : (
                            <div className="space-y-6">
                                {recentActivities.map((a) => (
                                    <div key={a.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 z-10 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all"></div>
                                            <div className="w-px flex-1 bg-slate-100 group-last:bg-transparent"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-xs font-bold text-slate-800 leading-snug">{a.action}</p>
                                            <div className="mt-1.5 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[11px] text-slate-500 leading-relaxed font-medium">
                                                {a.details}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1.5 font-bold flex items-center gap-1">
                                                <Clock size={10} /> {formatTimeAgo(a.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-3 glass-card">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Nhiệm vụ ưu tiên cao</h3>
                        <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">CẦN XỬ LÝ</span>
                    </div>
                    <div className="p-4 max-h-[440px] overflow-y-auto custom-scrollbar">
                        {urgentTasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs italic">🎉 Không có việc khẩn cấp!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {urgentTasks.map((task: any) => (
                                    <div key={task.id} className="border border-slate-100 rounded-[20px] p-4 hover:shadow-xl transition-all duration-300 bg-white group ring-1 ring-black/5 hover:ring-indigo-100 transform hover:-translate-y-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest">{task.task_code}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-3 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">{task.name}</h4>
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-4 font-bold uppercase">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${getStatusBadge(task.status)}`}>{task.status}</span>
                                            <span className="text-slate-400">HẠN: {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                                                <span>TIẾN ĐỘ</span>
                                                <span className="text-emerald-500">{task.completion_pct || 0}%</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-full h-1.5 ring-1 ring-black/5">
                                                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full shadow-sm" style={{ width: `${task.completion_pct || 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section - 6 Premium Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> Trạng thái nhiệm vụ
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={taskStatusData}
                                cx="50%" cy="50%"
                                innerRadius={65} outerRadius={90}
                                paddingAngle={5} dataKey="value"
                                cornerRadius={6}
                            >
                                {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div> Tiến độ dự án (%)
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={projectProgressData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="Khối lượng" fill="url(#colorBar)" radius={[10, 10, 0, 0]} barSize={24}>
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-amber-500 rounded-full"></div> Mức độ ưu tiên
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={taskPriorityData}
                                cx="50%" cy="50%"
                                innerRadius={65} outerRadius={90}
                                paddingAngle={5} dataKey="value"
                                cornerRadius={6}
                            >
                                {taskPriorityData.map((_, i) => <Cell key={i} fill={COLORS_PRIORITY[i % COLORS_PRIORITY.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div> Hiệu suất nhân viên
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={employeeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Bar dataKey="Tổng số nhiệm vụ" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="Việc hoàn thành (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-purple-500 rounded-full"></div> Xu hướng hoàn thành
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Line type="monotone" dataKey="Hoàn thành" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-3 bg-sky-500 rounded-full"></div> So sánh trạng thái dự án
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={projectCompareData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Bar dataKey="Đang thực hiện" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
