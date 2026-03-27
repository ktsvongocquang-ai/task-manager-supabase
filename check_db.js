import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://mlozcqdfyvuelktogdma.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'HIDDEN_KEY'
)

async function check() {
  const { data, error } = await supabase.from('construction_projects').select('*').limit(1)
  console.log("construction_projects exists:", error ? error.message : "YES")

  const { error: err2 } = await supabase.from('construction_tasks').select('*').limit(1)
  console.log("construction_tasks exists:", err2 ? err2.message : "YES")
}

check()
