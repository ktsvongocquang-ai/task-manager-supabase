import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function vietnamize() {
  console.log('=== VIỆT HÓA TOÀN BỘ DATABASE ===\n');

  // 1. Cập nhật TÊN MODULE
  const moduleUpdates = [
    { slug: 'onboarding',       title: 'Nền tảng DQH',           description: 'Vision · Mission · Values · Brand DNA · Tư duy thiết kế' },
    { slug: 'design-knowledge', title: 'Kiến thức Thiết kế',     description: 'Quiet Luxury · Vật liệu · Phong cách · Lỗi thường gặp' },
    { slug: 'workflow',         title: 'Quy trình vận hành',     description: '9 quy trình chuẩn — từ gặp khách đến nghiệm thu' },
    { slug: 'tools-templates',  title: 'Kỹ thuật & Hạ tầng',    description: 'Hệ thống ngầm · Thi công · Hồ sơ hoàn công' },
    { slug: 'estimation',       title: 'Dự toán',                description: 'Công cụ tính giá sơ bộ theo phân khúc' },
    { slug: 'sales-marketing',  title: 'Bán hàng & Marketing',   description: 'Kịch bản sales · Messaging · Social media' },
  ];

  for (const u of moduleUpdates) {
    const { error } = await sb.from('training_modules').update({ title: u.title, description: u.description }).eq('slug', u.slug);
    if (error) console.log(`  ❌ Module ${u.slug}:`, error.message);
    else console.log(`  ✅ Module: ${u.slug} → ${u.title}`);
  }

  // 2. Cập nhật TÊN SECTIONS (Module 1 — Foundation)
  const sectionUpdates = [
    { number: '1.1', title: 'Tầm nhìn · Sứ mệnh · Triết lý' },
    { number: '1.2', title: 'Giá trị cốt lõi (5 Values)' },
    { number: '1.3', title: 'Bản sắc thương hiệu — Quiet Luxury' },
    { number: '1.4', title: 'Tư duy Thiết kế Thực chiến' },
    { number: '1.5', title: 'Master Suite — Tiêu chuẩn 5 sao tại gia' },
    { number: '1.6', title: 'Mô tả công việc (7 Vị trí)' },
    // Module 2 — Design Knowledge
    { number: '2.1', title: 'Triết lý Quiet Luxury' },
    { number: '2.2', title: 'Nguyên tắc bố cục' },
    { number: '2.3', title: 'Kích thước chuẩn (Ergonomics)' },
    { number: '2.4', title: 'Vật liệu chuẩn DQH' },
    { number: '2.5', title: '3 Phong cách chính' },
    { number: '2.6', title: 'Case Study nội bộ' },
    { number: '2.7', title: 'Lỗi thường gặp' },
    // Module 4 — Technical
    { number: '4.1', title: 'Hệ thống kỹ thuật ngầm' },
    { number: '4.2', title: 'Quy trình thi công (11 bước)' },
    { number: '4.3', title: 'Hồ sơ hoàn công' },
    // Module 6 — Sales
    { number: '6.1', title: 'Kịch bản tư vấn khách hàng' },
    { number: '6.2', title: 'Chiến lược Marketing số' },
  ];

  for (const u of sectionUpdates) {
    const { error } = await sb.from('training_sections').update({ title: u.title }).eq('number', u.number);
    if (error) console.log(`  ❌ Section ${u.number}:`, error.message);
    else console.log(`  ✅ Section: ${u.number} → ${u.title}`);
  }

  // 3. Cập nhật TÊN WORKFLOWS (Module 3)
  const wfUpdates = [
    { number: '3.1', title: 'Gặp khách & Tư vấn',       description: 'Tiếp khách lần đầu → ký hợp đồng' },
    { number: '3.2', title: 'Quy trình Thiết kế',        description: 'Briefing → Concept → 3D → Bản vẽ → Bàn giao' },
    { number: '3.3', title: 'Bàn giao TK → Thi công',    description: 'Chuyển giao giữa các bộ phận' },
    { number: '3.4', title: 'Quy chuẩn đặt tên file',    description: 'Naming convention & version control' },
    { number: '3.5', title: 'Quản lý thư viện',          description: 'CAD blocks · 3D models · Material' },
    { number: '3.6', title: 'Lưu trữ & Cấu trúc folder', description: 'Chuẩn DQH cho mọi dự án' },
    { number: '3.7', title: 'Tiêu chuẩn đầu ra',        description: 'Deliverable theo từng tier ngân sách' },
    { number: '3.8', title: 'Xử lý phát sinh',           description: 'Change request & Change order' },
    { number: '3.9', title: 'Nghiệm thu & Hậu mãi',     description: 'Bàn giao, bảo hành, chăm sóc sau bán' },
  ];

  for (const u of wfUpdates) {
    const { error } = await sb.from('training_workflows').update({ title: u.title, description: u.description }).eq('number', u.number);
    if (error) console.log(`  ❌ Workflow ${u.number}:`, error.message);
    else console.log(`  ✅ Workflow: ${u.number} → ${u.title}`);
  }

  console.log('\n=== HOÀN TẤT VIỆT HÓA ===');
}

vietnamize();
