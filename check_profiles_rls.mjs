import { createClient } from '@supabase/supabase-js'

// Using PRODUCTION Supabase credentials (from Vercel)
const supabaseUrl = 'https://fsnmavpgkkrgtlnbreby.supabase.co'
const supabaseAnonKey = 'sb_publishable_BcifRcQD8TsJ9NhDbHXF7w_u10XRziW'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('=== Querying PRODUCTION profiles ===')
const { data, error, count } = await supabase.from('profiles').select('id, full_name, role, email')
console.log('Error:', error)
console.log('Count:', data?.length || 0)
if (data) {
    data.forEach(p => console.log(`  - ${p.full_name || '(no name)'} | role: ${p.role || '(none)'} | email: ${p.email || '(none)'}`))
}
