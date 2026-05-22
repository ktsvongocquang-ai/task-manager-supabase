import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DQHFoundationPage from "../../components/DQHFoundationPage";
import MindsetTierBlock from "../../components/training/MindsetTierBlock";
import {
  BookOpen, GitBranch, Calculator, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, Upload,
  Lightbulb, ArrowLeft, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package,
  RefreshCw, TriangleAlert, Zap, Settings, Megaphone,
  Search, Loader2, Network, X
} from "lucide-react";
import * as XLSX from "xlsx";
import WorkflowProcessTable from "../../components/WorkflowProcessTable";
import CoordinationProcessTable from "../../components/CoordinationProcessTable";
import {
  fetchModules,
  fetchSectionsForModule,
  fetchWorkflows,
  fetchWorkflowWithSteps,
  searchTrainingContent,
  updateSubsectionMetadata,
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
  CheckCircle2, Zap, Settings, Megaphone, TriangleAlert, Network
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
  { id: "m1", slug: "foundation", title: "Nền tảng DQH", description: "Vision · Mission · Values · Brand DNA · Tư duy thiết kế", icon: "BookOpen", color: "#7C3AED", sort_order: 1, created_at: "", updated_at: "" },
  { id: "m2", slug: "design-knowledge", title: "Kiến thức Thiết kế", description: "Quiet Luxury · Vật liệu · Phong cách · Lỗi thường gặp", icon: "Layers", color: "#059669", sort_order: 2, created_at: "", updated_at: "" },
  { id: "m3", slug: "workflow", title: "Quy trình vận hành", description: "9 quy trình chuẩn — từ gặp khách đến nghiệm thu", icon: "Zap", color: "#D97706", sort_order: 3, created_at: "", updated_at: "" },
  { id: "m4", slug: "tools-templates", title: "Kỹ thuật & Kỹ năng mềm", description: "Hạ tầng kỹ thuật · Thi công · Giao tiếp · Thuyết trình", icon: "Settings", color: "#6B7280", sort_order: 4, created_at: "", updated_at: "" },
];

const FALLBACK_DESIGN_SECTIONS: Section[] = [
  { id: "fs1", module_id: "m2", slug: "philosophy", number: "2.1", title: "Triết lý thiết kế DQH", description: null, icon: "Sparkles", content: "Quiet Luxury không phải là sự thiếu vắng — đó là sự hiện diện được kiểm soát.", sort_order: 1, created_at: "", updated_at: "", subsections: [] },
  { id: "fs2", module_id: "m2", slug: "fundamentals", number: "2.2", title: "Kiến thức nền", description: null, icon: "Ruler", content: "Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định.", sort_order: 2, created_at: "", updated_at: "", subsections: [] },
  { id: "fs3", module_id: "m2", slug: "styles", number: "2.3", title: "Style Library", description: null, icon: "Palette", content: "Mỗi style có DNA riêng. Hiểu sâu một style trước khi pha trộn.", sort_order: 3, created_at: "", updated_at: "", subsections: [] },
  { id: "fs4", module_id: "m2", slug: "cases", number: "2.4", title: "Case Study nội bộ", description: null, icon: "Layers", content: "Mỗi dự án là một bài học. Đây là thư viện DQH dùng để dạy lẫn nhau.", sort_order: 4, created_at: "", updated_at: "", subsections: [] },
  { id: "fs5", module_id: "m2", slug: "mistakes", number: "2.5", title: "Common Mistakes", description: null, icon: "TriangleAlert", content: "Lỗi sai không phải để xấu hổ — để cả team không lặp lại.", sort_order: 5, created_at: "", updated_at: "", subsections: [] },
];

// Icons now come from section.icon field directly


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
  { id: "w1", module_id: "m3", slug: "client-meeting", number: "3.1", title: "Gặp khách & Tư vấn", description: "Tiếp khách lần đầu đến ký hợp đồng", icon: "Users", lead_quote: "Lần gặp đầu tiên quyết định 70% khả năng ký HĐ.", checklist: ["Brochure & bảng giá phân khúc đã in", "3–5 case study chuẩn bị (in hoặc iPad)", "Sample vật liệu signature (gỗ, đá, vải) mang theo", "Intake questionnaire sẵn sàng"], sort_order: 1, created_at: "", updated_at: "" },
  { id: "w2", module_id: "m3", slug: "design-process", number: "3.2", title: "Quy trình thiết kế", description: "Concept → 3D → Bản vẽ kỹ thuật", icon: "Sparkles", lead_quote: "Mỗi giai đoạn có deliverable cụ thể — không bỏ qua bước nào.", checklist: ["Mỗi giai đoạn có biên bản xác nhận của khách", "Không bắt đầu giai đoạn sau khi chưa duyệt giai đoạn trước", "Mọi thay đổi sau khi duyệt = change order"], sort_order: 2, created_at: "", updated_at: "" },
  { id: "w_coord", module_id: "m3", slug: "coordination-process", number: "3.3", title: "Phối hợp phòng ban", description: "Quy trình phối hợp Thiết kế, 2D, Thi công, Xưởng", icon: "Network", lead_quote: "Quy trình chặt chẽ giữa các phòng ban giúp giảm 80% rớt thông tin và làm lại.", checklist: null, sort_order: 3, created_at: "", updated_at: "" },
  { id: "w4", module_id: "m3", slug: "file-naming", number: "3.4", title: "Quy chuẩn đặt tên & Lưu trữ file", description: "Quy chuẩn đặt tên, version control", icon: "FileText", lead_quote: "Một file sai tên = 30 phút tìm kiếm của cả team.", checklist: null, sort_order: 4, created_at: "", updated_at: "" },
  { id: "w5", module_id: "m3", slug: "library", number: "3.5", title: "Quản lý thư viện", description: "CAD blocks, 3D models, material", icon: "Package", lead_quote: "Thư viện chung tiết kiệm thời gian + đảm bảo nhất quán.", checklist: null, sort_order: 5, created_at: "", updated_at: "" },
  { id: "w_present", module_id: "m3", slug: "presentation-skills", number: "3.6", title: "Kỹ năng giao tiếp & Thuyết trình", description: "Kỹ năng trình bày, giao tiếp KH", icon: "Megaphone", lead_quote: "Thiết kế giỏi mà trình bày kém = mất khách. Giao tiếp tốt = chốt deal nhanh.", checklist: null, sort_order: 6, created_at: "", updated_at: "" },
];

