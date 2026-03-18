import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve('c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
const envKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]

const supabase = createClient(envUrl, envKey)

async function run() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('id', 'permissions')
    .single()

  console.log(JSON.stringify(data?.value || {}, null, 2))
}

run()
