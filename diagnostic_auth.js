import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    const testEmail = `test_${Date.now()}@dqh.vn`;
    const testPassword = 'password123456';

    console.log(`1. Bắt đầu đăng ký (Sign Up) tài khoản mới: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                full_name: 'Test User'
            }
        }
    });

    if (signUpError) {
        console.error('❌ Lỗi Sign Up:', signUpError.message);
        return;
    }
    console.log('✅ Đăng ký thành công! User ID:', signUpData.user?.id);

    console.log(`\n2. Bắt đầu đăng nhập lại tài khoản vừa tạo...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    });

    if (signInError) {
        console.error('❌ Lỗi Sign In:', signInError.message);
    } else {
        console.log('✅ Đăng nhập thành công! User ID:', signInData.user?.id);
    }
}

runTest();
