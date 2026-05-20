// seed_training_hub.mjs
// ─── Idempotent seed script for Training Hub data ────────────
// Run: node seed_training_hub.mjs
// Requires: @supabase/supabase-js, dotenv

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── HELPER ──────────────────────────────────────────────────

async function upsertAndReturn(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) {
    console.error(`❌ Error inserting into ${table}:`, error.message);
    throw error;
  }
  return data;
}

// ─── MAIN ────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding Training Hub…\n");

  // ── 1. CLEAR existing data (child tables first) ────────────
  const tables = [
    "training_workflow_steps",
    "training_workflows",
    "training_subsections",
    "training_sections",
    "training_modules",
  ];
  // Note: we don't have a 6th table to clear unless it exists
  // Clear in dependency order
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.error(`⚠️  Could not clear ${t}: ${error.message}`);
    } else {
      console.log(`  🗑  Cleared ${t}`);
    }
  }
  console.log();

  // ── 2. INSERT 6 modules ────────────────────────────────────

  const modulesData = [
    {
      slug: "onboarding",
      title: "Onboarding",
      description: "Quy trình nhập môn cho thành viên mới",
      icon: "BookOpen",
      color: "#7C3AED",
      sort_order: 1,
    },
    {
      slug: "design-knowledge",
      title: "Design Knowledge",
      description: "Bộ kiến thức chuyên môn cốt lõi của DQH — triết lý, kích thước chuẩn, phong cách, case study, lỗi sai.",
      icon: "Layers",
      color: "#059669",
      sort_order: 2,
    },
    {
      slug: "workflow",
      title: "Workflow",
      description: "9 quy trình vận hành cốt lõi — mỗi bước rõ owner, deliverable, và checkpoint chất lượng.",
      icon: "Zap",
      color: "#D97706",
      sort_order: 3,
    },
    {
      slug: "tools-templates",
      title: "Tools & Templates",
      description: "Bộ công cụ và mẫu biểu chuẩn DQH",
      icon: "Settings",
      color: "#6B7280",
      sort_order: 4,
    },
    {
      slug: "estimation",
      title: "Estimation",
      description: "Dự toán sơ bộ chi phí nội thất theo phân khúc & phong cách.",
      icon: "Calculator",
      color: "#0891B2",
      sort_order: 5,
    },
    {
      slug: "sales-marketing",
      title: "Sales & Marketing",
      description: "Kỹ năng bán hàng, tiếp thị và chăm sóc khách hàng",
      icon: "Megaphone",
      color: "#DC2626",
      sort_order: 6,
    },
  ];

  const modules = await upsertAndReturn("training_modules", modulesData);
  console.log(`✅ Inserted ${modules.length} modules`);

  // Build lookup
  const moduleBySlug = {};
  for (const m of modules) {
    moduleBySlug[m.slug] = m;
  }

  // ── 3. MODULE 2 — Design Knowledge ────────────────────────

  const mod2Id = moduleBySlug["design-knowledge"].id;

  // 3a. Sections
  const designSectionsData = [
    {
      module_id: mod2Id,
      slug: "philosophy",
      number: "2.1",
      title: "Triết lý thiết kế DQH",
      description: "5 nguyên tắc Quiet Luxury — tỷ lệ, ánh sáng, vật liệu",
      icon: "Sparkles",
      content: "Quiet Luxury không phải là sự thiếu vắng — đó là sự hiện diện được kiểm soát.",
      sort_order: 1,
    },
    {
      module_id: mod2Id,
      slug: "fundamentals",
      number: "2.2",
      title: "Kiến thức nền",
      description: "Công thái học, kích thước chuẩn (mm), chiều cao trần",
      icon: "Ruler",
      content: "Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định.",
      sort_order: 2,
    },
    {
      module_id: mod2Id,
      slug: "styles",
      number: "2.3",
      title: "Style Library",
      description: "Quiet Luxury, Modern Luxury, Indochine — DNA từng style",
      icon: "Palette",
      content: "Mỗi style có DNA riêng. Hiểu sâu một style trước khi pha trộn.",
      sort_order: 3,
    },
    {
      module_id: mod2Id,
      slug: "cases",
      number: "2.4",
      title: "Case Study nội bộ",
      description: "Dự án đã làm — phân tích hay/dở, bài học",
      icon: "Layers",
      content: "Mỗi dự án là một bài học. Đây là thư viện DQH dùng để dạy lẫn nhau.",
      sort_order: 4,
    },
    {
      module_id: mod2Id,
      slug: "mistakes",
      number: "2.5",
      title: "Common Mistakes",
      description: "Lỗi sai thường gặp trong TK, Triển khai, Khách hàng",
      icon: "TriangleAlert",
      content: "Lỗi sai không phải để xấu hổ — để cả team không lặp lại.",
      sort_order: 5,
    },
  ];

  const designSections = await upsertAndReturn("training_sections", designSectionsData);
  console.log(`✅ Inserted ${designSections.length} design sections`);

  const sectionBySlug = {};
  for (const s of designSections) {
    sectionBySlug[s.slug] = s;
  }

  // 3b. Subsections
  const subsectionsData = [];

  // ── philosophy (2.1) ──────────────────────────────────────
  const philId = sectionBySlug["philosophy"].id;
  subsectionsData.push({
    section_id: philId,
    slug: "philosophy-core-principles",
    heading: "5 Nguyên tắc cốt lõi",
    content_type: "items",
    metadata: {
      items: [
        { title: "Tỷ lệ trước trang trí", body: "Một không gian đúng tỷ lệ luôn đẹp dù chưa có gì. Trang trí chỉ là lớp cuối cùng, không phải để cứu vớt bố cục sai." },
        { title: "Vật liệu kể chuyện", body: "Chọn vật liệu thật, để vân gỗ, đường vân đá, texture vải tự lên tiếng. Không che, không phủ giả." },
        { title: "Ánh sáng có lớp", body: "Tối thiểu 3 lớp: ambient (nền), task (chức năng), accent (điểm nhấn). Không bao giờ chỉ dùng đèn trần." },
        { title: "Bảng màu giới hạn", body: "Tối đa 3 màu chính + 1 accent. Quiet Luxury sống nhờ sự kiềm chế, không phải đa sắc." },
        { title: "Khoảng trống là chi tiết", body: "Negative space được tính toán như mọi chi tiết khác. Khoảng trống đắt hơn đồ đạc." },
      ],
    },
    sort_order: 1,
  });
  subsectionsData.push({
    section_id: philId,
    slug: "philosophy-material-palette",
    heading: "Material Palette chuẩn DQH",
    content_type: "items",
    metadata: {
      items: [
        { title: "Gỗ", body: "Walnut Mỹ, sồi trắng vân thẳng, teak Myanmar. Không dùng veneer giả vân nổi." },
        { title: "Đá", body: "Travertine, marble Calacatta, đá vôi Bình Định. Tránh đá nhân tạo vân quá đều." },
        { title: "Kim loại", body: "Brass brushed, blackened steel, antique bronze. Không chrome bóng." },
        { title: "Vải", body: "Linen Bỉ, bouclé wool, velvet mohair. Màu trung tính đậm." },
      ],
    },
    sort_order: 2,
  });

  // ── fundamentals (2.2) ────────────────────────────────────
  const fundId = sectionBySlug["fundamentals"].id;
  subsectionsData.push({
    section_id: fundId,
    slug: "fundamentals-dimensions",
    heading: "Kích thước công thái học (mm)",
    content_type: "table",
    metadata: {
      table: [
        ["Hạng mục", "Min", "Tiêu chuẩn", "Cao cấp"],
        ["Lối đi chính", "900", "1100", "1300+"],
        ["Lối đi phụ", "600", "750", "900"],
        ["Bàn ăn 6 người (D)", "1500", "1800", "2100"],
        ["Bàn ăn (W)", "800", "900", "1000+"],
        ["Sofa depth", "850", "950", "1050+"],
        ["Coffee table H", "350", "400", "420"],
        ["Đảo bếp H", "850", "900", "900"],
        ["Tủ bếp trên (cách sàn)", "1400", "1500", "1500+"],
        ["Bệ TV H", "400", "450", "500"],
        ["Giường master (D)", "2000", "2000", "2100"],
        ["Giường master (W)", "1600", "1800", "2000"],
      ],
    },
    sort_order: 1,
  });
  subsectionsData.push({
    section_id: fundId,
    slug: "fundamentals-ceiling-height",
    heading: "Chiều cao trần theo phân khúc",
    content_type: "items",
    metadata: {
      items: [
        { title: "Standard", body: "2700–2800mm — vừa đủ cho căn hộ thông thường" },
        { title: "Premium", body: "3000–3200mm — bắt đầu có cảm giác sang" },
        { title: "Luxury", body: "3300mm+ — không gian thở, đủ chỗ cho chandelier" },
      ],
    },
    sort_order: 2,
  });

  // ── styles (2.3) ──────────────────────────────────────────
  const styleId = sectionBySlug["styles"].id;
  subsectionsData.push({
    section_id: styleId,
    slug: "styles-quiet-luxury",
    heading: "Quiet Luxury / Japandi (Signature DQH)",
    content_type: "items",
    metadata: {
      items: [
        { title: "Palette", body: "Ivory, oat, taupe, charcoal + accent brass/aged brass" },
        { title: "Vật liệu", body: "Sồi trắng, travertine, linen, bouclé" },
        { title: "Đường nét", body: "Thẳng, sạch, soft edge — không cong điệu đà" },
        { title: "Tránh", body: "Họa tiết phức tạp, gold bóng, marble vân quá nổi" },
      ],
    },
    sort_order: 1,
  });
  subsectionsData.push({
    section_id: styleId,
    slug: "styles-modern-luxury",
    heading: "Modern Luxury",
    content_type: "items",
    metadata: {
      items: [
        { title: "Palette", body: "Charcoal, off-white, walnut + brass/champagne gold" },
        { title: "Vật liệu", body: "Walnut, Calacatta, velvet, leather" },
        { title: "Đường nét", body: "Geometric mạnh, contrast cao" },
        { title: "Tránh", body: "Quá nhiều texture mềm, palette nhạt" },
      ],
    },
    sort_order: 2,
  });
  subsectionsData.push({
    section_id: styleId,
    slug: "styles-indochine",
    heading: "Indochine đương đại",
    content_type: "items",
    metadata: {
      items: [
        { title: "Palette", body: "Cream, terracotta, jade, dark wood + brass" },
        { title: "Vật liệu", body: "Teak, rattan, gạch bông, lụa Việt" },
        { title: "Đường nét", body: "Tinh giản hóa motif Đông Dương, không lạm dụng" },
        { title: "Tránh", body: "Sao chép nguyên mẫu Pháp thuộc, kitsch" },
      ],
    },
    sort_order: 3,
  });

  // ── cases (2.4) ───────────────────────────────────────────
  const caseId = sectionBySlug["cases"].id;
  subsectionsData.push({
    section_id: caseId,
    slug: "cases-structure",
    heading: "Cấu trúc 1 case study chuẩn",
    content_type: "items",
    metadata: {
      items: [
        { title: "01. Brief & Constraint", body: "Khách là ai, ngân sách, deadline, ràng buộc kỹ thuật" },
        { title: "02. Concept & Lý do", body: "Tại sao chọn hướng này, đã loại bỏ option nào và tại sao" },
        { title: "03. Quá trình thiết kế", body: "Các iteration chính, key decisions" },
        { title: "04. Thi công thực tế", body: "Cái gì làm được, cái gì phải đổi, lý do" },
        { title: "05. Kết quả & Học được gì", body: "Phản hồi khách, lỗi muốn tránh lần sau" },
      ],
    },
    sort_order: 1,
  });
  subsectionsData.push({
    section_id: caseId,
    slug: "cases-archive",
    heading: "Dự án archive (sẽ bổ sung)",
    content_type: "items",
    metadata: {
      items: [
        { title: "UBT Office — Q3 HCM", body: "130m² · Modern Luxury · 13.5tr/m² — đang bổ sung" },
        { title: "Verosa F11 Townhouse", body: "Nhà phố 4 tầng 5×17m · Quiet Luxury — đang bổ sung" },
      ],
    },
    sort_order: 2,
  });

  // ── mistakes (2.5) ────────────────────────────────────────
  const mistId = sectionBySlug["mistakes"].id;
  subsectionsData.push({
    section_id: mistId,
    slug: "mistakes-design",
    heading: "Trong giai đoạn THIẾT KẾ",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Đặt giường đối diện cửa WC (phong thủy & thẩm mỹ)", right: "Đặt giường vuông góc hoặc lệch trục cửa WC" },
        { wrong: "Layout bếp không theo tam giác công năng (bếp – chậu – tủ lạnh)", right: "Tổng 3 điểm: 3.6–6.6m, không có điểm nào < 1.2m" },
        { wrong: "Đèn chùm phòng ăn cao hơn 90cm so với mặt bàn", right: "Đáy đèn cách bàn 75–90cm, đường kính đèn = ½ – ⅔ chiều rộng bàn" },
        { wrong: "Chọn vật liệu chỉ qua ảnh, không cầm mẫu thật", right: "Bắt buộc duyệt sample vật liệu thật trước khi trình khách" },
      ],
    },
    sort_order: 1,
  });
  subsectionsData.push({
    section_id: mistId,
    slug: "mistakes-execution",
    heading: "Trong giai đoạn TRIỂN KHAI",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bản vẽ thiếu cao độ ổ điện, công tắc", right: "Mỗi mặt tường có cao độ thiết bị điện chi tiết theo công năng" },
        { wrong: "Không có material schedule riêng — chỉ ghi trên 3D", right: "Material schedule: mã, ký hiệu, nhà CC, ghi chú thi công" },
        { wrong: "File TK / cơ điện / nội thất không coordination", right: "Drawing coordination meeting trước khi xuất full set" },
      ],
    },
    sort_order: 2,
  });
  subsectionsData.push({
    section_id: mistId,
    slug: "mistakes-client",
    heading: "Khi LÀM VIỆC VỚI KHÁCH",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Hứa miệng 'phát sinh nhỏ không tính tiền'", right: "Mọi thay đổi có change order văn bản, dù 0đ" },
        { wrong: "Trình concept bằng mood board chung chung, không vật liệu", right: "Mood board kèm vật liệu cụ thể + budget implication" },
      ],
    },
    sort_order: 3,
  });

  const subsections = await upsertAndReturn("training_subsections", subsectionsData);
  console.log(`✅ Inserted ${subsections.length} design subsections`);

  // ── 4. MODULE 3 — Workflow ────────────────────────────────

  const mod3Id = moduleBySlug["workflow"].id;

  const workflowsData = [
    {
      module_id: mod3Id,
      slug: "client-meeting",
      number: "3.1",
      title: "Gặp khách & Tư vấn",
      description: "Tiếp khách lần đầu đến ký hợp đồng",
      icon: "Users",
      lead_quote: "Lần gặp đầu tiên quyết định 70% khả năng ký HĐ.",
      checklist: [
        "Brochure & bảng giá phân khúc đã in",
        "3–5 case study chuẩn bị (in hoặc iPad)",
        "Sample vật liệu signature (gỗ, đá, vải) mang theo",
        "Intake questionnaire sẵn sàng",
      ],
      sort_order: 1,
    },
    {
      module_id: mod3Id,
      slug: "design-process",
      number: "3.2",
      title: "Quy trình thiết kế",
      description: "Concept → 3D → Bản vẽ kỹ thuật",
      icon: "Sparkles",
      lead_quote: "Mỗi giai đoạn có deliverable cụ thể — không bỏ qua bước nào.",
      checklist: [
        "Mỗi giai đoạn có biên bản xác nhận của khách",
        "Không bắt đầu giai đoạn sau khi chưa duyệt giai đoạn trước",
        "Mọi thay đổi sau khi duyệt = change order",
      ],
      sort_order: 2,
    },
    {
      module_id: mod3Id,
      slug: "handover",
      number: "3.3",
      title: "Bàn giao TK → Triển khai → Thi công",
      description: "Chuyển giao giữa các bộ phận",
      icon: "RefreshCw",
      lead_quote: "Điểm dễ rớt thông tin nhất. Quy trình chặt = ít rework.",
      checklist: null,
      sort_order: 3,
    },
    {
      module_id: mod3Id,
      slug: "file-naming",
      number: "3.4",
      title: "Lưu file & Naming Convention",
      description: "Quy chuẩn đặt tên, version control",
      icon: "FileText",
      lead_quote: "Một file sai tên = 30 phút tìm kiếm của cả team.",
      checklist: null,
      sort_order: 4,
    },
    {
      module_id: mod3Id,
      slug: "library",
      number: "3.5",
      title: "Thư viện vật liệu & Block",
      description: "CAD blocks, 3D models, material",
      icon: "Package",
      lead_quote: "Thư viện chung tiết kiệm thời gian + đảm bảo nhất quán.",
      checklist: null,
      sort_order: 5,
    },
    {
      module_id: mod3Id,
      slug: "storage",
      number: "3.6",
      title: "Lưu trữ dự án",
      description: "Cấu trúc folder chuẩn DQH",
      icon: "FolderOpen",
      lead_quote: "Một cấu trúc folder duy nhất cho mọi dự án — không sáng tạo riêng.",
      checklist: null,
      sort_order: 6,
    },
    {
      module_id: mod3Id,
      slug: "standards",
      number: "3.7",
      title: "Tiêu chuẩn đầu ra theo phân khúc",
      description: "Deliverable theo từng tier",
      icon: "ClipboardList",
      lead_quote: "Khách trả ngân sách khác nhau — kỳ vọng đầu ra cũng phải khác.",
      checklist: null,
      sort_order: 7,
    },
    {
      module_id: mod3Id,
      slug: "change-order",
      number: "3.8",
      title: "Xử lý phát sinh & Thay đổi",
      description: "Change request, change order",
      icon: "GitBranch",
      lead_quote: "Không có thay đổi miễn phí. Mọi thay đổi đều có giấy tờ — dù 0đ.",
      checklist: null,
      sort_order: 8,
    },
    {
      module_id: mod3Id,
      slug: "handover-client",
      number: "3.9",
      title: "Nghiệm thu & Hậu mãi",
      description: "Bàn giao khách, bảo hành",
      icon: "CheckCircle2",
      lead_quote: "Bàn giao tốt = giới thiệu khách mới. Hậu mãi tốt = thương hiệu bền.",
      checklist: null,
      sort_order: 9,
    },
  ];

  const workflows = await upsertAndReturn("training_workflows", workflowsData);
  console.log(`✅ Inserted ${workflows.length} workflows`);

  const wfBySlug = {};
  for (const w of workflows) {
    wfBySlug[w.slug] = w;
  }

  // ── 5. Workflow Steps ─────────────────────────────────────

  const stepsData = [];

  // ── client-meeting (3.1) ──────────────────────────────────
  const cmId = wfBySlug["client-meeting"].id;
  stepsData.push({
    workflow_id: cmId,
    phase: "Trước cuộc gặp",
    owner: "Sales / Leader",
    actions: [
      "Nghiên cứu khách: FB, Zalo, profile — nghề nghiệp, gia đình, taste",
      "Chuẩn bị 3–5 case study DQH match taste khách",
      "In brochure + bảng giá phân khúc",
      "Xác nhận thời gian, địa điểm trước 1 ngày",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Tại cuộc gặp (60–90 phút)",
    owner: "Sales + Designer Lead",
    actions: [
      "10p: Phá băng, hiểu khách (gia đình, lối sống, sở thích)",
      "20p: Khách trình bày nhu cầu, mặt bằng, mong muốn",
      "20p: DQH trình bày triết lý, case study tương đồng",
      "20p: Thảo luận sơ bộ budget, timeline, scope",
      "10p: Chốt next step, lịch khảo sát",
    ],
    sort_order: 2,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Sau cuộc gặp (trong 24h)",
    owner: "Sales",
    actions: [
      "Gửi follow-up qua Zalo cảm ơn",
      "Gửi proposal sơ bộ nếu đủ thông tin",
      "Tạo client folder trên Drive, log vào CRM",
      "Báo cáo Leader: khả năng chốt, hướng tiếp cận",
    ],
    sort_order: 3,
    metadata: null,
  });

  // ── design-process (3.2) ──────────────────────────────────
  const dpId = wfBySlug["design-process"].id;
  stepsData.push({
    workflow_id: dpId,
    phase: "Concept (5–7 ngày)",
    owner: "Lead Designer",
    actions: [
      "Mood board + concept statement",
      "Phương án bố cục 2D (2–3 option)",
      "Material direction sơ bộ",
      "Trình khách duyệt concept",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "3D Visualization (7–10 ngày)",
    owner: "Designer + Diễn họa",
    actions: [
      "Phát triển 3D theo concept đã duyệt",
      "Render 3–5 góc chính mỗi không gian",
      "Material schedule sơ bộ",
      "Trình khách duyệt 3D",
    ],
    sort_order: 2,
    metadata: null,
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "Technical Drawing (10–14 ngày)",
    owner: "Designer + Triển khai",
    actions: [
      "Mặt bằng bố trí, mặt bằng cao độ",
      "Mặt đứng từng mặt tường",
      "Chi tiết tủ kệ, đồ rời",
      "Bảng vật liệu hoàn thiện",
      "Phối hợp cơ điện",
    ],
    sort_order: 3,
    metadata: null,
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "Bàn giao thi công",
    owner: "Triển khai + Leader",
    actions: [
      "Full set bản vẽ in & file",
      "Material schedule final",
      "Họp brief đội thi công",
      "Setup kênh báo cáo (Zalo + App QLDA)",
    ],
    sort_order: 4,
    metadata: null,
  });

  // ── handover (3.3) ────────────────────────────────────────
  const hoId = wfBySlug["handover"].id;
  stepsData.push({
    workflow_id: hoId,
    phase: "TK → Triển khai",
    owner: "Designer → Drafter",
    actions: [
      "Họp bàn giao 60p: walkthrough toàn bộ file",
      "Designer giải thích ý đồ, key details",
      "Drafter list điểm chưa rõ, deadline phản hồi 2 ngày",
      "Designer ký xác nhận handover sheet",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: hoId,
    phase: "Triển khai → Thi công",
    owner: "Drafter + Leader → Site team",
    actions: [
      "Họp brief 90p: walkthrough full set",
      "Material schedule + nhà cung cấp",
      "Timeline thi công chi tiết",
      "Kênh báo cáo: Zalo group + App QLDA",
      "Designer/Drafter cam kết on-call",
    ],
    sort_order: 2,
    metadata: null,
  });

  // ── file-naming (3.4) ─────────────────────────────────────
  const fnId = wfBySlug["file-naming"].id;
  stepsData.push({
    workflow_id: fnId,
    phase: "Format tên file",
    owner: "Toàn team",
    actions: [
      "Format: [DỰ_ÁN]_[HẠNG_MỤC]_[VERSION]_[NGÀY]_[INITIALS]",
      "VD: VEROSA_F11_MB-T1_V03_20260518_QH.dwg",
      "Hạng mục: MB (mặt bằng), MD (mặt đứng), CT (chi tiết), 3D, REND",
      "Version: V01, V02... mỗi lần khách duyệt +1",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: fnId,
    phase: "Quy tắc bất di bất dịch",
    owner: "Toàn team",
    actions: [
      "Không dùng tiếng Việt có dấu trong tên file",
      "Không khoảng trắng — dùng dấu _ hoặc -",
      "Không 'FINAL', 'FINAL_FINAL' — dùng V03_APPROVED",
      "File khách duyệt: thêm hậu tố _APPROVED",
    ],
    sort_order: 2,
    metadata: null,
  });

  // ── library (3.5) ─────────────────────────────────────────
  const libId = wfBySlug["library"].id;
  stepsData.push({
    workflow_id: libId,
    phase: "CAD Block Library",
    owner: "Lead + Drafter",
    actions: [
      "Đồ nội thất chuẩn theo kích thước công thái học",
      "Layer theo chuẩn DQH",
      "Lưu tại Drive/DQH_LIBRARY/CAD_BLOCKS/",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: libId,
    phase: "3D Model Library",
    owner: "Lead + Diễn họa",
    actions: [
      "Model FF&E phân loại theo style",
      "Lưu tại Drive/DQH_LIBRARY/3D_MODELS/",
    ],
    sort_order: 2,
    metadata: null,
  });
  stepsData.push({
    workflow_id: libId,
    phase: "Material Sample (vật lý)",
    owner: "Office Manager",
    actions: [
      "Tủ mẫu tại văn phòng, code trùng với file",
      "Update khi có vật liệu mới",
    ],
    sort_order: 3,
    metadata: null,
  });

  // ── storage (3.6) — tree structure ────────────────────────
  const stId = wfBySlug["storage"].id;
  const folderTree = `📁 [PROJECT_NAME]/
├── 📁 01_BRIEF & CONTRACT
│   ├── Brief khách
│   ├── Hợp đồng
│   └── Khảo sát hiện trạng
├── 📁 02_CONCEPT
│   ├── Mood board
│   ├── Concept statement
│   └── Material direction
├── 📁 03_DESIGN
│   ├── 2D Drawings
│   ├── 3D Models
│   └── Renders
├── 📁 04_TECHNICAL
│   ├── Bản vẽ kỹ thuật
│   ├── Material schedule
│   └── Phối hợp MEP
├── 📁 05_EXECUTION
│   ├── Báo giá & BOQ
│   ├── Tiến độ thi công
│   └── Hình ảnh hiện trường
├── 📁 06_HANDOVER
│   ├── Biên bản nghiệm thu
│   ├── Bảo hành
│   └── Hình ảnh hoàn thiện
└── 📁 07_ARCHIVE`;

  stepsData.push({
    workflow_id: stId,
    phase: "Cấu trúc folder chuẩn",
    owner: "Toàn team",
    actions: [folderTree],
    sort_order: 1,
    metadata: null,
  });

  // ── standards (3.7) — tiers ───────────────────────────────
  const stdId = wfBySlug["standards"].id;
  stepsData.push({
    workflow_id: stdId,
    phase: "Tiêu chuẩn đầu ra theo phân khúc",
    owner: "Lead Designer",
    actions: [],
    sort_order: 1,
    metadata: {
      tiers: [
        {
          name: "Tier 1 — Standard (8–10tr/m²)",
          color: "#6B7280",
          deliverables: [
            "Concept 1 phương án",
            "3D 3–5 góc chính/không gian",
            "Bản vẽ kỹ thuật cơ bản",
            "Material schedule chuẩn",
          ],
        },
        {
          name: "Tier 2 — Premium (12–15tr/m²)",
          color: "#7C3AED",
          deliverables: [
            "Concept 2 phương án",
            "3D 5–8 góc + animation key spaces",
            "Bản vẽ kỹ thuật chi tiết",
            "Material sample physical trình khách",
            "Coordination MEP đầy đủ",
          ],
        },
        {
          name: "Tier 3 — Luxury (18tr+/m²)",
          color: "#D97706",
          deliverables: [
            "Concept 3 phương án + mood board cinematic",
            "3D toàn bộ + walkthrough video",
            "Bản vẽ kỹ thuật cấp thi công cao cấp",
            "Sample box vật liệu giao tận nơi",
            "Coordination MEP + AV + smart home",
            "Site visit hàng tuần với Lead Designer",
          ],
        },
      ],
    },
  });

  // ── change-order (3.8) ────────────────────────────────────
  const coId = wfBySlug["change-order"].id;
  stepsData.push({
    workflow_id: coId,
    phase: "Khi khách yêu cầu thay đổi",
    owner: "Sales / PM",
    actions: [
      "Tiếp nhận qua văn bản (Zalo, email — KHÔNG miệng)",
      "Đánh giá impact: chi phí, thời gian, kỹ thuật",
      "Lập Change Order Sheet trong 24–48h",
      "Khách ký xác nhận TRƯỚC khi thực hiện",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: coId,
    phase: "Change Order Sheet gồm",
    owner: "—",
    actions: [
      "Mô tả thay đổi (trước & sau)",
      "Chi phí phát sinh (+/– VND)",
      "Thay đổi timeline (+/– ngày)",
      "Tác động đến hạng mục khác",
      "Chữ ký khách + DQH",
    ],
    sort_order: 2,
    metadata: null,
  });

  // ── handover-client (3.9) ─────────────────────────────────
  const hcId = wfBySlug["handover-client"].id;
  stepsData.push({
    workflow_id: hcId,
    phase: "Nghiệm thu",
    owner: "PM + Leader",
    actions: [
      "Punch list trước nghiệm thu chính thức",
      "Vệ sinh tổng thể, styling đồ trang trí",
      "Bàn giao key + tài liệu (bảo hành, hướng dẫn)",
      "Biên bản nghiệm thu ký xác nhận",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: hcId,
    phase: "Hậu mãi",
    owner: "PM",
    actions: [
      "Tuần 1: gọi check feedback ban đầu",
      "Tháng 1: visit check chất lượng",
      "Tháng 6: visit + maintenance miễn phí",
      "Năm 1: thư cảm ơn + lời mời giới thiệu",
    ],
    sort_order: 2,
    metadata: null,
  });

  const steps = await upsertAndReturn("training_workflow_steps", stepsData);
  console.log(`✅ Inserted ${steps.length} workflow steps`);

  // ── 6. PLACEHOLDER SECTIONS for Modules 1, 4, 6 ──────────

  const placeholderSections = [];

  // Module 1 — Onboarding
  const mod1Id = moduleBySlug["onboarding"].id;
  placeholderSections.push({
    module_id: mod1Id,
    slug: "onboarding-welcome",
    number: "1.1",
    title: "Chào mừng thành viên mới",
    description: "Giới thiệu công ty, văn hóa, đội ngũ",
    icon: "BookOpen",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 1,
  });
  placeholderSections.push({
    module_id: mod1Id,
    slug: "onboarding-checklist",
    number: "1.2",
    title: "Checklist ngày đầu",
    description: "Danh sách việc cần làm tuần đầu tiên",
    icon: "ClipboardList",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 2,
  });

  // Module 4 — Tools & Templates
  const mod4Id = moduleBySlug["tools-templates"].id;
  placeholderSections.push({
    module_id: mod4Id,
    slug: "tools-overview",
    number: "4.1",
    title: "Tổng quan công cụ",
    description: "Phần mềm, ứng dụng và công cụ DQH sử dụng",
    icon: "Settings",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 1,
  });
  placeholderSections.push({
    module_id: mod4Id,
    slug: "tools-templates-library",
    number: "4.2",
    title: "Thư viện mẫu biểu",
    description: "Template báo giá, hợp đồng, biên bản",
    icon: "FileText",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 2,
  });

  // Module 6 — Sales & Marketing
  const mod6Id = moduleBySlug["sales-marketing"].id;
  placeholderSections.push({
    module_id: mod6Id,
    slug: "sales-skills",
    number: "6.1",
    title: "Kỹ năng bán hàng",
    description: "Cách tiếp cận, tư vấn và chốt deal",
    icon: "Megaphone",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 1,
  });
  placeholderSections.push({
    module_id: mod6Id,
    slug: "marketing-content",
    number: "6.2",
    title: "Content Marketing",
    description: "Chiến lược nội dung, social media, portfolio",
    icon: "Megaphone",
    content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
    sort_order: 2,
  });

  const phSections = await upsertAndReturn("training_sections", placeholderSections);
  console.log(`✅ Inserted ${phSections.length} placeholder sections (Modules 1, 4, 6)`);

  // ── DONE ──────────────────────────────────────────────────
  console.log("\n🎉 Training Hub seeded successfully!");
  console.log(`   Modules:      ${modules.length}`);
  console.log(`   Sections:     ${designSections.length + phSections.length}`);
  console.log(`   Subsections:  ${subsections.length}`);
  console.log(`   Workflows:    ${workflows.length}`);
  console.log(`   WF Steps:     ${steps.length}`);
}

seed().catch((err) => {
  console.error("💥 Seed failed:", err);
  process.exit(1);
});
