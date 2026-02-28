import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const usersToSync = [
    { email: 'admin@dqh.vn', role: 'Admin', position: 'Admin', staffId: 'ADMIN_01', name: 'Admin' },
    { email: 'aminh@dqh.vn', role: 'Quản lý', position: 'Quản trị viên', staffId: 'NV001', name: 'Aminh' },
    { email: 'thang@dqh.vn', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV002', name: 'Thắng' },
    { email: 'minh@dqh.vn', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV003', name: 'Minh' },
    { email: 'vy@dqh.vn', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV004', name: 'Vy' },
    { email: 'hau@dqh.vn', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV005', name: 'Hậu' },
    { email: 'khoa@dqh.vn', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV006', name: 'Khoa' }
];

async function autoFix() {
    console.log("🚀 ĐANG TỰ ĐỘNG SỬA TẬN GỐC HỆ THỐNG GIAO VIỆC...");
    let allGood = 0;

    for (const u of usersToSync) {
        process.stdout.write(`- Xử lý ${u.email}... `);

        let userId = null;

        // 1. Thử login bằng cái pass bị nhầm hồi nãy (Do script trước tạo ra bằng password123)
        let { data, error } = await supabase.auth.signInWithPassword({ email: u.email, password: 'password123' });

        if (!error && data?.user) {
            userId = data.user.id;
            // Ép đổi pass về 123456 luôn cho khách hàng
            await supabase.auth.updateUser({ password: '123456' });
            process.stdout.write(`Đã đồng bộ pass về chuẩn 123456 -> `);
        } else {
            // 2. Thử login bằng pass 123456 (Trường hợp khách đã tự xóa tự tạo)
            let { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email: u.email, password: '123456' });
            if (!e2 && d2?.user) {
                userId = d2.user.id;
                process.stdout.write(`Pass đã chuẩn 123456 sẵn -> `);
            } else {
                // 3. Nếu không có account thì tự tạo mới luôn
                let { data: d3, error: e3 } = await supabase.auth.signUp({
                    email: u.email, password: '123456', options: { data: { full_name: u.name } }
                });
                if (!e3 && d3?.user) {
                    userId = d3.user.id;
                    process.stdout.write(`Tạo mới tinh -> `);
                } else {
                    process.stdout.write(`❌ Lỗi dính Pass (Phải tự đổi pass trên Supabase): ${e3?.message} \n`);
                    continue;
                }
            }
        }

        // 4. Update Profile và phân quyền
        if (userId) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                staff_id: u.staffId,
                full_name: u.name,
                email: u.email,
                role: u.role,
                position: u.position
            }, { onConflict: 'id' });

            if (profileError) {
                process.stdout.write(`❌ Lỗi Quyền: ${profileError.message}\n`);
            } else {
                process.stdout.write(`✅ XONG!\n`);
                allGood++;
            }
        }

        await supabase.auth.signOut();
    }

    if (allGood === usersToSync.length) {
        console.log("\n🎉 XỬ LÝ XONG 100%! BẠN CÓ THỂ ĐĂNG NHẬP THOẢI MÁI BẤT KỲ AI LÊN WEB LÀ VÔ ẦM ẦM.");
    } else {
        console.log(`\n⚠️ Chỉ thành công ${allGood}/${usersToSync.length}. Vui lòng kiểm tra lại.`);
    }
}

autoFix();
