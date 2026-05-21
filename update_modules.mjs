import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function addResources() {
  console.log('=== THÊM QUY TRÌNH FILE + TÀI NGUYÊN ===\n');

  // Lấy module Kỹ thuật & Kỹ năng mềm
  const { data: techMod } = await sb.from('training_modules').select('id').eq('slug', 'tools-templates').single();
  if (!techMod) { console.log('❌ Không tìm thấy module'); return; }

  // Thêm sections mới
  const newSections = [
    {
      module_id: techMod.id,
      slug: 'file-naming-standard',
      number: '4.9',
      title: 'Quy chuẩn đặt tên file & Lưu trữ',
      description: 'Naming convention, version control, cấu trúc folder chuẩn DQH',
      icon: 'FileText',
      content: 'Một file sai tên = 30 phút tìm kiếm. Quy chuẩn thống nhất giúp cả team làm việc nhanh hơn.',
      sort_order: 9,
    },
    {
      module_id: techMod.id,
      slug: 'resource-links',
      number: '4.10',
      title: 'Thư viện Tài nguyên & Link nhanh',
      description: 'Drive templates, tài khoản công cụ, tài liệu mẫu',
      icon: 'Package',
      content: 'Tất cả links quan trọng tập trung 1 chỗ — không cần hỏi ai.',
      sort_order: 10,
    },
  ];

  const { error: secErr } = await sb.from('training_sections').insert(newSections);
  if (secErr) { console.log('❌ Thêm sections:', secErr.message); return; }
  console.log('✅ Đã thêm 2 sections mới (4.9 + 4.10)');

  // Lấy ID sections vừa tạo
  const { data: secs } = await sb.from('training_sections').select('id, slug')
    .in('slug', ['file-naming-standard', 'resource-links']);

  const fileSecId = secs?.find(s => s.slug === 'file-naming-standard')?.id;
  const linkSecId = secs?.find(s => s.slug === 'resource-links')?.id;

  // === SUBSECTIONS CHO 4.9 QUY CHUẨN FILE ===
  if (fileSecId) {
    const fileSubs = [
      {
        section_id: fileSecId,
        slug: 'naming-format',
        heading: 'Format đặt tên file chuẩn DQH',
        content: null,
        content_type: 'items',
        metadata: {
          items: [
            { title: 'Format chuẩn', body: '[DỰ_ÁN]_[HẠNG_MỤC]_[VERSION]_[NGÀY]_[INITIALS]\nVD: VEROSA_F11_MB-T1_V03_20260518_QH.dwg' },
            { title: 'Hạng mục (viết tắt)', body: 'MB = Mặt bằng\nMD = Mặt đứng\nCT = Chi tiết\n3D = File 3D\nRENDER = File render\nBOQ = Bảng khối lượng' },
            { title: 'Version', body: 'V01, V02, V03... mỗi lần khách duyệt +1\nFile được duyệt: thêm _APPROVED' },
            { title: '⛔ Tuyệt đối tránh', body: '• Không dùng tiếng Việt có dấu\n• Không khoảng trắng — dùng _ hoặc -\n• Không "FINAL", "FINAL_FINAL" — dùng V03_APPROVED' },
          ]
        },
        sort_order: 1,
      },
      {
        section_id: fileSecId,
        slug: 'folder-structure',
        heading: 'Cấu trúc folder dự án chuẩn',
        content: null,
        content_type: 'items',
        metadata: {
          items: [
            { title: '📁 01_BRIEF & CONTRACT', body: 'Brief khách hàng · Hợp đồng · Khảo sát hiện trạng' },
            { title: '📁 02_CONCEPT', body: 'Mood board · Concept statement · Material direction' },
            { title: '📁 03_DESIGN', body: '2D Drawings · 3D Models · Renders' },
            { title: '📁 04_TECHNICAL', body: 'Bản vẽ kỹ thuật · Material schedule · Phối hợp MEP' },
            { title: '📁 05_EXECUTION', body: 'Báo giá & BOQ · Tiến độ thi công · Ảnh hiện trường' },
            { title: '📁 06_HANDOVER', body: 'Biên bản nghiệm thu · Bảo hành · Ảnh hoàn thiện' },
            { title: '📁 07_ARCHIVE', body: 'Lưu trữ toàn bộ sau khi đóng dự án' },
          ]
        },
        sort_order: 2,
      },
    ];
    const { error } = await sb.from('training_subsections').insert(fileSubs);
    if (error) console.log('❌ Subsections 4.9:', error.message);
    else console.log('✅ Đã thêm nội dung cho 4.9 (Naming + Folder)');
  }

  // === SUBSECTIONS CHO 4.10 THƯ VIỆN TÀI NGUYÊN ===
  if (linkSecId) {
    const linkSubs = [
      {
        section_id: linkSecId,
        slug: 'drive-templates',
        heading: '📂 Google Drive — Thư viện mẫu',
        content: null,
        content_type: 'items',
        metadata: {
          items: [
            { title: '🔗 Folder dự án mẫu', body: '→ [Cập nhật link Google Drive tại đây]\nChứa template folder chuẩn DQH cho mọi dự án mới' },
            { title: '🔗 CAD Block Library', body: '→ [Cập nhật link Google Drive tại đây]\nĐồ nội thất chuẩn, layer theo chuẩn DQH' },
            { title: '🔗 3D Model Library', body: '→ [Cập nhật link Google Drive tại đây]\nModel FF&E phân loại theo style (Quiet Luxury, Modern, Indochine)' },
            { title: '🔗 Material Sample Database', body: '→ [Cập nhật link Google Drive tại đây]\nMã mẫu, nhà cung cấp, giá tham khảo' },
            { title: '🔗 Design Brief Template', body: '→ [Cập nhật link Google Drive tại đây]\nForm phỏng vấn khách hàng, checklist khảo sát' },
            { title: '🔗 Presentation Template (PPT)', body: '→ [Cập nhật link Google Drive tại đây]\nPPT Concept, 3D Present, Handover chuẩn DQH' },
            { title: '🔗 BOQ & Báo giá Template', body: '→ [Cập nhật link Google Drive tại đây]\nExcel bóc tách khối lượng, báo giá thi công' },
          ]
        },
        sort_order: 1,
      },
      {
        section_id: linkSecId,
        slug: 'tool-accounts',
        heading: '🔑 Tài khoản công cụ',
        content: null,
        content_type: 'items',
        metadata: {
          items: [
            { title: 'AutoCAD / AutoDesk', body: 'Tài khoản: [cập nhật]\nMật khẩu: [hỏi Leader]\nGhi chú: Dùng bản 2024+' },
            { title: 'SketchUp Pro', body: 'Tài khoản: [cập nhật]\nMật khẩu: [hỏi Leader]\nPlugin bắt buộc: V-Ray, Enscape' },
            { title: '3ds Max + V-Ray/Corona', body: 'Tài khoản: [cập nhật]\nRender farm: [cập nhật link nếu có]' },
            { title: 'Adobe Creative Suite', body: 'Tài khoản: [cập nhật]\nPhotoshop, Illustrator, InDesign' },
            { title: 'Canva Pro (Marketing)', body: 'Tài khoản: [cập nhật]\nDùng cho social media, proposal' },
            { title: 'Google Workspace', body: 'Email: @dqh.vn hoặc [cập nhật]\nDrive, Docs, Sheets, Calendar' },
            { title: 'Notion / Quản lý dự án', body: 'Link workspace: [cập nhật]\nQuản lý task, timeline, meeting notes' },
          ]
        },
        sort_order: 2,
      },
      {
        section_id: linkSecId,
        slug: 'reference-sites',
        heading: '🌐 Trang tham khảo thiết kế',
        content: null,
        content_type: 'items',
        metadata: {
          items: [
            { title: 'Pinterest — Board DQH', body: '→ [Cập nhật link Pinterest]\nMood board theo style: Quiet Luxury, Modern, Indochine' },
            { title: 'Archdaily / Dezeen', body: 'archdaily.com · dezeen.com\nTham khảo kiến trúc & nội thất quốc tế' },
            { title: 'Behance / Dribbble', body: 'Tham khảo layout, presentation, visual direction' },
            { title: 'NCC Vật liệu ưa thích', body: '→ [Cập nhật danh sách NCC]\nGỗ, Đá, Vải, Kim loại — có mã + giá tham khảo' },
          ]
        },
        sort_order: 3,
      },
    ];
    const { error } = await sb.from('training_subsections').insert(linkSubs);
    if (error) console.log('❌ Subsections 4.10:', error.message);
    else console.log('✅ Đã thêm nội dung cho 4.10 (Drive + Accounts + References)');
  }

  console.log('\n=== HOÀN TẤT ===');
  console.log('Tab "Kỹ thuật & Kỹ năng mềm" giờ có:');
  console.log('  4.1  Hệ thống kỹ thuật ngầm');
  console.log('  4.2  Quy trình thi công (11 bước)');
  console.log('  4.3  Hồ sơ hoàn công');
  console.log('  4.4  Giao tiếp với khách hàng');
  console.log('  4.5  Kỹ năng thuyết trình');
  console.log('  4.6  Ngôn ngữ Quiet Luxury');
  console.log('  4.7  Xử lý phản hồi & Đàm phán');
  console.log('  4.8  Viết email & Báo cáo');
  console.log('  4.9  ✨ Quy chuẩn đặt tên file & Lưu trữ');
  console.log('  4.10 ✨ Thư viện Tài nguyên & Link nhanh');
}

addResources();
