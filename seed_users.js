import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlozcqdfyvuelktogdma.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb3pjcWRmeXZ1ZWxrdG9nZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTg1ODcsImV4cCI6MjA4NzczNDU4N30.Gu-9XFac2ft9hwprsQybCOGF_EyyNkYIIpd9zJHWvys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const usersToCreate = [
    { email: 'admin@dqh.vn', password: '123456', fullName: 'Admin', role: 'Admin', position: 'Admin', staffId: 'ADMIN_01' },
    { email: 'aminh@dqh.vn', password: '123456', fullName: 'Aminh', role: 'Quản lý', position: 'Quản trị viên', staffId: 'NV001' },
    // Không tạo Thắng vì Thắng đã đăng nhập thành công
    // { email: 'thang@dqh.vn', password: '123456', fullName: 'Thắng', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV002' },
    { email: 'minh@dqh.vn', password: '123456', fullName: 'Minh', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV003' },
    { email: 'vy@dqh.vn', password: '123456', fullName: 'Vy', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV004' },
    { email: 'hau@dqh.vn', password: '123456', fullName: 'Hậu', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV005' },
    { email: 'khoa@dqh.vn', password: '123456', fullName: 'Khoa', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV006' }
];

async function seedUsers() {
    console.log('🚀 Bắt đầu tạo 6 nhân viên (trừ Thắng) qua API...');

    for (const u of usersToCreate) {
        console.log(`Đang chạy: ${u.email}...`);

        // 1. Dùng Auth API để đăng ký User đúng chuẩn
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: u.email,
            password: u.password,
            options: {
                data: {
                    full_name: u.fullName,
                }
            }
        });

        if (authError) {
            console.error(`❌ Lỗi tạo Auth user (${u.email}):`, authError.message);
            continue;
        }

        let userId = authData?.user?.id;

        if (!userId) {
            console.log(`⚠️ User ${u.email} chưa được tạo ID.`);
            continue;
        }

        console.log(`✅ Đã tạo/đăng nhập Auth User ID: ${userId}`);

        // 2. Cập nhật Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                staff_id: u.staffId,
                full_name: u.fullName,
                email: u.email,
                role: u.role,
                position: u.position
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`❌ Lỗi lưu Profile (${u.email}):`, profileError.message);
        } else {
            console.log(`✅ Lưu Profile và Phân quyền thành công cho ${u.fullName} (${u.role})!`);
        }
    }

    console.log('🎉 Hoàn thành!');
}

seedUsers();
