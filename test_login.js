import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log("Testing sign in for admin@dqh.vn with 123456...");
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'admin@dqh.vn',
        password: '123456',
    });

    if (error2) {
        console.error("Login failed for admin:", error2.message);
    } else {
        console.log("Login successful! User ID:", data2.user.id);
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', data2.user.id).single();
        console.log("Profile data:", profile || error.message);
    }

    console.log("\nTesting sign in for admin@dqh.vn with password123...");
    const { data: data3, error: error3 } = await supabase.auth.signInWithPassword({
        email: 'admin@dqh.vn',
        password: 'password123',
    });

    if (error3) {
        console.error("Login failed for admin:", error3.message);
    } else {
        console.log("Login successful! User ID:", data3.user.id);
    }


    console.log("\nTesting sign in for thang@dqh.vn with 123456...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'thang@dqh.vn',
        password: '123456',
    });

    if (error) {
        console.error("Login failed for thang:", error.message);
    } else {
        console.log("Login successful! User ID:", data.user.id);
    }
}

testLogin();
