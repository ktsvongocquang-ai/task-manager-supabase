import { supabase } from './supabase'

export const getComments = async (taskId?: string | null, projectId?: string | null) => {
    try {
        let query = supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: true }); // Oldest first for chat feel

        if (taskId) {
            query = query.eq('task_id', taskId);
        } else if (projectId) {
            query = query.eq('project_id', projectId);
        } else {
            return [];
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching comments:', err);
        return [];
    }
}

export const createComment = async (
    userId: string,
    content: string,
    mentions: string[] = [],
    taskId?: string | null,
    projectId?: string | null
) => {
    try {
        const { error } = await supabase
            .from('comments')
            .insert({
                user_id: userId,
                content: content,
                mentions: mentions,
                task_id: taskId || null,
                project_id: projectId || null
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error creating comment:', err);
        return false;
    }
}
