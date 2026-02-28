import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

// Bắt buộc dùng Service Role Key để tạo User không cần Email Confirmation nếu UI chưa bị tắt
// Do mình không có Service Role Key nên đành dùng cách bypass SQL và SignIn

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTest() {
    console.log("=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN ===");

    // 1. Kiểm tra đăng nhập với tài khoản thang@dqh.vn
    console.log("\n1. Đang test thử đăng nhập với thang@dqh.vn / 123456");
    const { data: d1, error: e1 } = await supabase.auth.signInWithPassword({
        email: 'thang@dqh.vn',
        password: '123456',
    });

    if (e1) {
        console.error("❌ LỖI (Thang):", e1.message);
    } else {
        console.log("✅ THÀNH CÔNG (Thang):", d1.user.id);
    }

    // 2. Tạo nhanh 1 tài khoản hoàn toàn mới bằng API xem có được không
    const newMail = `demo_${Date.now()}@dqh.vn`;
    console.log(`\n2. Đang tạo User nháp ${newMail} bằng API...`);
    const { data: d2, error: e2 } = await supabase.auth.signUp({
        email: newMail,
        password: 'password123',
    });

    if (e2) {
        console.error("❌ LỖI TẠO USER NHÁP:", e2.message);
    } else {
        console.log("✅ TẠO USER NHÁP THÀNH CÔNG (Nhưng có thể chưa confirmed Email):", d2.user?.id);

        // Cố gắng đăng nhập ngay lập tức cái user vừa tạo
        console.log(`\n3. Đang test đăng nhập User nháp ${newMail}...`);
        const { data: d3, error: e3 } = await supabase.auth.signInWithPassword({
            email: newMail,
            password: 'password123',
        });

        if (e3) {
            console.error("❌ LỖI ĐĂNG NHẬP USER NHÁP:", e3.message);
        } else {
            console.log("✅ ĐĂNG NHẬP USER NHÁP THÀNH CÔNG:", d3.user?.id);
        }
    }
}

finalTest();
