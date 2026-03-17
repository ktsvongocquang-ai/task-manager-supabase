
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function listTables() {
  console.log('Fetching all table names...')
  // Using a trick to get table names via a common error or just selecting from a non-existent table
  // But since I have service role, I can try to query information_schema if I have RPC or use standard select from likely tables.
  
  // Let's try to see if marketing_tasks, marketing_projects, etc. have related tables.
  const tables = ['marketing_projects', 'marketing_tasks', 'daily_logs', 'shooting_milestones', 'marketing_daily_logs', 'marketing_shooting_milestones']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
      console.log(`Table exists: ${table}`)
    } else {
      console.log(`Table might not exist: ${table} (${error.message})`)
    }
  }
}

listTables()
