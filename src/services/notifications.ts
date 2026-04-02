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

import { fetchHRDataAndCalculate } from './hrAssistantService'

// Check and generate overdue/due today and HR auto-notifications
export const checkScheduledNotifications = async (userId: string) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch user profile to get role and name
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', userId)
            .single();

        if (!profileData) return;
        const userName = profileData.full_name || 'Nhân sự';
        const userRole = profileData.role || 'Nhân viên';

        // Fetch tasks and HR calculations
        const hrData = await fetchHRDataAndCalculate(userId, userRole);
        const evaluatedTasks = hrData.evaluatedTasks;

        // Fetch today's notifications to prevent spam (max 2 per task/day)
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


        for (const task of evaluatedTasks) {
            if (task.status === 'Hoàn thành' || task.status === 'Hủy bỏ' || !task.due_date) continue;

            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            const expectedValueStr = (task.taskValue / task.onTimeMulti).toLocaleString('vi-VN');

            // 1. Nhắc deadline 24h
            if (daysUntilDue === 1 && (notifTracker[task.id] || 0) < 1) {
                await createNotification(
                    userId,
                    `${userName} — Task "${task.name}" sẽ đến hạn vào ngày mai. Nếu hoàn thành đúng hạn: +${expectedValueStr}đ vào lương hiệu quả.`,
                    'due_today',
                    null,
                    task.id,
                    task.project_id
                );
            }
            
            // 2. Báo task trễ
            if (task.daysLate > 0 && (notifTracker[task.id] || 0) < 1) {
                const baseValue = task.taskValue / task.onTimeMulti;
                const lostAmount = baseValue - task.taskValue;
                
                await createNotification(
                    userId,
                    `${userName} — Task "${task.name}" đã quá hạn ${task.daysLate} ngày. Hệ số on-time hiện tại: ${task.onTimeMulti}x. Ảnh hưởng lương: -${lostAmount.toLocaleString('vi-VN')}đ. Vui lòng cập nhật trạng thái!`,
                    'overdue',
                    null,
                    task.id,
                    task.project_id
                );

                // Admin cảnh báo:
                if (task.daysLate > 1 && task.isHardDeadline) {
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

        // CẢNH BÁO KPI CHO QUẢN LÝ
        if (today.getDate() >= 21 && hrData.kpiPercent < 60) {
            // only check once per week or month maybe? 
            // We can just rely on notifTracker to not spam if we use a specific task id, but we don't have one here.
            // Simplified: just warn if we haven't warned them today about this global fact.
            const hasWarnedKPI = !todayNotifs || todayNotifs.some(n => n.type === 'system' && n.content?.includes('KPI tháng < 60%'));
            if (!hasWarnedKPI && managers) {
                for (const m of managers) {
                    await createNotification(
                        m.id,
                        `[CẢNH BÁO] ${userName} hiện có KPI tháng rất thấp (${hrData.kpiPercent.toFixed(1)}%). Đề nghị rà soát năng suất.`,
                        'system',
                        userId,
                        null,
                        null
                    );
                }
            }
        }

    } catch (err) {
        console.error('Error checking scheduled notifications:', err);
    }
}
