import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen, GitBranch, Calculator, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, Upload,
  Lightbulb, ArrowLeft, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package,
  RefreshCw, TriangleAlert, Zap, Settings, Megaphone,
  Search, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchModules,
  fetchSectionsForModule,
  fetchWorkflows,
  fetchWorkflowWithSteps,
  searchTrainingContent,
  type TrainingModule,
  type Section,
  type Subsection,
  type Workflow,
  type WorkflowStep,
} from "../../services/trainingService";

// ─── ICON REGISTRY (map DB icon names to Lucide components) ──
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BookOpen, GitBranch, Calculator, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package, RefreshCw,
  CheckCircle2, Zap, Settings, Megaphone, TriangleAlert,
};

const getIcon = (name: string | null) => ICON_MAP[name || ""] || BookOpen;

// ─── DESIGN TOKENS (match DQH app) ──────────────────────────
// Primary: #7C3AED (purple-600)
// Active bg: #7C3AED / text white
// Content bg: #F9FAFB
// Card: white, border #E5E7EB

// ─── HARDCODED FALLBACK DATA ─────────────────────────────────
// These are used when Supabase tables don't exist yet

const FALLBACK_MODULES: TrainingModule[] = [
  { id: "m1", module_number: 1, title: "Foundation", description: "Nền tảng DQH — Vision, Mission, Values, Brand DNA", icon: "BookOpen", color: "#7C3AED", order_index: 1, created_at: "", updated_at: "" },
  { id: "m2", module_number: 2, title: "Design Knowledge", description: "Kiến thức thiết kế — Quiet Luxury, Materials, Styles", icon: "Layers", color: "#059669", order_index: 2, created_at: "", updated_at: "" },
  { id: "m3", module_number: 3, title: "Workflow Execution", description: "Quy trình thực chiến — 9 workflows chi tiết", icon: "Zap", color: "#D97706", order_index: 3, created_at: "", updated_at: "" },
  { id: "m4", module_number: 4, title: "Technical Infrastructure", description: "Kỹ thuật hạ tầng — MEP, Construction, As-Built", icon: "Settings", color: "#6B7280", order_index: 4, created_at: "", updated_at: "" },
  { id: "m5", module_number: 5, title: "Estimation Tool", description: "Công cụ dự toán — Rates, Calculations", icon: "Calculator", color: "#0891B2", order_index: 5, created_at: "", updated_at: "" },
  { id: "m6", module_number: 6, title: "Sales & Marketing", description: "Bộ chuẩn marketing — Scripts, Messaging", icon: "Megaphone", color: "#DC2626", order_index: 6, created_at: "", updated_at: "" },
];

const FALLBACK_DESIGN_SECTIONS: Section[] = [
  { id: "fs1", module_id: "m2", section_number: "2.1", title: "Triết lý thiết kế DQH", content: "Quiet Luxury không phải là sự thiếu vắng — đó là sự hiện diện được kiểm soát.", order_index: 1, created_at: "", updated_at: "", subsections: [] },
  { id: "fs2", module_id: "m2", section_number: "2.2", title: "Kiến thức nền", content: "Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định.", order_index: 2, created_at: "", updated_at: "", subsections: [] },
  { id: "fs3", module_id: "m2", section_number: "2.3", title: "Style Library", content: "Mỗi style có DNA riêng. Hiểu sâu một style trước khi pha trộn.", order_index: 3, created_at: "", updated_at: "", subsections: [] },
  { id: "fs4", module_id: "m2", section_number: "2.4", title: "Case Study nội bộ", content: "Mỗi dự án là một bài học. Đây là thư viện DQH dùng để dạy lẫn nhau.", order_index: 4, created_at: "", updated_at: "", subsections: [] },
  { id: "fs5", module_id: "m2", section_number: "2.5", title: "Common Mistakes", content: "Lỗi sai không phải để xấu hổ — để cả team không lặp lại.", order_index: 5, created_at: "", updated_at: "", subsections: [] },
];

