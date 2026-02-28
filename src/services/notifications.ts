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
    projectId?: string | null
) => {
    try {
        // Prevent duplicate assignment notifications in a short span if needed, but for now just insert
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                content: content,
                type: type,
                actor_id: actorId || null,
                related_task_id: taskId || null,
                related_project_id: projectId || null,
                is_read: false
            });

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

        // 1. Get tasks where user is assignee
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .in('status', ['Chưa bắt đầu', 'Đang thực hiện', 'Đang làm'])
            .eq('assignee_id', userId);

        if (error) throw error;

        // Fetch today's notifications to prevent spam
        const { data: todayNotifs } = await supabase
            .from('notifications')
            .select('related_task_id, type')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        const existingOverdue = new Set(todayNotifs?.filter(n => n.type === 'overdue').map(n => n.related_task_id));
        const existingDueToday = new Set(todayNotifs?.filter(n => n.type === 'due_today').map(n => n.related_task_id));

        for (const task of tasks || []) {
            if (!task.due_date) continue;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - dueDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0 && !existingOverdue.has(task.id)) {
                // Tiếng Việt warning
                await createNotification(
                    userId,
                    `Nhiệm vụ "${task.name}" đã TRỄ HẠN ${diffDays} ngày!`,
                    'overdue',
                    null,
                    task.id,
                    task.project_id
                );
            } else if (diffDays === 0 && !existingDueToday.has(task.id)) {
                await createNotification(
                    userId,
                    `Nhiệm vụ "${task.name}" cần hoàn thành TRONG HÔM NAY.`,
                    'due_today',
                    null,
                    task.id,
                    task.project_id
                );
            }
        }
    } catch (err) {
        console.error('Error checking scheduled notifications:', err);
    }
}
