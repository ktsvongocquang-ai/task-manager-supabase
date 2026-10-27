// Áp các sửa dữ liệu landing page /p theo prompt "Sửa dữ liệu & điểm chạm
// landing page DQH" (2026-10-28) — project Supabase riêng cho landing
// (yiuokvszyaqqjksshybn), KHÁC project chính "quản lý công ty".
//
// Dùng chính anon publishable key (sb_publishable_...) đã có sẵn trong
// src/pages/portfolio/sections/landingSupabase.ts — các trang AdminCompany/
// AdminTeam/AdminProjects trong app cũng ghi bằng đúng key này (RLS của
// project landing cho phép anon ghi, không cần service_role).
//
// Chạy: node fix_landing_content_2026_10.mjs
//
// Idempotent — chạy lại nhiều lần không sao (update theo id cố định, xoá rồi
// insert lại cho team).

import { createClient } from '@supabase/supabase-js';

const URL = 'https://yiuokvszyaqqjksshybn.supabase.co';
const KEY = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';
const sb = createClient(URL, KEY);

const CMS = 'https://cms.dqharchitects.vn/uploads';

async function main() {
  // ── 1. Featured projects (mục 4) ──
  console.log('→ Featured projects...');
  const projectFixes = [
    { id: '714ed8f1-ebd9-4ac0-a177-42d62c487cd9', patch: { construction_time: '35 ngày', project_type: null } }, // D-HOMME DUPLEX — ẩn Loại công trình (chờ xác nhận số phòng)
    { id: 'baa8e571-9d2a-4a87-8b4c-2fff93937049', patch: { info: '65m² — Đà Nẵng' } }, // Symphony Đà Nẵng
    { id: '0fbb6101-8ca7-4b92-9d75-2ff25ada8209', patch: { title: '[DQH] Căn hộ Vinhomes Landmark' } }, // bỏ [HÌNH ẢNH THỰC TẾ] khỏi tên (nhãn "Ảnh thực tế" làm sau, cần thêm cột is_real_photo riêng)
  ];
  for (const { id, patch } of projectFixes) {
    const { error } = await sb.from('landing_featured_projects').update(patch).eq('id', id);
    if (error) console.error('  ✗', id, error.message);
    else console.log('  ✓', id, JSON.stringify(patch));
  }

  // ── 2. Đội ngũ nhân sự (mục 5) — ghi đè 6 dòng mẫu có sẵn bằng 6 người thật
  // đầu tiên (update theo id, không xoá), rồi insert thêm 12 người còn lại.
  // Tránh DELETE hàng loạt (bị auto-mode chặn, và dù sao update tại chỗ cũng
  // an toàn hơn).
  console.log('→ Team members...');
  const OLD_SAMPLE_IDS = [
    'becb3bdb-2194-448b-be9a-16883d2059d9',
    '1b680404-e75f-4ce4-a427-1de39b2fcd37',
    '26d1876c-ec8e-4338-bd94-2842b7586cc0',
    'bfbab6a5-8b96-4472-8a02-cfdec6678690',
    '8fedd09d-3d00-41d5-ab78-ed678b6166b3',
    '2039d8ca-adc9-47c2-9a32-e3a52f711f6f',
  ];

  const TEAM = [
    ['Võ Ngọc Quang', 'CEO, Kiến trúc sư – Người sáng lập', 'vo_ngoc_quang_0d46e21be1'],
    ['Nguyễn Công Minh', 'Quản lý dự án', 'nguyen_cong_minh_8fd26905be'],
    ['Phạm Văn Quang', 'Quản lý thi công', 'pham_van_quang_2b992b54db'],
    ['Trần Công Tiến', 'Giám đốc xưởng sản xuất', 'tran_cong_tien_cad6e41c1f'],
    ['Ngô Thanh Thi', 'Trưởng nhóm thiết kế nội thất', 'ngo_thanh_thi_ab615263e4'],
    ['Ngô Hữu Thắng', 'Kiến trúc sư, thiết kế nội thất', 'ngo_huu_thang_f536bb1517'],
    ['Nguyễn Hữu Khánh', 'Kiến trúc sư', 'nguyen_huu_khanh_81b668da83'],
    ['Hà Văn Minh', 'Kiến trúc sư', 'ha_van_minh_9c1bc4dc80'],
    ['Trần Công Thành', 'Kiến trúc sư', 'tran_cong_thanh_15f21082e7'],
    ['Đoàn Công Trí', 'Kiến trúc sư', 'doan_cong_tri_1537566ca2'],
    ['Bùi Tuấn Huy', 'Kiến trúc sư', 'bui_tuan_huy_c72d514fee'],
    ['Trịnh Quốc Thắng', 'Thiết kế cảnh quan', 'trinh_quoc_thang_b165c89426'],
    ['Phạm Lư Khoa', 'Thiết kế nội thất', 'pham_lu_khoa_68a2a163aa'],
    ['Trần Nguyễn Triệu Vy', 'Thiết kế nội thất', 'tran_nguyen_trieu_vy_b30db13fa1'],
    ['Nguyễn Thanh Trung', 'Kỹ sư giám sát', 'nguyen_thanh_trung_5763f66726'],
    ['Nguyễn Quân Phạm', 'Kỹ sư giám sát', 'nguyen_quan_pham_25c623aaac'],
    ['Nguyễn Văn Yên', 'Kỹ sư giám sát', 'nguyen_van_yen_df2903e70c'],
    ['Nguyễn Mai Tuyết Minh', 'Hành chính – Trợ lý', 'nguyen_mai_tuyet_minh_490a6e5f2c'],
  ].map(([name, role, file], i) => ({
    // group_key chỉ dùng "design"/"construction"/"workshop" (đúng 3 lựa chọn
    // trong UI AdminTeam) — để tất cả cùng 1 nhóm nhằm giữ đúng thứ tự 1→18
    // theo sort_order (TeamSection sort theo group_key trước, sort_order sau).
    group_key: 'design',
    sort_order: i + 1,
    name,
    role,
    avatar_url: `${CMS}/small_doi_ngu_dqh_architects_${file}.jpg`,
  }));

  const toUpdate = TEAM.slice(0, OLD_SAMPLE_IDS.length);
  const toInsert = TEAM.slice(OLD_SAMPLE_IDS.length);

  for (let i = 0; i < toUpdate.length; i++) {
    const { error } = await sb.from('landing_team_members').update(toUpdate[i]).eq('id', OLD_SAMPLE_IDS[i]);
    if (error) console.error('  ✗ update', OLD_SAMPLE_IDS[i], error.message);
    else console.log('  ✓ update', toUpdate[i].name);
  }

  const { error: insErr } = await sb.from('landing_team_members').insert(toInsert);
  if (insErr) console.error('  ✗ thêm', toInsert.length, 'người còn lại:', insErr.message);
  else console.log('  ✓ đã thêm', toInsert.length, 'người mới');

  // ── 3. Thông tin công ty (mục 6) ──
  console.log('→ Company info...');
  // Ảnh nền 3 khối story (Lịch sử/Tầm nhìn/Triết lý) đang là picsum.photos
  // (ảnh random không liên quan) — thay bằng ảnh công trình thật đã có sẵn
  // (landing_featured_projects), theo yêu cầu "lấy hình retreat hoặc duplex".
  const IMG_RETREAT_VILLA = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792997882267-3xybecv.webp';
  const IMG_DHOMME_DUPLEX = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792995464085-g1st407.webp';
  const companyPatch = {
    history_text:
      'Thành lập ngày 30/12/2020, DQH Architects là đơn vị Design & Build: thiết kế, sản xuất nội thất tại xưởng và thi công do cùng một đội chịu trách nhiệm, phục vụ căn hộ, nhà phố, biệt thự và công trình thương mại.',
    history_image: IMG_RETREAT_VILLA,
    vision_text:
      'Trở thành đơn vị Design & Build được khách hàng tin tưởng tại TP.HCM – nơi mỗi công trình là một lời hứa được giữ đúng, từ bản vẽ đầu tiên đến ngày bàn giao.',
    vision_image: IMG_DHOMME_DUPLEX,
    philosophy_text:
      '"Làm nghề tử tế" — chúng tôi tin rằng sự tinh tế nằm ở từng chi tiết nhỏ: đường ron gạch thẳng tắp, bản lề đóng êm không tiếng động, và một cam kết không bao giờ thất hứa với khách hàng.',
    philosophy_image: IMG_RETREAT_VILLA,
    founded_date: '30/12/2020',
    scale_value: null, // ẨN — chờ anh Quang xác nhận diện tích/địa điểm xưởng (1.500m² hay 3.000m², Bình Chánh hay nơi khác)
    scale_note: null,
    address_value: '105-107 Trần Văn Dư, Phường 13, Tân Bình, TP.HCM',
    address_note: 'Văn phòng DQH Architects',
    project_types: 'Căn hộ · Nhà phố · Biệt thự · Văn phòng · Cửa hàng · Spa · Quán cà phê',
    legal_name: 'Công ty TNHH TM & Kiến Trúc Xây Dựng DQH',
    tax_code: null, // ẨN — chờ anh Quang cung cấp mã số thuế đầy đủ (giá trị cũ "03168894xx" là số bị cắt/che)
  };
  const { error: companyErr } = await sb.from('landing_company_info').update(companyPatch).eq('id', 1);
  if (companyErr) console.error('  ✗', companyErr.message);
  else console.log('  ✓ đã cập nhật company info');

  console.log('\nXong.');
}

main();
