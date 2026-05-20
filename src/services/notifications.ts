import { supabase } from './supabase'

export const getNotifications = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
    }
}

export const getUnreadNotificationCount = async (userId: string) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error('Error fetching unread notification count:', err);
        return 0;
    }
}

export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return false;
    }
}

export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        return false;
    }
}

// Internal function, usually calls to this would come from Edge Functions or specific UI actions like @mentions
export const createNotification = async (
    userId: string,
    content: string,
    type: string,
    actorId?: string | null,
    taskId?: string | null,
    projectId?: string | null,
    moduleType: 'core' | 'marketing' = 'core'
) => {
    try {
        // Prevent duplicate assignment notifications in a short span if needed, but for now just insert
        const payload: any = {
            user_id: userId,
            content: content,
            type: type,
            actor_id: actorId || null,
            is_read: false
        };

        if (moduleType === 'marketing') {
            payload.marketing_task_id = taskId || null;
            payload.marketing_project_id = projectId || null;
        } else {
            payload.related_task_id = taskId || null;
            payload.related_project_id = projectId || null;
        }

        const { error } = await supabase
            .from('notifications')
            .insert(payload);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error creating notification:', err);
        return false;
    }
}

// Check and generate overdue/due today notifications
export const checkScheduledNotifications = async (userId: string) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch user profile to get role and name
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        if (!profileData) return;
        const userName = profileData.full_name || 'Nhân sự';

        // Fetch tasks assigned to user
        const { data: userTasks } = await supabase
            .from('tasks')
            .select('id, name, status, priority, due_date, completion_date, project_id')
            .eq('assignee_id', userId)
            .not('status', 'eq', 'Hoàn thành')
            .not('status', 'eq', 'Hủy bỏ');

        const tasks = (userTasks || []) as any[];

        // Fetch today's notifications to prevent spam (max 1 per task/day)
        const { data: todayNotifs } = await supabase
            .from('notifications')
            .select('related_task_id, type, content')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        const notifTracker: Record<string, number> = {};
        todayNotifs?.forEach(n => {
            const id = n.related_task_id;
            if (id) {
                notifTracker[id] = (notifTracker[id] || 0) + 1;
            }
        });

        // Also fetch managers for admin warnings
        const { data: managers } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['Admin', 'Quản lý thiết kế', 'Quản lý thi công']);


        for (const task of tasks) {
            if (!task.due_date) continue;

            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const daysLate = Math.max(0, -daysUntilDue);

            // 1. Nhắc deadline 24h
            if (daysUntilDue === 1 && (notifTracker[task.id] || 0) < 1) {
                await createNotification(
                    userId,
                    `${userName} — Task "${task.name}" sẽ đến hạn vào ngày mai. Vui lòng hoàn thành đúng hạn!`,
                    'due_today',
                    null,
                    task.id,
                    task.project_id
                );
            }
            
            // 2. Báo task trễ
            if (daysLate > 0 && (notifTracker[task.id] || 0) < 1) {
                await createNotification(
                    userId,
                    `${userName} — Task "${task.name}" đã quá hạn ${daysLate} ngày. Vui lòng cập nhật trạng thái!`,
                    'overdue',
                    null,
                    task.id,
                    task.project_id
                );

                // Admin cảnh báo:
                const isHardDeadline = task.name?.includes('[DEADLINE CỨNG]') || task.priority === 'Khẩn cấp';
                if (daysLate > 1 && isHardDeadline) {
                    if (managers) {
                        for (const m of managers) {
                            await createNotification(
                                m.id,
                                `[CẢNH BÁO] ${userName} có task cứng "${task.name}" trễ > 1 ngày. Gợi ý: 1-on-1 hoặc điều chỉnh khối lượng.`,
                                'system',
                                userId,
                                task.id,
                                task.project_id
                            );
                        }
                    }
                }
            }
        }



    } catch (err) {
        console.error('Error checking scheduled notifications:', err);
    }
}
