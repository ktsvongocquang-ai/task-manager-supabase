import { useState, useMemo, useRef } from "react";
import {
  BookOpen, GitBranch, Calculator, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, Upload,
  Lightbulb, ArrowLeft, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package,
  RefreshCw, TriangleAlert
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── DESIGN TOKENS (match DQH app) ──────────────────────────
// Primary: #7C3AED (purple-600)
// Active bg: #7C3AED / text white
// Content bg: #F9FAFB
// Card: white, border #E5E7EB
// Text primary: #111827  secondary: #6B7280  muted: #9CA3AF
// Accent red: #EF4444   green: #10B981   orange: #F59E0B

// ─── DATA ────────────────────────────────────────────────────

const DESIGN_SECTIONS = [
  {
    id: "philosophy", number: "2.1", icon: Sparkles,
    title: "Triết lý thiết kế DQH",
    desc: "5 nguyên tắc Quiet Luxury — tỷ lệ, ánh sáng, vật liệu",
  },
  {
    id: "fundamentals", number: "2.2", icon: Ruler,
    title: "Kiến thức nền",
    desc: "Công thái học, kích thước chuẩn (mm), chiều cao trần",
  },
  {
    id: "styles", number: "2.3", icon: Palette,
    title: "Style Library",
    desc: "Quiet Luxury, Modern Luxury, Indochine — DNA từng style",
  },
  {
    id: "cases", number: "2.4", icon: Layers,
    title: "Case Study nội bộ",
    desc: "Dự án đã làm — phân tích hay/dở, bài học",
  },
  {
    id: "mistakes", number: "2.5", icon: TriangleAlert,
    title: "Common Mistakes",
    desc: "Lỗi sai thường gặp trong TK, Triển khai, Khách hàng",
  },
];

const DESIGN_CONTENT = {
  philosophy: {
    title: "Triết lý thiết kế DQH", number: "2.1",
    lead: "Quiet Luxury không phải là sự thiếu vắng — đó là sự hiện diện được kiểm soát.",
    blocks: [
      {
        heading: "5 Nguyên tắc cốt lõi",
        items: [
          { title: "Tỷ lệ trước trang trí", body: "Một không gian đúng tỷ lệ luôn đẹp dù chưa có gì. Trang trí chỉ là lớp cuối cùng, không phải để cứu vớt bố cục sai." },
          { title: "Vật liệu kể chuyện", body: "Chọn vật liệu thật, để vân gỗ, đường vân đá, texture vải tự lên tiếng. Không che, không phủ giả." },
          { title: "Ánh sáng có lớp", body: "Tối thiểu 3 lớp: ambient (nền), task (chức năng), accent (điểm nhấn). Không bao giờ chỉ dùng đèn trần." },
          { title: "Bảng màu giới hạn", body: "Tối đa 3 màu chính + 1 accent. Quiet Luxury sống nhờ sự kiềm chế, không phải đa sắc." },
          { title: "Khoảng trống là chi tiết", body: "Negative space được tính toán như mọi chi tiết khác. Khoảng trống đắt hơn đồ đạc." },
        ],
      },
      {
        heading: "Material Palette chuẩn DQH",
        items: [
          { title: "Gỗ", body: "Walnut Mỹ, sồi trắng vân thẳng, teak Myanmar. Không dùng veneer giả vân nổi." },
          { title: "Đá", body: "Travertine, marble Calacatta, đá vôi Bình Định. Tránh đá nhân tạo vân quá đều." },
          { title: "Kim loại", body: "Brass brushed, blackened steel, antique bronze. Không chrome bóng." },
          { title: "Vải", body: "Linen Bỉ, bouclé wool, velvet mohair. Màu trung tính đậm." },
        ],
      },
    ],
  },
  fundamentals: {
    title: "Kiến thức nền", number: "2.2",
    lead: "Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định.",
    blocks: [
      {
        heading: "Kích thước công thái học (mm)",
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
      {
        heading: "Chiều cao trần theo phân khúc",
        items: [
          { title: "Standard", body: "2700–2800mm — vừa đủ cho căn hộ thông thường" },
          { title: "Premium", body: "3000–3200mm — bắt đầu có cảm giác sang" },
          { title: "Luxury", body: "3300mm+ — không gian thở, đủ chỗ cho chandelier" },
        ],
      },
    ],
  },
  styles: {
    title: "Style Library", number: "2.3",
    lead: "Mỗi style có DNA riêng. Hiểu sâu một style trước khi pha trộn.",
    blocks: [
      {
        heading: "Quiet Luxury / Japandi (Signature DQH)",
        items: [
          { title: "Palette", body: "Ivory, oat, taupe, charcoal + accent brass/aged brass" },
          { title: "Vật liệu", body: "Sồi trắng, travertine, linen, bouclé" },
          { title: "Đường nét", body: "Thẳng, sạch, soft edge — không cong điệu đà" },
          { title: "Tránh", body: "Họa tiết phức tạp, gold bóng, marble vân quá nổi" },
        ],
      },
      {
        heading: "Modern Luxury",
        items: [
          { title: "Palette", body: "Charcoal, off-white, walnut + brass/champagne gold" },
          { title: "Vật liệu", body: "Walnut, Calacatta, velvet, leather" },
          { title: "Đường nét", body: "Geometric mạnh, contrast cao" },
          { title: "Tránh", body: "Quá nhiều texture mềm, palette nhạt" },
        ],
      },
      {
        heading: "Indochine đương đại",
        items: [
          { title: "Palette", body: "Cream, terracotta, jade, dark wood + brass" },
          { title: "Vật liệu", body: "Teak, rattan, gạch bông, lụa Việt" },
          { title: "Đường nét", body: "Tinh giản hóa motif Đông Dương, không lạm dụng" },
          { title: "Tránh", body: "Sao chép nguyên mẫu Pháp thuộc, kitsch" },
        ],
      },
    ],
  },
  cases: {
    title: "Case Study nội bộ", number: "2.4",
    lead: "Mỗi dự án là một bài học. Đây là thư viện DQH dùng để dạy lẫn nhau.",
    blocks: [
      {
        heading: "Cấu trúc 1 case study chuẩn",
        items: [
          { title: "01. Brief & Constraint", body: "Khách là ai, ngân sách, deadline, ràng buộc kỹ thuật" },
          { title: "02. Concept & Lý do", body: "Tại sao chọn hướng này, đã loại bỏ option nào và tại sao" },
          { title: "03. Quá trình thiết kế", body: "Các iteration chính, key decisions" },
          { title: "04. Thi công thực tế", body: "Cái gì làm được, cái gì phải đổi, lý do" },
          { title: "05. Kết quả & Học được gì", body: "Phản hồi khách, lỗi muốn tránh lần sau" },
        ],
      },
      {
        heading: "Dự án archive (sẽ bổ sung)",
        items: [
          { title: "UBT Office — Q3 HCM", body: "130m² · Modern Luxury · 13.5tr/m² — đang bổ sung" },
          { title: "Verosa F11 Townhouse", body: "Nhà phố 4 tầng 5×17m · Quiet Luxury — đang bổ sung" },
        ],
      },
    ],
  },
  mistakes: {
    title: "Common Mistakes", number: "2.5",
    lead: "Lỗi sai không phải để xấu hổ — để cả team không lặp lại.",
    blocks: [
      {
        heading: "Trong giai đoạn THIẾT KẾ",
        mistakes: [
          { wrong: "Đặt giường đối diện cửa WC (phong thủy & thẩm mỹ)", right: "Đặt giường vuông góc hoặc lệch trục cửa WC" },
          { wrong: "Layout bếp không theo tam giác công năng (bếp – chậu – tủ lạnh)", right: "Tổng 3 điểm: 3.6–6.6m, không có điểm nào < 1.2m" },
          { wrong: "Đèn chùm phòng ăn cao hơn 90cm so với mặt bàn", right: "Đáy đèn cách bàn 75–90cm, đường kính đèn = ½ – ⅔ chiều rộng bàn" },
          { wrong: "Chọn vật liệu chỉ qua ảnh, không cầm mẫu thật", right: "Bắt buộc duyệt sample vật liệu thật trước khi trình khách" },
        ],
      },
      {
        heading: "Trong giai đoạn TRIỂN KHAI",
        mistakes: [
          { wrong: "Bản vẽ thiếu cao độ ổ điện, công tắc", right: "Mỗi mặt tường có cao độ thiết bị điện chi tiết theo công năng" },
          { wrong: "Không có material schedule riêng — chỉ ghi trên 3D", right: "Material schedule: mã, ký hiệu, nhà CC, ghi chú thi công" },
          { wrong: "File TK / cơ điện / nội thất không coordination", right: "Drawing coordination meeting trước khi xuất full set" },
        ],
      },
      {
        heading: "Khi LÀM VIỆC VỚI KHÁCH",
        mistakes: [
          { wrong: "Hứa miệng 'phát sinh nhỏ không tính tiền'", right: "Mọi thay đổi có change order văn bản, dù 0đ" },
          { wrong: "Trình concept bằng mood board chung chung, không vật liệu", right: "Mood board kèm vật liệu cụ thể + budget implication" },
        ],
      },
    ],
  },
};

const WORKFLOWS = [
  { id: "client-meeting", number: "3.1", icon: Users, title: "Gặp khách & Tư vấn", desc: "Tiếp khách lần đầu đến ký hợp đồng" },
  { id: "design-process", number: "3.2", icon: Sparkles, title: "Quy trình thiết kế", desc: "Concept → 3D → Bản vẽ kỹ thuật" },
  { id: "handover", number: "3.3", icon: RefreshCw, title: "Bàn giao TK → TC", desc: "Chuyển giao giữa các bộ phận" },
  { id: "file-naming", number: "3.4", icon: FileText, title: "Lưu file & Naming", desc: "Quy chuẩn đặt tên, version control" },
  { id: "library", number: "3.5", icon: Package, title: "Thư viện & Block", desc: "CAD blocks, 3D models, material" },
  { id: "storage", number: "3.6", icon: FolderOpen, title: "Lưu trữ dự án", desc: "Cấu trúc folder chuẩn DQH" },
  { id: "standards", number: "3.7", icon: ClipboardList, title: "Tiêu chuẩn đầu ra", desc: "Deliverable theo từng tier" },
  { id: "change-order", number: "3.8", icon: GitBranch, title: "Phát sinh & Thay đổi", desc: "Change request, change order" },
  { id: "handover-client", number: "3.9", icon: CheckCircle2, title: "Nghiệm thu & Hậu mãi", desc: "Bàn giao khách, bảo hành" },
];

const WORKFLOW_CONTENT = {
  "client-meeting": {
    title: "Gặp khách & Tư vấn", number: "3.1",
    lead: "Lần gặp đầu tiên quyết định 70% khả năng ký HĐ.",
    steps: [
      { phase: "Trước cuộc gặp", owner: "Sales / Leader", actions: ["Nghiên cứu khách: FB, Zalo, profile — nghề nghiệp, gia đình, taste", "Chuẩn bị 3–5 case study DQH match taste khách", "In brochure + bảng giá phân khúc", "Xác nhận thời gian, địa điểm trước 1 ngày"] },
      { phase: "Tại cuộc gặp (60–90 phút)", owner: "Sales + Designer Lead", actions: ["10p: Phá băng, hiểu khách (gia đình, lối sống, sở thích)", "20p: Khách trình bày nhu cầu, mặt bằng, mong muốn", "20p: DQH trình bày triết lý, case study tương đồng", "20p: Thảo luận sơ bộ budget, timeline, scope", "10p: Chốt next step, lịch khảo sát"] },
      { phase: "Sau cuộc gặp (trong 24h)", owner: "Sales", actions: ["Gửi follow-up qua Zalo cảm ơn", "Gửi proposal sơ bộ nếu đủ thông tin", "Tạo client folder trên Drive, log vào CRM", "Báo cáo Leader: khả năng chốt, hướng tiếp cận"] },
    ],
    checklist: ["Brochure & bảng giá phân khúc đã in", "3–5 case study chuẩn bị (in hoặc iPad)", "Sample vật liệu signature (gỗ, đá, vải) mang theo", "Intake questionnaire sẵn sàng"],
  },
  "design-process": {
    title: "Quy trình thiết kế", number: "3.2",
    lead: "Mỗi giai đoạn có deliverable cụ thể — không bỏ qua bước nào.",
    steps: [
      { phase: "Concept (5–7 ngày)", owner: "Lead Designer", actions: ["Mood board + concept statement", "Phương án bố cục 2D (2–3 option)", "Material direction sơ bộ", "Trình khách duyệt concept"] },
      { phase: "3D Visualization (7–10 ngày)", owner: "Designer + Diễn họa", actions: ["Phát triển 3D theo concept đã duyệt", "Render 3–5 góc chính mỗi không gian", "Material schedule sơ bộ", "Trình khách duyệt 3D"] },
      { phase: "Technical Drawing (10–14 ngày)", owner: "Designer + Triển khai", actions: ["Mặt bằng bố trí, mặt bằng cao độ", "Mặt đứng từng mặt tường", "Chi tiết tủ kệ, đồ rời", "Bảng vật liệu hoàn thiện", "Phối hợp cơ điện"] },
      { phase: "Bàn giao thi công", owner: "Triển khai + Leader", actions: ["Full set bản vẽ in & file", "Material schedule final", "Họp brief đội thi công", "Setup kênh báo cáo (Zalo + App QLDA)"] },
    ],
    checklist: ["Mỗi giai đoạn có biên bản xác nhận của khách", "Không bắt đầu giai đoạn sau khi chưa duyệt giai đoạn trước", "Mọi thay đổi sau khi duyệt = change order"],
  },
  "handover": {
    title: "Bàn giao TK → Triển khai → Thi công", number: "3.3",
    lead: "Điểm dễ rớt thông tin nhất. Quy trình chặt = ít rework.",
    steps: [
      { phase: "TK → Triển khai", owner: "Designer → Drafter", actions: ["Họp bàn giao 60p: walkthrough toàn bộ file", "Designer giải thích ý đồ, key details", "Drafter list điểm chưa rõ, deadline phản hồi 2 ngày", "Designer ký xác nhận handover sheet"] },
      { phase: "Triển khai → Thi công", owner: "Drafter + Leader → Site team", actions: ["Họp brief 90p: walkthrough full set", "Material schedule + nhà cung cấp", "Timeline thi công chi tiết", "Kênh báo cáo: Zalo group + App QLDA", "Designer/Drafter cam kết on-call"] },
    ],
  },
  "file-naming": {
    title: "Lưu file & Naming Convention", number: "3.4",
    lead: "Một file sai tên = 30 phút tìm kiếm của cả team.",
    steps: [
      { phase: "Format tên file", owner: "Toàn team", actions: ["Format: [DỰ_ÁN]_[HẠNG_MỤC]_[VERSION]_[NGÀY]_[INITIALS]", "VD: VEROSA_F11_MB-T1_V03_20260518_QH.dwg", "Hạng mục: MB (mặt bằng), MD (mặt đứng), CT (chi tiết), 3D, REND", "Version: V01, V02... mỗi lần khách duyệt +1"] },
      { phase: "Quy tắc bất di bất dịch", owner: "Toàn team", actions: ["Không dùng tiếng Việt có dấu trong tên file", "Không khoảng trắng — dùng dấu _ hoặc -", "Không 'FINAL', 'FINAL_FINAL' — dùng V03_APPROVED", "File khách duyệt: thêm hậu tố _APPROVED"] },
    ],
  },
  "library": {
    title: "Thư viện vật liệu & Block", number: "3.5",
    lead: "Thư viện chung tiết kiệm thời gian + đảm bảo nhất quán.",
    steps: [
      { phase: "CAD Block Library", owner: "Lead + Drafter", actions: ["Đồ nội thất chuẩn theo kích thước công thái học", "Layer theo chuẩn DQH", "Lưu tại Drive/DQH_LIBRARY/CAD_BLOCKS/"] },
      { phase: "3D Model Library", owner: "Lead + Diễn họa", actions: ["Model FF&E phân loại theo style", "Lưu tại Drive/DQH_LIBRARY/3D_MODELS/"] },
      { phase: "Material Sample (vật lý)", owner: "Office Manager", actions: ["Tủ mẫu tại văn phòng, code trùng với file", "Update khi có vật liệu mới"] },
    ],
  },
  "storage": {
    title: "Lưu trữ dự án", number: "3.6",
    lead: "Một cấu trúc folder duy nhất cho mọi dự án — không sáng tạo riêng.",
    tree: `📁 [PROJECT_NAME]/
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
└── 📁 07_ARCHIVE`,
  },
  "standards": {
    title: "Tiêu chuẩn đầu ra theo phân khúc", number: "3.7",
    lead: "Khách trả ngân sách khác nhau — kỳ vọng đầu ra cũng phải khác.",
    tiers: [
      { name: "Tier 1 — Standard (8–10tr/m²)", color: "#6B7280", deliverables: ["Concept 1 phương án", "3D 3–5 góc chính/không gian", "Bản vẽ kỹ thuật cơ bản", "Material schedule chuẩn"] },
      { name: "Tier 2 — Premium (12–15tr/m²)", color: "#7C3AED", deliverables: ["Concept 2 phương án", "3D 5–8 góc + animation key spaces", "Bản vẽ kỹ thuật chi tiết", "Material sample physical trình khách", "Coordination MEP đầy đủ"] },
      { name: "Tier 3 — Luxury (18tr+/m²)", color: "#D97706", deliverables: ["Concept 3 phương án + mood board cinematic", "3D toàn bộ + walkthrough video", "Bản vẽ kỹ thuật cấp thi công cao cấp", "Sample box vật liệu giao tận nơi", "Coordination MEP + AV + smart home", "Site visit hàng tuần với Lead Designer"] },
    ],
  },
  "change-order": {
    title: "Xử lý phát sinh & Thay đổi", number: "3.8",
    lead: "Không có thay đổi miễn phí. Mọi thay đổi đều có giấy tờ — dù 0đ.",
    steps: [
      { phase: "Khi khách yêu cầu thay đổi", owner: "Sales / PM", actions: ["Tiếp nhận qua văn bản (Zalo, email — KHÔNG miệng)", "Đánh giá impact: chi phí, thời gian, kỹ thuật", "Lập Change Order Sheet trong 24–48h", "Khách ký xác nhận TRƯỚC khi thực hiện"] },
      { phase: "Change Order Sheet gồm", owner: "—", actions: ["Mô tả thay đổi (trước & sau)", "Chi phí phát sinh (+/– VND)", "Thay đổi timeline (+/– ngày)", "Tác động đến hạng mục khác", "Chữ ký khách + DQH"] },
    ],
  },
  "handover-client": {
    title: "Nghiệm thu & Hậu mãi", number: "3.9",
    lead: "Bàn giao tốt = giới thiệu khách mới. Hậu mãi tốt = thương hiệu bền.",
    steps: [
      { phase: "Nghiệm thu", owner: "PM + Leader", actions: ["Punch list trước nghiệm thu chính thức", "Vệ sinh tổng thể, styling đồ trang trí", "Bàn giao key + tài liệu (bảo hành, hướng dẫn)", "Biên bản nghiệm thu ký xác nhận"] },
      { phase: "Hậu mãi", owner: "PM", actions: ["Tuần 1: gọi check feedback ban đầu", "Tháng 1: visit check chất lượng", "Tháng 6: visit + maintenance miễn phí", "Năm 1: thư cảm ơn + lời mời giới thiệu"] },
    ],
  },
};

const BASE_RATES = {
  "Phòng khách": 4500000,
  "Phòng ngủ": 4000000,
  "Phòng bếp": 6500000,
  "Phòng tắm": 5500000,
  "Phòng làm việc": 3800000,
  "Hành lang / Khác": 3200000,
  "Tủ kệ": 4200000,
  "Đồ rời": 5000000,
};

const TIER_MULTIPLIER = {
  standard: { label: "Standard (8–10tr/m²)", x: 1.0 },
  premium:  { label: "Premium (12–15tr/m²)", x: 1.4 },
  luxury:   { label: "Luxury (18tr+/m²)",    x: 1.9 },
};

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

// ─── SHARED COMPONENTS ───────────────────────────────────────

const SectionBadge = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
    {label}
  </span>
);

const BackBtn = ({ onClick, label = "Quay lại" }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium mb-6"
  >
    <ArrowLeft size={16} /> {label}
  </button>
);

const Checklist = ({ items }) => (
  <div className="mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4">
    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">
      <Lightbulb size={14} /> Checklist
    </div>
    <ul className="space-y-2">
      {items.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <CheckCircle2 size={15} className="text-purple-500 flex-shrink-0 mt-0.5" />
          {c}
        </li>
      ))}
    </ul>
  </div>
);

