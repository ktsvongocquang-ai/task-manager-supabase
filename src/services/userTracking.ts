import { supabase } from './supabase'

/**
 * Ghi nhận phiên đăng nhập của user vào activity_logs
 * Được gọi 1 lần khi user truy cập app (trong AuthGuard)
 */
export const trackUserLogin = async (userId: string) => {
    try {
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('action', 'LOGIN')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .limit(1)

        if (existing && existing.length > 0) {
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action: 'APP_ACTIVE',
                details: `Người dùng đang online lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            })
            return
        }

        await supabase.from('activity_logs').insert({
            user_id: userId,
            action: 'LOGIN',
            details: `Đăng nhập vào hệ thống lúc ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}`,
        })
    } catch (err) {
        console.error('[Tracking] Login track error:', err)
    }
}

/**
 * Ghi nhận user chuyển trang (pageview tracking)
 */
export const trackPageView = async (userId: string, pagePath: string) => {
    try {
        const pageNames: Record<string, string> = {
            '/kanban': 'Kanban Board',
            '/tasks': 'Danh sách Tasks',
            '/schedule': 'Lịch trình',
            '/gantt': 'Sơ đồ Gantt',
            '/projects': 'Quản lý Dự án',
            '/dashboard': 'Dashboard',
            '/construction': 'Quản lý Thi công',
            '/customers': 'CRM',
            '/marketing': 'Marketing',
            '/mytasks': 'Việc cá nhân',
            '/users': 'Quản lý Users',
            '/history': 'Lịch sử',
            '/profile': 'Hồ sơ cá nhân',
        }
        const pageName = pageNames[pagePath] || pagePath

        await supabase.from('activity_logs').insert({
            user_id: userId,
            action: 'PAGE_VIEW',
            details: `Xem trang: ${pageName}`,
        })
    } catch (err) {
        console.error('[Tracking] Page view track error:', err)
    }
}

// ── BÁO CÁO CHI TIẾT TỪNG NHÂN SỰ ──────────────────────────────────

interface EmployeeDailyReport {
    name: string
    role: string
    position: string
    // Login info
    hasLoggedIn: boolean
    loginTime: string | null
    lastActiveTime: string | null
    // Task activity
    tasksCreated: number
    tasksUpdated: number
    taskDetails: string[]
    // App usage
    totalActions: number
    pagesVisited: string[]
    allActivities: string[]
}

/**
 * BÁO CÁO CHI TIẾT NHÂN SỰ - trả lời câu hỏi:
 * "Ai đã vào app?", "Nhân sự nào nhập task?", "Ai chưa làm gì?"
 * Hỗ trợ: hôm nay, hôm qua, hoặc ngày cụ thể bất kỳ
 */
export const getDetailedEmployeeReport = async (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const dateLabel = formatDateLabel(targetDate)

    // 1. Get all profiles (nhân sự)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, position')

    // 2. Get ALL activity logs for the target date
    const { data: allLogs } = await supabase
        .from('activity_logs')
        .select('user_id, action, details, created_at')
        .gte('created_at', `${targetDate}T00:00:00`)
        .lte('created_at', `${targetDate}T23:59:59`)
        .order('created_at', { ascending: true })

    // 3. Get tasks created on target date
    const { data: tasksCreatedToday } = await supabase
        .from('tasks')
        .select('id, name, assignee_id, created_at')
        .gte('created_at', `${targetDate}T00:00:00`)
        .lte('created_at', `${targetDate}T23:59:59`)

    // 4. Build per-employee report
    const reportMap = new Map<string, EmployeeDailyReport>()

    for (const p of (profiles || [])) {
        reportMap.set(p.id, {
            name: p.full_name,
            role: p.role,
            position: p.position || '',
            hasLoggedIn: false,
            loginTime: null,
            lastActiveTime: null,
            tasksCreated: 0,
            tasksUpdated: 0,
            taskDetails: [],
            totalActions: 0,
            pagesVisited: [],
            allActivities: [],
        })
    }

    // Process activity logs
    for (const log of (allLogs || [])) {
        if (!log.user_id || !reportMap.has(log.user_id)) continue
        const r = reportMap.get(log.user_id)!
        r.totalActions++

        const time = new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

        // Track login
        if (log.action === 'LOGIN') {
            r.hasLoggedIn = true
            if (!r.loginTime) r.loginTime = time
        }

        // Track app heartbeat
        if (log.action === 'APP_ACTIVE') {
            r.hasLoggedIn = true
            if (!r.loginTime) r.loginTime = time
        }

        // Track page views
        if (log.action === 'PAGE_VIEW' && log.details) {
            const page = log.details.replace('Xem trang: ', '')
            if (!r.pagesVisited.includes(page)) r.pagesVisited.push(page)
        }

        // Track task-related actions
        const taskActions = ['Thêm nhiệm vụ', 'Sửa nhiệm vụ', 'Xóa nhiệm vụ', 'Tạo task',
            'Cập nhật task', 'Thêm dự án', 'Sửa dự án', 'Thêm công trình']
        const actionLower = (log.action || '').toLowerCase()
        const isTaskAction = taskActions.some(a => actionLower.includes(a.toLowerCase())) ||
            actionLower.includes('task') ||
            actionLower.includes('nhiệm vụ') ||
            actionLower.includes('dự án')

        if (isTaskAction) {
            if (actionLower.includes('thêm') || actionLower.includes('tạo')) {
                r.tasksCreated++
            } else {
                r.tasksUpdated++
            }
            r.taskDetails.push(`${time}: ${log.action}${log.details ? ' - ' + log.details : ''}`)
        }

        // Any activity = logged in
        if (!r.hasLoggedIn) {
            r.hasLoggedIn = true
            if (!r.loginTime) r.loginTime = time
        }

        // Track all non-trivial activities for detailed view
        if (!['PAGE_VIEW', 'APP_ACTIVE'].includes(log.action)) {
            r.allActivities.push(`${time}: ${log.action}${log.details ? ' (' + truncate(log.details, 60) + ')' : ''}`)
        }

        r.lastActiveTime = time
    }

    // Process tasks created today — attribute to assignee
    for (const task of (tasksCreatedToday || [])) {
        const assigneeIds = Array.isArray(task.assignee_id) ? task.assignee_id : [task.assignee_id]
        for (const aid of assigneeIds) {
            if (aid && reportMap.has(aid)) {
                const r = reportMap.get(aid)!
                // Count only if not already counted via activity_logs
                const alreadyCounted = r.taskDetails.some(d => d.includes(task.name))
                if (!alreadyCounted) {
                    r.tasksCreated++
                    r.taskDetails.push(`Task được giao: "${truncate(task.name, 50)}"`)
                }
            }
        }
    }

    const allEmployees = Array.from(reportMap.values())
    const activeEmployees = allEmployees.filter(e => e.hasLoggedIn)
    const inactiveEmployees = allEmployees.filter(e => !e.hasLoggedIn)
    // Employees who logged in but did ZERO task-related work
    const loggedInButNoTasks = activeEmployees.filter(e => e.tasksCreated === 0 && e.tasksUpdated === 0 && e.taskDetails.length === 0)

    return {
        date: targetDate,
        dateLabel,
        summary: {
            totalEmployees: allEmployees.length,
            loggedIn: activeEmployees.length,
            notLoggedIn: inactiveEmployees.length,
            didTaskWork: activeEmployees.filter(e => e.tasksCreated > 0 || e.tasksUpdated > 0).length,
            loggedInButIdle: loggedInButNoTasks.length,
        },
        activeEmployees: activeEmployees.map(e => ({
            name: e.name,
            role: e.role,
            loginTime: e.loginTime || '—',
            lastActive: e.lastActiveTime || '—',
            tasksCreated: e.tasksCreated,
            tasksUpdated: e.tasksUpdated,
            taskDetails: e.taskDetails,
            pagesUsed: e.pagesVisited,
            totalActions: e.totalActions,
            recentActivities: e.allActivities.slice(-5),
        })),
        inactiveEmployees: inactiveEmployees.map(e => ({
            name: e.name,
            role: e.role,
        })),
        loggedInButNoTasks: loggedInButNoTasks.map(e => ({
            name: e.name,
            role: e.role,
            loginTime: e.loginTime,
            pagesUsed: e.pagesVisited,
        })),
    }
}

/**
 * Parse ngày từ câu hỏi tiếng Việt
 * "hôm nay" → today, "hôm qua" → yesterday, "01/04" → specific date
 */
export const parseDateFromQuestion = (question: string): string | undefined => {
    const q = question.toLowerCase()
    const today = new Date()

    if (q.includes('hôm qua') || q.includes('yesterday')) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().split('T')[0]
    }

    if (q.includes('hôm kia') || q.includes('2 ngày trước')) {
        const dayBefore = new Date(today)
        dayBefore.setDate(dayBefore.getDate() - 2)
        return dayBefore.toISOString().split('T')[0]
    }

    if (q.includes('tuần trước') || q.includes('last week')) {
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        return lastWeek.toISOString().split('T')[0]
    }

    // Try to parse dd/mm or dd/mm/yyyy
    const dateMatch = q.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
    if (dateMatch) {
        const day = parseInt(dateMatch[1])
        const month = parseInt(dateMatch[2]) - 1
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear()
        const parsed = new Date(year, month, day)
        return parsed.toISOString().split('T')[0]
    }

    // Default: today (return undefined to use default)
    return undefined
}

// ── Helpers ──

const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + '...' : str

const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const targetDay = new Date(dateStr + 'T00:00:00')
    targetDay.setHours(0, 0, 0, 0)

    if (targetDay.getTime() === today.getTime()) return 'Hôm nay'
    if (targetDay.getTime() === yesterday.getTime()) return 'Hôm qua'

    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Legacy export for backward compatibility ──
export const getUserLoginHistory = getDetailedEmployeeReport
