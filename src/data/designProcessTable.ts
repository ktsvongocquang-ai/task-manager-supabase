// ============================================================================
// DQH Design Process — Bảng Quy trình Gọn (4 Giai đoạn, ~20 bước)
// ============================================================================

export interface ProcessStep {
  code: string;
  task: string;
  deliverable: string;
  executor: string;
  reviewer: string;
  form: string;
  duration: string;
}

export interface ProcessPhase {
  code: string;
  name: string;
  color: string;
  bgLight: string;
  totalDuration: string;
  steps: ProcessStep[];
}

export const DESIGN_PROCESS_TABLE: {
  title: string;
  phases: ProcessPhase[];
} = {
  title: "3.2 Quy trình Thiết kế (Design Main Process)",
  phases: [
    {
      code: "A",
      name: "BRIEFING — NHẬN THÔNG TIN",
      color: "#3B82F6",
      bgLight: "#EFF6FF",
      totalDuration: "01 tuần",
      steps: [
        { code: "A1", task: "Nhận thông tin dự án", deliverable: "Email to confirm", executor: "Designer", reviewer: "Leader", form: "Email, Design Brief", duration: "1 day" },
        { code: "A2", task: "Lập folder dự án trên Drive", deliverable: "Project Folder", executor: "Leader", reviewer: "Director", form: "Template Folder", duration: "0.5 day" },
        { code: "A3", task: "Gặp gỡ khách hàng, phỏng vấn", deliverable: "Design Brief", executor: "Designer", reviewer: "Director", form: "Design Brief", duration: "2 days" },
        { code: "A4", task: "Khảo sát hiện trạng", deliverable: "Mặt bằng ghi chú + Ảnh", executor: "Designer", reviewer: "Leader", form: "Site Survey Checklist", duration: "1 day" },
        { code: "A5", task: "Lập tiến độ thiết kế cho dự án", deliverable: "Project Schedule", executor: "Leader", reviewer: "Director", form: "Schedule Template", duration: "0.5 day" },
      ]
    },
    {
      code: "B",
      name: "THIẾT KẾ Ý TƯỞNG — CONCEPT DESIGN",
      color: "#059669",
      bgLight: "#ECFDF5",
      totalDuration: "02 - 04 tuần",
      steps: [
        { code: "B1", task: "Brainstorm nhu cầu khách hàng", deliverable: "Design Brief", executor: "Designer & Leader", reviewer: "Director", form: "Email, Design Brief", duration: "1 day" },
        { code: "B2", task: "Định hướng phong cách, mức đầu tư", deliverable: "Mood Board", executor: "Designer & Leader", reviewer: "Director", form: "Concept Template", duration: "2 days" },
        { code: "B3", task: "Thiết kế zoning, test layout (02 PA)", deliverable: "Zoning, Testfit, References", executor: "Designer & Leader", reviewer: "Director", form: "Concept Presentation", duration: "3 days" },
        { code: "B4", task: "Họp review nội bộ + duyệt PA", deliverable: "MOM (Biên bản)", executor: "Leader", reviewer: "Director", form: "MOM Template", duration: "0.5 day" },
        { code: "B5", task: "Present Concept cho khách hàng", deliverable: "PPT Presentation", executor: "Leader", reviewer: "Director", form: "PPT Template", duration: "1 day" },
        { code: "B6", task: "Điều chỉnh theo feedback (max 2 lần)", deliverable: "Concept Approved", executor: "Designer", reviewer: "Leader", form: "Revision Log", duration: "2 days" },
      ]
    },
    {
      code: "C",
      name: "TRIỂN KHAI — 3D & BẢN VẼ KỸ THUẬT",
      color: "#D97706",
      bgLight: "#FFFBEB",
      totalDuration: "03 - 06 tuần",
      steps: [
        { code: "C1", task: "Triển khai mặt bằng chi tiết", deliverable: "AutoCAD Layout", executor: "Designer", reviewer: "Leader", form: "CAD Template", duration: "2 days" },
        { code: "C2", task: "Dựng 3D, render phối cảnh", deliverable: "3D Renders (5+ góc)", executor: "3D Viz", reviewer: "Leader", form: "Render Checklist", duration: "5 days" },
        { code: "C3", task: "Review 3D + Present cho khách", deliverable: "3D Approved + Material Board", executor: "Leader", reviewer: "Director", form: "PPT Template", duration: "1 day" },
        { code: "C4", task: "Triển khai bản vẽ kỹ thuật", deliverable: "Full Set bản vẽ", executor: "Drafter", reviewer: "Leader", form: "Drawing Checklist", duration: "5 days" },
        { code: "C5", task: "Lập Material Schedule + BOQ", deliverable: "BOQ + Material Schedule", executor: "Designer & Drafter", reviewer: "Leader", form: "BOQ Template", duration: "2 days" },
        { code: "C6", task: "Kiểm soát bộ hồ sơ hoàn chỉnh", deliverable: "Hồ sơ TK (PDF + CAD)", executor: "Leader", reviewer: "Director", form: "QC Checklist", duration: "1 day" },
      ]
    },
    {
      code: "D",
      name: "BÀN GIAO & GIÁM SÁT",
      color: "#DC2626",
      bgLight: "#FEF2F2",
      totalDuration: "Theo tiến độ TC",
      steps: [
        { code: "D1", task: "Present hồ sơ + Báo giá TC cho khách", deliverable: "Báo giá TC Approved", executor: "Leader & Sales", reviewer: "Director", form: "BOQ + PPT", duration: "1 day" },
        { code: "D2", task: "Ký HĐ TC, bàn giao hồ sơ cho nhà thầu", deliverable: "HĐ TC + Hồ sơ TC", executor: "Director", reviewer: "—", form: "HĐ Template", duration: "1 day" },
        { code: "D3", task: "Giám sát tác quyền thiết kế", deliverable: "Báo cáo tuần + Ảnh", executor: "Designer & Leader", reviewer: "Director", form: "Site Report", duration: "Hàng tuần" },
        { code: "D4", task: "Nghiệm thu, bàn giao cho khách hàng", deliverable: "BB Nghiệm thu + Hoàn công", executor: "Leader", reviewer: "Director", form: "Completion Record", duration: "1 day" },
      ]
    }
  ]
};