// ─── MODULE 02 ───────────────────────────────────────────────

const DesignModule = () => {
  const [active, setActive] = useState(null);
  if (active) return <DesignDetail id={active} onBack={() => setActive(null)} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Design Knowledge</h2>
        <p className="text-sm text-gray-500 mt-1">Bộ kiến thức chuyên môn cốt lõi của DQH — triết lý, kích thước chuẩn, phong cách, case study, lỗi sai.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGN_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Icon size={18} className="text-purple-600" />
                </div>
                <span className="text-xs text-gray-400 font-mono">{s.number}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Xem chi tiết <ChevronRight size={13} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DesignDetail = ({ id, onBack }) => {
  const data = DESIGN_CONTENT[id];
  if (!data) return null;

  return (
    <div>
      <BackBtn onClick={onBack} label="Design Knowledge" />
      <div className="mb-6 flex items-center gap-3">
        <SectionBadge label={data.number} />
        <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
      </div>
      <p className="text-base text-gray-600 italic mb-8 border-l-4 border-purple-300 pl-4">{data.lead}</p>

      <div className="space-y-10">
        {data.blocks.map((block, i) => (
          <div key={i}>
            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">{block.heading}</h3>

            {block.items && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.items.map((item, j) => (
                  <div key={j} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-purple-500">0{j + 1}</span>
                      <span className="font-semibold text-sm text-gray-900">{item.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            )}

            {block.table && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {block.table[0].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {block.table.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-gray-900" : "font-mono text-gray-600"}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {block.mistakes && (
              <div className="space-y-3">
                {block.mistakes.map((m, j) => (
                  <div key={j} className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">
                        <AlertTriangle size={13} /> Lỗi sai
                      </div>
                      <p className="text-sm text-gray-700">{m.wrong}</p>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">
                        <CheckCircle2 size={13} /> Chuẩn DQH
                      </div>
                      <p className="text-sm text-gray-700">{m.right}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MODULE 03 ───────────────────────────────────────────────

const WorkflowModule = () => {
  const [active, setActive] = useState(null);
  if (active) return <WorkflowDetail id={active} onBack={() => setActive(null)} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Workflow</h2>
        <p className="text-sm text-gray-500 mt-1">9 quy trình vận hành cốt lõi — mỗi bước rõ owner, deliverable, và checkpoint chất lượng.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {WORKFLOWS.map((w) => {
          const Icon = w.icon;
          return (
            <button
              key={w.id}
              onClick={() => setActive(w.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-purple-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm group-hover:text-purple-700">{w.title}</span>
                  <span className="text-[10px] font-mono text-gray-400">{w.number}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{w.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const WorkflowDetail = ({ id, onBack }) => {
  const data = WORKFLOW_CONTENT[id];
  if (!data) return null;

  return (
    <div>
      <BackBtn onClick={onBack} label="Workflow" />
      <div className="mb-6 flex items-center gap-3">
        <SectionBadge label={data.number} />
        <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
      </div>
      {data.lead && (
        <p className="text-base text-gray-600 italic mb-8 border-l-4 border-purple-300 pl-4">{data.lead}</p>
      )}

      {data.steps && (
        <div className="space-y-6 mb-6">
          {data.steps.map((step, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="font-semibold text-sm text-gray-900">{step.phase}</span>
                </div>
                <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-0.5">{step.owner}</span>
              </div>
              <ul className="px-5 py-4 space-y-2">
                {step.actions.map((a, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.tiers && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.tiers.map((tier, i) => (
            <div key={i} className="bg-white border-2 rounded-xl overflow-hidden" style={{ borderColor: tier.color }}>
              <div className="px-4 py-3" style={{ backgroundColor: tier.color }}>
                <h3 className="font-semibold text-sm text-white">{tier.name}</h3>
              </div>
              <ul className="p-4 space-y-2">
                {tier.deliverables.map((d, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.tree && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-gray-800 mb-3">Cấu trúc folder chuẩn</h3>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-5 text-xs leading-relaxed overflow-x-auto font-mono whitespace-pre">
            {data.tree}
          </pre>
        </div>
      )}

      {data.checklist && <Checklist items={data.checklist} />}
    </div>
  );
};

// ─── MODULE 04 ───────────────────────────────────────────────

const defaultItem = (id) => ({
  id, category: "Phòng khách", name: "", length: 0, width: 0, height: 0,
  unit: "m²", material: "", notes: "",
});

const EstimationModule = () => {
  const [info, setInfo] = useState({ name: "", client: "", tier: "premium", style: "quiet-luxury" });
  const [items, setItems] = useState([{ ...defaultItem(1), name: "Tủ TV âm tường", length: 3500, width: 600, height: 2400, material: "Veneer sồi trắng + sơn PU" }]);
  const fileRef = useRef();

  const calcItem = (item) => {
    const rate = BASE_RATES[item.category] ?? 4000000;
    const mx = TIER_MULTIPLIER[info.tier].x;
    const area = item.unit === "m²" ? (item.length / 1000) * (item.width / 1000)
               : item.unit === "md" ? item.length / 1000 : 1;
    return { area, cost: area * rate * mx };
  };

  const totals = useMemo(() => items.reduce((acc, it) => {
    const { area, cost } = calcItem(it);
    return { area: acc.area + area, cost: acc.cost + cost };
  }, { area: 0, cost: 0 }), [items, info.tier]);

  const addItem = () => setItems(prev => [...prev, defaultItem(Date.now())]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const update = (id, field, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  // Export Excel
  const exportExcel = () => {
    const rows = items.map(it => {
      const { area, cost } = calcItem(it);
      return { "Khu vực": it.category, "Hạng mục": it.name, "Dài (mm)": it.length, "Rộng (mm)": it.width, "Cao (mm)": it.height, "Đơn vị": it.unit, "Vật liệu": it.material, "KL": +area.toFixed(2), "Thành tiền (VND)": Math.round(cost) };
    });
    rows.push({ "Khu vực": "", "Hạng mục": "TỔNG CỘNG", "Dài (mm)": "", "Rộng (mm)": "", "Cao (mm)": "", "Đơn vị": "", "Vật liệu": "", "KL": +totals.area.toFixed(2), "Thành tiền (VND)": Math.round(totals.cost) });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dự toán");
    XLSX.writeFile(wb, `DuToan_${info.name || "DQH"}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`);
  };

  // Import Excel
  const importExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.filter(r => r["Hạng mục"] && r["Hạng mục"] !== "TỔNG CỘNG").map((r, i) => ({
        id: Date.now() + i,
        category: r["Khu vực"] || "Phòng khách",
        name: r["Hạng mục"] || "",
        length: +r["Dài (mm)"] || 0,
        width: +r["Rộng (mm)"] || 0,
        height: +r["Cao (mm)"] || 0,
        unit: r["Đơn vị"] || "m²",
        material: r["Vật liệu"] || "",
        notes: "",
      }));
      if (mapped.length) setItems(mapped);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const inputCls = "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Estimation Tool</h2>
        <p className="text-sm text-gray-500 mt-1">Dự toán sơ bộ chi phí nội thất theo phân khúc & phong cách. Nhập tay hoặc import Excel.</p>
      </div>

      {/* Project info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Thông tin dự án</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tên dự án", field: "name", placeholder: "VD: Verosa F11 Townhouse" },
            { label: "Khách hàng", field: "client", placeholder: "VD: Anh Nguyễn" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input value={info[field]} onChange={e => setInfo({ ...info, [field]: e.target.value })} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phân khúc</label>
            <select value={info.tier} onChange={e => setInfo({ ...info, tier: e.target.value })} className={inputCls}>
              {Object.entries(TIER_MULTIPLIER).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phong cách</label>
            <select value={info.style} onChange={e => setInfo({ ...info, style: e.target.value })} className={inputCls}>
              <option value="quiet-luxury">Quiet Luxury / Japandi</option>
              <option value="modern-luxury">Modern Luxury</option>
              <option value="indochine">Indochine đương đại</option>
              <option value="neoclassic">Neo-classic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={addItem} className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
          <Plus size={15} /> Thêm hạng mục
        </button>
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <Upload size={15} /> Import Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
        <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Khu vực", "Hạng mục", "Dài (mm)", "Rộng (mm)", "Cao (mm)", "Đv", "Vật liệu", "KL", "Thành tiền", ""].map((h, i) => (
                  <th key={i} className={`px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${i >= 7 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const { area, cost } = calcItem(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <select value={item.category} onChange={e => update(item.id, "category", e.target.value)} className="w-36 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white">
                        {Object.keys(BASE_RATES).map(k => <option key={k}>{k}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.name} onChange={e => update(item.id, "name", e.target.value)} placeholder="Tên hạng mục" className="w-40 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400" />
                    </td>
                    {["length", "width", "height"].map(f => (
                      <td key={f} className="px-2 py-2">
                        <input type="number" value={item[f] || ""} onChange={e => update(item.id, f, parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 font-mono" />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <select value={item.unit} onChange={e => update(item.id, "unit", e.target.value)} className="w-16 px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400">
                        <option>m²</option><option>md</option><option>cái</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.material} onChange={e => update(item.id, "material", e.target.value)} placeholder="Vật liệu" className="w-40 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400" />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-gray-500">{area.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900 whitespace-nowrap">{fmt(cost)} ₫</td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="bg-purple-600 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-200 uppercase tracking-wide mb-1">
            Dự toán tổng — {TIER_MULTIPLIER[info.tier].label}
          </div>
          <div className="text-sm text-purple-200">
            {items.length} hạng mục · {totals.area.toFixed(2)} m²
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{fmt(totals.cost)} <span className="text-xl text-purple-300">₫</span></div>
          <div className="text-xs text-purple-300 mt-1">
            Đơn giá TB: {totals.area > 0 ? fmt(totals.cost / totals.area) : 0} ₫/m²
          </div>
        </div>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Dự toán sơ bộ</strong> — dựa trên đơn giá tham chiếu nội bộ DQH × hệ số phân khúc.
          Báo giá chính thức cần BOQ chi tiết theo vật liệu thực tế, biện pháp thi công, và điều kiện hiện trường.
        </p>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────

const TABS = [
  { id: "design",     label: "Design Knowledge", icon: BookOpen },
  { id: "workflow",   label: "Workflow",          icon: GitBranch },
  { id: "estimation", label: "Estimation Tool",   icon: Calculator },
];

export default function TrainingHub() {
  const [tab, setTab] = useState("design");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Training Hub</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kiến thức nội bộ · Quy trình · Công cụ</p>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === "design"     && <DesignModule />}
        {tab === "workflow"   && <WorkflowModule />}
        {tab === "estimation" && <EstimationModule />}
      </div>
    </div>
  );
}
