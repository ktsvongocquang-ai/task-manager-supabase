import { supabase } from './supabase'
import { getDetailedEmployeeReport, parseDateFromQuestion } from './userTracking'

// ── Data Fetching Functions (Tools for AI) ──────────────────────────────

/**
 * Lấy tất cả tasks hôm nay hoặc theo ngày cụ thể, có thể lọc theo team/role
 */
export const fetchTeamTasks = async (options?: {
    date?: string // YYYY-MM-DD
    role?: string // 'Thiết kế' | 'Thi công' | 'CSKH' | 'Marketing' | 'Sale'
}) => {
    const targetDate = options?.date || new Date().toISOString().split('T')[0]

    // Get profiles to map assignee_id to names and roles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, position')

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Build tasks query
    let query = supabase
        .from('tasks')
        .select('id, name, status, priority, assignee_id, due_date, start_date, completion_pct, project_id')
        .or(`due_date.eq.${targetDate},start_date.lte.${targetDate}`)
        .not('status', 'eq', 'Hủy bỏ')
        .order('priority', { ascending: false })
        .limit(100)

    const { data: tasks, error } = await query
    if (error) throw error

    // Map roles to teams
    const roleTeamMap: Record<string, string> = {
        'Quản lý thiết kế': 'Thiết kế',
        'Admin': 'Admin',
        'Quản lý thi công': 'Thi công',
        'Giám Sát': 'Thi công',
        'Sale': 'CSKH',
        'Marketing': 'Marketing',
        'Nhân viên': 'Thiết kế',
    }

    // Enrich tasks with assignee info
    const enrichedTasks = (tasks || []).map(task => {
        const assigneeId = Array.isArray(task.assignee_id) ? task.assignee_id[0] : task.assignee_id
        const assignee = assigneeId ? profileMap.get(assigneeId) : null
        const team = assignee?.role ? roleTeamMap[assignee.role] || 'Khác' : 'Chưa gán'
        return {
            ...task,
            assignee_name: assignee?.full_name || 'Chưa gán',
            assignee_role: assignee?.role || 'Không rõ',
            team,
        }
    })

    // Filter by team if specified
    if (options?.role) {
        const teamFilter = options.role.toLowerCase()
        return enrichedTasks.filter(t => t.team.toLowerCase().includes(teamFilter))
    }

    return enrichedTasks
}

/**
 * Lấy thống kê tổng quan tasks
 */
export const fetchTaskStats = async (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status, priority, due_date, completion_pct')

    const tasks = allTasks || []
    const today = new Date(targetDate)

    const overdue = tasks.filter(t =>
        t.due_date && new Date(t.due_date) < today &&
        t.status !== 'Hoàn thành' && t.status !== 'Hủy bỏ'
    )

    const dueToday = tasks.filter(t => t.due_date === targetDate)
    const inProgress = tasks.filter(t => t.status === 'Đang thực hiện')
    const completed = tasks.filter(t => t.status === 'Hoàn thành')
    const notStarted = tasks.filter(t => t.status === 'Chưa bắt đầu')
    const urgent = tasks.filter(t => t.priority === 'Khẩn cấp' && t.status !== 'Hoàn thành')

    return {
        total: tasks.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        inProgress: inProgress.length,
        completed: completed.length,
        notStarted: notStarted.length,
        urgent: urgent.length,
        completionRate: tasks.length > 0
            ? Math.round((completed.length / tasks.length) * 100)
            : 0,
        overdueDetails: overdue.slice(0, 10).map(t => ({
            name: t.id,
            due_date: t.due_date,
            status: t.status,
        })),
    }
}

/**
 * Lấy hoạt động gần đây (activity logs)
 */
export const fetchRecentActivity = async (limit = 20) => {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return (logs || []).map(log => ({
        ...log,
        user_name: log.user_id ? profileMap.get(log.user_id)?.full_name || 'Không rõ' : 'Hệ thống',
        user_role: log.user_id ? profileMap.get(log.user_id)?.role || '' : '',
    }))
}

/**
 * Lấy danh sách nhân viên và trạng thái online (dựa vào activity gần đây)
 */
