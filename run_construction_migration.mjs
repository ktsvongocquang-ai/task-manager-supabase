/**
 * run_construction_migration.mjs
 * Seeds all construction data into Supabase using service role key.
 * Run: node run_construction_migration.mjs
 */

import { createClient } from '@supabase/supabase-js';

import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Thiếu env vars. Tạo file .env với VITE_SUPABASE_URL và VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Admin client bypasses RLS
const db = createClient(SUPABASE_URL, ANON_KEY, {
  global: { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
});

const log = (msg, ok = true) => console.log(`${ok ? '✅' : '❌'} ${msg}`);

async function upsert(table, rows, conflictCol = 'id') {
  const { error } = await db.from(table).upsert(rows, { onConflict: conflictCol });
  log(`${table} (${rows.length} rows)`, !error);
  if (error) console.log(`   → ${error.message}`);
  return !error;
}

async function main() {
  console.log('\n🚀 Construction Migration — Seeding Data\n');

  // ── PROJECTS ──
  await upsert('construction_projects', [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Nhà cô Lan - Q.7', address: '123 Đường số 4, P. Tân Phong, Q7', status: 'ĐANG THI CÔNG', progress: 45, budget: 2500000000, spent: 1200000000, contract_value: 2800000000, budget_spent: 42, risk_level: 'green', owner_name: 'Cô Lan', engineer_name: 'Nguyễn Văn Hùng', start_date: '2026-01-15', handover_date: '2026-08-20' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Biệt thự Anh Hùng - Thủ Đức', address: '45 Khu đô thị Vạn Phúc, Thủ Đức', status: 'MỚI', progress: 28, budget: 5000000000, spent: 500000000, contract_value: 5500000000, budget_spent: 35, risk_level: 'yellow', owner_name: 'Anh Hùng', engineer_name: 'Trần Minh Tuấn', start_date: '2026-02-01', handover_date: '2026-11-15' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Nhà phố Tân Bình', address: '78 Cộng Hòa, Q. Tân Bình', status: 'MỚI', progress: 12, budget: 1900000000, spent: 190000000, contract_value: 1900000000, budget_spent: 10, risk_level: 'green', owner_name: 'Chị Hạnh', engineer_name: 'Lê Quốc Bảo', start_date: '2026-03-01', handover_date: '2026-09-30' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Nhà phố Gò Vấp', address: '56 Quang Trung, Q. Gò Vấp', status: 'ĐANG THI CÔNG', progress: 72, budget: 2400000000, spent: 1920000000, contract_value: 2400000000, budget_spent: 80, risk_level: 'red', owner_name: 'Anh Tâm', engineer_name: 'Phạm Đức', start_date: '2025-11-01', handover_date: '2026-05-15' },
  ]);

  // ── SUBCONTRACTORS ──
  await upsert('construction_subcontractors', [
    { id: '5a000001-0000-0000-0000-000000000001', name: 'Cty Điện Minh Phát', trade: 'Điện', phone: '0909 123 456', rating: 4.5, project_ids: ['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222'] },
    { id: '5a000002-0000-0000-0000-000000000002', name: 'Nước Toàn Thắng', trade: 'Cấp thoát nước', phone: '0912 345 678', rating: 4.2, project_ids: ['11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333'] },
    { id: '5a000003-0000-0000-0000-000000000003', name: 'Nhôm kính Đại Phát', trade: 'Nhôm kính', phone: '0938 567 890', rating: 4.0, project_ids: ['22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444'] },
    { id: '5a000004-0000-0000-0000-000000000004', name: 'Sơn Bảo Ngọc', trade: 'Sơn nước', phone: '0977 890 123', rating: 4.7, project_ids: ['11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444'] },
    { id: '5a000005-0000-0000-0000-000000000005', name: 'Công ty XD Nam', trade: 'Xây dựng chính', phone: '0901 234 567', rating: 4.8, project_ids: ['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444'] },
    { id: '5a000006-0000-0000-0000-000000000006', name: 'Phòng cháy Sài Gòn', trade: 'PCCC', phone: '0918 765 432', rating: 4.1, project_ids: ['11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444'] },
    { id: '5a000007-0000-0000-0000-000000000007', name: 'Trắc đạc Việt', trade: 'Trắc đạc', phone: '0905 111 222', rating: 4.6, project_ids: ['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222'] },
  ]);

  // ── TASKS (project 1) ──
  await upsert('construction_tasks', [
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', project_id: '11111111-1111-1111-1111-111111111111', name: 'Ép cọc bê tông cốt thép', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty Nền Móng Việt', days: 5, budget: 150000000, spent: 145000000, approved: true, progress: 100, start_date: '2026-01-15', end_date: '2026-01-20', dependencies: [], checklist: [{id:'c1',label:'Kiểm tra tim cọc',completed:true,required:true},{id:'c2',label:'Nghiệm thu vật liệu',completed:true,required:true},{id:'c3',label:'Ép cọc thử',completed:true,required:true}], issues: [], tags: ['#EpCoc'] },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', project_id: '11111111-1111-1111-1111-111111111111', name: 'Đào móng và thi công đà kiềng', category: 'PHẦN THÔ', status: 'DONE', subcontractor: 'Công ty XD Nam', days: 10, budget: 250000000, spent: 260000000, approved: true, progress: 100, start_date: '2026-01-21', end_date: '2026-02-01', dependencies: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], checklist: [{id:'c4',label:'Đào đất đúng cao độ',completed:true,required:true},{id:'c5',label:'Lắp đặt cốt thép móng',completed:true,required:true}], issues: [], tags: ['#Mong'] },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', project_id: '11111111-1111-1111-1111-111111111111', name: 'Xây tường bao tầng trệt', category: 'PHẦN THÔ', status: 'DOING', subcontractor: 'Công ty XD Nam', days: 7, budget: 120000000, spent: 50000000, approved: true, progress: 71, start_date: '2026-02-02', end_date: '2026-02-09', dependencies: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], checklist: [{id:'c7',label:'Kiểm tra mạch vữa đều',completed:true,required:true},{id:'c8',label:'Kiểm tra thẳng đứng',completed:false,required:true}], issues: [{id:'i1',title:'Sai lệch kích thước cửa sổ',description:'Cửa sổ phòng khách lệch 5cm',status:'OPEN',severity:'HIGH',createdAt:'2026-03-20'}], tags: ['#XayTuong'] },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', project_id: '11111111-1111-1111-1111-111111111111', name: 'Lắp đặt hệ thống điện nước âm tường', category: 'MEP', status: 'TODO', subcontractor: 'Điện Nước Hoàng Gia', days: 8, budget: 180000000, spent: 0, approved: false, progress: 0, start_date: '2026-02-10', end_date: '2026-02-18', dependencies: ['cccccccc-cccc-cccc-cccc-cccccccccccc'], checklist: [{id:'c10',label:'Đục tường đúng sơ đồ',completed:false,required:true},{id:'c11',label:'Lắp đặt ống điện',completed:false,required:true}], issues: [], tags: ['#MEP'] },
    { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', project_id: '11111111-1111-1111-1111-111111111111', name: 'Đổ bê tông sàn tầng 2', category: 'PHẦN THÔ', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 3, budget: 200000000, spent: 0, approved: false, progress: 0, start_date: '2026-02-19', end_date: '2026-02-22', dependencies: ['cccccccc-cccc-cccc-cccc-cccccccccccc'], checklist: [], issues: [], tags: ['#BeTong'] },
    { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', project_id: '11111111-1111-1111-1111-111111111111', name: 'Mái + Chống thấm', category: 'PHẦN THÔ', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 7, budget: 210000000, spent: 0, approved: false, progress: 0, start_date: '2026-02-23', end_date: '2026-03-02', dependencies: ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'], checklist: [], issues: [], tags: [] },
    { id: 'a0000007-0000-0000-0000-000000000007', project_id: '11111111-1111-1111-1111-111111111111', name: 'Tô trát + Hoàn thiện', category: 'HOÀN THIỆN', status: 'TODO', subcontractor: 'Công ty XD Nam', days: 14, budget: 420000000, spent: 0, approved: false, progress: 0, start_date: '2026-03-03', end_date: '2026-03-17', dependencies: ['ffffffff-ffff-ffff-ffff-ffffffffffff'], checklist: [], issues: [], tags: [] },
    { id: 'a0000008-0000-0000-0000-000000000008', project_id: '11111111-1111-1111-1111-111111111111', name: 'Sơn + Vệ sinh + Bàn giao', category: 'HOÀN THIỆN', status: 'TODO', subcontractor: 'Sơn Bảo Ngọc', days: 10, budget: 140000000, spent: 0, approved: false, progress: 0, start_date: '2026-03-18', end_date: '2026-03-28', dependencies: ['a0000007-0000-0000-0000-000000000007'], checklist: [], issues: [], tags: [] },
  ]);

  // ── MILESTONES ──
  await upsert('construction_milestones', [
    { id: 'b0000001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', name: 'Nghiệm thu móng', status: 'passed', approved_date: '2026-02-10', payment_amount: 560000000, payment_status: 'paid', sort_order: 1 },
    { id: 'b0000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', name: 'Nghiệm thu kết cấu trệt', status: 'passed', approved_date: '2026-03-10', payment_amount: 560000000, payment_status: 'paid', sort_order: 2 },
    { id: 'b0000003-0000-0000-0000-000000000003', project_id: '11111111-1111-1111-1111-111111111111', name: 'Nghiệm thu kết cấu lầu 1', status: 'pending_internal', approved_date: null, payment_amount: 560000000, payment_status: 'unpaid', sort_order: 3 },
    { id: 'b0000004-0000-0000-0000-000000000004', project_id: '11111111-1111-1111-1111-111111111111', name: 'Nghiệm thu kết cấu lầu 2', status: 'upcoming', approved_date: null, payment_amount: 560000000, payment_status: 'unpaid', sort_order: 4 },
    { id: 'b0000005-0000-0000-0000-000000000005', project_id: '11111111-1111-1111-1111-111111111111', name: 'Nghiệm thu hoàn thiện + Bàn giao', status: 'upcoming', approved_date: null, payment_amount: 560000000, payment_status: 'unpaid', sort_order: 5 },
  ]);

  // ── APPROVALS ──
  await upsert('construction_approvals', [
    { id: 'aaa00001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', type: 'qc', title: 'QC: Cốt thép sàn lầu 1', detail: '12 mục kiểm tra, 11 pass, 1 chờ xác nhận khoảng cách thép đai.', status: 'pending' },
    { id: 'aaa00002-0000-0000-0000-000000000002', project_id: '22222222-2222-2222-2222-222222222222', type: 'material', title: 'Đề xuất vật tư: Thép Pomina D16', detail: 'Số lượng: 2.5 tấn. Ngân sách hạng mục còn lại: 85%.', status: 'pending' },
    { id: 'aaa00003-0000-0000-0000-000000000003', project_id: '44444444-4444-4444-4444-444444444444', type: 'variation', title: 'Phát sinh: KH đổi gạch ốp WC', detail: 'Chênh lệch: +18,500,000 VND. Thời gian: +3 ngày.', status: 'pending' },
    { id: 'aaa00004-0000-0000-0000-000000000004', project_id: '44444444-4444-4444-4444-444444444444', type: 'budget_alert', title: 'Cảnh báo: Vượt ngân sách phần thô', detail: 'Hạng mục kết cấu đã chi 80% nhưng mới hoàn thành 65%.', status: 'pending' },
  ]);

  // ── NOTIFICATIONS ──
  await upsert('construction_notifications', [
    { id: 'c0000001-0000-0000-0000-000000000001', project_id: '44444444-4444-4444-4444-444444444444', level: 'critical', msg: 'Gò Vấp: Vượt ngân sách phần thô 12%', read: false },
    { id: 'c0000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', level: 'action', msg: 'Q.7: QC cốt thép sàn L1 chờ duyệt', read: false },
    { id: 'c0000003-0000-0000-0000-000000000003', project_id: '22222222-2222-2222-2222-222222222222', level: 'action', msg: 'Thủ Đức: Đề xuất thép Pomina 2.5T chờ duyệt', read: false },
    { id: 'c0000004-0000-0000-0000-000000000004', project_id: '33333333-3333-3333-3333-333333333333', level: 'good', msg: 'Tân Bình: Hoàn thành đúng tiến độ tuần 4', read: true },
    { id: 'c0000005-0000-0000-0000-000000000005', project_id: '11111111-1111-1111-1111-111111111111', level: 'info', msg: 'Q.7: Nhật ký hôm nay đã cập nhật', read: true },
  ]);

  // ── DAILY LOGS (only columns that exist) ──
  await upsert('daily_logs', [
    { id: 'd0000001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-28', weather: 'sunny/sunny', temperature: 34, main_workers: 5, helper_workers: 3, work_item: 'Xây tường bao trệt', status: 'pending', photo_urls: [] },
    { id: 'd0000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-27', weather: 'sunny/rainy', temperature: 30, main_workers: 5, helper_workers: 3, work_item: 'Xây tường bao trệt', status: 'approved', photo_urls: [] },
    { id: 'd0000003-0000-0000-0000-000000000003', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-26', weather: 'cloudy/sunny', temperature: 32, main_workers: 4, helper_workers: 3, work_item: 'Xây tường bao trệt', status: 'approved', photo_urls: [] },
    { id: 'd0000004-0000-0000-0000-000000000004', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-25', weather: 'rainy/rainy', temperature: 26, main_workers: 0, helper_workers: 0, work_item: 'Nghỉ do mưa', status: 'approved', photo_urls: [] },
  ]);

  // ── ATTENDANCE ──
  await upsert('construction_attendance', [
    { id: 'e0000001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-28', main_workers: 5, helper_workers: 3, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-27', main_workers: 5, helper_workers: 3, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000003-0000-0000-0000-000000000003', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-26', main_workers: 4, helper_workers: 3, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000004-0000-0000-0000-000000000004', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-25', main_workers: 0, helper_workers: 0, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000005-0000-0000-0000-000000000005', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-24', main_workers: 5, helper_workers: 4, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000006-0000-0000-0000-000000000006', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-23', main_workers: 5, helper_workers: 3, daily_rate_main: 450000, daily_rate_helper: 280000 },
    { id: 'e0000007-0000-0000-0000-000000000007', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-22', main_workers: 5, helper_workers: 3, daily_rate_main: 450000, daily_rate_helper: 280000 },
  ]);

  // ── PAYMENT RECORDS (needs DDL first) ──
  const { error: payErr } = await db.from('construction_payment_records').upsert([
    { id: 'f0000001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-01-20', description: 'Thanh toán đợt 1 - Ép cọc', amount: 560000000, type: 'payment_in', status: 'confirmed', category: 'Nghiệm thu', bill_photos: [] },
    { id: 'f0000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-02-15', description: 'Chi thép Pomina D16', amount: 340000000, type: 'payment_out', status: 'confirmed', category: 'Vật liệu', bill_photos: [] },
    { id: 'f0000003-0000-0000-0000-000000000003', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-10', description: 'Thanh toán đợt 2 - Kết cấu trệt', amount: 560000000, type: 'payment_in', status: 'confirmed', category: 'Nghiệm thu', bill_photos: [] },
    { id: 'f0000004-0000-0000-0000-000000000004', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-03-20', description: 'Chi nhân công tháng 3', amount: 180000000, type: 'payment_out', status: 'confirmed', category: 'Nhân công', bill_photos: [] },
    { id: 'f0000005-0000-0000-0000-000000000005', project_id: '11111111-1111-1111-1111-111111111111', date: '2026-04-05', description: 'Thu đợt 3 - Kết cấu lầu 1 (dự kiến)', amount: 560000000, type: 'payment_in', status: 'pending', category: 'Nghiệm thu', bill_photos: [] },
  ], { onConflict: 'id' });
  log('construction_payment_records (5 rows)', !payErr);
  if (payErr) console.log(`   → NEEDS DDL FIRST: ${payErr.message}`);

  // ── PHASES (needs DDL first) ──
  const { error: phErr } = await db.from('construction_phases').upsert([
    { id: 'ab000001-0000-0000-0000-000000000001', project_id: '11111111-1111-1111-1111-111111111111', name: 'Chuẩn bị mặt bằng', status: 'done', sort_order: 1, start_date: '2026-01-10', end_date: '2026-01-14' },
    { id: 'ab000002-0000-0000-0000-000000000002', project_id: '11111111-1111-1111-1111-111111111111', name: 'Thi công phần móng', status: 'done', sort_order: 2, start_date: '2026-01-15', end_date: '2026-02-01' },
    { id: 'ab000003-0000-0000-0000-000000000003', project_id: '11111111-1111-1111-1111-111111111111', name: 'Thi công kết cấu', status: 'doing', sort_order: 3, start_date: '2026-02-02', end_date: '2026-03-28' },
    { id: 'ab000004-0000-0000-0000-000000000004', project_id: '11111111-1111-1111-1111-111111111111', name: 'Thi công MEP', status: 'upcoming', sort_order: 4, start_date: '2026-03-29', end_date: '2026-05-15' },
    { id: 'ab000005-0000-0000-0000-000000000005', project_id: '11111111-1111-1111-1111-111111111111', name: 'Hoàn thiện', status: 'upcoming', sort_order: 5, start_date: '2026-05-16', end_date: '2026-08-10' },
    { id: 'ab000006-0000-0000-0000-000000000006', project_id: '11111111-1111-1111-1111-111111111111', name: 'Bàn giao', status: 'upcoming', sort_order: 6, start_date: '2026-08-11', end_date: '2026-08-20' },
  ], { onConflict: 'id' });
  log('construction_phases (6 rows)', !phErr);
  if (phErr) console.log(`   → NEEDS DDL FIRST: ${phErr.message}`);

  const needsDDL = payErr || phErr;
  console.log('\n' + '─'.repeat(60));
  if (needsDDL) {
    console.log('\n⚠️  Cần chạy DDL trước cho 2 bảng mới.');
    console.log('   Mở Supabase SQL Editor và paste:');
    console.log('   https://supabase.com/dashboard/project/mlozcqdfyvuelktogdma/sql/new\n');
    console.log(`CREATE TABLE IF NOT EXISTS construction_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  date date NOT NULL, description text NOT NULL, amount bigint DEFAULT 0,
  bill_photos jsonb DEFAULT '[]', type text DEFAULT 'payment_out',
  status text DEFAULT 'pending', category text DEFAULT 'Vật liệu',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS construction_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES construction_projects(id) ON DELETE CASCADE,
  name text NOT NULL, status text DEFAULT 'upcoming', sort_order int DEFAULT 0,
  start_date date, end_date date, note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);`);
    console.log('\n   Sau đó chạy lại: node run_construction_migration.mjs\n');
  } else {
    console.log('\n🎉 Tất cả data đã seed thành công!');
    console.log('   Deploy lên Vercel: vercel --prod\n');
  }
}

main().catch(console.error);