const FALLBACK_DESIGN_ICONS: Record<string, string> = {
  "2.1": "Sparkles", "2.2": "Ruler", "2.3": "Palette", "2.4": "Layers", "2.5": "TriangleAlert",
};

const FALLBACK_DESIGN_DESCS: Record<string, string> = {
  "2.1": "5 nguyên tắc Quiet Luxury — tỷ lệ, ánh sáng, vật liệu",
  "2.2": "Công thái học, kích thước chuẩn (mm), chiều cao trần",
  "2.3": "Quiet Luxury, Modern Luxury, Indochine — DNA từng style",
  "2.4": "Dự án đã làm — phân tích hay/dở, bài học",
  "2.5": "Lỗi sai thường gặp trong TK, Triển khai, Khách hàng",
};

// ─── HARDCODED DESIGN CONTENT (full, for fallback) ───────────

const FALLBACK_DESIGN_CONTENT: Record<string, { title: string; number: string; lead: string; blocks: any[] }> = {
  "2.1": {
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
  "2.2": {
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
  "2.3": {
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
  "2.4": {
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
  "2.5": {
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

// ─── HARDCODED WORKFLOW FALLBACK DATA ────────────────────────

const FALLBACK_WORKFLOWS: Workflow[] = [
  { id: "w1", module_id: "m3", workflow_number: 1, title: "Gặp khách & Tư vấn", description: "Tiếp khách lần đầu đến ký hợp đồng", icon: "Users", owner: null, duration: null, lead_quote: "Lần gặp đầu tiên quyết định 70% khả năng ký HĐ.", checklist: ["Brochure & bảng giá phân khúc đã in", "3–5 case study chuẩn bị (in hoặc iPad)", "Sample vật liệu signature (gỗ, đá, vải) mang theo", "Intake questionnaire sẵn sàng"], order_index: 1, created_at: "", updated_at: "" },
  { id: "w2", module_id: "m3", workflow_number: 2, title: "Quy trình thiết kế", description: "Concept → 3D → Bản vẽ kỹ thuật", icon: "Sparkles", owner: null, duration: null, lead_quote: "Mỗi giai đoạn có deliverable cụ thể — không bỏ qua bước nào.", checklist: ["Mỗi giai đoạn có biên bản xác nhận của khách", "Không bắt đầu giai đoạn sau khi chưa duyệt giai đoạn trước", "Mọi thay đổi sau khi duyệt = change order"], order_index: 2, created_at: "", updated_at: "" },
  { id: "w3", module_id: "m3", workflow_number: 3, title: "Bàn giao TK → TC", description: "Chuyển giao giữa các bộ phận", icon: "RefreshCw", owner: null, duration: null, lead_quote: "Điểm dễ rớt thông tin nhất. Quy trình chặt = ít rework.", checklist: null, order_index: 3, created_at: "", updated_at: "" },
  { id: "w4", module_id: "m3", workflow_number: 4, title: "Lưu file & Naming", description: "Quy chuẩn đặt tên, version control", icon: "FileText", owner: null, duration: null, lead_quote: "Một file sai tên = 30 phút tìm kiếm của cả team.", checklist: null, order_index: 4, created_at: "", updated_at: "" },
  { id: "w5", module_id: "m3", workflow_number: 5, title: "Thư viện & Block", description: "CAD blocks, 3D models, material", icon: "Package", owner: null, duration: null, lead_quote: "Thư viện chung tiết kiệm thời gian + đảm bảo nhất quán.", checklist: null, order_index: 5, created_at: "", updated_at: "" },
  { id: "w6", module_id: "m3", workflow_number: 6, title: "Lưu trữ dự án", description: "Cấu trúc folder chuẩn DQH", icon: "FolderOpen", owner: null, duration: null, lead_quote: "Một cấu trúc folder duy nhất cho mọi dự án — không sáng tạo riêng.", checklist: null, order_index: 6, created_at: "", updated_at: "" },
  { id: "w7", module_id: "m3", workflow_number: 7, title: "Tiêu chuẩn đầu ra", description: "Deliverable theo từng tier", icon: "ClipboardList", owner: null, duration: null, lead_quote: "Khách trả ngân sách khác nhau — kỳ vọng đầu ra cũng phải khác.", checklist: null, order_index: 7, created_at: "", updated_at: "" },
  { id: "w8", module_id: "m3", workflow_number: 8, title: "Phát sinh & Thay đổi", description: "Change request, change order", icon: "GitBranch", owner: null, duration: null, lead_quote: "Không có thay đổi miễn phí. Mọi thay đổi đều có giấy tờ — dù 0đ.", checklist: null, order_index: 8, created_at: "", updated_at: "" },
  { id: "w9", module_id: "m3", workflow_number: 9, title: "Nghiệm thu & Hậu mãi", description: "Bàn giao khách, bảo hành", icon: "CheckCircle2", owner: null, duration: null, lead_quote: "Bàn giao tốt = giới thiệu khách mới. Hậu mãi tốt = thương hiệu bền.", checklist: null, order_index: 9, created_at: "", updated_at: "" },
];

const FALLBACK_WORKFLOW_STEPS: Record<string, WorkflowStep[]> = {
  w1: [
    { id: "ws1", workflow_id: "w1", step_number: 1, phase: "Trước cuộc gặp", owner: "Sales / Leader", actions: ["Nghiên cứu khách: FB, Zalo, profile — nghề nghiệp, gia đình, taste", "Chuẩn bị 3–5 case study DQH match taste khách", "In brochure + bảng giá phân khúc", "Xác nhận thời gian, địa điểm trước 1 ngày"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws2", workflow_id: "w1", step_number: 2, phase: "Tại cuộc gặp (60–90 phút)", owner: "Sales + Designer Lead", actions: ["10p: Phá băng, hiểu khách (gia đình, lối sống, sở thích)", "20p: Khách trình bày nhu cầu, mặt bằng, mong muốn", "20p: DQH trình bày triết lý, case study tương đồng", "20p: Thảo luận sơ bộ budget, timeline, scope", "10p: Chốt next step, lịch khảo sát"], order_index: 2, created_at: "", updated_at: "" },
    { id: "ws3", workflow_id: "w1", step_number: 3, phase: "Sau cuộc gặp (trong 24h)", owner: "Sales", actions: ["Gửi follow-up qua Zalo cảm ơn", "Gửi proposal sơ bộ nếu đủ thông tin", "Tạo client folder trên Drive, log vào CRM", "Báo cáo Leader: khả năng chốt, hướng tiếp cận"], order_index: 3, created_at: "", updated_at: "" },
  ],
  w2: [
    { id: "ws4", workflow_id: "w2", step_number: 1, phase: "Concept (5–7 ngày)", owner: "Lead Designer", actions: ["Mood board + concept statement", "Phương án bố cục 2D (2–3 option)", "Material direction sơ bộ", "Trình khách duyệt concept"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws5", workflow_id: "w2", step_number: 2, phase: "3D Visualization (7–10 ngày)", owner: "Designer + Diễn họa", actions: ["Phát triển 3D theo concept đã duyệt", "Render 3–5 góc chính mỗi không gian", "Material schedule sơ bộ", "Trình khách duyệt 3D"], order_index: 2, created_at: "", updated_at: "" },
    { id: "ws6", workflow_id: "w2", step_number: 3, phase: "Technical Drawing (10–14 ngày)", owner: "Designer + Triển khai", actions: ["Mặt bằng bố trí, mặt bằng cao độ", "Mặt đứng từng mặt tường", "Chi tiết tủ kệ, đồ rời", "Bảng vật liệu hoàn thiện", "Phối hợp cơ điện"], order_index: 3, created_at: "", updated_at: "" },
    { id: "ws7", workflow_id: "w2", step_number: 4, phase: "Bàn giao thi công", owner: "Triển khai + Leader", actions: ["Full set bản vẽ in & file", "Material schedule final", "Họp brief đội thi công", "Setup kênh báo cáo (Zalo + App QLDA)"], order_index: 4, created_at: "", updated_at: "" },
  ],
  w3: [
    { id: "ws8", workflow_id: "w3", step_number: 1, phase: "TK → Triển khai", owner: "Designer → Drafter", actions: ["Họp bàn giao 60p: walkthrough toàn bộ file", "Designer giải thích ý đồ, key details", "Drafter list điểm chưa rõ, deadline phản hồi 2 ngày", "Designer ký xác nhận handover sheet"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws9", workflow_id: "w3", step_number: 2, phase: "Triển khai → Thi công", owner: "Drafter + Leader → Site team", actions: ["Họp brief 90p: walkthrough full set", "Material schedule + nhà cung cấp", "Timeline thi công chi tiết", "Kênh báo cáo: Zalo group + App QLDA", "Designer/Drafter cam kết on-call"], order_index: 2, created_at: "", updated_at: "" },
  ],
  w4: [
    { id: "ws10", workflow_id: "w4", step_number: 1, phase: "Format tên file", owner: "Toàn team", actions: ["Format: [DỰ_ÁN]_[HẠNG_MỤC]_[VERSION]_[NGÀY]_[INITIALS]", "VD: VEROSA_F11_MB-T1_V03_20260518_QH.dwg", "Hạng mục: MB (mặt bằng), MD (mặt đứng), CT (chi tiết), 3D, REND", "Version: V01, V02... mỗi lần khách duyệt +1"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws11", workflow_id: "w4", step_number: 2, phase: "Quy tắc bất di bất dịch", owner: "Toàn team", actions: ["Không dùng tiếng Việt có dấu trong tên file", "Không khoảng trắng — dùng dấu _ hoặc -", "Không 'FINAL', 'FINAL_FINAL' — dùng V03_APPROVED", "File khách duyệt: thêm hậu tố _APPROVED"], order_index: 2, created_at: "", updated_at: "" },
  ],
  w5: [
    { id: "ws12", workflow_id: "w5", step_number: 1, phase: "CAD Block Library", owner: "Lead + Drafter", actions: ["Đồ nội thất chuẩn theo kích thước công thái học", "Layer theo chuẩn DQH", "Lưu tại Drive/DQH_LIBRARY/CAD_BLOCKS/"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws13", workflow_id: "w5", step_number: 2, phase: "3D Model Library", owner: "Lead + Diễn họa", actions: ["Model FF&E phân loại theo style", "Lưu tại Drive/DQH_LIBRARY/3D_MODELS/"], order_index: 2, created_at: "", updated_at: "" },
    { id: "ws14", workflow_id: "w5", step_number: 3, phase: "Material Sample (vật lý)", owner: "Office Manager", actions: ["Tủ mẫu tại văn phòng, code trùng với file", "Update khi có vật liệu mới"], order_index: 3, created_at: "", updated_at: "" },
  ],
  w6: [], // Special: tree view (handled separately)
  w7: [], // Special: tiers (handled separately)
  w8: [
    { id: "ws15", workflow_id: "w8", step_number: 1, phase: "Khi khách yêu cầu thay đổi", owner: "Sales / PM", actions: ["Tiếp nhận qua văn bản (Zalo, email — KHÔNG miệng)", "Đánh giá impact: chi phí, thời gian, kỹ thuật", "Lập Change Order Sheet trong 24–48h", "Khách ký xác nhận TRƯỚC khi thực hiện"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws16", workflow_id: "w8", step_number: 2, phase: "Change Order Sheet gồm", owner: "—", actions: ["Mô tả thay đổi (trước & sau)", "Chi phí phát sinh (+/– VND)", "Thay đổi timeline (+/– ngày)", "Tác động đến hạng mục khác", "Chữ ký khách + DQH"], order_index: 2, created_at: "", updated_at: "" },
  ],
  w9: [
    { id: "ws17", workflow_id: "w9", step_number: 1, phase: "Nghiệm thu", owner: "PM + Leader", actions: ["Punch list trước nghiệm thu chính thức", "Vệ sinh tổng thể, styling đồ trang trí", "Bàn giao key + tài liệu (bảo hành, hướng dẫn)", "Biên bản nghiệm thu ký xác nhận"], order_index: 1, created_at: "", updated_at: "" },
    { id: "ws18", workflow_id: "w9", step_number: 2, phase: "Hậu mãi", owner: "PM", actions: ["Tuần 1: gọi check feedback ban đầu", "Tháng 1: visit check chất lượng", "Tháng 6: visit + maintenance miễn phí", "Năm 1: thư cảm ơn + lời mời giới thiệu"], order_index: 2, created_at: "", updated_at: "" },
  ],
};

// Special workflow content (storage tree + standards tiers)
const FALLBACK_STORAGE_TREE = `📁 [PROJECT_NAME]/
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

const FALLBACK_STANDARDS_TIERS = [
  { name: "Tier 1 — Standard (8–10tr/m²)", color: "#6B7280", deliverables: ["Concept 1 phương án", "3D 3–5 góc chính/không gian", "Bản vẽ kỹ thuật cơ bản", "Material schedule chuẩn"] },
  { name: "Tier 2 — Premium (12–15tr/m²)", color: "#7C3AED", deliverables: ["Concept 2 phương án", "3D 5–8 góc + animation key spaces", "Bản vẽ kỹ thuật chi tiết", "Material sample physical trình khách", "Coordination MEP đầy đủ"] },
  { name: "Tier 3 — Luxury (18tr+/m²)", color: "#D97706", deliverables: ["Concept 3 phương án + mood board cinematic", "3D toàn bộ + walkthrough video", "Bản vẽ kỹ thuật cấp thi công cao cấp", "Sample box vật liệu giao tận nơi", "Coordination MEP + AV + smart home", "Site visit hàng tuần với Lead Designer"] },
];


// ─── ESTIMATION DATA (stays client-side, never in DB) ────────

const BASE_RATES: Record<string, number> = {
  "Phòng khách": 4500000,
  "Phòng ngủ": 4000000,
  "Phòng bếp": 6500000,
  "Phòng tắm": 5500000,
  "Phòng làm việc": 3800000,
  "Hành lang / Khác": 3200000,
  "Tủ kệ": 4200000,
  "Đồ rời": 5000000,
};

const TIER_MULTIPLIER: Record<string, { label: string; x: number }> = {
  standard: { label: "Standard (8–10tr/m²)", x: 1.0 },
  premium:  { label: "Premium (12–15tr/m²)", x: 1.4 },
  luxury:   { label: "Luxury (18tr+/m²)",    x: 1.9 },
};

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

// ─── SHARED UI COMPONENTS ────────────────────────────────────

const LoadingSpinner = ({ text = "Đang tải..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Loader2 size={28} className="text-purple-500 animate-spin" />
    <span className="text-sm text-gray-500">{text}</span>
  </div>
);

const EmptyState = ({ text = "Chưa có nội dung" }: { text?: string }) => (
  <div className="text-center py-16">
    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
);

const SectionBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
    {label}
  </span>
);

const BackBtn = ({ onClick, label = "Quay lại" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium mb-6"
  >
    <ArrowLeft size={16} /> {label}
  </button>
);

const Checklist = ({ items }: { items: string[] }) => (
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

// ─── SUBSECTION RENDERERS ────────────────────────────────────

/** Render a block of items (title + body pairs) from DB metadata or fallback */
const ItemsBlock = ({ items }: { items: { title: string; body: string }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {items.map((item, j) => (
      <div key={j} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-purple-500">0{j + 1}</span>
          <span className="font-semibold text-sm text-gray-900">{item.title}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
      </div>
    ))}
  </div>
);

/** Render a data table from DB metadata or fallback */
const TableBlock = ({ table }: { table: string[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {table[0].map((h, i) => (
            <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {table.slice(1).map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => (
              <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-gray-900" : "font-mono text-gray-600"}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Render mistakes (wrong/right pairs) from DB metadata or fallback */
const MistakesBlock = ({ mistakes }: { mistakes: { wrong: string; right: string }[] }) => (
  <div className="space-y-3">
    {mistakes.map((m, j) => (
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
);

/** Render a content block based on type (from DB subsection or fallback block) */
const ContentBlock = ({ block }: { block: any }) => {
  // DB subsection format: content_type + metadata
  if (block.content_type) {
    const meta = block.metadata || {};
    if (block.content_type === "list" && meta.items) return <ItemsBlock items={meta.items} />;
    if (block.content_type === "table" && meta.table) return <TableBlock table={meta.table} />;
    if (block.content_type === "mistakes" && meta.mistakes) return <MistakesBlock mistakes={meta.mistakes} />;
    if (block.content_type === "text" && block.content) return <p className="text-sm text-gray-600 leading-relaxed">{block.content}</p>;
    return null;
  }
  // Fallback format: items / table / mistakes arrays directly on block
  if (block.items) return <ItemsBlock items={block.items} />;
  if (block.table) return <TableBlock table={block.table} />;
  if (block.mistakes) return <MistakesBlock mistakes={block.mistakes} />;
  return null;
};

// ─── SECTION MODULE (for Modules 1, 2, 4, 6 — content-based) ─

const SectionModule = ({ moduleId, moduleColor, useDB }: { moduleId: string; moduleColor: string; useDB: boolean }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveSection(null);
    if (useDB) {
      fetchSectionsForModule(moduleId).then(data => {
        setSections(data);
        setLoading(false);
      });
    } else {
      // Fallback: only Module 2 has hardcoded sections
      setSections(FALLBACK_DESIGN_SECTIONS);
      setLoading(false);
    }
  }, [moduleId, useDB]);

  if (loading) return <LoadingSpinner />;
  if (sections.length === 0) return <EmptyState text="Module này chưa có nội dung. Vui lòng thêm dữ liệu vào Supabase." />;

  // Detail view
  if (activeSection) {
    const section = sections.find(s => s.id === activeSection);
    if (!section) return null;
    return <SectionDetail section={section} useDB={useDB} onBack={() => setActiveSection(null)} />;
  }

  // Section list
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((s) => {
        const iconName = useDB ? null : FALLBACK_DESIGN_ICONS[s.section_number];
        const Icon = iconName ? getIcon(iconName) : BookOpen;
        const desc = useDB ? (s.content?.substring(0, 80) || "") : (FALLBACK_DESIGN_DESCS[s.section_number] || "");
        return (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Icon size={18} className="text-purple-600" />
              </div>
              <span className="text-xs text-gray-400 font-mono">{s.section_number}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{s.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Xem chi tiết <ChevronRight size={13} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

const SectionDetail = ({ section, useDB, onBack }: { section: Section; useDB: boolean; onBack: () => void }) => {
  const [subsections, setSubsections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useDB && section.subsections && section.subsections.length > 0) {
      // Already loaded via fetchSectionsForModule
      setSubsections(section.subsections);
      setLoading(false);
    } else if (!useDB) {
      // Fallback: use hardcoded content
      const content = FALLBACK_DESIGN_CONTENT[section.section_number];
      if (content) {
        setSubsections(content.blocks);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [section, useDB]);

  const lead = useDB ? section.content : FALLBACK_DESIGN_CONTENT[section.section_number]?.lead;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <BackBtn onClick={onBack} />
      <div className="mb-6 flex items-center gap-3">
        <SectionBadge label={section.section_number} />
        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
      </div>
      {lead && (
        <p className="text-base text-gray-600 italic mb-8 border-l-4 border-purple-300 pl-4">{lead}</p>
      )}

      <div className="space-y-10">
        {subsections.map((block: any, i: number) => (
          <div key={i}>
            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              {block.title || block.heading}
            </h3>
            <ContentBlock block={block} />
          </div>
        ))}
      </div>

      {subsections.length === 0 && <EmptyState text="Chưa có nội dung chi tiết cho section này." />}
    </div>
  );
};

// ─── WORKFLOW MODULE (Module 3) ──────────────────────────────

const WorkflowModule = ({ moduleId, useDB }: { moduleId: string; useDB: boolean }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveWorkflow(null);
    if (useDB) {
      fetchWorkflows(moduleId).then(data => {
        setWorkflows(data);
        setLoading(false);
      });
    } else {
      setWorkflows(FALLBACK_WORKFLOWS);
      setLoading(false);
    }
  }, [moduleId, useDB]);

  if (loading) return <LoadingSpinner />;
  if (workflows.length === 0) return <EmptyState text="Chưa có workflow nào." />;

  if (activeWorkflow) {
    return <WorkflowDetail workflowId={activeWorkflow} useDB={useDB} onBack={() => setActiveWorkflow(null)} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Workflow</h2>
        <p className="text-sm text-gray-500 mt-1">9 quy trình vận hành cốt lõi — mỗi bước rõ owner, deliverable, và checkpoint chất lượng.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {workflows.map((w) => {
          const Icon = getIcon(w.icon);
          return (
            <button
              key={w.id}
              onClick={() => setActiveWorkflow(w.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-purple-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm group-hover:text-purple-700">{w.title}</span>
                  <span className="text-[10px] font-mono text-gray-400">3.{w.workflow_number}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{w.description}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const WorkflowDetail = ({ workflowId, useDB, onBack }: { workflowId: string; useDB: boolean; onBack: () => void }) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useDB) {
      fetchWorkflowWithSteps(workflowId).then(data => {
        if (data) {
          setWorkflow(data);
          setSteps(data.steps || []);
        }
        setLoading(false);
      });
    } else {
      const w = FALLBACK_WORKFLOWS.find(fw => fw.id === workflowId);
      if (w) {
        setWorkflow(w);
        setSteps(FALLBACK_WORKFLOW_STEPS[w.id] || []);
      }
      setLoading(false);
    }
  }, [workflowId, useDB]);

  if (loading) return <LoadingSpinner />;
  if (!workflow) return <EmptyState text="Không tìm thấy workflow." />;

  const isStorage = workflow.workflow_number === 6;
  const isStandards = workflow.workflow_number === 7;

  return (
    <div>
      <BackBtn onClick={onBack} label="Workflow" />
      <div className="mb-6 flex items-center gap-3">
        <SectionBadge label={`3.${workflow.workflow_number}`} />
        <h2 className="text-xl font-bold text-gray-900">{workflow.title}</h2>
      </div>
      {workflow.lead_quote && (
        <p className="text-base text-gray-600 italic mb-8 border-l-4 border-purple-300 pl-4">{workflow.lead_quote}</p>
      )}

      {/* Regular steps */}
      {steps.length > 0 && (
        <div className="space-y-6 mb-6">
          {steps.map((step, i) => (
            <div key={step.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="font-semibold text-sm text-gray-900">{step.phase}</span>
                </div>
                {step.owner && (
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-0.5">{step.owner}</span>
                )}
              </div>
              <ul className="px-5 py-4 space-y-2">
                {(step.actions || []).map((a: string, j: number) => (
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

      {/* Storage tree (workflow 6) */}
      {isStorage && !useDB && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-gray-800 mb-3">Cấu trúc folder chuẩn</h3>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-5 text-xs leading-relaxed overflow-x-auto font-mono whitespace-pre">
            {FALLBACK_STORAGE_TREE}
          </pre>
        </div>
      )}

      {/* Standards tiers (workflow 7) */}
      {isStandards && !useDB && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {FALLBACK_STANDARDS_TIERS.map((tier, i) => (
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

      {/* DB-sourced special content (tree / tiers stored in step metadata) */}
      {useDB && steps.length === 0 && (
        <EmptyState text="Chưa có bước nào cho workflow này." />
      )}

      {workflow.checklist && workflow.checklist.length > 0 && (
        <Checklist items={workflow.checklist} />
      )}
    </div>
  );
};

// ─── ESTIMATION MODULE (unchanged, client-side only) ─────────

const defaultItem = (id: number) => ({
  id, category: "Phòng khách", name: "", length: 0, width: 0, height: 0,
  unit: "m²", material: "", notes: "",
});

const EstimationModule = () => {
  const [info, setInfo] = useState({ name: "", client: "", tier: "premium", style: "quiet-luxury" });
  const [items, setItems] = useState([{ ...defaultItem(1), name: "Tủ TV âm tường", length: 3500, width: 600, height: 2400, material: "Veneer sồi trắng + sơn PU" }]);
  const fileRef = useRef<HTMLInputElement>(null);

  const calcItem = (item: any) => {
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
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const update = (id: number, field: string, val: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const exportExcel = () => {
    const rows: any[] = items.map(it => {
      const { area, cost } = calcItem(it);
      return { "Khu vực": it.category, "Hạng mục": it.name, "Dài (mm)": it.length, "Rộng (mm)": it.width, "Cao (mm)": it.height, "Đơn vị": it.unit, "Vật liệu": it.material, "KL": +area.toFixed(2), "Thành tiền (VND)": Math.round(cost) };
    });
    rows.push({ "Khu vực": "", "Hạng mục": "TỔNG CỘNG", "Dài (mm)": "", "Rộng (mm)": "", "Cao (mm)": "", "Đơn vị": "", "Vật liệu": "", "KL": +totals.area.toFixed(2), "Thành tiền (VND)": Math.round(totals.cost) });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dự toán");
    XLSX.writeFile(wb, `DuToan_${info.name || "DQH"}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`);
  };

  const importExcel = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.filter((r: any) => r["Hạng mục"] && r["Hạng mục"] !== "TỔNG CỘNG").map((r: any, i: number) => ({
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
              <input value={(info as any)[field]} onChange={e => setInfo({ ...info, [field]: e.target.value })} placeholder={placeholder} className={inputCls} />
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
                        <input type="number" value={(item as any)[f] || ""} onChange={e => update(item.id, f, parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 font-mono" />
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

export default function TrainingHub() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [activeModuleNum, setActiveModuleNum] = useState<number>(2); // Default to Design Knowledge
  const [useDB, setUseDB] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules().then(data => {
      if (data && data.length > 0) {
        setModules(data);
        setUseDB(true);
      } else {
        // Fallback to hardcoded modules
        setModules(FALLBACK_MODULES);
        setUseDB(false);
      }
      setLoading(false);
    }).catch(() => {
      setModules(FALLBACK_MODULES);
      setUseDB(false);
      setLoading(false);
    });
  }, []);

  const activeModule = modules.find(m => m.module_number === activeModuleNum);

  const renderModuleContent = () => {
    if (!activeModule) return <EmptyState />;

    // Module 5: Estimation Tool (always client-side)
    if (activeModule.module_number === 5) return <EstimationModule />;

    // Module 3: Workflow
    if (activeModule.module_number === 3) return <WorkflowModule moduleId={activeModule.id} useDB={useDB} />;

    // Modules 1, 2, 4, 6: Section-based content
    return <SectionModule moduleId={activeModule.id} moduleColor={activeModule.color || "#7C3AED"} useDB={useDB} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Đang tải Training Hub..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kiến thức nội bộ · Quy trình · Công cụ</p>
          </div>
          {useDB && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Supabase
            </span>
          )}
        </div>
      </div>

      {/* Tab nav — 6 modules */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {modules.map((m) => {
            const Icon = getIcon(m.icon);
            return (
              <button
                key={m.module_number}
                onClick={() => setActiveModuleNum(m.module_number)}
                className={`inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeModuleNum === m.module_number
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {m.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {renderModuleContent()}
      </div>
    </div>
  );
}