export const fetchUserStats = async () => {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, position')

    // Check who has been active in the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: recentLogs } = await supabase
        .from('activity_logs')
        .select('user_id')
        .gte('created_at', yesterday.toISOString())

    const activeUserIds = new Set(recentLogs?.map(l => l.user_id) || [])

    const users = (profiles || []).map(p => ({
        name: p.full_name,
        role: p.role,
        position: p.position,
        isActive: activeUserIds.has(p.id),
    }))

    return {
        totalUsers: users.length,
        activeToday: users.filter(u => u.isActive).length,
        byRole: users.reduce((acc, u) => {
            const role = u.role || 'Khác'
            if (!acc[role]) acc[role] = { total: 0, active: 0 }
            acc[role].total++
            if (u.isActive) acc[role].active++
            return acc
        }, {} as Record<string, { total: number; active: number }>),
        details: users,
    }
}

/**
 * Lấy thông tin dự án
 */
export const fetchProjectStats = async () => {
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, start_date, end_date, project_type')

    const list = projects || []
    return {
        total: list.length,
        byStatus: list.reduce((acc, p) => {
            const st = p.status || 'Khác'
            acc[st] = (acc[st] || 0) + 1
            return acc
        }, {} as Record<string, number>),
        activeProjects: list
            .filter(p => p.status === 'Đang thực hiện')
            .map(p => ({ name: p.name, start_date: p.start_date, end_date: p.end_date })),
    }
}

// ── Chatbot AI Logic (Gemini Integration) ───────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

/**
 * Core function: Xử lý câu hỏi của admin → tự động truy vấn data → trả lời bằng ngôn ngữ tự nhiên
 */
export const processAdminQuestion = async (
    question: string,
    conversationHistory: ChatMessage[]
): Promise<string> => {
    try {
        // Step 1: Phân tích intent → Lấy data phù hợp
        const contextData = await gatherContextForQuestion(question)

        // Step 2: Gọi Gemini với context data
        const answer = await callGeminiWithContext(question, contextData, conversationHistory)
        return answer
    } catch (error: any) {
        console.error('Admin Chatbot Error:', error)
        return `⚠️ Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi: ${error.message}. Vui lòng thử lại.`
    }
}

/**
 * Phân tích câu hỏi + tự động thu thập data cần thiết
 */
