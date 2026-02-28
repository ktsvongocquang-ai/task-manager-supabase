import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseKey);

const accountsToTest = [
    { email: 'admin@dqh.vn', name: 'Admin', role: 'Admin' },
    { email: 'aminh@dqh.vn', name: 'Aminh', role: 'Quản lý' },
    { email: 'thang@dqh.vn', name: 'Thắng', role: 'Nhân viên' },
    { email: 'minh@dqh.vn', name: 'Minh', role: 'Nhân viên' },
    { email: 'vy@dqh.vn', name: 'Vy', role: 'Nhân viên' },
    { email: 'hau@dqh.vn', name: 'Hậu', role: 'Nhân viên' },
    { email: 'khoa@dqh.vn', name: 'Khoa', role: 'Nhân viên' }
];

async function testAllAccounts() {
    console.log("=== BẮT ĐẦU KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN TOÀN BỘ 7 TÀI KHOẢN ===\n");
    let successCount = 0;
    let failCount = 0;

    for (const account of accountsToTest) {
        process.stdout.write(`Đang kiểm tra: ${account.email}... `);

        // 1. Thử đăng nhập
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: '123456',
        });

        if (authError) {
            console.log(`❌ THẤT BẠI LÚC ĐĂNG NHẬP`);
            console.error(`   -> Lý do: ${authError.message}`);
            failCount++;
            continue; // Bỏ qua lấy profile nếu chưa đăng nhập dc
        }

        // 2. Lấy Profile dựa vào Auth ID
        const userId = authData.user.id;
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            console.log(`⚠️ ĐĂNG NHẬP THÀNH CÔNG nhưng CHƯA ĐỒNG BỘ PROFILE`);
            failCount++;
        } else {
            // 3. Kiểm tra xem Role/Name có đúng ý khách hàng không
            if (profile.role === account.role && profile.full_name === account.name) {
                console.log(`✅ OK! (Auth: Thành công | Role: ${profile.role} | Tên: ${profile.full_name})`);
                successCount++;
            } else {
                console.log(`⚠️ SAI THÔNG TIN (Mong đợi: ${account.role} - Thực tế: ${profile.role})`);
                failCount++;
            }
        }

        // Thoát đăng nhập để test user tiếp theo cho chuẩn
        await supabase.auth.signOut();
    }

    console.log("\n================ KẾT QUẢ TỔNG KẾT ================");
    console.log(`🏆 Tổng số tài khoản test thành công 100%: ${successCount}/${accountsToTest.length}`);
    if (failCount > 0) {
        console.log(`🚨 Số tài khoản bị lỗi: ${failCount}`);
    } else {
        console.log(`🎉 HỆ THỐNG HOÀN HẢO. BẠN CÓ THỂ YÊN TÂM SỬ DỤNG!`);
    }
}

testAllAccounts();
