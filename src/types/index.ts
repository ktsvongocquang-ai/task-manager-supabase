export interface Profile {
    id: string
    staff_id: string
    full_name: string
    email: string
    position: string | null
    role: 'Admin' | 'Quản lý thiết kế' | 'Quản lý thi công' | 'Giám Sát' | 'Sale' | 'Marketing' | 'Khách hàng' | 'Nhân viên'
    construction_project_id?: string | null
    telegram_chat_id?: string | null
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
    actualCost?: number | null
    created_at: string
    department?: string | null
    project_type?: string | null
    update_status?: string | null
    scale?: string | null
    effect_type?: string | null
    effect_description?: string | null
    address?: string | null
    image_folder_link?: string | null
    video_folder_link?: string | null
    can_shoot_video?: string | null
    customer_problem?: string | null
    dqh_solution?: string | null
    other_info?: string | null
    content_link?: string | null
    // --- Construction Timeline Fields ---
    actual_start_date?: string | null
    design_days?: number | null
    rough_construction_days?: number | null
    finishing_days?: number | null
    interior_days?: number | null
    handover_date?: string | null
    supervisor_phone?: string | null
    
    // Virtual relations (if fetched together)
    marketing_shooting_milestones?: ShootingMilestone[]
    marketing_daily_logs?: DailyLog[]
}

export interface ShootingMilestone {
    id: string
    project_id: string
    task_id?: string | null
    milestone_date: string
    content: string
    status?: string | 'Chờ quay' | 'Đã quay' | 'Đã huỷ'
    created_at?: string
}

export interface DailyLog {
    id: string
    project_id: string
    log_date: string
    content: string
    media_link?: string | null
    user_id?: string | null
    created_at?: string
}

export interface Task {
    id: string
    task_code: string
    project_id: string
    parent_id?: string | null
    name: string
    description: string | null
    assignee_id: string | string[] | null
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
    approved?: boolean | null
    subcontractor?: string | null
    end_date?: string | null
    personnel?: number | null
    is_approved?: boolean | null
    category?: string | null
    cost_estimate?: number | null
    format?: string | null
    platform?: string | null
    views?: string | null
    interactions?: string | null
    shares?: string | null
    saves?: string | null
    sections?: any[] | null
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
    parent_id: string | null
    user_id: string
    content: string
    mentions: string[] // Array of user IDs
    created_at: string
    reply_count?: number // Optional computed field
}

export interface AppNotification {
    id: string
    user_id: string
    actor_id: string | null
    type: string | 'mention' | 'assignment' | 'overdue' | 'due_today' | 'system'
    related_task_id: string | null
    related_project_id: string | null
    marketing_task_id?: string | null
    marketing_project_id?: string | null
    content: string
    is_read: boolean
    created_at: string
}
