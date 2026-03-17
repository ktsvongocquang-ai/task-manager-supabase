import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'admin@dqh.vn',
        password: 'password123',
    });

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: 'Test Project Gantt',
                project_code: 'DA999',
                status: 'Chưa bắt đầu',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) {
            console.error("Insert failed:", error);
        } else {
            console.log("Insert successful!", data);
            
            // cleanup
            await supabase.from('projects').delete().eq('id', data.id);
        }
    } catch (e) {
        console.error(e);
    }
}

testInsert();
