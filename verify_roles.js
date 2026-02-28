import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoles() {
    console.log("=== BẮT ĐẦU KIỂM TRA PHÂN QUYỀN ===\n");

    try {
        // 1. Kiểm tra bảng Profiles xem có dòng nào không
        console.log("1. Đang kiểm tra bảng Profiles...");
        const { data: allProfiles, error: err1 } = await supabase
            .from('profiles')
            .select('email, full_name, role, position, id');

        if (err1) {
            console.error("❌ Không thể đọc bảng Profiles:", err1.message);
        } else if (allProfiles && allProfiles.length > 0) {
            console.log(`✅ Tìm thấy ${allProfiles.length} profiles trong hệ thống.`);
            console.table(allProfiles.map(p => ({
                Email: p.email,
                'Chức danh': p.role,
                'Vị trí': p.position,
                'Đã Link với Auth ID': p.id ? 'YES' : 'NO'
            })));
        } else {
            console.log("⚠️ Bảng Profiles đang trống! Script đồng bộ SQL CÓ THỂ chưa được chạy thành công.");
            return;
        }

        // 2. Test Đăng nhập thực tế
        console.log("\n2. Đang kiểm tra Đăng nhập & Quyền truy cập cho thang@dqh.vn...");

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'thang@dqh.vn',
            password: '123456',
        });

        if (authError) {
            console.error("❌ Đăng nhập thất bại:", authError.message);
            console.log("👉 LÝ DO: Có thể bạn chưa Disable phần Confirm Email hoặc chưa tạo user `thang@dqh.vn` ở màn hình Authentication.");
        } else {
            console.log("✅ Đăng nhập THÀNH CÔNG! Khóa ID:", authData.user.id);

            // Lấy profile thực tế đang gắn với ID này
            const { data: myProfile, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileErr) {
                console.error("❌ Lấy Profile thất bại:", profileErr.message);
                console.log("👉 LÝ DO: Script đồng bộ UUID (SQL lúc nãy) chưa được áp dụng thành công cho ID mới này.");
            } else if (myProfile) {
                console.log("\n✅ ĐỒNG BỘ HOÀN HẢO! Thông tin phân quyền hiện tại:");
                console.log(`   - Tên: ${myProfile.full_name}`);
                console.log(`   - Quyền: [${myProfile.role}]`);
                console.log(`   - Vị trí: ${myProfile.position}`);
            }
        }

    } catch (e) {
        console.error("Lỗi Exception:", e);
    }
}

testRoles();
