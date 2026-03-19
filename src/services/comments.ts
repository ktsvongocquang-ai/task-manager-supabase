import { supabase } from './supabase'

export const getComments = async (taskId?: string | null, projectId?: string | null, moduleType: 'core' | 'marketing' = 'core') => {
    try {
        let query = supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: true }); // Oldest first for chat feel

        if (taskId) {
            query = query.eq(moduleType === 'marketing' ? 'marketing_task_id' : 'task_id', taskId);
        } else if (projectId) {
            query = query.eq(moduleType === 'marketing' ? 'marketing_project_id' : 'project_id', projectId);
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
    projectId?: string | null,
    parentId?: string | null,
    moduleType: 'core' | 'marketing' = 'core'
) => {
    try {
        const payload: any = {
            user_id: userId,
            content: content,
            mentions: mentions,
            parent_id: parentId || null
        };
        
        if (moduleType === 'marketing') {
            payload.marketing_task_id = taskId || null;
            payload.marketing_project_id = projectId || null;
        } else {
            payload.task_id = taskId || null;
            payload.project_id = projectId || null;
        }

        const { error } = await supabase
            .from('comments')
            .insert(payload);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error creating comment:', err);
        return false;
    }
}

export const updateComment = async (commentId: string, newContent: string) => {
    try {
        const { error } = await supabase
            .from('comments')
            .update({ content: newContent })
            .eq('id', commentId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating comment:', err);
        return false;
    }
}

export const deleteComment = async (commentId: string) => {
    try {
        // Delete child replies first (cascade)
        await supabase.from('comments').delete().eq('parent_id', commentId);
        // Then delete the comment itself
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting comment:', err);
        return false;
    }
}
