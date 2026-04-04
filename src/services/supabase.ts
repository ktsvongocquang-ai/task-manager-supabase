import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsnmavpgkkrgtlnbreby.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbm1hdnBna2tyZ3RsbmJyZWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjQ3NjEsImV4cCI6MjA5MDg0MDc2MX0.0J1CTeOyZtKQE_GrBz1l2KTOv2nI0Ea5vp0cKnyK1KQ'

console.log('Supabase Init:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
