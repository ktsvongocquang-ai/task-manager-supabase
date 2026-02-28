import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { format, parseISO } from 'date-fns'

export const History = () => {
    const [logs, setLogs] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [actionFilter, setActionFilter] = useState('Tất cả')
    const [userFilter, setUserFilter] = useState('Tất cả')
    const [searchKeyword, setSearchKeyword] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [logsResponse, profilesResponse, projectsResponse] = await Promise.all([
                supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('*'),
                supabase.from('projects').select('*')
            ])

            if (logsResponse.error) throw logsResponse.error
            if (profilesResponse.error) throw profilesResponse.error
            if (projectsResponse.error) throw projectsResponse.error

            setLogs(logsResponse.data || [])
            setProfiles(profilesResponse.data || [])
            setProjects(projectsResponse.data || [])
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getProfileName = (userId: string | null) => {
        if (!userId) return 'Hệ thống'
        const profile = profiles.find(p => p.id === userId)
        return profile?.full_name || 'Người dùng ẩn'
    }

    const getActionColor = (action: string) => {
        const a = action.toLowerCase()
        if (a.includes('thêm') || a.includes('tạo')) return 'text-emerald-400'
        if (a.includes('sửa') || a.includes('cập nhật')) return 'text-amber-400'
        if (a.includes('xóa')) return 'text-rose-400'
        return 'text-blue-400'
    }

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return '-'
        const project = projects.find(p => p.id === projectId)
        return project?.name || '-'
    }

    // Apply filters
    const filteredLogs = logs.filter(log => {
        const logDate = log.created_at ? format(parseISO(log.created_at), 'yyyy-MM-dd') : ''
        const matchDate = dateFilter ? logDate === dateFilter : true

        const matchAction = actionFilter !== 'Tất cả' ? log.action.includes(actionFilter) : true

        const matchUser = userFilter !== 'Tất cả' ? log.user_id === userFilter : true

        const searchLower = searchKeyword.toLowerCase()
        const matchSearch = searchKeyword
            ? (log.action.toLowerCase().includes(searchLower) || (log.details || '').toLowerCase().includes(searchLower) || getProjectName(log.project_id).toLowerCase().includes(searchLower))
            : true

        return matchDate && matchAction && matchUser && matchSearch
    })

    const uniqueActions = ['Tất cả', ...Array.from(new Set(logs.map(l => l.action.split(' ')[0])))]

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-inter">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Lịch Sử Hoạt Động</h1>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lọc theo ngày</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder-slate-400 appearance-none font-medium shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Action Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none font-medium shadow-sm"
                        >
                            {uniqueActions.map((action, idx) => (
                                <option key={idx} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    {/* User Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Người thực hiện</label>
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none font-medium shadow-sm"
                        >
                            <option value="Tất cả">Tất cả</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tìm kiếm</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nhập từ khóa..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder-slate-400 font-medium shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 w-48 uppercase tracking-wider">Ngày giờ</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 w-32 uppercase tracking-wider">Thao tác</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 w-48 uppercase tracking-wider">Người thực hiện</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Dự án</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nội dung thực hiện</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 text-sm font-medium">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 text-sm font-medium">Không tìm thấy lịch sử hoạt động phù hợp.</td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-3.5 px-6 text-sm text-slate-500 font-medium whitespace-nowrap">
                                                {log.created_at ? format(parseISO(log.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                                            </td>
                                            <td className={`py-3.5 px-6 text-sm font-bold capitalize whitespace-nowrap ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </td>
                                            <td className="py-3.5 px-6 text-sm font-semibold text-slate-700 whitespace-nowrap">
                                                {getProfileName(log.user_id)}
                                            </td>
                                            <td className="py-3.5 px-6 text-sm font-semibold text-indigo-600 max-w-[200px] truncate" title={getProjectName(log.project_id)}>
                                                {getProjectName(log.project_id)}
                                            </td>
                                            <td className="py-3.5 px-6 text-sm text-slate-600 max-w-lg truncate group-hover:whitespace-normal transition-all" title={log.details || ''}>
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
