import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve('c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
// We will use the service role key if available in env, or anon key if not.
const envAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]

// First let's check what keys are in .env
console.log("ENV KEYs exist: URL=", !!envUrl, "ANON=", !!envAnonKey);

const supabase = createClient(envUrl, envAnonKey)

async function run() {
  console.log("--- PROFILES ---")
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, role').limit(10)
  if (pErr) console.error("Profiles error:", pErr)
  else console.log(profiles)

  console.log("--- SYSTEM SETTINGS ---")
  const { data: settings, error: sErr } = await supabase.from('system_settings').select('*')
  if (sErr) console.error("System settings error:", sErr)
  else console.log(JSON.stringify(settings, null, 2))
}

run()
