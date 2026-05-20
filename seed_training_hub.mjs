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
  console.log("🌱 Seeding Training Hub (v3.0 — Full Content)…\n");

  // ── 1. CLEAR existing data (child tables first) ────────────
  const tables = [
    "training_workflow_steps",
    "training_workflows",
    "training_subsections",
    "training_sections",
    "training_modules",
  ];
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
      title: "Foundation",
      description: "Nền tảng DQH — Vision, Mission, Core Values, Brand DNA, Tư duy Thiết kế Thực chiến",
      icon: "BookOpen",
      color: "#7C3AED",
      sort_order: 1,
    },
    {
      slug: "design-knowledge",
      title: "Design Knowledge",
      description: "Bộ kiến thức chuyên môn cốt lõi của DQH — triết lý, kích thước chuẩn, vật liệu, phong cách, case study, lỗi sai.",
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
      title: "Technical Infrastructure",
      description: "Kỹ thuật hạ tầng & tiêu chuẩn tương lai — hệ thống kỹ thuật ngầm, quy trình thi công, hồ sơ hoàn công.",
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
  for (const m of modules) moduleBySlug[m.slug] = m;

  // ══════════════════════════════════════════════════════════════
  // MODULE 1 — FOUNDATION (Nền tảng DQH)
  // ══════════════════════════════════════════════════════════════

  const mod1Id = moduleBySlug["onboarding"].id;

  const mod1SectionsData = [
    {
      module_id: mod1Id,
      slug: "vision-mission-philosophy",
      number: "1.1",
      title: "Vision & Mission & Philosophy",
      description: "Tầm nhìn, sứ mệnh và triết lý cốt lõi của DQH",
      icon: "Compass",
      content: "\"Quiet Luxury\" — Sang trọng không cần phô trương.",
      sort_order: 1,
    },
    {
      module_id: mod1Id,
      slug: "core-values",
      number: "1.2",
      title: "Core Values (5 Giá trị cốt lõi)",
      description: "EXCELLENCE, OWNERSHIP, CRAFT, RESPECT, GROWTH",
      icon: "Heart",
      content: "5 giá trị định hình cách DQH làm việc mỗi ngày.",
      sort_order: 2,
    },
    {
      module_id: mod1Id,
      slug: "brand-dna",
      number: "1.3",
      title: "Brand DNA — Quiet Luxury",
      description: "Định nghĩa và 5 yếu tố cốt lõi của Quiet Luxury",
      icon: "Diamond",
      content: "Quiet Luxury là sự sang trọng thể hiện qua chất lượng vật liệu, tỷ lệ không gian, craftsmanship — thay vì logo, họa tiết, hay số lượng đồ đạc.",
      sort_order: 3,
    },
    {
      module_id: mod1Id,
      slug: "design-thinking",
      number: "1.4",
      title: "Tư duy Thiết kế Thực chiến",
      description: "5 Nhóm Cốt Lõi — từ không gian, đối lưu, công năng, giao thông đến ngôn ngữ kiến trúc",
      icon: "Lightbulb",
      content: "Tư duy thực chiến giúp Designer giải bài toán thực tế, không chỉ vẽ hình đẹp.",
      sort_order: 4,
    },
    {
      module_id: mod1Id,
      slug: "master-suite",
      number: "1.5",
      title: "Master Suite — Khách sạn 5 sao tại gia",
      description: "Trục di chuyển, khu sinh hoạt chung, khu ngủ, Walk-in Closet",
      icon: "BedDouble",
      content: "Master Suite được thiết kế như khách sạn 5 sao — nơi gia chủ tận hưởng mỗi ngày.",
      sort_order: 5,
    },
    {
      module_id: mod1Id,
      slug: "job-descriptions",
      number: "1.6",
      title: "Job Descriptions (7 Vị trí)",
      description: "Chi tiết các vị trí trong DQH",
      icon: "Users",
      content: "Nội dung đang được xây dựng — sẽ bổ sung trong phiên bản tiếp theo.",
      sort_order: 6,
    },
  ];

  const mod1Sections = await upsertAndReturn("training_sections", mod1SectionsData);
  console.log(`✅ Inserted ${mod1Sections.length} Module 1 sections`);

  const sec1BySlug = {};
  for (const s of mod1Sections) sec1BySlug[s.slug] = s;

  // ── Module 1 Subsections ──────────────────────────────────

  const mod1Subsections = [];

  // ── 1.1 Vision & Mission & Philosophy ─────────────────────
  const vmpId = sec1BySlug["vision-mission-philosophy"].id;

  mod1Subsections.push({
    section_id: vmpId,
    slug: "tam-nhin",
    heading: "TẦM NHÌN",
    content: "Trở thành studio thiết kế & thi công nội thất được lựa chọn hàng đầu tại TP.HCM trong phân khúc cao cấp — nơi mỗi không gian được tạo ra là một tác phẩm phản ánh bản sắc và phong cách sống của gia chủ.",
    content_type: "text",
    metadata: null,
    sort_order: 1,
  });

  mod1Subsections.push({
    section_id: vmpId,
    slug: "su-menh",
    heading: "SỨ MỆNH",
    content: "DQH kiến tạo những không gian sống tinh tế, có chiều sâu và bền vững — nơi nghệ thuật thiết kế gặp gỡ chất lượng thi công. Chúng tôi đồng hành với khách hàng từ ý tưởng đầu tiên đến khoảnh khắc bàn giao, mang lại trải nghiệm đẳng cấp ở mọi điểm chạm.",
    content_type: "text",
    metadata: null,
    sort_order: 2,
  });

  mod1Subsections.push({
    section_id: vmpId,
    slug: "triet-ly",
    heading: "TRIẾT LÝ",
    content: "\"Quiet Luxury\" — Sang trọng không cần phô trương. Vẻ đẹp thực sự đến từ tỷ lệ chuẩn mực, vật liệu chân thực, và sự kiềm chế có chủ ý. Không gian tốt nhất là không gian người ta cảm nhận được mà không thể giải thích tại sao.",
    content_type: "text",
    metadata: null,
    sort_order: 3,
  });

  // ── 1.2 Core Values ──────────────────────────────────────
  const cvId = sec1BySlug["core-values"].id;

  mod1Subsections.push({
    section_id: cvId,
    slug: "core-values-list",
    heading: "5 Giá trị cốt lõi",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "EXCELLENCE — Chất lượng không thỏa hiệp",
          body: "Mỗi quyết định — từ chọn vật liệu đến cách đóng đinh — đều đặt tiêu chuẩn chất lượng lên hàng đầu.\n• Duyệt sample vật liệu thật trước khi trình khách\n• Không bỏ qua coordination bản vẽ dù tight deadline\n• Phát hiện lỗi thi công → dừng, sửa, không che",
        },
        {
          title: "OWNERSHIP — Chủ động và có trách nhiệm",
          body: "Mỗi người trong team là chủ của phần việc mình phụ trách. Sai thì nhận, sửa, học — không đổ lỗi.\n• Thấy lỗi của người khác → báo ngay\n• Deadline đang nguy → raise flag sớm\n• Phần việc của mình → tự track, không cần nhắc",
        },
        {
          title: "CRAFT — Sáng tạo có căn cứ",
          body: "Sáng tạo là giải quyết bài toán thực tế của khách bằng giải pháp đẹp nhất. Mọi quyết định thiết kế cần lý do, không chỉ cảm giác.\n• Trình concept: giải thích tại sao, không chỉ là gì\n• Tham khảo trend nhưng lọc qua lăng kính DQH\n• Feedback nội bộ được khuyến khích",
        },
        {
          title: "RESPECT — Tôn trọng và thẳng thắn",
          body: "Chúng ta nói thẳng về vấn đề — với khách, với nhau — nhưng luôn với thái độ xây dựng và giải pháp đi kèm.\n• Không đồng ý → nói trực tiếp, không than vãn\n• Feedback phải cụ thể, không chỉ 'không đẹp'\n• Khách yêu cầu sai → tư vấn thẳng, giải thích tại sao",
        },
        {
          title: "GROWTH — Phát triển không ngừng",
          body: "DQH kỳ vọng mỗi thành viên chủ động học, cập nhật, và chia sẻ kiến thức mới.\n• Mỗi dự án hoàn thành → review 1 bài học rút ra\n• Follow ít nhất 5 studio quốc tế\n• Chia sẻ kiến thức mới trong team meeting hàng tuần",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 1.3 Brand DNA — Quiet Luxury ─────────────────────────
  const bdId = sec1BySlug["brand-dna"].id;

  mod1Subsections.push({
    section_id: bdId,
    slug: "brand-dna-definition",
    heading: "ĐỊNH NGHĨA",
    content: "Quiet Luxury là sự sang trọng thể hiện qua chất lượng vật liệu, tỷ lệ không gian, craftsmanship — thay vì logo, họa tiết, hay số lượng đồ đạc.",
    content_type: "text",
    metadata: null,
    sort_order: 1,
  });

  mod1Subsections.push({
    section_id: bdId,
    slug: "brand-dna-5-elements",
    heading: "5 Yếu tố Cốt lõi",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "1. Subtlety over Display",
          body: "Không logo, không phô trương. Vẻ đẹp được thể hiện qua chất lượng thực — vân gỗ thật, đường vân đá, texture vải.",
        },
        {
          title: "2. Craftsmanship & Materiality",
          body: "Vật liệu chân thực (gỗ, đá, linen, cashmere) được chọn vì chúng 'aging well' — càng dùng lâu, càng có hồn.",
        },
        {
          title: "3. Timelessness & Restraint",
          body: "Không follow trend ngắn hạn. Mỗi quyết định: 'Cái này còn đẹp trong 10 năm nữa không?' Palette: neutral. Không bold color.",
        },
        {
          title: "4. Intentionality & Meaning",
          body: "Không có thứ gì 'có vô vì có'. Mỗi vật dụng, mỗi chi tiết phải có lý do tồn tại — thực dụng hoặc cảm xúc.",
        },
        {
          title: "5. Emotional Comfort over Status",
          body: "Luxury = cảm giác 'thật thoải mái, thật bình yên'. Mental peace > Instagram-worthy.",
        },
      ],
    },
    sort_order: 2,
  });

  // ── 1.4 Tư duy Thiết kế Thực chiến ───────────────────────
  const dtId = sec1BySlug["design-thinking"].id;

  // NHÓM 1
  mod1Subsections.push({
    section_id: dtId,
    slug: "nhom-1-ban-khong-gian",
    heading: "NHÓM 1: BÁN KHÔNG GIAN, KHÔNG BÁN VẬT LIỆU",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Không gian là Vĩnh cửu, Vật liệu là Tạm thời",
          body: "Cấu trúc nhà, đối lưu gió, ánh sáng đi theo gia chủ cả đời. Microcement đắt đỏ, dễ nứt. Gạch bóng trend — lỗi mốt 3 năm.",
        },
        {
          title: "Vẻ đẹp của sự \"Basic\"",
          body: "Gạch nền chỉ cần <500k/m² nhưng matching, êm ái, chuẩn ron. Càng basic, nhà càng tinh tế, không bao giờ lỗi mốt. Đừng ép khách mua vật liệu đắt tiền.",
        },
        {
          title: "Chuyển dịch ngân sách đầu tư",
          body: "Dồn tiền từ vật liệu ốp lát sang đầu tư những thứ phục vụ sức khỏe: Nệm xịn (thay vì giường xịn), thiết bị bếp thông minh, thiết bị vệ sinh cao cấp.",
        },
      ],
    },
    sort_order: 1,
  });

  // NHÓM 2
  mod1Subsections.push({
    section_id: dtId,
    slug: "nhom-2-phan-lop-doi-luu",
    heading: "NHÓM 2: PHÂN LỚP KHÔNG GIAN & ĐỐI LƯU TỰ NHIÊN",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "3 Lớp Không Gian Tiêu Chuẩn",
          body: "① Ngoài trời (Tự nhiên 100%)\n② Vùng đệm ½ tự nhiên: Tiền sảnh, sân sau, Terrace có mái che — \"vũ khí\" để ngắm mưa nắng mà không bị hắt nước\n③ Trong nhà (Sinh hoạt khép kín)",
        },
        {
          title: "Ban công là vô dụng — Terrace mới là đẳng cấp",
          body: "Ban công nhỏ hẹp không ai ra đứng. Làm Terrace trồng cây, quầy bar nhỏ, ghế lười. Cây xanh tạo rèm tự nhiên bảo vệ sự riêng tư cho phòng ngủ.",
        },
        {
          title: "Đối lưu 2 chiều (Bắt buộc)",
          body: "Một phòng chỉ 1 cửa sổ = phòng chết (hầm nóng). Bắt buộc 2 cửa đối diện/chéo để ép gió 'vào đầu này, ra đầu kia'. Không khí tươi mới không cần điều hòa.",
        },
      ],
    },
    sort_order: 2,
  });

  // NHÓM 3
  mod1Subsections.push({
    section_id: dtId,
    slug: "nhom-3-cong-nang-ergonomics",
    heading: "NHÓM 3: CÔNG NĂNG & ERGONOMICS (TIỆN THÁI HỌC)",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Hệ sinh thái Bếp — 4 phân khu",
          body: "① Lưu trữ khô: Tủ lạnh + tủ đồ khô (gia vị, snack)\n② Thiết bị điện tử: Lò nướng, vi sóng, nồi cơm gom 1 hệ tủ có hút mùi riêng\n③ Nấu & Rửa sống: Bếp từ + Bồn rửa thịt cá + Bẫy tách mỡ\n④ Bàn Đảo (Rửa chín): CHỈ rửa rau, trái cây ăn liền — TUYỆT ĐỐI không rửa thịt cá (nguy hiểm lây nhiễm)",
        },
        {
          title: "Bếp Phụ (Dirty Kitchen)",
          body: "Ở góc khuất phía sau. Tủ đông, bếp ga nấu món nặng mùi, khu giặt phơi khăn.",
        },
        {
          title: "Kho chứa đồ vô hình",
          body: "Chủ ý để góc nhỏ làm kho: chổi, cây lau, hộp dụng cụ, thang nhôm. Nhà đẹp nhưng chổi gác khắp nơi = thất bại.",
        },
        {
          title: "Đôn bục máy giặt",
          body: "Cao 60cm — Khách đứng thao tác không bị cụp lưng. Gầm dưới để sọt kéo đồ dơ.",
        },
        {
          title: "Gen đồ dơ liên tầng",
          body: "Ống thả đồ từ phòng thay đồ (Master) rớt xuống giỏ đồ dơ ở khu giặt sấy. Không cần xách đồ đi cầu thang.",
        },
        {
          title: "Tủ giày hở gầm",
          body: "Gầm 15–20cm — Khách đá giày vào không cần mở cánh. Kèm ghế Bench để ngồi mang giày.",
        },
      ],
    },
    sort_order: 3,
  });

  // NHÓM 4
  mod1Subsections.push({
    section_id: dtId,
    slug: "nhom-4-giao-thong-che-giau",
    heading: "NHÓM 4: GIAO THÔNG MẠCH LẠC & CHE GIẤU",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Phân luồng tiếp cận từ ngoài",
          body: "Cổng chính (Ô tô) + Cổng phụ (Xe máy - đi làm về không cần mở cổng lớn).",
        },
        {
          title: "Hành lang bên hông (Side Corridor)",
          body: "Tuyến đường sinh mệnh thứ 2. Từ cổng ngoài vào bếp phụ, ra sân sau hoặc WC chung mà không dẫm qua phòng khách.",
        },
        {
          title: "Sảnh đệm (Lobby/Tiền sảnh)",
          body: "Không bao giờ mở cửa phòng nhìn thông thống vào khu vực giường ngủ hay sinh hoạt. Phải có sảnh đệm (bàn console, tranh) làm vách ngăn thị giác. Dù mở cửa 24/24 người ngoài vẫn không thấy sinh hoạt riêng.",
        },
        {
          title: "Tư duy Backup — Thiết kế Mở cho Tương lai",
          body: "Khách đòi 2 phòng cho 2 con nhỏ chưa cần ngủ riêng?\n• Đập thông 2 phòng thành 1 đại công trường vui chơi\n• Phần thô (ống nước, hố ga, dây điện) đi sẵn dưới sàn\n• 3–5 năm sau: đặt hệ tủ kịch trần = 2 phòng riêng. Không xây gạch, không bụi.",
        },
      ],
    },
    sort_order: 4,
  });

  // NHÓM 5
  mod1Subsections.push({
    section_id: dtId,
    slug: "nhom-5-ngon-ngu-kien-truc",
    heading: "NHÓM 5: NGÔN NGỮ KIẾN TRÚC & NỘI THẤT",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Giảm thiểu tường xây (Minimal Solid Walls)",
          body: "Càng giảm tường xây, nhà càng tinh tế. Không dùng tường gạch trừ WC. Thay bằng vách kính, cửa trượt, hệ tủ hai mặt.",
        },
        {
          title: "Đóng khung góc nhìn (Framing the View)",
          body: "Cửa sổ, ô thoáng như 'bức tranh sống'. Tính toán tỷ lệ ô kính bắt trọn cành cây, khoảng sân. KTS quyết định chủ nhà sẽ nhìn thấy gì khi thức dậy.",
        },
        {
          title: "Ánh sáng gián tiếp (Indirect Lighting)",
          body: "Trong khu thư giãn (Master, WC): 100% ánh sáng gián tiếp (hắt trần, hắt khe tường, hắt gương). Tuyệt đối không đèn rọi thẳng vào mắt.",
        },
        {
          title: "Tôn vinh vật liệu bản địa & Rustic",
          body: "Vật liệu thô mộc càng dùng lâu càng có hồn. Tránh Microcement ở vùng thời tiết khắc nghiệt — co ngót cao, nứt mẻ, đắt gấp 5 lần gạch.",
        },
        {
          title: "Nội thất Bespoke — Trang trí bằng cảm xúc",
          body: "KTS hỏi khách hay đọc gì, sưu tầm gì. Tủ sách đúng kích thước từng cuốn. Gallery Wall: 20–30 khung ảnh gia đình bố cục ngẫu nhiên. Góc check-in theo mùa có ổ cắm sẵn sàng.",
        },
      ],
    },
    sort_order: 5,
  });

  // ── 1.5 Master Suite ──────────────────────────────────────
  const msId = sec1BySlug["master-suite"].id;

  mod1Subsections.push({
    section_id: msId,
    slug: "master-suite-details",
    heading: "Master Suite — Khách sạn 5 sao tại gia",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Trục di chuyển chuẩn",
          body: "Sảnh đệm → Khu sinh hoạt chung → Phòng ngủ → Walk-in Closet → WC",
        },
        {
          title: "Khu sinh hoạt chung",
          body: "Tách khỏi giường ngủ. Sofa nhỏ, bàn làm việc, tủ Pantry pha trà/cafe. Con cái có thể lên chơi với bố mẹ mà không xâm phạm khu giường ngủ.",
        },
        {
          title: "Khu vực Ngủ thuần túy",
          body: "TUYỆT ĐỐI không TV. Chỉ giường xịn + cửa kính mở rộng tối đa ra Terrace. Khung cảnh cây xanh thay thế màn hình điện tử.",
        },
        {
          title: "Walk-in Closet (Phòng thay đồ)",
          body: "Hệ tủ không cánh hở hoàn toàn. Luồng rõ ràng: Cởi đồ dơ → Mặc đồ nhà → Bàn trang điểm toàn thân. Có \"Mặt thất\" (ngăn kéo ẩn) cất giấy tờ quan trọng.",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 1.6 Job Descriptions ──────────────────────────────────
  const jdId = sec1BySlug["job-descriptions"].id;
  
  const m1Jobs = [
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "ceo-founder",
    "heading": "CEO / Founder",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "Crown",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Định hướng tầm nhìn chiến lược và triết lý thiết kế 'Quiet Luxury' cho toàn bộ studio — đảm bảo mọi dự án đều phản ánh giá trị cốt lõi: sự tinh tế trong chất liệu, tỷ lệ không gian và tay nghề thủ công\n• Xây dựng và duy trì mối quan hệ với khách hàng cao cấp, đối tác thương hiệu và các nhà cung cấp vật liệu premium — trực tiếp tham gia tư vấn cho các dự án trọng điểm\n• Quản trị tài chính tổng thể: lập ngân sách hàng năm, kiểm soát dòng tiền, phê duyệt báo giá dự án và đảm bảo biên lợi nhuận mục tiêu cho từng hạng mục\n• Tuyển dụng, đào tạo và phát triển đội ngũ — xây dựng văn hóa làm việc chuyên nghiệp, sáng tạo và gắn kết; dẫn dắt các buổi review thiết kế nội bộ định kỳ\n• Nghiên cứu xu hướng thiết kế nội thất quốc tế, tham gia các hội chợ và triển lãm chuyên ngành (Salone del Mobile, Maison&Objet) để cập nhật và nâng tầm chất lượng thiết kế của DQH"
        },
        {
          "title": "KPI chính",
          "body": "• Doanh thu studio đạt mục tiêu tăng trưởng tối thiểu 20% so với năm trước\n• Tỷ lệ khách hàng quay lại hoặc giới thiệu (referral rate) đạt ≥ 40%\n• Biên lợi nhuận gộp trên mỗi dự án duy trì ≥ 35%\n• Chỉ số hài lòng đội ngũ (Employee Satisfaction Score) đạt ≥ 8/10 trong khảo sát nội bộ hàng quý"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Tư duy chiến lược và khả năng hoạch định kinh doanh dài hạn — hiểu sâu về thị trường nội thất cao cấp tại Việt Nam\n• Kỹ năng lãnh đạo, truyền cảm hứng và xây dựng đội ngũ đa chuyên môn (thiết kế, thi công, kinh doanh)\n• Năng lực quản trị tài chính: đọc báo cáo tài chính, phân tích P&L, quản lý ngân sách dự án\n• Khả năng giao tiếp và thuyết trình chuyên nghiệp — tự tin trình bày concept thiết kế cho khách hàng VIP\n• Am hiểu sâu về vật liệu cao cấp, xu hướng thiết kế quốc tế và tiêu chuẩn thi công nội thất premium"
        },
        {
          "title": "Tools sử dụng",
          "body": "Notion (quản lý dự án & knowledge base), Google Workspace (Docs, Sheets, Drive), Phần mềm kế toán (MISA hoặc tương đương), Canva/Figma (review material truyền thông), Zoom/Google Meet (họp khách hàng)"
        }
      ]
    },
    "sort_order": 1
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "senior-designer",
    "heading": "Senior Designer / Design Leader",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "Sparkles",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Dẫn dắt quá trình phát triển concept thiết kế từ giai đoạn ý tưởng ban đầu đến thiết kế chi tiết — đảm bảo mọi không gian đều thể hiện triết lý 'Quiet Luxury' đặc trưng của DQH\n• Trực tiếp làm việc với khách hàng: lắng nghe nhu cầu, phân tích lifestyle, trình bày và bảo vệ phương án thiết kế — xây dựng lòng tin và sự hài lòng xuyên suốt dự án\n• Hướng dẫn, đào tạo và review công việc của Designer và Drafter trong team — đảm bảo chất lượng đầu ra đồng nhất theo tiêu chuẩn DQH\n• Nghiên cứu và đề xuất bảng vật liệu (material palette), phối màu và giải pháp ánh sáng phù hợp với từng concept dự án — ưu tiên vật liệu tự nhiên, bền vững\n• Phối hợp chặt chẽ với 3D Visualizer và Project Manager để đảm bảo thiết kế được hiện thực hóa chính xác từ bản vẽ đến công trình thực tế"
        },
        {
          "title": "KPI chính",
          "body": "• Chỉ số hài lòng khách hàng (CSAT) đạt ≥ 9/10 cho các dự án phụ trách\n• Tỷ lệ phương án thiết kế được duyệt từ lần trình bày thứ 2 trở xuống đạt ≥ 80%\n• 100% dự án hoàn thành giai đoạn thiết kế đúng timeline cam kết\n• Đánh giá năng lực team member (mentoring score) đạt ≥ 8/10 — thể hiện qua sự tiến bộ của junior designer"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Thành thạo AutoCAD (bản vẽ 2D chính xác), SketchUp (mô hình 3D nhanh) và có kiến thức cơ bản về 3ds Max để giao tiếp hiệu quả với team diễn họa\n• Am hiểu sâu về lý thuyết màu sắc, tỷ lệ vàng trong thiết kế không gian, nguyên lý ánh sáng tự nhiên và nhân tạo\n• Kiến thức chuyên sâu về vật liệu nội thất cao cấp: gỗ tự nhiên (walnut, oak, teak), đá marble/granite, kim loại, vải bọc và da\n• Kỹ năng trình bày và storytelling — khả năng kể câu chuyện thiết kế một cách thuyết phục, cảm xúc\n• Tối thiểu 5 năm kinh nghiệm thiết kế nội thất, ưu tiên phân khúc cao cấp (biệt thự, penthouse, boutique hotel)"
        },
        {
          "title": "Tools sử dụng",
          "body": "AutoCAD 2024+, SketchUp Pro, Adobe Creative Suite (Photoshop, Illustrator, InDesign — dùng cho mood board và hồ sơ thiết kế), Pinterest/Behance (nghiên cứu xu hướng), Notion (quản lý dự án)"
        }
      ]
    },
    "sort_order": 2
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "designer",
    "heading": "Designer",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "Palette",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Thực hiện thiết kế chi tiết dưới sự hướng dẫn của Senior Designer — phát triển bản vẽ mặt bằng 2D, mặt cắt, mặt đứng và layout nội thất theo concept đã được duyệt\n• Xây dựng mood board và bảng phối vật liệu (material board) cho từng dự án — tổng hợp hình ảnh tham khảo, mẫu vật liệu, bảng màu để trình bày với khách hàng\n• Khảo sát hiện trạng công trình, đo đạc kích thước chính xác và ghi nhận các yếu tố kỹ thuật ảnh hưởng đến thiết kế (kết cấu, MEP, thông gió, ánh sáng tự nhiên)\n• Hỗ trợ Senior Designer trong việc chọn lựa và liên hệ nhà cung cấp vật liệu, nội thất — lấy báo giá, so sánh chất lượng và theo dõi mẫu vật liệu\n• Liên tục cập nhật kiến thức thiết kế, nghiên cứu xu hướng mới và xây dựng thư viện tham khảo cá nhân để nâng cao năng lực chuyên môn"
        },
        {
          "title": "KPI chính",
          "body": "• Chất lượng bản vẽ thiết kế đạt chuẩn DQH: ≤ 2 lần chỉnh sửa sau review của Senior Designer\n• 100% deadline thiết kế được hoàn thành đúng hạn theo timeline dự án\n• Mood board và material board nhận đánh giá tích cực từ khách hàng (≥ 8/10)\n• Số lượng dự án hoàn thành tối thiểu 3-4 dự án/quý (tùy quy mô)"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Thành thạo AutoCAD — vẽ mặt bằng, mặt cắt, chi tiết nội thất chính xác theo tiêu chuẩn kỹ thuật\n• Sử dụng tốt SketchUp để dựng mô hình 3D concept nhanh, hỗ trợ trình bày ý tưởng với khách hàng\n• Kỹ năng Photoshop: chỉnh sửa render, tạo mood board chuyên nghiệp, xử lý hình ảnh cho hồ sơ thiết kế\n• Hiểu biết cơ bản về quy trình thi công nội thất, vật liệu phổ biến và các tiêu chuẩn an toàn\n• Tư duy thẩm mỹ tốt, chú ý đến chi tiết và khả năng làm việc nhóm hiệu quả"
        },
        {
          "title": "Tools sử dụng",
          "body": "AutoCAD 2024+, SketchUp Pro/Free, Adobe Photoshop, Canva (mood board nhanh), Pinterest (tham khảo ý tưởng), Google Drive (lưu trữ và chia sẻ tài liệu dự án)"
        }
      ]
    },
    "sort_order": 3
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "3d-visualizer",
    "heading": "3D Visualizer / Diễn họa",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "Monitor",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Tạo hình ảnh diễn họa 3D chất lượng cao (photorealistic rendering) từ bản vẽ thiết kế — thể hiện chính xác vật liệu, ánh sáng, không gian và cảm xúc mà concept thiết kế muốn truyền tải\n• Xây dựng mô hình 3D chi tiết với độ chính xác cao về tỷ lệ, kích thước và đặc tính vật liệu — đặc biệt chú trọng chất cảm gỗ tự nhiên, đá marble, vải và kim loại\n• Phát triển video walkthrough và trải nghiệm VR (Virtual Reality) cho các dự án cao cấp — giúp khách hàng 'sống' trong không gian thiết kế trước khi thi công\n• Hậu kỳ hình ảnh render (post-production): chỉnh màu, thêm hiệu ứng ánh sáng, cây xanh, phụ kiện trang trí để tạo hình ảnh hoàn chỉnh và sống động\n• Xây dựng và quản lý thư viện vật liệu 3D nội bộ (material library) — liên tục cập nhật texture, model nội thất và preset ánh sáng theo phong cách DQH"
        },
        {
          "title": "KPI chính",
          "body": "• Chất lượng render tối thiểu đạt độ phân giải 3000×2000px, photorealistic với độ chính xác vật liệu ≥ 95% so với mẫu thực tế\n• Thời gian hoàn thành: tối đa 3 ngày cho bộ render cơ bản (5-7 góc nhìn) của một dự án căn hộ tiêu chuẩn\n• Tỷ lệ render được duyệt từ lần trình bày thứ 2 trở xuống đạt ≥ 85%\n• Duy trì thư viện vật liệu nội bộ với ≥ 500 texture và 200 model chuẩn DQH"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Thành thạo 3ds Max — modeling, texturing, lighting setup cho không gian nội thất\n• Chuyên sâu V-Ray hoặc Corona Renderer — hiểu rõ về global illumination, material editor, HDRI lighting và render optimization\n• Sử dụng tốt Enscape/Lumion cho real-time rendering và VR walkthrough\n• Kỹ năng Photoshop nâng cao cho hậu kỳ render: color grading, compositing, retouching\n• Hiểu biết về nhiếp ảnh nội thất — bố cục, góc máy, ánh sáng tự nhiên để tạo render có cảm giác chân thực"
        },
        {
          "title": "Tools sử dụng",
          "body": "3ds Max 2024+, V-Ray 6 / Corona Renderer 10+, Enscape 3.5+, Adobe Photoshop (hậu kỳ), Marvelous Designer (vải, rèm — nếu cần), Quixel Megascans (texture cao cấp), Chaos Cosmos (thư viện 3D asset)"
        }
      ]
    },
    "sort_order": 4
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "drafter",
    "heading": "Drafter / Triển khai bản vẽ",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "FileText",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Triển khai bản vẽ kỹ thuật thi công (shop drawing) chi tiết từ thiết kế đã được duyệt — bao gồm mặt bằng, mặt cắt, mặt đứng, chi tiết cấu tạo nội thất và bản vẽ lắp đặt\n• Lập bảng thống kê vật liệu (BOQ — Bill of Quantities) và bảng chi tiết vật liệu (material schedule) chính xác — là cơ sở cho việc báo giá và mua sắm vật tư\n• Phối hợp chặt chẽ với đội ngũ MEP (Mechanical, Electrical, Plumbing) để tích hợp hệ thống kỹ thuật vào bản vẽ nội thất — đảm bảo không xung đột giữa các hệ thống\n• Kiểm tra và cập nhật bản vẽ theo phản hồi từ công trường — xử lý các thay đổi thiết kế (design change) kịp thời và chính xác\n• Tuân thủ nghiêm ngặt tiêu chuẩn bản vẽ DQH: quy cách layer, font chữ, tỷ lệ bản vẽ, ký hiệu vật liệu và format trình bày thống nhất"
        },
        {
          "title": "KPI chính",
          "body": "• Độ chính xác bản vẽ kỹ thuật: mục tiêu 0 lỗi kích thước và ký hiệu — tối đa 1 lỗi nhỏ/100 bản vẽ sau review\n• 100% bản vẽ tuân thủ tiêu chuẩn trình bày DQH (layer, font, lineweight, title block)\n• Hoàn thành bộ bản vẽ thi công đúng deadline: tối đa 5-7 ngày làm việc cho dự án căn hộ tiêu chuẩn\n• BOQ chính xác với sai số vật liệu ≤ 3% so với thực tế thi công"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Thành thạo AutoCAD — vẽ kỹ thuật nhanh, chính xác với hệ thống layer và block chuẩn\n• Kiến thức cơ bản về Revit — phục vụ xu hướng chuyển đổi sang BIM (Building Information Modeling) trong tương lai\n• Hiểu biết sâu về quy trình và phương pháp thi công nội thất: mộc, sắt, thạch cao, sơn, đá, kính\n• Nắm vững các tiêu chuẩn kỹ thuật xây dựng Việt Nam (TCVN) liên quan đến nội thất và hoàn thiện\n• Cẩn thận, tỉ mỉ và có khả năng làm việc dưới áp lực deadline cao — quản lý thời gian hiệu quả"
        },
        {
          "title": "Tools sử dụng",
          "body": "AutoCAD 2024+ (công cụ chính), Autodesk Revit (BIM — đang triển khai), Microsoft Excel (BOQ, material schedule), PDF editor (Bluebeam Revu hoặc Adobe Acrobat — xuất bản vẽ), Google Drive (chia sẻ và quản lý phiên bản bản vẽ)"
        }
      ]
    },
    "sort_order": 5
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "project-manager",
    "heading": "Project Manager / Giám sát thi công",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "ClipboardList",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Giám sát toàn bộ quá trình thi công nội thất tại công trường — đảm bảo nhà thầu thực hiện đúng bản vẽ thiết kế, đúng chất liệu và đạt tiêu chuẩn chất lượng DQH\n• Lập kế hoạch và quản lý tiến độ thi công chi tiết: phân chia giai đoạn, xác định milestone, theo dõi tiến độ hàng ngày và xử lý kịp thời các phát sinh trên công trường\n• Điều phối và quản lý các nhà thầu phụ (mộc, sắt, thạch cao, sơn, đá, kính, điện, nước) — đảm bảo phối hợp nhịp nhàng, tránh chồng chéo và lãng phí thời gian\n• Kiểm soát ngân sách thi công: theo dõi chi phí thực tế so với dự toán, phê duyệt thanh toán theo tiến độ, cảnh báo sớm khi có nguy cơ vượt budget\n• Kiểm tra nghiệm thu từng hạng mục và nghiệm thu bàn giao tổng thể — lập biên bản kiểm tra chất lượng, chụp ảnh tiến độ và báo cáo cho khách hàng định kỳ"
        },
        {
          "title": "KPI chính",
          "body": "• Tỷ lệ dự án hoàn thành đúng tiến độ cam kết đạt ≥ 90%\n• Chi phí thi công thực tế không vượt quá 5% so với dự toán được duyệt\n• Tỷ lệ lỗi/sai sót cần sửa chữa sau nghiệm thu (defect rate) ≤ 2% tổng hạng mục\n• Chỉ số hài lòng khách hàng về quá trình thi công đạt ≥ 8.5/10"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Kinh nghiệm tối thiểu 3-5 năm trong giám sát thi công nội thất — ưu tiên phân khúc cao cấp (biệt thự, penthouse, showroom)\n• Hiểu biết sâu về quy trình thi công các hạng mục nội thất: đồ gỗ, trần thạch cao, sơn bả, lắp đặt thiết bị, đá tự nhiên\n• Kỹ năng quản lý dự án: lập Gantt chart, quản lý rủi ro, giải quyết xung đột và đàm phán với nhà thầu\n• Đọc và hiểu thành thạo bản vẽ kỹ thuật thi công (shop drawing) và bản vẽ MEP\n• Giao tiếp tốt, quyết đoán và có khả năng xử lý tình huống phát sinh nhanh chóng tại công trường"
        },
        {
          "title": "Tools sử dụng",
          "body": "Microsoft Project / Gantt Pro (lập tiến độ), AutoCAD (xem bản vẽ), Excel (quản lý BOQ và ngân sách), Smartphone + camera (chụp ảnh công trường, báo cáo tiến độ), Notion/Trello (phối hợp nội bộ), Zalo/WhatsApp (liên lạc nhanh với nhà thầu)"
        }
      ]
    },
    "sort_order": 6
  },
  {
    "section_id": "__JOB_DESC_ID__",
    "slug": "sales-marketing",
    "heading": "Sales & Marketing",
    "content": null,
    "content_type": "items",
    "metadata": {
      "icon": "Megaphone",
      "items": [
        {
          "title": "Vai trò & Trách nhiệm",
          "body": "• Tìm kiếm và phát triển khách hàng tiềm năng trong phân khúc cao cấp — xây dựng mạng lưới quan hệ với chủ đầu tư bất động sản, kiến trúc sư và các đối tác giới thiệu\n• Quản lý toàn bộ kênh truyền thông mạng xã hội (Facebook, Instagram, TikTok, LinkedIn) — xây dựng nội dung thể hiện phong cách 'Quiet Luxury' đặc trưng của DQH\n• Tư vấn ban đầu cho khách hàng: tìm hiểu nhu cầu, giới thiệu portfolio và quy trình làm việc của DQH — tạo ấn tượng chuyên nghiệp ngay từ lần tiếp xúc đầu tiên\n• Lên kế hoạch và triển khai các chiến dịch marketing: chụp ảnh công trình hoàn thiện, viết case study, tổ chức sự kiện open house và hợp tác với KOL/influencer\n• Quản lý CRM (Customer Relationship Management): theo dõi pipeline bán hàng, chăm sóc khách hàng sau bàn giao và thúc đẩy referral — biến mỗi khách hàng thành đại sứ thương hiệu"
        },
        {
          "title": "KPI chính",
          "body": "• Tỷ lệ chuyển đổi từ lead sang ký hợp đồng (conversion rate) đạt ≥ 15%\n• Tăng trưởng follower và engagement rate trên các kênh social media: ≥ 10% mỗi tháng\n• Tỷ lệ khách hàng giới thiệu (client referral rate) đạt ≥ 30% tổng dự án mới\n• Chi phí marketing trên mỗi lead (CPL — Cost Per Lead) giảm ≥ 10% mỗi quý thông qua tối ưu hóa kênh"
        },
        {
          "title": "Kỹ năng yêu cầu",
          "body": "• Kỹ năng copywriting và storytelling — viết nội dung sang trọng, tinh tế phù hợp với định vị thương hiệu 'Quiet Luxury'\n• Am hiểu về digital marketing: Facebook/Instagram Ads, Google Ads, SEO cơ bản và content marketing\n• Kỹ năng giao tiếp và tư vấn bán hàng — tự tin, chuyên nghiệp khi làm việc với khách hàng cao cấp\n• Hiểu biết cơ bản về thiết kế nội thất và kiến trúc — đủ để tư vấn ban đầu và truyền đạt giá trị thiết kế\n• Nhạy bén với xu hướng thị trường, hành vi người tiêu dùng và chiến lược cạnh tranh trong ngành nội thất"
        },
        {
          "title": "Tools sử dụng",
          "body": "Canva Pro (thiết kế ấn phẩm truyền thông), Meta Business Suite (quản lý Facebook & Instagram), Google Analytics (phân tích website), HubSpot/Zoho CRM (quản lý khách hàng), CapCut/Premiere Pro (edit video ngắn), Notion (lập kế hoạch content calendar)"
        }
      ]
    },
    "sort_order": 7
  }
];
  m1Jobs.forEach(j => {
    j.section_id = jdId;
    mod1Subsections.push(j);
  });

  const mod1SubsResult = await upsertAndReturn("training_subsections", mod1Subsections);
  console.log(`✅ Inserted ${mod1SubsResult.length} Module 1 subsections`);

  // ══════════════════════════════════════════════════════════════
  // MODULE 2 — DESIGN KNOWLEDGE
  // ══════════════════════════════════════════════════════════════

  const mod2Id = moduleBySlug["design-knowledge"].id;

  const mod2SectionsData = [
    {
      module_id: mod2Id,
      slug: "philosophy",
      number: "2.1",
      title: "Quiet Luxury Philosophy",
      description: "Định nghĩa và 5 nguyên tắc cốt lõi",
      icon: "Sparkles",
      content: "Quiet Luxury không phải là sự thiếu vắng — đó là sự hiện diện được kiểm soát.",
      sort_order: 1,
    },
    {
      module_id: mod2Id,
      slug: "layout-principles",
      number: "2.2",
      title: "Nguyên tắc bố cục Quiet Luxury",
      description: "Tỷ lệ, ánh sáng, vật liệu palette",
      icon: "Layout",
      content: "Bố cục chuẩn mực là nền tảng của mọi thiết kế Quiet Luxury.",
      sort_order: 2,
    },
    {
      module_id: mod2Id,
      slug: "ergonomics",
      number: "2.3",
      title: "Công thái học (Kích thước chuẩn)",
      description: "Kích thước chuẩn cho phòng khách, phòng ngủ, bếp, WC",
      icon: "Ruler",
      content: "Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định.",
      sort_order: 3,
    },
    {
      module_id: mod2Id,
      slug: "materials",
      number: "2.4",
      title: "Vật liệu chuẩn",
      description: "Gỗ, đá, vải, sơn — và những thứ cần tránh",
      icon: "Layers",
      content: "Vật liệu kể chuyện — chọn đúng vật liệu, không gian tự lên tiếng.",
      sort_order: 4,
    },
    {
      module_id: mod2Id,
      slug: "styles",
      number: "2.5",
      title: "3 Style chính của DQH",
      description: "Chi tiết các style sẽ được thêm sau",
      icon: "Palette",
      content: "Mỗi style có DNA riêng. Hiểu sâu một style trước khi pha trộn.",
      sort_order: 5,
    },
    {
      module_id: mod2Id,
      slug: "case-studies",
      number: "2.6",
      title: "Case Study nội bộ",
      description: "Dự án đã làm — phân tích hay/dở, bài học",
      icon: "Layers",
      content: "Mỗi dự án là một bài học. Đây là thư viện DQH dùng để dạy lẫn nhau.",
      sort_order: 6,
    },
    {
      module_id: mod2Id,
      slug: "mistakes",
      number: "2.7",
      title: "Common Mistakes in Design",
      description: "Lỗi sai thường gặp trong TK, Triển khai, Khách hàng",
      icon: "TriangleAlert",
      content: "Lỗi sai không phải để xấu hổ — để cả team không lặp lại.",
      sort_order: 7,
    },
  ];

  const mod2Sections = await upsertAndReturn("training_sections", mod2SectionsData);
  console.log(`✅ Inserted ${mod2Sections.length} Module 2 sections`);

  const sec2BySlug = {};
  for (const s of mod2Sections) sec2BySlug[s.slug] = s;

  // ── Module 2 Subsections ──────────────────────────────────

  const mod2Subsections = [];

  // ── 2.1 Quiet Luxury Philosophy ───────────────────────────
  const philId = sec2BySlug["philosophy"].id;

  mod2Subsections.push({
    section_id: philId,
    slug: "ql-dinh-nghia",
    heading: "ĐỊNH NGHĨA",
    content: "Quiet Luxury = sang trọng thể hiện qua chất lượng vật liệu, tỷ lệ không gian, craftsmanship — KHÔNG thể hiện qua logo, màu nổi, hoặc số lượng đồ đạc.",
    content_type: "text",
    metadata: null,
    sort_order: 1,
  });

  mod2Subsections.push({
    section_id: philId,
    slug: "ql-5-nguyen-tac",
    heading: "5 Nguyên tắc Cốt lõi",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "1. Subtlety over Display",
          body: "Không logo, không phô trương. Vẻ đẹp được cảm nhận, không được giải thích. Một chiếc sofa linen xịn hơn sofa gold frame.",
        },
        {
          title: "2. Material Integrity",
          body: "Vật liệu thật tự nhiên (gỗ, đá, linen, cashmere). Aging gracefully — càng dùng lâu, càng có hồn. Tránh fake material.",
        },
        {
          title: "3. Timeless Design",
          body: "Không follow trend ngắn hạn. Mỗi quyết định: 'Cái này còn đẹp trong 10 năm nữa không?' Palette: neutral. Không bold color.",
        },
        {
          title: "4. Intentionality",
          body: "Không vật dụng 'có vô vì có'. Mỗi thứ phải có lý do — thực dụng hoặc cảm xúc. Curation > decoration.",
        },
        {
          title: "5. Emotional Comfort",
          body: "Luxury = cảm giác 'thật thoải mái, thật bình yên'. Mental peace > Instagram-worthy.",
        },
      ],
    },
    sort_order: 2,
  });

  // ── 2.2 Nguyên tắc bố cục ────────────────────────────────
  const layoutId = sec2BySlug["layout-principles"].id;

  mod2Subsections.push({
    section_id: layoutId,
    slug: "layout-principles-list",
    heading: "Nguyên tắc bố cục Quiet Luxury",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Tỷ lệ chuẩn mực",
          body: "Tỷ lệ vàng trong kiến trúc tạo sự hài hòa vô cùng.",
        },
        {
          title: "Ánh sáng tự nhiên",
          body: "Tối ưu hóa ánh sáng từ hướng Đông-Tây. Cửa sổ lớn hướng không gian sống. Phòng riêng tư hướng Bắc.",
        },
        {
          title: "Vật liệu palette chuẩn",
          body: "Beige, taupe, cream, gray, charcoal, white. Accent: 1 màu tự nhiên (wood tone hoặc đá). Không bold color.",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 2.3 Công thái học ─────────────────────────────────────
  const ergoId = sec2BySlug["ergonomics"].id;

  mod2Subsections.push({
    section_id: ergoId,
    slug: "ergonomics-dimensions",
    heading: "Kích thước chuẩn theo phòng",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Phòng khách",
          body: "Ghế sofa: W 200-250cm. Bàn cà phê: W 120cm, D 60cm. Khoảng cách từ sofa đến TV: 2-3m.",
        },
        {
          title: "Phòng ngủ",
          body: "Giường đôi: 1.8 x 2.0m. Khoảng cách giường đến tường: 50cm. Đầu giường cao 120cm.",
        },
        {
          title: "Bếp",
          body: "Bàn bếp: H 90cm. Khoảng cách tủ trên-dưới: 65cm. Đảo bếp W tối thiểu 120cm.",
        },
        {
          title: "WC",
          body: "Toilet: D 70cm từ tường. Lavabo: H 80-85cm. Vòi sen: H 200-210cm.",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 2.4 Vật liệu chuẩn ───────────────────────────────────
  const matId = sec2BySlug["materials"].id;

  mod2Subsections.push({
    section_id: matId,
    slug: "materials-list",
    heading: "Vật liệu chuẩn DQH",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Gỗ",
          body: "Oak, walnut, cedar, xoan, lát (tự nhiên > MDF/HDF)",
        },
        {
          title: "Đá",
          body: "Marble tự nhiên, limestone, slate, granite",
        },
        {
          title: "Vải",
          body: "Linen, cotton, wool (tránh polyester giá rẻ)",
        },
        {
          title: "Sơn",
          body: "Sơn nước không độc (bảo vệ sức khỏe)",
        },
        {
          title: "Tránh",
          body: "Microcement (khí hậu khắc nghiệt), mạ vàng (tróc vảy), plastic decor (sáo rỗng)",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 2.5 3 Style chính ─────────────────────────────────────
  const styleId = sec2BySlug["styles"].id;
  
  const m2Styles = [
  {
    "section_id": "__STYLE_ID__",
    "slug": "quiet-luxury-signature",
    "heading": "Quiet Luxury / Contemporary Minimalism (DQH Signature)",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Định nghĩa & DNA",
          "body": "Phong cách cốt lõi của DQH. Sang trọng không phô trương, tập trung vào chất lượng vật liệu nguyên bản, tỷ lệ không gian hoàn hảo và ánh sáng tự nhiên. Vẻ đẹp đến từ sự tiết chế, mang lại cảm giác bình yên và vượt thời gian."
        },
        {
          "title": "Color Palette",
          "body": "Warm neutrals: Sand, cream, taupe, charcoal, matte black. Tuyệt đối tránh các màu sắc quá rực rỡ hoặc tương phản mạnh."
        },
        {
          "title": "Vật liệu chính",
          "body": "Gỗ tự nhiên (Oak, Walnut) hoàn thiện mờ (matte finish), đá vôi (limestone), đá cẩm thạch vân chìm, vải linen, len cashmere, kim loại hoàn thiện mờ (matte metals)."
        },
        {
          "title": "Đặc điểm thiết kế",
          "body": "• Clean lines (đường nét gọn gàng, liền mạch)\n• Hidden storage (lưu trữ ẩn để không gian luôn gọn gàng)\n• Indirect lighting (ánh sáng gián tiếp, hắt khe, hắt trần)\n• Focus on proportion (Tỷ lệ không gian quan trọng hơn chi tiết trang trí)"
        },
        {
          "title": "Nên tránh",
          "body": "Bold colors (màu chói), visible logos (logo lộ liễu), excessive ornamentation (trang trí rườm rà), trendy materials (vật liệu chạy theo xu hướng ngắn hạn như microcement rẻ tiền, mạ vàng sáng bóng)."
        },
        {
          "title": "Reference Studios",
          "body": "Vincent Van Duysen, John Pawson, Norm Architects."
        }
      ]
    },
    "sort_order": 1
  },
  {
    "section_id": "__STYLE_ID__",
    "slug": "modern-luxury",
    "heading": "Modern Luxury",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Định nghĩa & DNA",
          "body": "Sự sang trọng rõ nét hơn Quiet Luxury nhưng vẫn giữ được sự tinh tế chuẩn DQH. Sử dụng các điểm nhấn mạnh mẽ (statement pieces) kết hợp với vật liệu cao cấp có độ tương phản cao, tạo ra không gian ấn tượng, đẳng cấp."
        },
        {
          "title": "Color Palette",
          "body": "Trắng, đen, xám đậm, điểm xuyết các tone màu sâu (deep tones như navy, emerald) và điểm nhấn ánh kim (gold/brass accents)."
        },
        {
          "title": "Vật liệu chính",
          "body": "Đá Marble vân mây lớn (Calacatta, Statuario), kim loại mạ brass/bronze, vải nhung (velvet), gỗ sơn mài (lacquer), kính màu (smoked/tinted glass)."
        },
        {
          "title": "Đặc điểm thiết kế",
          "body": "• Statement pieces (Nội thất rời độc đáo làm điểm nhấn)\n• Dramatic lighting (Ánh sáng có tính nghệ thuật, đèn chùm ấn tượng)\n• Contrasting textures (Sự tương phản vật liệu: bóng - mờ, cứng - mềm)"
        },
        {
          "title": "Nên tránh",
          "body": "Cheap imitation materials (Vật liệu giả rẻ tiền), over-decoration (lạm dụng trang trí dẫn đến rối mắt), inconsistent luxury level (phối đồ cao cấp với đồ rẻ tiền làm giảm giá trị không gian)."
        },
        {
          "title": "Reference Studios",
          "body": "Kelly Hoppen, Kelly Wearstler (ở những dự án tiết chế), SJB Interiors."
        }
      ]
    },
    "sort_order": 2
  },
  {
    "section_id": "__STYLE_ID__",
    "slug": "indochine-contemporary",
    "heading": "Indochine Đương Đại (Contemporary Indochine)",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Định nghĩa & DNA",
          "body": "Sự kết hợp giữa di sản văn hóa Việt Nam và sự tiện nghi của lối sống đương đại (Tropical Modernism). Giữ lại tinh thần Indochine qua chất liệu và tỷ lệ, nhưng làm mới bằng ngôn ngữ thiết kế tối giản, sạch sẽ."
        },
        {
          "title": "Color Palette",
          "body": "Earth tones (màu đất), terracotta (gốm nung), deep green (xanh rêu/lá nhiệt đới), màu tự nhiên của mây tre và gỗ."
        },
        {
          "title": "Vật liệu chính",
          "body": "Gỗ sồi hoặc xoan đào (hoàn thiện màu walnut/dark oak), mây tre đan (rattan), gạch bông truyền thống (cement tile) dùng làm điểm nhấn, vải lanh thô, gốm sứ."
        },
        {
          "title": "Đặc điểm thiết kế",
          "body": "• Cửa sổ lá sách (louvered windows) điều hòa không khí tự nhiên\n• Tường hoa gió (breeze blocks) tạo hiệu ứng bóng đổ\n• Đèn lồng đương đại, ưu tiên khoảng sân trong (courtyard) mang thiên nhiên vào nhà"
        },
        {
          "title": "Nên tránh",
          "body": "Kitsch Vietnamese elements (Chi tiết trang trí rườm rà mang tính biểu tượng sáo rỗng), fake antiques (đồ giả cổ), over-themed (làm quá đà giống như một nhà hàng/resort thay vì nhà ở)."
        },
        {
          "title": "Reference Studios",
          "body": "Võ Trọng Nghĩa Architects, a21studio, Module K."
        }
      ]
    },
    "sort_order": 3
  }
];
  m2Styles.forEach(s => {
    s.section_id = styleId;
    mod2Subsections.push(s);
  });

  // ── 2.6 Case Study nội bộ ─────────────────────────────────
  const caseId = sec2BySlug["case-studies"].id;

  const m2Case = [
  {
    "slug": "case-study-framework",
    "heading": "Framework Xây Dựng Case Study",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Mục đích",
          "body": "Mỗi dự án hoàn thành là một bài học đắt giá cho toàn team. Case study giúp lưu trữ tri thức, kinh nghiệm xử lý tình huống thực tế và lan tỏa tinh thần thiết kế của DQH."
        },
        {
          "title": "Cấu trúc chuẩn",
          "body": "1. Client Brief (Yêu cầu đầu bài từ khách hàng)\n2. Design Response (Giải pháp thiết kế của DQH - Tại sao lại chọn giải pháp đó?)\n3. Challenges (Những khó khăn trong quá trình TK/TC)\n4. Lessons Learned (Bài học rút ra - Làm tốt điều gì, cần tránh điều gì)\n5. Photos (Hình ảnh thực tế trước và sau)"
        },
        {
          "title": "Template sử dụng",
          "body": "Team sử dụng template chuẩn trên Notion để tạo Case Study mới sau mỗi dự án bàn giao và trình bày trong buổi Weekly Knowledge Sharing."
        }
      ]
    },
    "sort_order": 1
  },
  {
    "slug": "case-study-1-q2",
    "heading": "Case Study 1: Căn hộ Quiet Luxury 120m² — Q2",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Client Brief",
          "body": "Khách hàng: Gia đình 4 người (2 vợ chồng, 2 con nhỏ). Budget: 2.8 tỷ VND. Yêu cầu: Không gian ấm cúng, tối giản nhưng phải hiện đại, dễ dàng dọn dẹp và an toàn cho trẻ em."
        },
        {
          "title": "Design Response",
          "body": "Áp dụng triệt để Quiet Luxury. Lựa chọn gỗ Oak tự nhiên kết hợp đá Limestone tạo sự ấm áp. Sử dụng 100% ánh sáng gián tiếp (hắt trần, hắt khe tường) tại khu vực sinh hoạt chung để tạo cảm giác thư giãn. Thiết kế hệ tủ âm tường liền mạch che giấu toàn bộ đồ đạc."
        },
        {
          "title": "Challenges",
          "body": "Budget 2.8 tỷ khá thách thức cho diện tích 120m² nếu sử dụng toàn bộ vật liệu tự nhiên cao cấp theo chuẩn DQH."
        },
        {
          "title": "Lessons Learned",
          "body": "Việc 'educate' khách hàng về triết lý Quiet Luxury từ sớm giúp giải quyết bài toán ngân sách: Team đã thuyết phục khách hàng đầu tư vào chất lượng không gian (hệ thống đèn, sàn gỗ tự nhiên, phụ kiện bếp cao cấp) thay vì các chi tiết trang trí thừa thãi. Khách hàng cực kỳ hài lòng với kết quả."
        }
      ]
    },
    "sort_order": 2
  },
  {
    "slug": "case-study-2-thaodien",
    "heading": "Case Study 2: Villa 350m² — Thảo Điền",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Client Brief",
          "body": "Khách hàng: Cặp vợ chồng nghỉ hưu, thích du lịch và văn hóa Việt Nam. Budget: 8 tỷ VND. Yêu cầu: Không gian thông thoáng, gần gũi thiên nhiên, mang đậm dấu ấn Á Đông nhưng vẫn tiện nghi."
        },
        {
          "title": "Design Response",
          "body": "Style: Indochine Đương đại pha trộn yếu tố Quiet Luxury. Tạo khoảng sân trong (courtyard) lớn ở trung tâm nhà, mọi phòng đều hướng về khoảng xanh này. Tối ưu hóa đối lưu gió tự nhiên thông qua hệ cửa lá sách."
        },
        {
          "title": "Challenges",
          "body": "Bài toán khó nhất là cân bằng giữa nét hoài cổ của Indochine mà không làm không gian trở nên nặng nề, cũ kỹ hay giống như một resort/nhà hàng."
        },
        {
          "title": "Lessons Learned",
          "body": "Việc khảo sát hiện trạng kỹ lưỡng (Site visit) đã tiết lộ hướng gió chính và góc nhìn đẹp nhất mà bản vẽ kỹ thuật ban đầu không thể hiện. Nhờ đó, team đã thay đổi layout phòng khách để tận dụng tối đa điều kiện tự nhiên. Bài học: Không bao giờ tin 100% vào bản vẽ giấy mà không đo đạc thực tế."
        }
      ]
    },
    "sort_order": 3
  }
];
  m2Case.forEach(c => {
    c.section_id = caseId;
    mod2Subsections.push(c);
  });

  // ── 2.7 Common Mistakes ───────────────────────────────────
  const mistId = sec2BySlug["mistakes"].id;

  mod2Subsections.push({
    section_id: mistId,
    slug: "mistakes-designer",
    heading: "DESIGNER MISTAKES (TK side)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Thiết kế theo trend (Microcement, brass) → 3 năm sau lỗi thời",
          right: "Follow principle (QL = timeless), không trend.",
        },
        {
          wrong: "Chọn vật liệu dễ lỗi thời (mạ vàng, marble vân nổi)",
          right: "Vật liệu: 10+ năm, available always, aging well.",
        },
        {
          wrong: "Design concept không match budget → khách dissatisfied",
          right: "Clarify budget cụ thể early. Design within constraint.",
        },
        {
          wrong: "Quá nhiều material / color → nhà chaos",
          right: "Max 3-4 material. Max 2 tone (base + 1 accent).",
        },
        {
          wrong: "Décor quá nhiều → nhà không thở được",
          right: "Negative space = important. 30% full, 70% breathing.",
        },
      ],
    },
    sort_order: 1,
  });

  mod2Subsections.push({
    section_id: mistId,
    slug: "mistakes-contractor",
    heading: "CONTRACTOR/EXECUTION MISTAKES (Triển khai side)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "Microcement ở phòng ẩm (WC, kitchen) → co ngót, nứt",
          right: "Microcement chỉ phòng khô. WC/kitchen = gạch hoặc sơn.",
        },
        {
          wrong: "Vật liệu thay đổi giữa chừng → không match sample",
          right: "Material schedule cụ thể. Nhà thầu order đúng.",
        },
        {
          wrong: "Thi công sơn sai (1 lớp thay vì 3) → tróc 6 tháng",
          right: "Sơn nước: 3 lớp. Primer → 2 lớp.",
        },
        {
          wrong: "Đèn gắn sai vị trí → ánh sáng destroy design",
          right: "KTS mark vị trí cụ thể. Triển khai follow.",
        },
        {
          wrong: "Outlet/switch ở chỗ sai → xấu thẩm mỹ",
          right: "Placement = KTS mark. Triển khai phối hợp điện.",
        },
      ],
    },
    sort_order: 2,
  });

  mod2Subsections.push({
    section_id: mistId,
    slug: "mistakes-client",
    heading: "CLIENT EXPECTATION MISTAKES (KH side)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        {
          wrong: "'Vừa QL vừa bold color vừa nhiều pattern' → impossible",
          right: "Educate: QL = subtlety. Choose 1.",
        },
        {
          wrong: "Compare Instagram dự án khác (staged, filtered) → unrealistic",
          right: "Show real DQH project (unstaged).",
        },
        {
          wrong: "Muốn change design sau 80% thi công → delay, cost",
          right: "Concept sign-off bắt buộc.",
        },
        {
          wrong: "Expect final match 3D render 100% → disappointed",
          right: "Explain: 3D = approximation. Show before/after thực tế.",
        },
      ],
    },
    sort_order: 3,
  });

  const mod2SubsResult = await upsertAndReturn("training_subsections", mod2Subsections);
  console.log(`✅ Inserted ${mod2SubsResult.length} Module 2 subsections`);

  // ══════════════════════════════════════════════════════════════
  // MODULE 3 — WORKFLOW
  // ══════════════════════════════════════════════════════════════

  const mod3Id = moduleBySlug["workflow"].id;

  const workflowsData = [
    {
      module_id: mod3Id,
      slug: "client-meeting",
      number: "3.1",
      title: "Client Meeting (Gặp khách)",
      description: "Hiểu rõ brief, nhu cầu, budget, timeline",
      icon: "Users",
      lead_quote: "Lần gặp đầu tiên quyết định 70% khả năng ký HĐ.",
      checklist: [
        "Owner: Senior Designer + CEO",
        "Duration: 1.5 - 2 hours",
        "Purpose: Hiểu rõ brief, nhu cầu, budget, timeline",
      ],
      sort_order: 1,
    },
    {
      module_id: mod3Id,
      slug: "design-process",
      number: "3.2",
      title: "Design Process (Quy trình Thiết kế Dự án — 6 BƯỚC)",
      description: "Từ tư vấn khảo sát đến ký HĐ thi công",
      icon: "Sparkles",
      lead_quote: "Mỗi giai đoạn có deliverable cụ thể — không bỏ qua bước nào.",
      checklist: [
        "TIMELINE TỔNG QUÁT: 6-8 TUẦN",
        "Bước 1: 1 ngày",
        "Bước 2: 2-3 ngày",
        "Bước 3: 2-3 tuần",
        "Bước 4: 1-2 tuần",
        "Bước 5: 1-2 tuần",
        "Bước 6: 1 tuần",
      ],
      sort_order: 2,
    },
    {
      module_id: mod3Id,
      slug: "handover",
      number: "3.3",
      title: "Handover (Bàn giao bản vẽ cho triển khai)",
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
      title: "File Naming & Storage Convention",
      description: "Quy chuẩn đặt tên, version control, folder structure",
      icon: "FileText",
      lead_quote: "Một file sai tên = 30 phút tìm kiếm của cả team.",
      checklist: null,
      sort_order: 4,
    },
    {
      module_id: mod3Id,
      slug: "library",
      number: "3.5",
      title: "Library Management",
      description: "Material samples, CAD blocks, 3D models, Reference photos",
      icon: "Package",
      lead_quote: "Thư viện chung tiết kiệm thời gian + đảm bảo nhất quán.",
      checklist: null,
      sort_order: 5,
    },
    {
      module_id: mod3Id,
      slug: "storage",
      number: "3.6",
      title: "Storage & Archive",
      description: "As-Built bản vẽ, backup, archive",
      icon: "FolderOpen",
      lead_quote: "Một cấu trúc folder duy nhất cho mọi dự án — không sáng tạo riêng.",
      checklist: null,
      sort_order: 6,
    },
    {
      module_id: mod3Id,
      slug: "standards",
      number: "3.7",
      title: "Design Standards",
      description: "Visual, Rendering, Material Schedule standards",
      icon: "ClipboardList",
      lead_quote: "Tiêu chuẩn đầu ra nhất quán cho mọi dự án.",
      checklist: null,
      sort_order: 7,
    },
    {
      module_id: mod3Id,
      slug: "change-order",
      number: "3.8",
      title: "Change Order (Phát sinh)",
      description: "Evaluate → Estimate → Present → Approval → Execute → Archive",
      icon: "GitBranch",
      lead_quote: "Không có thay đổi miễn phí. Mọi thay đổi đều có giấy tờ — dù 0đ.",
      checklist: null,
      sort_order: 8,
    },
    {
      module_id: mod3Id,
      slug: "handover-client",
      number: "3.9",
      title: "Client Handover (Bàn giao khách)",
      description: "Defect inspection → Rectification → Final approval → Handover → Post-support",
      icon: "CheckCircle2",
      lead_quote: "Bàn giao tốt = giới thiệu khách mới. Hậu mãi tốt = thương hiệu bền.",
      checklist: null,
      sort_order: 9,
    },
  ];

  const workflows = await upsertAndReturn("training_workflows", workflowsData);
  console.log(`✅ Inserted ${workflows.length} workflows`);

  const wfBySlug = {};
  for (const w of workflows) wfBySlug[w.slug] = w;

  // ── Workflow Steps ────────────────────────────────────────

  const stepsData = [];

  // ── 3.1 Client Meeting ────────────────────────────────────
  const cmId = wfBySlug["client-meeting"].id;

  stepsData.push({
    workflow_id: cmId,
    phase: "Bước 1: Chuẩn bị trước meeting",
    owner: "Senior Designer + CEO",
    actions: [
      "Xem brief email, review portfolio, chuẩn bị câu hỏi, sample vật liệu.",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Bước 2: Phỏng vấn chi tiết (30 phút)",
    owner: "Senior Designer + CEO",
    actions: [
      "Lifestyle, thói quen sinh hoạt, nhu cầu, budget, timeline. Hỏi HÀNH VI, không style.",
    ],
    sort_order: 2,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Bước 3: Site visit & measurement (30 phút)",
    owner: "Senior Designer + CEO",
    actions: [
      "Tự đo (mm). Check ánh sáng, gió, mùi, cấu trúc. Chụp 4 hướng.",
    ],
    sort_order: 3,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Bước 4: Present DQH philosophy (15 phút)",
    owner: "Senior Designer + CEO",
    actions: [
      "Quiet Luxury, Design Thinking, end-to-end.",
    ],
    sort_order: 4,
    metadata: null,
  });
  stepsData.push({
    workflow_id: cmId,
    phase: "Bước 5: Recap + Next steps",
    owner: "Senior Designer + CEO",
    actions: [
      "Nhu cầu chính, budget, timeline. Concept deadline rõ.",
    ],
    sort_order: 5,
    metadata: null,
  });

  // ── 3.2 Design Process (6 BƯỚC) ──────────────────────────
  const dpId = wfBySlug["design-process"].id;

  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 1: TƯ VẤN TRỰC TIẾP VÀ KHẢO SÁT HIỆN TRẠNG",
    owner: "Senior Designer + CEO",
    actions: [
      "DQH THỰC HIỆN:\n• Tư vấn chi tiết (lifestyle, budget, nhu cầu, thiết bị)\n• Khảo sát hiện trạng (đo mm, chụp 4 hướng, check ánh sáng/gió/mùi)\n• Báo giá thiết kế sơ bộ",
      "KHÁCH HÀNG:\n• Cung cấp thông tin\n• Trao đổi nhu cầu thực tế",
      "GHI CHÚ:\n• Không đo theo số cũ khách cung cấp\n• Recap email gửi khách hôm sau\n• Concept deadline rõ (simple 2 tuần, complex 3 tuần)",
    ],
    sort_order: 1,
    metadata: { duration: "1.5 - 2 giờ" },
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 2: KÝ HỢP ĐỒNG THIẾT KẾ",
    owner: "Senior Designer + CEO",
    actions: [
      "DQH THỰC HIỆN:\n• Gửi HĐ TK với scope rõ:\n  - 3 lựa chọn ý tưởng\n  - 3 lần điều chỉnh 3D\n  - Bản vẽ kỹ thuật + báo giá thi công\n• Timeline: Concept (2-3 tuần) → 3D (1-2 tuần) → Technical (1-2 tuần)\n• Payment: 60% (ký) → 30% (approve 3D) → 10% (bàn giao)",
      "KHÁCH HÀNG:\n• Ký HĐ\n• Thanh toán 60%",
      "GHI CHÚ:\n• HĐ rõ revision policy (max 3 lần/stage)\n• Change sau concept = charge thêm",
    ],
    sort_order: 2,
    metadata: { duration: "Ngay sau khảo sát" },
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 3: BỐ TRÍ MẶT BẰNG VÀ LÊN Ý TƯỞNG",
    owner: "Senior Designer + Design Leader",
    actions: [
      "DQH THỰC HIỆN:\n• 3 lựa chọn bố cục công năng\n• Mỗi concept có giải thích (TẠI SAO)\n• Dự toán sơ bộ thi công",
      "KHÁCH HÀNG:\n• Review & feedback\n• Chọn 1 ý tưởng\n• Trao đổi budget",
      "GHI CHÚ:\n• Concept phải align QL philosophy\n• Dự toán sơ bộ giúp khách hiểu budget thực\n• Change lần 3 = charge phí",
    ],
    sort_order: 3,
    metadata: { duration: "2-3 tuần" },
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 4: PHỐI CẢNH 3D VÀ CHỌN VẬT LIỆU",
    owner: "3D Visualization + Senior Designer",
    actions: [
      "DQH THỰC HIỆN:\n• Render 3D chất lượng cao (3000x2000px+)\n• Multiple angles (bếp, phòng khách, phòng ngủ)\n• Material samples thật (không photo)\n• Điều chỉnh max 3 lần",
      "KHÁCH HÀNG:\n• Review & xác nhận 3D\n• Chọn vật liệu từ samples\n• Thanh toán 30%",
      "GHI CHÚ:\n• Explain render ≠ thực tế\n• Material samples PHẢI thật\n• Revision sau lần 3 = charge phí",
    ],
    sort_order: 4,
    metadata: { duration: "1-2 tuần" },
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 5: BẢN VẼ KỸ THUẬT (2D) VÀ BÁO GIÁ THI CÔNG",
    owner: "Triển khai (Drafter) + Design Leader",
    actions: [
      "DQH THỰC HIỆN:\n• Bản vẽ chi tiết kỹ thuật:\n  - Mặt bằng bố trí + kích thước\n  - Mặt đứng chi tiết mỗi bức tường\n  - Chi tiết lắp ráp\n  - Material schedule (code, NCC, mã mẫu, giá)\n  - Layer naming, font, line weight chuẩn DQH\n• Báo giá thi công chi tiết breakdown",
      "KHÁCH HÀNG:\n• Review bản vẽ + báo giá\n• Chốt báo giá\n• Chọn nhà thầu",
      "GHI CHÚ:\n• Bản vẽ 100% correct (0 sai sót)\n• Báo giá transparent (breakdown từng item)\n• Change ở stage này = charge phí",
    ],
    sort_order: 5,
    metadata: { duration: "1-2 tuần" },
  });
  stepsData.push({
    workflow_id: dpId,
    phase: "BƯỚC 6: THANH LÝ HĐ THIẾT KẾ & KÝ KẾT HĐ THI CÔNG",
    owner: "CEO + Senior Designer + Triển khai",
    actions: [
      "DQH THỰC HIỆN:\n• Bàn giao HỒ SƠ THIẾT KẾ HOÀN CHỈNH:\n  - Mặt bằng + phối cảnh + bản vẽ\n  - Material schedule + samples\n  - Báo giá thi công\n  - Hồ sơ hoàn công (As-built sau)\n• Gửi HĐ Thi công\n• Hỗ trợ ký HĐ TC với nhà thầu",
      "KHÁCH HÀNG:\n• Xác nhận Hồ sơ TK\n• Thanh toán 10%\n• Phản hồi & đánh giá\n• Ký HĐ TC",
      "GHI CHÚ:\n• HĐ TC rõ timeline, payment, warranty\n• DQH hỗ trợ site supervision\n• Hồ sơ TK = quyền DQH (copyright)",
    ],
    sort_order: 6,
    metadata: { duration: "1 tuần" },
  });

  // ── 3.3 Handover ──────────────────────────────────────────
  const hoId = wfBySlug["handover"].id;
  const handoverData = [
  {
    "phase": "1. Chuẩn bị hồ sơ bàn giao (Designer → Drafter)",
    "owner": "Senior Designer",
    "actions": [
      "Tổng hợp toàn bộ hồ sơ thiết kế: Bản vẽ concept 2D, hình ảnh 3D đã được khách hàng duyệt, danh sách vật liệu (material selections).",
      "Tạo Design Intent Document (DID) — tài liệu vô cùng quan trọng để giải thích 'TẠI SAO' cho mỗi quyết định thiết kế, giúp team Drafter hiểu rõ ý đồ.",
      "Checklist bàn giao nội bộ: Mặt bằng ✓, mặt đứng cơ bản ✓, 3D ✓, vật liệu ✓, MEP coordination cơ bản ✓.",
      "Lấy chữ ký (Sign-off) xác nhận từ Design Leader trước khi tiến hành bàn giao chính thức."
    ],
    "metadata": null,
    "sort_order": 1
  },
  {
    "phase": "2. Handover Meeting (30-45 phút)",
    "owner": "Design Leader + Drafter Lead",
    "actions": [
      "Walk-through toàn bộ Design Intent: Trình bày ý tưởng, nguồn cảm hứng và những điểm nhấn quan trọng của dự án.",
      "Highlight các chi tiết kỹ thuật phức tạp (critical details): Các điểm giao (joints), sự phối hợp với hệ thống MEP (điện, nước, điều hòa âm trần), và các vật liệu đặc biệt (special finishes).",
      "Q&A Session: Drafter đặt câu hỏi cho mọi thắc mắc, không để lại bất kỳ điểm mù nào trước khi bắt tay vào vẽ.",
      "Ghi chép Meeting Minutes rõ ràng và cả hai bên (Design & Drafter) ký xác nhận đã bàn giao thành công."
    ],
    "metadata": null,
    "sort_order": 2
  },
  {
    "phase": "3. Triển khai bản vẽ kỹ thuật (Shop Drawing)",
    "owner": "Drafter",
    "actions": [
      "Phát triển bản vẽ kỹ thuật thi công (shop drawing) chi tiết từ hồ sơ concept đã nhận.",
      "Thực hiện Coordination MEP: Đảm bảo vị trí đèn, công tắc, ổ cắm, miệng gió điều hòa khớp hoàn toàn với thiết kế trần/tường.",
      "Lập Material Schedule chi tiết: Lên danh sách mã vật liệu, nhà cung cấp (NCC), mã mẫu thực tế, giá cả dự kiến.",
      "Self-check (Tự kiểm tra) bản vẽ trước khi nộp, bám sát các tiêu chuẩn kỹ thuật (Drawing Standards) của DQH."
    ],
    "metadata": null,
    "sort_order": 3
  },
  {
    "phase": "4. Design Review (Kiểm tra chéo)",
    "owner": "Senior Designer",
    "actions": [
      "Review bản vẽ kỹ thuật triển khai so với Design Intent ban đầu — đảm bảo không bị sai lệch ý tưởng.",
      "Thực hiện Mark-up corrections (Red pen) trực tiếp lên bản vẽ (PDF/Bản in) để Drafter chỉnh sửa.",
      "Xác nhận các thông số kỹ thuật vật liệu (Material specifications) trên bản vẽ khớp 100% với mẫu vật liệu thực tế đã duyệt.",
      "Sign-off phê duyệt bản vẽ kỹ thuật cuối cùng (Final technical drawings)."
    ],
    "metadata": null,
    "sort_order": 4
  },
  {
    "phase": "5. Bàn giao cho team Thi Công",
    "owner": "Project Manager (PM) + Design Leader",
    "actions": [
      "Tổ chức Pre-construction meeting (Họp tiền thi công) với nhà thầu chính và các nhà thầu phụ quan trọng.",
      "Walk-through bản vẽ kỹ thuật và Material Schedule thực tế tại công trường hoặc văn phòng.",
      "Xác nhận lại Timeline thi công, các cột mốc quan trọng (Milestones) và lịch thanh toán (Payment schedule).",
      "Phát hành chính thức hồ sơ thi công (Construction package) đóng dấu 'Issued for Construction' cho tất cả các bên liên quan."
    ],
    "metadata": null,
    "sort_order": 5
  }
];
  handoverData.forEach(step => {
    step.workflow_id = hoId;
    stepsData.push(step);
  });

  // ── 3.4 File Naming & Storage ─────────────────────────────
  const fnId = wfBySlug["file-naming"].id;
  stepsData.push({
    workflow_id: fnId,
    phase: "Format tên file",
    owner: "Toàn team",
    actions: [
      "Format: [PROJECT]_[CATEGORY]_[VERSION]_[DATE]_[INITIALS]",
      "VD: VEROSA_F11_MB_V03_20260520_QH.dwg",
    ],
    sort_order: 1,
    metadata: null,
  });
  stepsData.push({
    workflow_id: fnId,
    phase: "Folder structure (7 cấp)",
    owner: "Toàn team",
    actions: [
      "01_BRIEF → 02_CONCEPT → 03_DESIGN → 04_TECHNICAL → 05_EXECUTION → 06_HANDOVER → 07_ARCHIVE",
    ],
    sort_order: 2,
    metadata: null,
  });

  // ── 3.5 Library Management ────────────────────────────────
  const libId = wfBySlug["library"].id;
  stepsData.push({
    workflow_id: libId,
    phase: "Thư viện DQH",
    owner: "Toàn team",
    actions: [
      "Material samples (physical cabinet)",
      "CAD blocks (standard furniture — chính xác scale)",
      "3D models (pre-setup materials + lights)",
      "Reference photos (DQH projects only)",
    ],
    sort_order: 1,
    metadata: null,
  });

  // ── 3.6 Storage & Archive ─────────────────────────────────
  const stId = wfBySlug["storage"].id;
  stepsData.push({
    workflow_id: stId,
    phase: "Lưu trữ & Archive",
    owner: "Toàn team",
    actions: [
      "As-Built bản vẽ (bản đồ sinh mệnh)",
      "Backup hàng tuần",
      "Archive folder = read-only",
    ],
    sort_order: 1,
    metadata: null,
  });

  // ── 3.7 Design Standards ──────────────────────────────────
  const stdId = wfBySlug["standards"].id;
  stepsData.push({
    workflow_id: stdId,
    phase: "Tiêu chuẩn đầu ra",
    owner: "Lead Designer",
    actions: [
      "Visual: Font Helvetica 3.5mm, Line weight 0.35-0.5mm, Layer naming chuẩn",
      "Rendering: Min 3000x2000px, Lighting balanced, Color accurate",
      "Material Schedule: Code, Supplier, Price, Sample, Notes",
    ],
    sort_order: 1,
    metadata: null,
  });

  // ── 3.8 Change Order ──────────────────────────────────────
  const coId = wfBySlug["change-order"].id;
  stepsData.push({
    workflow_id: coId,
    phase: "Quy trình phát sinh",
    owner: "PM / Sales",
    actions: [
      "Evaluate → Estimate → Present options → Client approval → Execute → Archive",
    ],
    sort_order: 1,
    metadata: null,
  });

  // ── 3.9 Client Handover ───────────────────────────────────
  const hcId = wfBySlug["handover-client"].id;
  stepsData.push({
    workflow_id: hcId,
    phase: "Quy trình bàn giao khách",
    owner: "PM + Leader",
    actions: [
      "Defect inspection → Rectification → Final approval → Handover package → Post-handover support (3 months)",
    ],
    sort_order: 1,
    metadata: null,
  });

  const steps = await upsertAndReturn("training_workflow_steps", stepsData);
  console.log(`✅ Inserted ${steps.length} workflow steps`);

  // ══════════════════════════════════════════════════════════════
  // MODULE 4 — TECHNICAL INFRASTRUCTURE
  // ══════════════════════════════════════════════════════════════

  const mod4Id = moduleBySlug["tools-templates"].id;

  const mod4SectionsData = [
    {
      module_id: mod4Id,
      slug: "technical-systems",
      number: "4.1",
      title: "Hệ thống kỹ thuật \"ngầm\" nhưng sống còn",
      description: "Kiểm soát mùi, phân ranh hố ga, ống thở chống trào ngược",
      icon: "Wrench",
      content: "Hệ thống kỹ thuật ngầm quyết định chất lượng sống thực sự của ngôi nhà.",
      sort_order: 1,
    },
    {
      module_id: mod4Id,
      slug: "construction-process",
      number: "4.2",
      title: "Quy trình thi công chuẩn (11 bước bất di bất dịch)",
      description: "Từ xây tường đến dặm vá — KHÔNG được đảo thứ tự",
      icon: "HardHat",
      content: "11 bước thi công chuẩn — KHÔNG được đảo thứ tự.",
      sort_order: 2,
    },
    {
      module_id: mod4Id,
      slug: "as-built",
      number: "4.3",
      title: "Hồ sơ hoàn công (Bản đồ sinh mệnh)",
      description: "Bản vẽ thể hiện đường đi thực tế của ống nước, dây điện sau khi bị trát lấp",
      icon: "Map",
      content: "Chìa khóa trao tay là chưa đủ — phải bàn giao Hồ Sơ Hoàn Công.",
      sort_order: 3,
    },
  ];

  const mod4Sections = await upsertAndReturn("training_sections", mod4SectionsData);
  console.log(`✅ Inserted ${mod4Sections.length} Module 4 sections`);

  const sec4BySlug = {};
  for (const s of mod4Sections) sec4BySlug[s.slug] = s;

  // ── Module 4 Subsections ──────────────────────────────────

  const mod4Subsections = [];

  // ── 4.1 Hệ thống kỹ thuật ngầm ───────────────────────────
  const tsId = sec4BySlug["technical-systems"].id;

  mod4Subsections.push({
    section_id: tsId,
    slug: "technical-systems-list",
    heading: "Hệ thống kỹ thuật \"ngầm\" nhưng sống còn",
    content_type: "items",
    metadata: {
      items: [
        {
          title: "Kiểm soát mùi",
          body: "Con Thỏ (P-Trap) ở mọi phễu thu sàn WC",
        },
        {
          title: "Phân ranh hố ga",
          body: "Sinh hoạt/mưa → hố tự thấm. Bếp → bẫy mỡ → hố ga riêng.",
        },
        {
          title: "Ống thở chống trào ngược",
          body: "Nhà cao → áp lực khí/nước không trào lên.",
        },
      ],
    },
    sort_order: 1,
  });

  // ── 4.2 Quy trình thi công 11 bước ───────────────────────
  const cpId = sec4BySlug["construction-process"].id;

  mod4Subsections.push({
    section_id: cpId,
    slug: "construction-11-steps",
    heading: "11 Bước thi công chuẩn",
    content_type: "items",
    metadata: {
      items: [
        { title: "① Xây tường", body: "" },
        { title: "② Xịt sơn định vị nội thất lên thực tế", body: "KTS + Chủ nhà check" },
        { title: "③ Đi MEP", body: "Điện, nước, điều hòa, báo cháy" },
        { title: "④ Tô trát", body: "" },
        { title: "⑤ Chống thấm", body: "" },
        { title: "⑥ Cán nền", body: "" },
        { title: "⑦ Sơn nước", body: "" },
        { title: "⑧ Ốp lát", body: "" },
        { title: "⑨ Lắp nội thất & Thiết bị", body: "" },
        { title: "⑩ Vệ sinh công nghiệp", body: "" },
        { title: "⑪ Dặm vá (Defect)", body: "" },
      ],
    },
    sort_order: 1,
  });

  mod4Subsections.push({
    section_id: cpId,
    slug: "construction-warning",
    heading: "Lưu ý quan trọng",
    content: "KHÔNG được đảo thứ tự.",
    content_type: "text",
    metadata: null,
    sort_order: 2,
  });

  // ── 4.3 Hồ sơ hoàn công ──────────────────────────────────
  const abId = sec4BySlug["as-built"].id;

  mod4Subsections.push({
    section_id: abId,
    slug: "as-built-content",
    heading: "Hồ sơ hoàn công (Bản đồ sinh mệnh)",
    content: "Chìa khóa trao tay là chưa đủ. Bàn giao Hồ Sơ Hoàn Công: Bản vẽ thể hiện đường đi thực tế của ống nước, dây điện sau khi bị trát lấp.\n\n10–20 năm sau, gia chủ muốn khoan tường, sửa chữa không bao giờ đục trúng ống/dây.\n\nĐây là giá trị cốt lõi của đơn vị TK&TC chuyên nghiệp.",
    content_type: "text",
    metadata: null,
    sort_order: 1,
  });

  const mod4SubsResult = await upsertAndReturn("training_subsections", mod4Subsections);
  console.log(`✅ Inserted ${mod4SubsResult.length} Module 4 subsections`);

  // ══════════════════════════════════════════════════════════════
  // MODULE 5 — ESTIMATION (no DB content — client-side only)
  // ══════════════════════════════════════════════════════════════
  // Module already inserted above. No sections/subsections needed.
  console.log(`ℹ️  Module 5 (Estimation) — client-side only, no DB content.`);

  // ══════════════════════════════════════════════════════════════
  // MODULE 6 — SALES & MARKETING (placeholder)
  // ══════════════════════════════════════════════════════════════

  const mod6Id = moduleBySlug["sales-marketing"].id;

  const mod6SectionsData = [
    {
      module_id: mod6Id,
      slug: "sales-skills",
      number: "6.1",
      title: "Script gặp khách lần đầu",
      description: "Cách tiếp cận, tư vấn và chốt deal",
      icon: "Megaphone",
      content: "Kỹ năng chuyên nghiệp dành cho sales & marketing tại DQH",
      sort_order: 1,
    },
    {
      module_id: mod6Id,
      slug: "concept-presentation",
      number: "6.2",
      title: "Cách trình bày concept",
      description: "Kỹ năng present concept cho khách hàng",
      icon: "Presentation",
      content: "Kỹ năng chuyên nghiệp dành cho sales & marketing tại DQH",
      sort_order: 2,
    },
    {
      module_id: mod6Id,
      slug: "ql-communication",
      number: "6.3",
      title: "Ngôn ngữ Quiet Luxury khi giao tiếp",
      description: "Cách sử dụng ngôn ngữ phù hợp với triết lý QL",
      icon: "MessageCircle",
      content: "Kỹ năng chuyên nghiệp dành cho sales & marketing tại DQH",
      sort_order: 3,
    },
  ];

  const mod6Sections = await upsertAndReturn("training_sections", mod6SectionsData);
  console.log(`✅ Inserted ${mod6Sections.length} Module 6 sections`);
  
  const sec6BySlug = {};
  for (const s of mod6Sections) sec6BySlug[s.slug] = s;
  
  const mod6Subsections = [];
  const m6Sales = [
  {
    "section_id": "__SALES_SEC1_ID__",
    "slug": "script-mo-dau",
    "heading": "1. Script mở đầu (First 10 minutes)",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Chào hỏi & Phá băng (Ice-breaking)",
          "body": "Bắt đầu bằng sự tinh tế và chân thành. 'Dạ chào anh/chị [Tên khách], rất vui được đón tiếp anh/chị tại DQH hôm nay. Anh/chị đi đường đến đây có thuận tiện không ạ? Không gian văn phòng DQH có làm anh/chị cảm thấy thư giãn không?' Mời nước lọc/trà/café và tạo không khí thoải mái."
        },
        {
          "title": "Giới thiệu DQH (30-second Elevator Pitch)",
          "body": "Tập trung vào triết lý, không phải dịch vụ. 'Tại DQH, tụi em theo đuổi phong cách Quiet Luxury. Tụi em tin rằng sự sang trọng không nằm ở sự phô trương hay lấp lánh, mà nằm ở chất lượng vật liệu nguyên bản, tỷ lệ không gian hài hòa và cảm giác bình yên khi anh/chị trở về nhà sau một ngày làm việc.'"
        },
        {
          "title": "Chuyển tiếp tự nhiên sang khám phá nhu cầu",
          "body": "'Để tụi em có thể hình dung rõ nhất về không gian sống mơ ước của anh/chị, anh/chị có thể chia sẻ một chút về thói quen sinh hoạt hàng ngày của gia đình mình được không ạ?'"
        }
      ]
    },
    "sort_order": 1
  },
  {
    "section_id": "__SALES_SEC1_ID__",
    "slug": "kham-pha-nhu-cau",
    "heading": "2. Câu hỏi khám phá nhu cầu (Discovery Questions)",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Lifestyle (Lối sống & Sinh hoạt)",
          "body": "• 'Gia đình anh/chị thường dành nhiều thời gian ở đâu nhất trong nhà?'\n• 'Cuối tuần, anh/chị thường thích tổ chức tiệc tùng đông người hay ưu tiên sự riêng tư, yên tĩnh?'\n• 'Anh/chị có thói quen đọc sách, thiền, hoặc cần một góc làm việc tập trung cao độ không?'"
        },
        {
          "title": "Aesthetic (Gu thẩm mỹ)",
          "body": "• 'Anh/chị có thể mô tả cảm giác mong muốn khi bước vào nhà? (Ví dụ: ấm cúng, thư giãn như resort, hay năng động hiện đại)'\n• 'Có không gian khách sạn, resort hay nhà hàng nào anh/chị từng ghé mà để lại ấn tượng mạnh không?'\n• 'Có vật liệu hay tông màu nào anh/chị đặc biệt thích hoặc đặc biệt không thích không?'"
        },
        {
          "title": "Practical (Thực tế)",
          "body": "• 'Quy mô gia đình mình gồm bao nhiêu thành viên? Mình có dự định thêm thành viên trong 5 năm tới không?'\n• 'Gia đình mình có nuôi thú cưng không ạ? (Điều này ảnh hưởng rất lớn đến việc chọn vật liệu sàn, sofa)'\n• 'Mức ngân sách (budget) dự kiến mà anh/chị muốn đầu tư cho không gian này là khoảng bao nhiêu?'\n• 'Anh/chị dự kiến khi nào thì có thể dọn vào ở?'"
        },
        {
          "title": "Pain points (Nỗi đau hiện tại)",
          "body": "• 'Điều gì ở không gian sống hiện tại làm anh/chị cảm thấy bất tiện hoặc không hài lòng nhất?'\n• 'Có vấn đề nào về lưu trữ đồ đạc (storage) mà anh/chị muốn giải quyết triệt để trong nhà mới không?'"
        }
      ]
    },
    "sort_order": 2
  },
  {
    "section_id": "__SALES_SEC1_ID__",
    "slug": "xu-ly-objections",
    "heading": "3. Xử lý Objections phổ biến",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "'Giá thiết kế/thi công của DQH có vẻ cao hơn thị trường?'",
          "body": "Chiến lược: Đừng bào chữa, hãy nói về Giá Trị. 'Dạ đúng ạ, chi phí đầu tư ban đầu tại DQH thường nhỉnh hơn. Nhưng đó là vì tụi em đầu tư vào những giá trị vô hình: hệ thống kỹ thuật MEP chuẩn xác giúp anh/chị không bao giờ phải đục tường sửa chữa, vật liệu tự nhiên càng dùng càng đẹp theo thời gian, và không gian sống bền vững trong 10-20 năm tới chứ không phải chạy theo trend ngắn hạn.'"
        },
        {
          "title": "'Tôi chỉ cần bản vẽ thiết kế, tôi có người nhà thi công được.'",
          "body": "Chiến lược: Giải thích giá trị End-to-End. 'DQH hoàn toàn tôn trọng quyết định của anh/chị. Tuy nhiên, thiết kế Quiet Luxury phụ thuộc 80% vào kỹ thuật thi công và độ sắc nét của chi tiết (craftsmanship). Rất nhiều vật liệu đặc biệt hoặc chi tiết giấu viền cần thợ có tay nghề cao và am hiểu bản vẽ của tụi em. Nếu thi công không đạt chuẩn, giá trị thiết kế sẽ bị giảm đi rất nhiều.'"
        },
        {
          "title": "'Tôi muốn làm nhà y hệt như hình 3D tôi lưu trên Pinterest này.'",
          "body": "Chiến lược: Educate về sự cá nhân hóa. 'Bức hình này rất đẹp và thể hiện gu thẩm mỹ tinh tế của anh/chị. Tuy nhiên, mỗi ngôi nhà có hướng nắng, hướng gió và tỷ lệ không gian khác nhau. Hơn nữa, thói quen sinh hoạt của gia đình mình là duy nhất. Tụi em sẽ dùng bức hình này làm cảm hứng (mood), nhưng sẽ thiết kế một không gian may đo (bespoke) dành riêng cho anh/chị.'"
        },
        {
          "title": "'Sao thiết kế đơn điệu thế? Sao không thêm vách đá xuyên sáng hay mạ vàng cho sang?'",
          "body": "Chiến lược: Giải thích triết lý Quiet Luxury. 'Tại DQH, sự sang trọng thực sự là sự kiềm chế. Khi ta đưa quá nhiều điểm nhấn vào một không gian, mắt sẽ bị mệt và không gian nhanh bị lỗi thời. Sự sang trọng tụi em hướng tới là cảm giác êm ái khi tay chạm vào mặt gỗ sồi tự nhiên, hay ánh sáng dịu nhẹ hắt ra từ khe rèm mỗi buổi tối.'"
        },
        {
          "title": "'Timeline thiết kế và thi công của bên em hơi dài.'",
          "body": "Chiến lược: Quality vs. Speed. 'Một dự án chuẩn mực cần thời gian để 'chín'. Quá trình thiết kế kỹ lưỡng sẽ giúp giảm thiểu 90% rủi ro và phát sinh khi ra công trường. Thời gian anh/chị chờ đợi đổi lấy sự yên tâm tuyệt đối và một tổ ấm hoàn hảo từng chi tiết.'"
        }
      ]
    },
    "sort_order": 3
  },
  {
    "section_id": "__SALES_SEC1_ID__",
    "slug": "follow-up-template",
    "heading": "4. Follow-up Template (24h sau meeting)",
    "content": "Kính gửi Anh/Chị [Tên Khách Hàng],\n\nThay mặt đội ngũ DQH, em xin chân thành cảm ơn anh/chị đã dành thời gian đến văn phòng trao đổi về dự án [Tên Dự Án/Địa Chỉ] vào ngày hôm qua.\n\nĐội ngũ rất ấn tượng với gu thẩm mỹ và những kỳ vọng của anh/chị về một không gian sống [tính từ: bình yên/hiện đại/ấm cúng]. Như chúng ta đã thảo luận, DQH sẽ tập trung vào các điểm chính:\n- Tối ưu hóa không gian sinh hoạt chung để gia đình có nhiều thời gian gắn kết.\n- Ứng dụng triết lý Quiet Luxury với bảng vật liệu tự nhiên (gỗ sồi, đá vôi).\n- Giải quyết vấn đề lưu trữ (storage) thông minh để không gian luôn gọn gàng.\n\n[Next Steps]\nBước tiếp theo, nếu anh/chị đồng ý với định hướng sơ bộ này, DQH xin phép gửi đính kèm Hợp đồng Thiết kế (hoặc Báo giá Thiết kế). Sau khi hoàn tất thủ tục, team sẽ tiến hành khảo sát hiện trạng chi tiết vào [Thời gian đề xuất].\n\nEm cũng có đính kèm Portfolio một dự án mang tinh thần tương tự để anh/chị tham khảo thêm về cách xử lý ánh sáng và vật liệu của DQH.\n\nNếu anh/chị có bất kỳ câu hỏi nào, xin đừng ngần ngại liên hệ với em.\n\nTrân trọng,\n[Tên Sales/Designer]\nDQH Interior Design",
    "content_type": "text",
    "metadata": null,
    "sort_order": 4
  },
  {
    "section_id": "__SALES_SEC2_ID__",
    "slug": "cau-truc-trinh-bay",
    "heading": "1. Cấu trúc buổi trình bày (45-60 phút)",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Opening (5 phút): Recap Brief",
          "body": "Bắt đầu bằng việc nhắc lại những mong muốn, nỗi đau và yêu cầu của khách hàng từ buổi họp đầu tiên. Điều này chứng minh: 'Chúng tôi đã lắng nghe rất kỹ và thấu hiểu anh/chị'."
        },
        {
          "title": "Concept Story (15 phút): WHY before WHAT",
          "body": "Tuyệt đối chưa mở bản vẽ 3D vội. Trình bày ý tưởng chủ đạo (Big Idea), nguồn cảm hứng (Mood board), bảng màu (Color Palette) và phân tích công năng. Kể câu chuyện thiết kế giải quyết vấn đề của họ như thế nào."
        },
        {
          "title": "Design Walkthrough (20 phút): Dẫn dắt không gian",
          "body": "Trình bày từ Mặt bằng công năng (Floor plan) -> Các góc nhìn 3D (Renders). Kết hợp cho khách hàng xem và chạm vào bảng mẫu vật liệu thực tế (Material boards) đã chuẩn bị sẵn. Dẫn dắt cảm xúc đi từ cửa vào đến từng căn phòng."
        },
        {
          "title": "Discussion (15 phút): Q&A và Phản hồi",
          "body": "Mời khách hàng chia sẻ cảm nhận. Lắng nghe ghi chép cẩn thận. Không nên phản bác ngay lập tức nếu khách có ý kiến trái chiều, hãy dùng kỹ thuật giải thích quyết định thiết kế."
        },
        {
          "title": "Closing (5 phút): Chốt Next Steps",
          "body": "Tóm tắt các điểm cần chỉnh sửa (nếu có). Chốt thời gian gửi lại bản cập nhật hoặc bước tiếp theo (ký hợp đồng thi công)."
        }
      ]
    },
    "sort_order": 1
  },
  {
    "section_id": "__SALES_SEC2_ID__",
    "slug": "storytelling-quiet-luxury",
    "heading": "2. Storytelling Technique cho Quiet Luxury",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Bắt đầu bằng Lifestyle, không phải Floor Plan",
          "body": "Thay vì nói 'Đây là phòng khách 30m2', hãy nói 'Đây là nơi mỗi tối cuối tuần cả gia đình mình sẽ quây quần xem phim, nên tụi em thiết kế ánh sáng thật êm dịu và sofa cực kỳ sâu, êm ái'."
        },
        {
          "title": "Sử dụng ngôn ngữ Cảm Giác (Sensory Language)",
          "body": "Kích thích các giác quan của khách hàng. 'Khi chị bước chân trần lên sàn gỗ sồi này vào buổi sáng, cảm giác sẽ rất ấm áp'. 'Ánh nắng sớm sẽ len qua rèm linen trong suốt này tạo hiệu ứng bóng đổ rất thơ trên mảng tường'."
        },
        {
          "title": "Kết nối thiết kế với Thói Quen",
          "body": "Gắn mỗi quyết định thiết kế với hành vi thực tế. 'Vì anh hay đi làm về muộn, tụi em bố trí một hệ đèn cảm ứng dưới chân giường, ánh sáng màu vàng ấm rất nhẹ, đủ để anh di chuyển mà không làm chị thức giấc'."
        },
        {
          "title": "Chỉ ra những điều 'Vô Hình' (The Invisible)",
          "body": "Trong Quiet Luxury, cái đẹp nằm ở sự vô hình. Hãy chỉ cho khách hàng thấy: cách giấu máy lạnh âm trần khe hẹp, cách phân luồng gió đối lưu tự nhiên, sự mạch lạc của ron gạch, hoặc các hệ thống lưu trữ được giấu phẳng vào tường."
        }
      ]
    },
    "sort_order": 2
  },
  {
    "section_id": "__SALES_SEC2_ID__",
    "slug": "giai-thich-quyet-dinh",
    "heading": "3. Cách giải thích quyết định thiết kế",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Tại sao chọn chất liệu tự nhiên (Gỗ sồi/Đá)?",
          "body": "Giải thích về sự lão hóa đẹp (Aging gracefully). 'Vật liệu công nghiệp ban đầu rất đẹp nhưng xước là hỏng. Gỗ thật hay đá thật có sự ấm áp về xúc giác, và theo thời gian, những vết hằn sử dụng sẽ trở thành câu chuyện riêng của ngôi nhà, nó có hồn hơn rất nhiều.'"
        },
        {
          "title": "Tại sao dùng ánh sáng gián tiếp (Indirect Lighting)?",
          "body": "Nhấn mạnh yếu tố sức khỏe và cảm xúc (Circadian rhythm). 'Tụi em hạn chế tối đa đèn chiếu thẳng vào mắt (downlight). Ánh sáng hắt khe gián tiếp mô phỏng ánh sáng hoàng hôn, giúp não bộ anh/chị thư giãn ngay lập tức và có giấc ngủ sâu hơn.'"
        },
        {
          "title": "Tại sao không dùng màu nổi (Bold Colors)?",
          "body": "Bài test 10 năm (The 10-year test). 'Một màu sắc đang trend có thể làm anh chị thích thú 1-2 năm đầu, nhưng nhanh chóng gây chán và mệt mỏi thị giác. Tông màu Neutral (trung tính) tạo ra một 'phông nền' tĩnh lặng, để chính con người và những sinh hoạt của gia đình trở thành điểm nhấn rực rỡ nhất.'"
        },
        {
          "title": "Framework Trả Lời: Problem → Principle → Solution → Benefit",
          "body": "Quy tắc 4 bước: (1) Nhắc lại vấn đề của khách, (2) Đưa ra nguyên tắc thiết kế, (3) Trình bày giải pháp đã vẽ, (4) Nhấn mạnh lợi ích cuối cùng."
        }
      ]
    },
    "sort_order": 3
  },
  {
    "section_id": "__SALES_SEC3_ID__",
    "slug": "tu-vung-ql",
    "heading": "1. Từ vựng nên dùng vs nên tránh",
    "content": null,
    "content_type": "table",
    "metadata": {
      "table": [
        [
          "Từ vựng NÊN DÙNG (Quiet Luxury)",
          "Thay vì dùng (Thông thường)",
          "Lý do / Sắc thái biểu đạt"
        ],
        [
          "Tinh tế, Kiềm chế (Restrained)",
          "Đơn giản, Trống trải",
          "Tạo cảm giác thiết kế có chủ đích, sự lựa chọn thông minh chứ không phải thiếu ý tưởng."
        ],
        [
          "Chất liệu tự nhiên, Nguyên bản",
          "Vật liệu mắc tiền, Vật liệu xịn",
          "Tập trung vào giá trị thực chất của vật liệu thay vì khoe khoang giá tiền."
        ],
        [
          "Khoảng không gian thở",
          "Chỗ trống, Không có đồ",
          "Nhấn mạnh khoảng trống là một yếu tố thiết kế quan trọng, mang lại sự thư giãn."
        ],
        [
          "Khoản đầu tư dài hạn",
          "Chi phí, Giá thành cao",
          "Thay đổi mindset khách hàng: xây nhà là đầu tư cho cuộc sống 10-20 năm tới."
        ],
        [
          "Thiết kế May đo (Bespoke/Tailor-made)",
          "Thiết kế riêng, Đồ đóng",
          "Nâng tầm giá trị sản phẩm, giống như một bộ suit may đo vừa vặn với từng khách hàng."
        ],
        [
          "Bền bỉ, Vượt thời gian (Timeless)",
          "Không bị lỗi mốt, Bền",
          "Tạo cảm giác đẳng cấp, thiết kế sống mãi với thời gian, không phụ thuộc vào trend."
        ],
        [
          "Ấm áp, Có hồn (Soulful)",
          "Màu vàng, Nhìn ấm",
          "Đánh vào cảm xúc và trải nghiệm không gian thay vì chỉ mô tả vật lý."
        ],
        [
          "Sự tĩnh lặng (Tranquility)",
          "Yên tĩnh",
          "Gợi lên trạng thái tâm lý thư thái cao nhất khi ở nhà."
        ],
        [
          "Chạm (Xúc giác / Tactile)",
          "Sờ, Cầm",
          "Nhấn mạnh trải nghiệm vật liệu tinh tế qua các giác quan."
        ]
      ]
    },
    "sort_order": 1
  },
  {
    "section_id": "__SALES_SEC3_ID__",
    "slug": "mo-ta-vat-lieu",
    "heading": "2. Cách mô tả vật liệu cho khách hàng",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Về Gỗ tự nhiên (Sồi/Óc chó)",
          "body": "'Mỗi tấm gỗ veneer này có đường vân duy nhất, không có tấm thứ hai giống hệt. Khi anh/chị lướt tay qua bề mặt hoàn thiện mờ (matte) này, cảm giác rất thật, rất ấm áp. Càng sử dụng theo thời gian, gỗ sẽ càng xuống màu sâu hơn, đẹp hơn.'"
        },
        {
          "title": "Về Đá Marble tự nhiên",
          "body": "'Tụi em chọn phiến đá Statuario này vì đường vân của nó như một bức tranh thủy mặc mà thiên nhiên vẽ riêng cho phòng tắm của anh/chị. Không cần thêm bất kỳ bức tranh trang trí nào nữa.'"
        },
        {
          "title": "Về Vải Linen (Lanh)",
          "body": "'Vải linen là một chất vải thở. Dù nó có nếp nhăn tự nhiên, nhưng chính những nếp nhăn đó tạo nên vẻ đẹp phóng khoáng, thư giãn. Càng giặt, sợi vải sẽ càng mềm mượt và êm ái hơn.'"
        },
        {
          "title": "Bí quyết chung (Sensory Description)",
          "body": "Luôn mô tả vật liệu thông qua các giác quan: Xúc giác (chạm vào thấy nhám/mát/mềm), Thị giác (dưới ánh đèn nó sẽ đổ bóng/phản quang như thế nào), và Cảm giác mang lại."
        }
      ]
    },
    "sort_order": 2
  },
  {
    "section_id": "__SALES_SEC3_ID__",
    "slug": "template-giao-tiep",
    "heading": "3. Template giao tiếp chuẩn DQH",
    "content": null,
    "content_type": "items",
    "metadata": {
      "items": [
        {
          "title": "Email xác nhận Meeting (Chuyên nghiệp, Chu đáo)",
          "body": "Kính gửi [Tên Khách Hàng],\nDQH xin xác nhận lịch hẹn tư vấn thiết kế nội thất với anh/chị:\n- Thời gian: [Ngày/Giờ]\n- Địa điểm: Văn phòng DQH / Online\nDQH đã chuẩn bị sẵn một số tài liệu và bảng vật liệu để anh/chị tham khảo. Anh/chị vui lòng phản hồi email này nếu có thay đổi về lịch trình.\nTrân trọng,"
        },
        {
          "title": "Thank You Note sau bàn giao (Handwritten is best)",
          "body": "Anh/Chị [Tên] thân mến,\nCảm ơn anh/chị đã tin tưởng trao cho DQH cơ hội kiến tạo nên tổ ấm này. Hành trình vừa qua thật đáng nhớ.\nChúc gia đình mình sẽ có những khoảnh khắc thật bình yên và hạnh phúc trong không gian mới. DQH luôn ở đây bất cứ khi nào ngôi nhà cần bảo trì.\nThân mến,\nĐội ngũ DQH."
        },
        {
          "title": "Referral Request (Xin lời giới thiệu một cách tinh tế)",
          "body": "Sau khi khách đã ở 1-2 tháng và cực kỳ hài lòng: 'DQH rất hạnh phúc khi thấy gia đình mình tận hưởng không gian mới. Niềm vui lớn nhất của tụi em là thiết kế những không gian mang lại sự bình yên như vậy. Nếu anh/chị có bạn bè hay đối tác cũng yêu thích phong cách sống này, mong anh/chị giới thiệu giúp DQH nhé. Sự công nhận của anh/chị là bảo chứng lớn nhất cho tụi em.'"
        }
      ]
    },
    "sort_order": 3
  }
];
  m6Sales.forEach(s => {
    s.section_id = sec6BySlug[s.slug.startsWith('script') || s.slug.startsWith('kham') || s.slug.startsWith('xu') || s.slug.startsWith('follow') ? 'sales-skills' : s.slug.startsWith('cau-truc') || s.slug.startsWith('story') || s.slug.startsWith('giai') ? 'concept-presentation' : 'ql-communication'].id;
    mod6Subsections.push(s);
  });
  
  const mod6SubsResult = await upsertAndReturn("training_subsections", mod6Subsections);
  console.log(`✅ Inserted ${mod6SubsResult.length} Module 6 subsections`);


  // ── DONE ──────────────────────────────────────────────────

  const totalSections = mod1Sections.length + mod2Sections.length + mod4Sections.length + mod6Sections.length;
  const totalSubsections = mod1SubsResult.length + mod2SubsResult.length + mod4SubsResult.length + mod6SubsResult.length;

  console.log("\n🎉 Training Hub seeded successfully! (v3.0 Full Content)");
  console.log(`   Modules:      ${modules.length}`);
  console.log(`   Sections:     ${totalSections}`);
  console.log(`   Subsections:  ${totalSubsections}`);
  console.log(`   Workflows:    ${workflows.length}`);
  console.log(`   WF Steps:     ${steps.length}`);
}

seed().catch((err) => {
  console.error("💥 Seed failed:", err);
  process.exit(1);
});
