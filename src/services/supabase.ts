import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('AI_AGENT_ERROR: MISSING_SUPABASE_ENV_VARS');
    console.error('URL:', supabaseUrl);
    console.error('KEY:', supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export const supabaseAdmin = createClient(
    supabaseUrl || '', 
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
