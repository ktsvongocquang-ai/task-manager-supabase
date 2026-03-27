import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://mlozcqdfyvuelktogdma.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'HIDDEN_KEY'
)

async function checkSchema(tableName) {
  // Try to get a single row to see all column names, or ask for the empty result
  const { data, error } = await supabase.from(tableName).select('*').limit(1)
  if (error) {
    console.log(`Table ${tableName} error:`, error.message)
    return
  }
  
  if (data && data.length > 0) {
    console.log(`Table ${tableName} columns:`, Object.keys(data[0]))
  } else {
    // If empty, insert a dummy record and rollback or just try to get column info
    // However, Supabase postgREST doesn't return schema info directly easily without RLS bypass or pg_meta.
    console.log(`Table ${tableName} exists but is empty. We can't see the columns via simple select.`)
  }
}

async function main() {
  await checkSchema('construction_projects')
  await checkSchema('construction_tasks')
  await checkSchema('daily_logs')
}

main()
