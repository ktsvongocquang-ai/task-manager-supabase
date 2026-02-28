export interface Profile {
    id: string
    staff_id: string
    full_name: string
    email: string
    position: string | null
    role: string | 'Nhân viên' | 'Admin'
    created_at: string
}

export interface Project {
    id: string
    project_code: string
    name: string
    description: string | null
    manager_id: string | null
    start_date: string | null
    end_date: string | null
    status: string | 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Tạm dừng'
    budget: number | null
    created_at: string
}

export interface Task {
    id: string
    task_code: string
    project_id: string
    name: string
    description: string | null
    assignee_id: string | null
    supporter_id?: string | null
    status: string | 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Tạm dừng' | 'Hủy bỏ'
    priority: string | 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp'
    start_date: string | null
    due_date: string | null
    completion_pct: number
    report_date: string | null
    target: string | null
    result_links: string | null
    output: string | null
    notes: string | null
    completion_date: string | null
    created_at: string
}

export interface ChatMessage {
    id: string
    user_id: string
    message: string
    created_at: string
}

export interface ActivityLog {
    id: string
    action: string
    user_id: string | null
    details: string | null
    project_id: string | null
    created_at: string
}

export interface Comment {
    id: string
    task_id: string | null
    project_id: string | null
    user_id: string
    content: string
    mentions: string[] // Array of user IDs
    created_at: string
}

export interface AppNotification {
    id: string
    user_id: string
    actor_id: string | null
    type: string | 'mention' | 'assignment' | 'overdue' | 'due_today' | 'system'
    related_task_id: string | null
    related_project_id: string | null
    content: string
    is_read: boolean
    created_at: string
}
