import { supabase } from './supabase'

export const logActivity = async (action: string, details: string, project_id?: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const user_id = session?.user?.id

        if (!user_id) return // Don't log if no user

        const payload: any = {
            action,
            details,
            user_id
        }
        if (project_id) {
            payload.project_id = project_id
        }

        const { error } = await supabase.from('activity_logs').insert(payload)

        if (error) {
            console.error('Failed to log activity:', error)
        }
    } catch (err) {
        console.error('Error logging activity:', err)
    }
}