const gatherContextForQuestion = async (question: string): Promise<string> => {
    const q = question.toLowerCase()
    const dataParts: string[] = []

    // Detect intent and fetch relevant data
    const fetchPromises: Promise<void>[] = []

    // Team-specific queries
    if (q.includes('thiết kế') || q.includes('design')) {
        fetchPromises.push(
            fetchTeamTasks({ role: 'Thiết kế' }).then(data =>
                void dataParts.push(`📐 TEAM THIẾT KẾ (${data.length} tasks):\n${JSON.stringify(data.slice(0, 15), null, 1)}`)
            )
        )
    }
    if (q.includes('thi công') || q.includes('công trình') || q.includes('xây')) {
        fetchPromises.push(
            fetchTeamTasks({ role: 'Thi công' }).then(data =>
                void dataParts.push(`🏗️ TEAM THI CÔNG (${data.length} tasks):\n${JSON.stringify(data.slice(0, 15), null, 1)}`)
            )
        )
    }
    if (q.includes('chăm sóc') || q.includes('cskh') || q.includes('khách hàng') || q.includes('sale')) {
        fetchPromises.push(
            fetchTeamTasks({ role: 'CSKH' }).then(data =>
                void dataParts.push(`🤝 TEAM CSKH/SALE (${data.length} tasks):\n${JSON.stringify(data.slice(0, 15), null, 1)}`)
            )
        )
    }
    if (q.includes('marketing') || q.includes('quảng cáo') || q.includes('ads')) {
        fetchPromises.push(
            fetchTeamTasks({ role: 'Marketing' }).then(data =>
                void dataParts.push(`📣 TEAM MARKETING (${data.length} tasks):\n${JSON.stringify(data.slice(0, 15), null, 1)}`)
            )
        )
    }

    // General / overview queries
    if (q.includes('tổng') || q.includes('hôm nay') || q.includes('báo cáo') || q.includes('thế nào') ||
        q.includes('overview') || q.includes('tất cả') || q.includes('chung') || q.includes('toàn bộ')) {
        fetchPromises.push(
            fetchTaskStats().then(data =>
                void dataParts.push(`📊 THỐNG KÊ TASK TỔNG QUAN:\n${JSON.stringify(data, null, 1)}`)
            )
        )
        // Also fetch all teams if asking general overview
        fetchPromises.push(
            fetchTeamTasks().then(data => {
                const byTeam = data.reduce((acc, t) => {
                    if (!acc[t.team]) acc[t.team] = []
                    acc[t.team].push(t)
                    return acc
                }, {} as Record<string, any[]>)
                void dataParts.push(`📋 TASKS THEO TEAM:\n${Object.entries(byTeam).map(([team, tasks]) =>
                    `  ${team}: ${tasks.length} tasks (${tasks.filter((t: any) => t.status === 'Hoàn thành').length} hoàn thành, ${tasks.filter((t: any) => t.status === 'Đang thực hiện').length} đang làm)`
                ).join('\n')}`)
            })
        )
    }

    // Activity / usage / login queries
    if (q.includes('hoạt động') || q.includes('activity') || q.includes('hiệu suất') ||
        q.includes('sử dụng') || q.includes('dùng app') || q.includes('online') || q.includes('ai đang') ||
        q.includes('đăng nhập') || q.includes('login') || q.includes('vô app') || q.includes('vào app') ||
        q.includes('nhân sự') || q.includes('có ai') || q.includes('hôm qua') || q.includes('nhập task') ||
        q.includes('kiểm tra') || q.includes('chưa vào') || q.includes('chưa làm')) {
        // Parse date from question (hôm nay, hôm qua, dd/mm, etc.)
        const queryDate = parseDateFromQuestion(question)

        fetchPromises.push(
            getDetailedEmployeeReport(queryDate).then(data => {
                const s = data.summary
                let report = `🔐 BÁO CÁO NHÂN SỰ CHI TIẾT — ${data.dateLabel} (${data.date}):\n`
                report += `📌 Tổng nhân sự: ${s.totalEmployees}\n`
                report += `✅ Đã vào app: ${s.loggedIn} người\n`
                report += `❌ Chưa vào app: ${s.notLoggedIn} người\n`
                report += `📝 Có nhập/sửa task: ${s.didTaskWork} người\n`
                report += `⚠️ Vào app nhưng KHÔNG nhập task: ${s.loggedInButIdle} người\n\n`

                // Active employees detail
                if (data.activeEmployees.length > 0) {
                    report += `── ✅ NHÂN SỰ ĐÃ VÀO APP ──\n`
                    for (const e of data.activeEmployees) {
                        report += `\n👤 ${e.name} (${e.role})\n`
                        report += `   ⏰ Đăng nhập: ${e.loginTime} | Hoạt động cuối: ${e.lastActive}\n`
                        report += `   📝 Task: Tạo ${e.tasksCreated}, Sửa ${e.tasksUpdated}\n`
                        if (e.taskDetails.length > 0) {
                            report += `   📋 Chi tiết: ${e.taskDetails.slice(0, 5).join('; ')}\n`
                        }
                        report += `   📱 Trang đã dùng: ${e.pagesUsed.join(', ') || 'Không rõ'}\n`
                        report += `   🔢 Tổng thao tác: ${e.totalActions}\n`
                    }
                }

                // Inactive employees
                if (data.inactiveEmployees.length > 0) {
                    report += `\n── ❌ NHÂN SỰ CHƯA VÀO APP ──\n`
                    for (const e of data.inactiveEmployees) {
                        report += `   • ${e.name} (${e.role})\n`
                    }
                }

                // Logged in but no task work
                if (data.loggedInButNoTasks.length > 0) {
                    report += `\n── ⚠️ VÀO APP NHƯNG KHÔNG NHẬP TASK ──\n`
                    for (const e of data.loggedInButNoTasks) {
                        report += `   • ${e.name} (${e.role}) — Đăng nhập lúc: ${e.loginTime}, Chỉ xem: ${e.pagesUsed.join(', ') || 'Không rõ'}\n`
                    }
                }

                void dataParts.push(report)
            })
        )
        fetchPromises.push(
            fetchRecentActivity(15).then(data =>
                void dataParts.push(`📝 HOẠT ĐỘNG GẦN ĐÂY:\n${JSON.stringify(data.map(a => ({
                    action: a.action, user: a.user_name, role: a.user_role, time: a.created_at, details: a.details
                })), null, 1)}`)
            )
        )
    }

    // Overdue / urgent queries
    if (q.includes('quá hạn') || q.includes('trễ') || q.includes('chậm') || q.includes('overdue') || q.includes('khẩn cấp')) {
        fetchPromises.push(
            fetchTaskStats().then(data =>
                void dataParts.push(`🚨 TASKS QUÁ HẠN & KHẨN CẤP:\nQuá hạn: ${data.overdue}\nKhẩn cấp: ${data.urgent}\nChi tiết: ${JSON.stringify(data.overdueDetails, null, 1)}`)
            )
        )
    }

    // Project queries
    if (q.includes('dự án') || q.includes('project') || q.includes('công trình')) {
        fetchPromises.push(
            fetchProjectStats().then(data =>
                void dataParts.push(`🏢 DỮ LIỆU DỰ ÁN:\n${JSON.stringify(data, null, 1)}`)
            )
        )
    }

    // If no specific intent detected, fetch general overview
    if (fetchPromises.length === 0) {
        fetchPromises.push(
            fetchTaskStats().then(data =>
                void dataParts.push(`📊 THỐNG KÊ CHUNG:\n${JSON.stringify(data, null, 1)}`)
            )
        )
        fetchPromises.push(
            fetchUserStats().then(data =>
                void dataParts.push(`👥 NHÂN VIÊN:\nTổng: ${data.totalUsers}, Online hôm nay: ${data.activeToday}`)
            )
        )
    }

    await Promise.all(fetchPromises)
    return dataParts.join('\n\n---\n\n')
}

