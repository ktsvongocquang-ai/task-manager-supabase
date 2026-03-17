
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function verifyMigrationV2() {
  console.log('Verifying Marketing Migration V2...')
  
  // 1. Check supervisor_phone in marketing_projects
  const { data: projData, error: projError } = await supabase
    .from('marketing_projects')
    .select('id, supervisor_phone')
    .limit(1)

  if (projError) {
    console.error('Column supervisor_phone check failed:', projError)
  } else {
    console.log('Column supervisor_phone exists.')
    
    // 2. Check marketing_shooting_milestones
    const { error: msError } = await supabase.from('marketing_shooting_milestones').select('*').limit(1)
    if (msError) {
      console.error('Table marketing_shooting_milestones check failed:', msError)
    } else {
      console.log('Table marketing_shooting_milestones exists.')
    }

    // 3. Check marketing_daily_logs
    const { error: logsError } = await supabase.from('marketing_daily_logs').select('*').limit(1)
    if (logsError) {
      console.error('Table marketing_daily_logs check failed:', logsError)
    } else {
      console.log('Table marketing_daily_logs exists.')
    }
    
    if (!msError && !logsError && projData) {
        console.log('All migration items verified successfully!')
        
        // Quick test insert
        const testProjectId = projData[0]?.id;
        if (testProjectId) {
            console.log('Testing inserts on new tables...')
            const { data: testMs, error: insMsErr } = await supabase.from('marketing_shooting_milestones').insert({
                project_id: testProjectId,
                milestone_date: new Date().toISOString().split('T')[0],
                content: 'Test Milestone',
                status: 'Chờ quay'
            }).select().single();
            
            if (insMsErr) console.error('Milestone insert failed:', insMsErr)
            else console.log('Milestone insert successful.')

            const { data: testLog, error: insLogErr } = await supabase.from('marketing_daily_logs').insert({
                project_id: testProjectId,
                log_date: new Date().toISOString().split('T')[0],
                content: 'Test Log'
            }).select().single();

            if (insLogErr) console.error('Log insert failed:', insLogErr)
            else console.log('Log insert successful.')

            // Cleanup
            if (testMs) await supabase.from('marketing_shooting_milestones').delete().eq('id', testMs.id)
            if (testLog) await supabase.from('marketing_daily_logs').delete().eq('id', testLog.id)
            console.log('Test records cleaned up.')
        }
    }
  }
}

verifyMigrationV2()