const FALLBACK_WORKFLOW_STEPS: Record<string, WorkflowStep[]> = {
  w1: [
    { id: "ws1", workflow_id: "w1", phase: "Trước cuộc gặp", owner: "Sales / Leader", actions: ["Nghiên cứu khách: FB, Zalo, profile — nghề nghiệp, gia đình, taste", "Chuẩn bị 3–5 case study DQH match taste khách", "In brochure + bảng giá phân khúc", "Xác nhận thời gian, địa điểm trước 1 ngày"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws2", workflow_id: "w1", phase: "Tại cuộc gặp (60–90 phút)", owner: "Sales + Designer Lead", actions: ["10p: Phá băng, hiểu khách (gia đình, lối sống, sở thích)", "20p: Khách trình bày nhu cầu, mặt bằng, mong muốn", "20p: DQH trình bày triết lý, case study tương đồng", "20p: Thảo luận sơ bộ budget, timeline, scope", "10p: Chốt next step, lịch khảo sát"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws3", workflow_id: "w1", phase: "Sau cuộc gặp (trong 24h)", owner: "Sales", actions: ["Gửi follow-up qua Zalo cảm ơn", "Gửi proposal sơ bộ nếu đủ thông tin", "Tạo client folder trên Drive, log vào CRM", "Báo cáo Leader: khả năng chốt, hướng tiếp cận"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w2: [
    { id: "ws4", workflow_id: "w2", phase: "Concept (5–7 ngày)", owner: "Lead Designer", actions: ["Mood board + concept statement", "Phương án bố cục 2D (2–3 option)", "Material direction sơ bộ", "Trình khách duyệt concept"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws5", workflow_id: "w2", phase: "3D Visualization (7–10 ngày)", owner: "Designer + Diễn họa", actions: ["Phát triển 3D theo concept đã duyệt", "Render 3–5 góc chính mỗi không gian", "Material schedule sơ bộ", "Trình khách duyệt 3D"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws6", workflow_id: "w2", phase: "Technical Drawing (10–14 ngày)", owner: "Designer + Triển khai", actions: ["Mặt bằng bố trí, mặt bằng cao độ", "Mặt đứng từng mặt tường", "Chi tiết tủ kệ, đồ rời", "Bảng vật liệu hoàn thiện", "Phối hợp cơ điện"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws7", workflow_id: "w2", phase: "Bàn giao thi công", owner: "Triển khai + Leader", actions: ["Full set bản vẽ in & file", "Material schedule final", "Họp brief đội thi công", "Setup kênh báo cáo (Zalo + App QLDA)"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w3: [
    { id: "ws8", workflow_id: "w3", phase: "TK → Triển khai", owner: "Designer → Drafter", actions: ["Họp bàn giao 60p: walkthrough toàn bộ file", "Designer giải thích ý đồ, key details", "Drafter list điểm chưa rõ, deadline phản hồi 2 ngày", "Designer ký xác nhận handover sheet"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws9", workflow_id: "w3", phase: "Triển khai → Thi công", owner: "Drafter + Leader → Site team", actions: ["Họp brief 90p: walkthrough full set", "Material schedule + nhà cung cấp", "Timeline thi công chi tiết", "Kênh báo cáo: Zalo group + App QLDA", "Designer/Drafter cam kết on-call"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w4: [
    { id: "ws10", workflow_id: "w4", phase: "Format tên file", owner: "Toàn team", actions: ["Format: [DỰ_ÁN]_[HẠNG_MỤC]_[VERSION]_[NGÀY]_[INITIALS]", "VD: VEROSA_F11_MB-T1_V03_20260518_QH.dwg", "Hạng mục: MB (mặt bằng), MD (mặt đứng), CT (chi tiết), 3D, REND", "Version: V01, V02... mỗi lần khách duyệt +1"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws11", workflow_id: "w4", phase: "Quy tắc bất di bất dịch", owner: "Toàn team", actions: ["Không dùng tiếng Việt có dấu trong tên file", "Không khoảng trắng — dùng dấu _ hoặc -", "Không 'FINAL', 'FINAL_FINAL' — dùng V03_APPROVED", "File khách duyệt: thêm hậu tố _APPROVED"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w5: [
    { id: "ws12", workflow_id: "w5", phase: "CAD Block Library", owner: "Lead + Drafter", actions: ["Đồ nội thất chuẩn theo kích thước công thái học", "Layer theo chuẩn DQH", "Lưu tại Drive/DQH_LIBRARY/CAD_BLOCKS/"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws13", workflow_id: "w5", phase: "3D Model Library", owner: "Lead + Diễn họa", actions: ["Model FF&E phân loại theo style", "Lưu tại Drive/DQH_LIBRARY/3D_MODELS/"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws14", workflow_id: "w5", phase: "Material Sample (vật lý)", owner: "Office Manager", actions: ["Tủ mẫu tại văn phòng, code trùng với file", "Update khi có vật liệu mới"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w_coord: [], // Special: handled separately
  w8: [
    { id: "ws15", workflow_id: "w8", phase: "Khi khách yêu cầu thay đổi", owner: "Sales / PM", actions: ["Tiếp nhận qua văn bản (Zalo, email — KHÔNG miệng)", "Đánh giá impact: chi phí, thời gian, kỹ thuật", "Lập Change Order Sheet trong 24–48h", "Khách ký xác nhận TRƯỚC khi thực hiện"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws16", workflow_id: "w8", phase: "Change Order Sheet gồm", owner: "—", actions: ["Mô tả thay đổi (trước & sau)", "Chi phí phát sinh (+/– VND)", "Thay đổi timeline (+/– ngày)", "Tác động đến hạng mục khác", "Chữ ký khách + DQH"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
  ],
  w9: [
    { id: "ws17", workflow_id: "w9", phase: "Nghiệm thu", owner: "PM + Leader", actions: ["Punch list trước nghiệm thu chính thức", "Vệ sinh tổng thể, styling đồ trang trí", "Bàn giao key + tài liệu (bảo hành, hướng dẫn)", "Biên bản nghiệm thu ký xác nhận"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
    { id: "ws18", workflow_id: "w9", phase: "Hậu mãi", owner: "PM", actions: ["Tuần 1: gọi check feedback ban đầu", "Tháng 1: visit check chất lượng", "Tháng 6: visit + maintenance miễn phí", "Năm 1: thư cảm ơn + lời mời giới thiệu"], metadata: null, sort_order: 1, created_at: "", updated_at: "" },
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
const ItemsBlock = ({ items, isEditing, onChange }: { items: { title: string; body: string }[], isEditing?: boolean, onChange?: (items: any[]) => void }) => {
  if (isEditing) {
    const handleTitleChange = (idx: number, val: string) => {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], title: val };
      onChange?.(newItems);
    };
    const handleBodyChange = (idx: number, val: string) => {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], body: val };
      onChange?.(newItems);
    };
    const addItem = () => {
      onChange?.([...items, { title: '', body: '' }]);
    };
    const removeItem = (idx: number) => {
      onChange?.(items.filter((_, i) => i !== idx));
    };

    return (
      <div className="overflow-x-auto rounded-lg border-2 border-purple-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold text-purple-700 uppercase tracking-wider w-1/3">Hạng mục (Title)</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Chi tiết (Body)</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {items.map((item, j) => (
              <tr key={j}>
                <td className="px-2 py-2 align-top">
                  <textarea value={item.title} onChange={e => handleTitleChange(j, e.target.value)} rows={2} className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-y" />
                </td>
                <td className="px-2 py-2 align-top">
                  <textarea value={item.body} onChange={e => handleBodyChange(j, e.target.value)} rows={3} className="w-full text-sm text-gray-700 border border-gray-200 rounded px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-y" />
                </td>
                <td className="px-2 py-2 text-center align-top">
                  <button onClick={() => removeItem(j)} className="text-red-500 hover:text-red-700 p-1 mt-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-gray-50 border-t border-purple-100">
          <button onClick={addItem} className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
            <Plus size={16} /> Thêm hạng mục
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-1/3">Hạng mục</th>
            <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item, j) => (
            <tr key={j} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-900 align-top">{item.title}</td>
              <td className="px-4 py-3 text-gray-600 align-top leading-relaxed whitespace-pre-wrap">{item.body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Render a data table from DB metadata or fallback */
const TableBlock = ({ table, isEditing, onChange }: { table: any, isEditing?: boolean, onChange?: (t: any) => void }) => {
  const isObject = !Array.isArray(table);
  const headers = isObject ? (table.headers || table.columns || []) : table[0];
  const rows = isObject ? (table.rows || []) : table.slice(1);

  if (isEditing) {
    const handleHeaderChange = (idx: number, val: string) => {
      const newH = [...headers]; newH[idx] = val;
      onChange?.(isObject ? { headers: newH, rows } : [newH, ...rows]);
    };
    const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
      const newR = [...rows];
      newR[rIdx] = [...newR[rIdx]];
      newR[rIdx][cIdx] = val;
      onChange?.(isObject ? { headers, rows: newR } : [headers, ...newR]);
    };
    const addRow = () => {
      const newRow = new Array(headers.length).fill('');
      onChange?.(isObject ? { headers, rows: [...rows, newRow] } : [headers, ...rows, newRow]);
    };
    const removeRow = (rIdx: number) => {
      const newR = rows.filter((_, i) => i !== rIdx);
      onChange?.(isObject ? { headers, rows: newR } : [headers, ...newR]);
    };

    return (
      <div className="overflow-x-auto rounded-lg border-2 border-purple-200">
        <table className="w-full text-sm">
          <thead className="bg-purple-50">
            <tr>
              {headers.map((h: string, i: number) => (
                <th key={i} className="px-2 py-2">
                  <input value={h} onChange={e => handleHeaderChange(i, e.target.value)} className="w-full text-xs font-semibold text-purple-900 bg-white border border-purple-200 rounded px-2 py-1" />
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 bg-white">
            {rows.map((row: string[], i: number) => (
              <tr key={i}>
                {row.map((cell: string, j: number) => (
                  <td key={j} className="px-2 py-2">
                    <textarea value={cell} onChange={e => handleCellChange(i, j, e.target.value)} rows={2} className="w-full text-sm text-gray-800 border border-gray-200 rounded px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-y" />
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-gray-50 border-t border-purple-100">
          <button onClick={addRow} className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
            <Plus size={16} /> Thêm dòng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h: string, i: number) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row: string[], i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell: string, j: number) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-gray-900" : "font-mono text-gray-600"} whitespace-pre-wrap`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Render mistakes (wrong/right pairs) from DB metadata or fallback */
const MistakesBlock = ({ mistakes, isEditing, onChange }: { mistakes: { wrong: string; right: string }[], isEditing?: boolean, onChange?: (m: any[]) => void }) => {
  if (isEditing) {
    const handleWrongChange = (idx: number, val: string) => {
      const newM = [...mistakes];
      newM[idx] = { ...newM[idx], wrong: val };
      onChange?.(newM);
    };
    const handleRightChange = (idx: number, val: string) => {
      const newM = [...mistakes];
      newM[idx] = { ...newM[idx], right: val };
      onChange?.(newM);
    };
    const addMistake = () => onChange?.([...mistakes, { wrong: '', right: '' }]);
    const removeMistake = (idx: number) => onChange?.(mistakes.filter((_, i) => i !== idx));

    return (
      <div className="border border-purple-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_32px] bg-gray-100 border-b border-gray-200">
          <div className="px-3 py-1.5 text-[11px] font-bold text-red-600 uppercase flex items-center gap-1">
            <AlertTriangle size={11} /> Lỗi sai
          </div>
          <div className="px-3 py-1.5 text-[11px] font-bold text-green-600 uppercase flex items-center gap-1 border-l border-gray-200">
            <CheckCircle2 size={11} /> Chuẩn DQH
          </div>
          <div></div>
        </div>
        {/* Rows */}
        {mistakes.map((m, j) => (
          <div key={j} className="grid grid-cols-[1fr_1fr_32px] border-b border-gray-100 hover:bg-gray-50/50">
            <div className="p-1.5">
              <textarea
                value={m.wrong}
                onChange={e => handleWrongChange(j, e.target.value)}
                rows={2}
                className="w-full text-[12px] text-gray-800 border border-red-100 bg-red-50/50 rounded px-2 py-1 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none resize-y"
              />
            </div>
            <div className="p-1.5 border-l border-gray-100">
              <textarea
                value={m.right}
                onChange={e => handleRightChange(j, e.target.value)}
                rows={2}
                className="w-full text-[12px] text-gray-800 border border-green-100 bg-green-50/50 rounded px-2 py-1 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none resize-y"
              />
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => removeMistake(j)} className="text-red-300 hover:text-red-600 p-0.5"><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
        <div className="p-2 bg-gray-50 border-t border-gray-200">
          <button onClick={addMistake} className="flex items-center gap-1 text-[12px] text-purple-600 hover:text-purple-800 font-medium">
            <Plus size={14} /> Thêm lỗi mới
          </button>
        </div>
      </div>
    );
  }

  return (
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
};

/** Interactive quiz component */
const QuizBlock = ({ quiz }: { quiz: any }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const questions = quiz?.questions || [];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q: any) => answers[q.id] === q.correct).length;
  const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const passed = score >= (quiz?.passingScore || 70);

  const handleSelect = (qId: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => setSubmitted(true);
  const handleReset = () => { setAnswers({}); setSubmitted(false); setShowExplanation({}); };

  return (
    <div>
      {/* Quiz header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-100">
        <h3 className="font-bold text-base text-gray-900">{quiz?.title || "Bài kiểm tra"}</h3>
        {quiz?.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
            📝 {totalQ} câu hỏi
          </span>
          {quiz?.timeLimit && (
            <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
              ⏱ {quiz.timeLimit} phút
            </span>
          )}
          <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
            🎯 Đạt: ≥{quiz?.passingScore || 70}%
          </span>
        </div>
      </div>

      {/* Results banner */}
      {submitted && (
        <div className={`rounded-xl p-4 mb-4 border-2 ${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className={`text-lg font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                {passed ? '🎉 Đạt!' : '❌ Chưa đạt'}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                Đúng {correctCount}/{totalQ} câu · Điểm: {score}%
              </div>
            </div>
            <button onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
              Làm lại
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!submitted && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Đã trả lời: {answeredCount}/{totalQ}</span>
            <span>{Math.round((answeredCount / totalQ) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: any, idx: number) => {
          const selected = answers[q.id];
          const isCorrect = submitted && selected === q.correct;
          const isWrong = submitted && selected !== undefined && selected !== q.correct;

          return (
            <div key={q.id}
              className={`rounded-xl border p-4 transition-colors ${
                submitted
                  ? isCorrect ? 'border-green-300 bg-green-50/50' : isWrong ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                  : selected !== undefined ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="flex gap-2 mb-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  submitted
                    ? isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                    : selected !== undefined ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>{idx + 1}</span>
                <p className="text-sm font-medium text-gray-800 pt-1 leading-relaxed">{q.question}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                {(q.options || []).map((opt: string, optIdx: number) => {
                  const isSelected = selected === optIdx;
                  const isCorrectOpt = submitted && optIdx === q.correct;
                  const isWrongOpt = submitted && isSelected && optIdx !== q.correct;

                  return (
                    <button key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      disabled={submitted}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                        isCorrectOpt
                          ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                          : isWrongOpt
                          ? 'bg-red-100 border-red-400 text-red-800 line-through'
                          : isSelected
                          ? 'bg-purple-100 border-purple-400 text-purple-800 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {submitted && q.explanation && (
                <div className="ml-9 mt-2">
                  <button onClick={() => setShowExplanation(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                    {showExplanation[q.id] ? '▾ Ẩn giải thích' : '▸ Xem giải thích'}
                  </button>
                  {showExplanation[q.id] && (
                    <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200 leading-relaxed">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && totalQ > 0 && (
        <div className="mt-6 flex justify-center">
          <button onClick={handleSubmit}
            disabled={answeredCount < totalQ}
            className={`px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
              answeredCount === totalQ
                ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            {answeredCount === totalQ ? '✅ Nộp bài' : `Còn ${totalQ - answeredCount} câu chưa trả lời`}
          </button>
        </div>
      )}
    </div>
  );
};

/** Render a content block based on type (from DB subsection or fallback block) */
const ContentBlock = ({ block, isEditing, onUpdate }: { block: any, isEditing?: boolean, onUpdate?: (id: string, metadata: any) => void }) => {
  // DB subsection format: content_type + metadata
  if (block.content_type) {
    const meta = block.metadata || {};
    const handleUpdate = (key: string, data: any) => {
      onUpdate?.(block.id, { ...meta, [key]: data });
    };

    if ((block.content_type === "list" || block.content_type === "items") && meta.items) return <ItemsBlock items={meta.items} isEditing={isEditing} onChange={(d) => handleUpdate("items", d)} />;
    if (block.content_type === "table" && meta.table) return <TableBlock table={meta.table} isEditing={isEditing} onChange={(d) => handleUpdate("table", d)} />;
    if (block.content_type === "mistakes" && meta.mistakes) return <MistakesBlock mistakes={meta.mistakes} isEditing={isEditing} onChange={(d) => handleUpdate("mistakes", d)} />;
    if (block.content_type === "quiz" && meta.quiz) return <QuizBlock quiz={meta.quiz} />;
    if (block.content_type === "text" && block.content) {
      if (isEditing) {
        return <textarea value={block.content} onChange={e => onUpdate?.(block.id, { ...meta, content: e.target.value })} rows={4} className="w-full text-sm text-gray-800 border-2 border-purple-200 rounded px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-y" />;
      }
      return <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{block.content}</p>;
    }
    if (block.content_type === "mindset_tier" && meta.data) return <MindsetTierBlock data={meta.data} />;
    // Fallback: if metadata has items but content_type doesn't match, still render
    if (meta.items) return <ItemsBlock items={meta.items} isEditing={isEditing} onChange={(d) => handleUpdate("items", d)} />;
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
        if (data.length > 0) setActiveSection(data[0].id);
        setLoading(false);
      });
    } else {
      setSections(FALLBACK_DESIGN_SECTIONS);
      if (FALLBACK_DESIGN_SECTIONS.length > 0) setActiveSection(FALLBACK_DESIGN_SECTIONS[0].id);
      setLoading(false);
    }
  }, [moduleId, useDB]);

  if (loading) return <LoadingSpinner />;
  if (sections.length === 0) return <EmptyState text="Module này chưa có nội dung." />;

  // If only 1 section → show content directly without sidebar
  if (sections.length === 1) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <SectionContent section={sections[0]} useDB={useDB} />
      </div>
    );
  }

  const selected = sections.find(s => s.id === activeSection);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50/50">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {sections.map((s) => {
              const Icon = getIcon(s.icon);
              const isActive = s.id === activeSection;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={13} />
                  <span>{s.number}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Mobile content */}
        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {selected ? (
            <SectionContent section={selected} useDB={useDB} />
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">Chọn mục để xem</div>
          )}
        </div>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex gap-0" style={{ minHeight: '500px' }}>
        {/* LEFT — Section sidebar */}
        <div className="w-[260px] flex-shrink-0 border-r border-gray-200 bg-gray-50/50">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Danh mục</span>
          </div>
          <div className="divide-y divide-gray-100">
            {sections.map((s) => {
              const Icon = getIcon(s.icon);
              const isActive = s.id === activeSection;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                    isActive
                      ? "bg-white border-l-3 border-l-purple-600 shadow-sm"
                      : "hover:bg-white/80 border-l-3 border-l-transparent"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${
                    isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                        isActive ? "text-purple-600 bg-purple-50" : "text-gray-400 bg-gray-100"
                      }`}>{s.number}</span>
                      <span className={`text-[13px] font-medium truncate ${
                        isActive ? "text-gray-900" : "text-gray-600"
                      }`}>{s.title}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Content area */}
        <div className="flex-1 bg-gray-50/30 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {selected ? (
            <SectionContent section={selected} useDB={useDB} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              ← Chọn một mục để xem nội dung
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Inline content for a section (renders inside the right panel) */
const SectionContent = ({ section, useDB }: { section: Section; useDB: boolean }) => {
  const [subsections, setSubsections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (useDB && section.subsections && section.subsections.length > 0) {
      setSubsections(section.subsections);
      setLoading(false);
    } else if (!useDB) {
      const content = FALLBACK_DESIGN_CONTENT[section.number];
      if (content) setSubsections(content.blocks);
      setLoading(false);
    } else {
      setSubsections([]);
      setLoading(false);
    }
  }, [section, useDB]);

  const handleUpdate = async (id: string, newMetadata: any) => {
    setSubsections(prev => prev.map(s => s.id === id ? { ...s, metadata: newMetadata } : s));
    await updateSubsectionMetadata(id, newMetadata);
  };

  const lead = useDB ? section.content : FALLBACK_DESIGN_CONTENT[section.number]?.lead;

  if (loading) return <LoadingSpinner />;

  // If many subsections (e.g. job descriptions) → tabbed view
  const useTabs = subsections.length >= 4;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SectionBadge label={section.number} />
          <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
        </div>
        {useDB && (
          <button onClick={() => setIsEditing(!isEditing)} className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${isEditing ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"}`}>
            {isEditing ? "Tắt chỉnh sửa (Đã lưu)" : "Chỉnh sửa nội dung"}
          </button>
        )}
      </div>
      {lead && (
        <p className="text-sm text-gray-500 italic mb-4 border-l-3 border-purple-300 pl-3">{lead}</p>
      )}

      {useTabs ? (
        <TabbedSubsections subsections={subsections} isEditing={isEditing} onUpdate={handleUpdate} />
      ) : (
        <div className="space-y-8">
          {subsections.map((block: any, i: number) => (
            <div key={i}>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {block.title || block.heading}
              </h3>
              <ContentBlock block={block} isEditing={isEditing} onUpdate={handleUpdate} />
            </div>
          ))}
        </div>
      )}

      {subsections.length === 0 && <EmptyState text="Chưa có nội dung chi tiết." />}
    </div>
  );
};

/** Tabbed view for subsections (e.g., Job Descriptions) */
const TabbedSubsections = ({ subsections, isEditing, onUpdate }: { subsections: any[], isEditing?: boolean, onUpdate?: (id: string, metadata: any) => void }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = subsections[activeIdx];

  return (
    <div>
      {/* Tab bar — scrollable row */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-gray-200">
        {subsections.map((sub: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
              i === activeIdx
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {sub.heading || sub.title}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {active && (
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4">
            {active.heading || active.title}
          </h3>
          <ContentBlock block={active} isEditing={isEditing} onUpdate={onUpdate} />
        </div>
      )}
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
        if (data.length > 0) setActiveWorkflow(data[0].id);
        setLoading(false);
      });
    } else {
      setWorkflows(FALLBACK_WORKFLOWS);
      if (FALLBACK_WORKFLOWS.length > 0) setActiveWorkflow(FALLBACK_WORKFLOWS[0].id);
      setLoading(false);
    }
  }, [moduleId, useDB]);

  if (loading) return <LoadingSpinner />;
  if (workflows.length === 0) return <EmptyState text="Chưa có quy trình nào." />;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50/50">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {workflows.map((w) => {
              const isActive = w.id === activeWorkflow;
              return (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkflow(w.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{w.number}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {activeWorkflow ? (
            <WorkflowContent workflowId={activeWorkflow} useDB={useDB} />
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">Chọn quy trình để xem</div>
          )}
        </div>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex gap-0" style={{ minHeight: '500px' }}>
        {/* LEFT — Workflow sidebar */}
        <div className="w-[210px] flex-shrink-0 border-r border-gray-200 bg-gray-50/50">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quy trình</span>
          </div>
          <div className="divide-y divide-gray-100">
            {workflows.map((w) => {
              const Icon = getIcon(w.icon);
              const isActive = w.id === activeWorkflow;
              return (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkflow(w.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                    isActive
                      ? "bg-white border-l-3 border-l-amber-500 shadow-sm"
                      : "hover:bg-white/80 border-l-3 border-l-transparent"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${
                    isActive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                        isActive ? "text-amber-600 bg-amber-50" : "text-gray-400 bg-gray-100"
                      }`}>{w.number}</span>
                    </div>
                    <span className={`text-[13px] font-medium block truncate ${
                      isActive ? "text-gray-900" : "text-gray-600"
                    }`}>{w.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Content area */}
        <div className="flex-1 bg-gray-50/30 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {activeWorkflow ? (
            <WorkflowContent workflowId={activeWorkflow} useDB={useDB} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              ← Chọn một quy trình để xem
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── STEP ACTIONS EDITOR ─────────────────────────────────────
const StepActionsEditor = ({ stepId, actions, useDB, onUpdate }: {
  stepId: string;
  actions: string[];
  useDB: boolean;
  onUpdate: (actions: string[]) => void;
}) => {
  const [text, setText] = useState(actions.join("\n"));

  const save = () => {
    const newActions = text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    onUpdate(newActions);
    if (useDB) {
      import('../../services/supabase').then(({ supabase }) => {
        supabase.from('training_workflow_steps').update({ actions: newActions }).eq('id', stepId);
      });
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Nội dung bước (mỗi dòng = 1 gạch đầu dòng)</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={save}
        className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
        placeholder="Nhập nội dung..."
      />
    </div>
  );
};

// ─── STEP DOCS EDITOR ────────────────────────────────────────
const StepDocsEditor = ({ stepId, workflowId, docs, useDB, onUpdate }: {
  stepId: string;
  workflowId: string;
  docs: { label: string; url: string }[];
  useDB: boolean;
  onUpdate: (docs: { label: string; url: string }[]) => void;
}) => {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const saveDocs = (newDocs: { label: string; url: string }[]) => {
    onUpdate(newDocs);
    if (useDB) {
      import('../../services/trainingService').then(({ updateWorkflowStepMetadata }) => {
        updateWorkflowStepMetadata(stepId, { docs: newDocs });
      });
    }
  };

  const addDoc = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    saveDocs([...docs, { label: newLabel.trim(), url: newUrl.trim() }]);
    setNewLabel("");
    setNewUrl("");
  };

  const removeDoc = (idx: number) => {
    saveDocs(docs.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
        <FileText size={12} /> Tài liệu đính kèm
      </p>
      {docs.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-100">
              <FileText size={11} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium text-blue-700 truncate">{doc.label}</span>
              <span className="text-blue-400 truncate flex-1 text-[10px]">{doc.url}</span>
              <button onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Tên tài liệu..."
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <input
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="https://link..."
          className="flex-[2] px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button
          onClick={addDoc}
          disabled={!newLabel.trim() || !newUrl.trim()}
          className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          + Thêm
        </button>
      </div>
    </div>
  );
};

const WorkflowContent = ({ workflowId, useDB }: { workflowId: string; useDB: boolean }) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleUpdateCoordinationChecklist = async (phase: string, actions: string[]) => {
    // ... (unchanged)
    const existingStepIdx = steps.findIndex(s => s.phase === phase);
    let newSteps = [...steps];
    
    if (existingStepIdx >= 0) {
      newSteps[existingStepIdx] = { ...newSteps[existingStepIdx], actions };
    } else {
      newSteps.push({
        id: 'temp-' + Date.now(),
        workflow_id: workflowId,
        phase,
        actions,
        owner: null,
        metadata: null,
        sort_order: 1,
        created_at: '',
        updated_at: ''
      });
    }
    setSteps(newSteps);

    if (useDB) {
      import('../../services/trainingService').then(({ updateWorkflowStepActions }) => {
        updateWorkflowStepActions(workflowId, phase, actions);
      });
    }
  };

  const [editChecklistText, setEditChecklistText] = useState("");

  const handleToggleEdit = () => {
    if (isEditing && workflow) {
      // Save changes
      const newChecklist = editChecklistText.split("\n").map(s => s.trim()).filter(s => s.length > 0);
      setWorkflow({ ...workflow, checklist: newChecklist });
      if (useDB) {
        import('../../services/trainingService').then(({ updateWorkflowChecklist }) => {
          updateWorkflowChecklist(workflowId, newChecklist);
        });
      }
    } else {
      // Enter edit mode
      setEditChecklistText((workflow?.checklist || []).join("\n"));
    }
    setIsEditing(!isEditing);
  };

  if (loading) return <LoadingSpinner />;
  if (!workflow) return <EmptyState text="Không tìm thấy workflow." />;

  const isStorage = workflow.number === '3.6';
  const isStandards = workflow.number === '3.7';
  const isDesignProcess = workflow.number === '3.2';
  const isCoordinationProcess = workflow.number === '3.3';

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SectionBadge label={workflow.number} />
          <h2 className="text-lg font-bold text-gray-900">{workflow.title}</h2>
        </div>
        {useDB && (
          <button 
            onClick={handleToggleEdit} 
            className={`hidden md:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${isEditing ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"}`}
          >
            {isEditing ? "Tắt chỉnh sửa (Đã lưu)" : "Chỉnh sửa nội dung"}
          </button>
        )}
      </div>
      {workflow.lead_quote && (
        <p className="text-sm text-gray-500 italic mb-6 border-l-3 border-amber-300 pl-3">{workflow.lead_quote}</p>
      )}

      {isEditing && (
        <div className="mb-6 p-4 border border-purple-200 rounded-xl bg-purple-50/50">
          <label className="block text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <ClipboardList size={16} />
            Checklist Đầu Ra cho giai đoạn này (Hiển thị khi hover vào Mục lục)
          </label>
          <p className="text-xs text-purple-600 mb-3">Mỗi dòng là một mục checklist. Để trống nếu không có.</p>
          <textarea
            value={editChecklistText}
            onChange={(e) => setEditChecklistText(e.target.value)}
            className="w-full h-32 border border-purple-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Nhập checklist tại đây..."
          />
        </div>
      )}

      {/* Design Process Table (workflow 3.2) */}
      {isDesignProcess && (
        <div className="mb-8">
          <WorkflowProcessTable />
        </div>
      )}

      {/* Coordination Process Table (workflow 3.3) */}
      {isCoordinationProcess && (
        <div className="mb-8">
          <CoordinationProcessTable 
            steps={steps}
            isEditing={isEditing}
            onUpdateChecklist={handleUpdateCoordinationChecklist}
          />
        </div>
      )}

      {/* Regular steps (hide for 3.2 and 3.3 since they use table views) */}
      {steps.length > 0 && !isDesignProcess && !isCoordinationProcess && (
        <div className="space-y-6 mb-6">
          {steps.map((step, i) => {
            const docs: { label: string; url: string }[] = (step.metadata as any)?.docs || [];
            return (
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
              {isEditing ? (
                <div className="px-5 py-4">
                  <StepActionsEditor
                    stepId={step.id}
                    actions={step.actions || []}
                    useDB={useDB}
                    onUpdate={(newActions) => {
                      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, actions: newActions } : s));
                    }}
                  />
                </div>
              ) : (
                <ul className="px-5 py-4 space-y-2">
                  {(step.actions || []).map((a: string, j: number) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}

              {/* Document Links */}
              {docs.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {docs.map((doc, di) => (
                    <a
                      key={di}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FileText size={12} />
                      {doc.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Admin: Edit docs */}
              {isEditing && (
                <div className="px-5 pb-4 border-t border-dashed border-purple-200 pt-3 mt-1">
                  <StepDocsEditor
                    stepId={step.id}
                    workflowId={workflowId}
                    docs={docs}
                    useDB={useDB}
                    onUpdate={(newDocs) => {
                      const newMeta = { ...(step.metadata as any || {}), docs: newDocs };
                      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, metadata: newMeta } : s));
                    }}
                  />
                </div>
              )}
            </div>
            );
          })}
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
  const [useDB, setUseDB] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read initial tab from URL hash (e.g. #design-knowledge)
  const getHashSlug = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'onboarding';
  };

  const [activeModuleSlug, setActiveModuleSlugState] = useState<string>(getHashSlug());

  // Wrap setActiveModuleSlug to also update hash
  const setActiveModuleSlug = useCallback((slug: string) => {
    setActiveModuleSlugState(slug);
    window.location.hash = slug;
  }, []);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const slug = window.location.hash.replace('#', '');
      if (slug) setActiveModuleSlugState(slug);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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

  const activeModule = modules.find(m => m.slug === activeModuleSlug);

  const renderModuleContent = () => {
    if (!activeModule) return <EmptyState />;

    // Module 1: Foundation landing page
    if (activeModule.slug === 'onboarding') return <DQHFoundationPage />;

    // Workflow module
    if (activeModule.slug === 'workflow') return <WorkflowModule moduleId={activeModule.id} useDB={useDB} />;

    // Modules 2, 4: Section-based content
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
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Đào tạo & Thư viện</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Kiến thức nội bộ · Quy trình · Công cụ</p>
          </div>
          {useDB && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Supabase
            </span>
          )}
        </div>
      </div>

      {/* Tab nav — 6 modules */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {modules.map((m) => {
            const Icon = getIcon(m.icon);
            return (
              <button
                key={m.slug}
                onClick={() => setActiveModuleSlug(m.slug)}
                className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-3 md:py-3.5 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeModuleSlug === m.slug
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{m.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        {renderModuleContent()}
      </div>
    </div>
  );
}