/**
 * Gọi Gemini API để sinh câu trả lời tự nhiên
 */
const callGeminiWithContext = async (
    question: string,
    contextData: string,
    history: ChatMessage[]
): Promise<string> => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
    if (!API_KEY) {
        return generateFallbackResponse(question, contextData)
    }

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const systemPrompt = `Bạn là "DQH Assistant" - Trợ lý AI quản trị thông minh của công ty DQH Architects. 
Hôm nay là ${today}.

QUY TẮC:
1. Trả lời NGẮN GỌN, RÕ RÀNG, CHUYÊN NGHIỆP bằng tiếng Việt
2. Dùng emoji phù hợp để dễ đọc
3. Khi liệt kê tasks, dùng bullet points ngắn gọn
4. Nếu có data cụ thể, PHẢI trích dẫn số liệu chính xác từ data
5. Nếu data trống hoặc không có, nói thẳng "Hiện chưa có dữ liệu" thay vì bịa
6. Khi báo cáo tổng quan, chia theo team rõ ràng
7. Đề xuất hành động cụ thể nếu phát hiện vấn đề (task quá hạn, team chậm tiến độ...)
8. KHÔNG giải thích dài dòng về AI hay hệ thống, chỉ tập trung trả lời câu hỏi`

    const recentHistory = history.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }))

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
            ...recentHistory,
            {
                role: 'user',
                parts: [{ text: `DỮ LIỆU HỆ THỐNG TỪ DATABASE (Real-time):\n${contextData}\n\n---\nCÂU HỎI CỦA ADMIN: ${question}` }]
            }
        ],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
        }
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
    )

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errData)}`)
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini trả về kết quả rỗng')

    return text
}

/**
 * Fallback khi không có Gemini API Key - trả về data thô nhưng format đẹp
 */
const generateFallbackResponse = (_question: string, contextData: string): string => {
    return `📊 **Báo cáo nhanh** (${new Date().toLocaleDateString('vi-VN')})

${contextData}

---
_⚠️ Chưa cấu hình Gemini API Key. Hiển thị dữ liệu thô từ hệ thống._
_Thêm \`VITE_GEMINI_API_KEY\` vào file .env để có AI tóm tắt thông minh._`
}

// ── Quick Action Suggestions ────────────────────────────────────────────

export const QUICK_QUESTIONS = [
    { icon: '📊', text: 'Báo cáo tổng quan hôm nay' },
    { icon: '🔐', text: 'Hôm nay ai đã vào app?' },
    { icon: '📐', text: 'Team thiết kế hôm nay thế nào?' },
    { icon: '🏗️', text: 'Tiến độ thi công ra sao?' },
    { icon: '🤝', text: 'Team CSKH có task gì?' },
    { icon: '📣', text: 'Marketing đang làm gì?' },
    { icon: '🚨', text: 'Có task nào quá hạn không?' },
    { icon: '👥', text: 'Nhân sự nào chưa vào app?' },
    { icon: '🏢', text: 'Tình hình các dự án?' },
]
