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

  mod1Subsections.push({
    section_id: jdId,
    slug: "job-descriptions-placeholder",
    heading: "Chi tiết các vị trí",
    content: "[Chi tiết các vị trí sẽ được thêm sau]",
    content_type: "text",
    metadata: null,
    sort_order: 1,
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

  mod2Subsections.push({
    section_id: styleId,
    slug: "styles-placeholder",
    heading: "Chi tiết các style",
    content: "[Chi tiết các style sẽ được thêm sau]",
    content_type: "text",
    metadata: null,
    sort_order: 1,
  });

  // ── 2.6 Case Study nội bộ ─────────────────────────────────
  const caseId = sec2BySlug["case-studies"].id;

  mod2Subsections.push({
    section_id: caseId,
    slug: "case-studies-placeholder",
    heading: "Dự án case study",
    content: "[Placeholder — cần update với dự án thực tế]",
    content_type: "text",
    metadata: null,
    sort_order: 1,
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
  stepsData.push({
    workflow_id: hoId,
    phase: "Placeholder",
    owner: "—",
    actions: ["[Sẽ build chi tiết]"],
    sort_order: 1,
    metadata: null,
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
      content: "[PLACEHOLDER — Sẽ build chi tiết sau]",
      sort_order: 1,
    },
    {
      module_id: mod6Id,
      slug: "concept-presentation",
      number: "6.2",
      title: "Cách trình bày concept",
      description: "Kỹ năng present concept cho khách hàng",
      icon: "Presentation",
      content: "[PLACEHOLDER — Sẽ build chi tiết sau]",
      sort_order: 2,
    },
    {
      module_id: mod6Id,
      slug: "ql-communication",
      number: "6.3",
      title: "Ngôn ngữ Quiet Luxury khi giao tiếp",
      description: "Cách sử dụng ngôn ngữ phù hợp với triết lý QL",
      icon: "MessageCircle",
      content: "[PLACEHOLDER — Sẽ build chi tiết sau]",
      sort_order: 3,
    },
  ];

  const mod6Sections = await upsertAndReturn("training_sections", mod6SectionsData);
  console.log(`✅ Inserted ${mod6Sections.length} Module 6 placeholder sections`);

  // ── DONE ──────────────────────────────────────────────────

  const totalSections = mod1Sections.length + mod2Sections.length + mod4Sections.length + mod6Sections.length;
  const totalSubsections = mod1SubsResult.length + mod2SubsResult.length + mod4SubsResult.length;

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
