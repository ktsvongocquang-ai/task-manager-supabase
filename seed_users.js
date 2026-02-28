// File chạy một lần (script) để thêm 7 nhân viên bằng JS thay vì SQL
// Yêu cầu: Đã cài đặt @supabase/supabase-js và dotenv 

import { createClient } from '@supabase/supabase-js';

// Vui lòng điền đúng 2 thông số này từ phần Settings > API của Supabase
const supabaseUrl = 'https://mlozcqdfyvuelktogdma.supabase.co'; // Thay bằng URL của bạn nếu khác
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'ĐIỀN_ANON_KEY_VÀO_ĐÂY'; // Thay bằng Anon Key thực tế

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const usersToCreate = [
    { email: 'admin@dqh.vn', password: 'password123', fullName: 'Admin', role: 'Admin', position: 'Admin', staffId: 'ADMIN_01' },
    { email: 'aminh@dqh.vn', password: 'password123', fullName: 'Aminh', role: 'Quản lý', position: 'Quản trị viên', staffId: 'NV001' },
    { email: 'thang@dqh.vn', password: 'password123', fullName: 'Thắng', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV002' },
    { email: 'minh@dqh.vn', password: 'password123', fullName: 'Minh', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV003' },
    { email: 'vy@dqh.vn', password: 'password123', fullName: 'Vy', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV004' },
    { email: 'hau@dqh.vn', password: 'password123', fullName: 'Hậu', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV005' },
    { email: 'khoa@dqh.vn', password: 'password123', fullName: 'Khoa', role: 'Nhân viên', position: 'Nhân viên', staffId: 'NV006' }
];

async function seedUsers() {
    console.log('🚀 Bắt đầu tạo 7 nhân viên qua API...');

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
            // Nếu lỗi "User already registered", tiếp tục cập nhật Profile
            if (!authError.message.includes('User already registered') && !authError.message.includes('already exists')) {
                continue; // Bỏ qua nếu lỗi khác
            }
        }

        let userId = authData?.user?.id;

        // Nếu user đã tồn tại nhưng signUp bị chặn do chính sách, ta thử query lại id
        if (!userId) {
            // Không có Admin Key thì không query được list user, do vậy đoạn này hơi hạn chế.
            // Giải pháp tốt nhất: Xóa toàn bộ user lỗi cũ trong mục Authentication -> Users trên góc nhìn giao diện quản trị Supabase.
            console.log(`⚠️ User ${u.email} đã tồn tại trong hệ thống cũ. Xin vui lòng xoá user bằng tay trong phần Authentication của Supabase trước.`);
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
                position: u.position,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`❌ Lỗi lưu Profile (${u.email}):`, profileError.message);
        } else {
            console.log(`✅ Lưu Profile thành công cho ${u.fullName}!`);
        }
    }

    console.log('🎉 Hoàn thành!');
}

seedUsers();
