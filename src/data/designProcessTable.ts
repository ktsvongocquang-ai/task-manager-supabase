// ============================================================================
// DQH Design Process — Bảng Quy trình Gọn (4 Giai đoạn, ~20 bước)
// Tối ưu cho công ty nhỏ, ít người
// Lưu vào metadata JSONB — không cần thay đổi schema DB
// ============================================================================

// Cấu trúc: Mỗi workflow step giờ có metadata.table_row chứa thông tin bảng
// { step_code, task, deliverable, executor, reviewer, form, duration }

export const DESIGN_PROCESS_TABLE = {
  title: "QUY TRÌNH THIẾT KẾ CHÍNH — DQH INTERIOR",
  columns: ["STT", "Nhiệm vụ", "Kết quả", "Thực hiện", "Kiểm soát", "Form / Template"],
  phases: [
    {
      code: "A",
      name: "BRIEFING — NHẬN THÔNG TIN",
      color: "#3B82F6",
      duration: "01 tuần",
      steps: [
        { code: "A1", task: "Nhận thông tin dự án, trao đổi sơ bộ", deliverable: "Email xác nhận", executor: "Designer", reviewer: "Leader", form: "Design Brief" },
        { code: "A2", task: "Tạo folder dự án trên Drive theo template", deliverable: "Project Folder", executor: "Leader", reviewer: "—", form: "Template Folder" },
        { code: "A3", task: "Gặp khách hàng, phỏng vấn nhu cầu chi tiết", deliverable: "Design Brief hoàn chỉnh", executor: "Designer & Leader", reviewer: "Director", form: "Intake Form" },
        { code: "A4", task: "Khảo sát hiện trạng, đo đạc thực tế", deliverable: "Mặt bằng ghi chú + Ảnh chụp", executor: "Designer", reviewer: "Leader", form: "Site Survey Checklist" },
        { code: "A5", task: "Lập tiến độ thiết kế cho dự án", deliverable: "Project Schedule", executor: "Leader", reviewer: "Director", form: "Schedule Template" },
      ]
    },
    {
      code: "B",
      name: "CONCEPT — Ý TƯỞNG THIẾT KẾ",
      color: "#059669",
      duration: "02 - 04 tuần",
      steps: [
        { code: "B1", task: "Brainstorm ý tưởng, xác định phong cách & mức đầu tư", deliverable: "Mood Board + Concept Brief", executor: "Designer & Leader", reviewer: "Director", form: "Design Brief" },
        { code: "B2", task: "Thiết kế zoning, test layout (02 phương án)", deliverable: "Zoning Layout + Reference images", executor: "Designer & Leader", reviewer: "Director", form: "Concept Presentation" },
        { code: "B3", task: "Họp review nội bộ, duyệt phương án", deliverable: "MOM (Biên bản họp)", executor: "Leader", reviewer: "Director", form: "MOM Template" },
        { code: "B4", task: "Hoàn chỉnh file thuyết trình + Present cho khách", deliverable: "Concept Presentation File", executor: "Leader", reviewer: "Director", form: "PPT Template" },
        { code: "B5", task: "Điều chỉnh theo feedback khách (max 2 lần)", deliverable: "Concept duyệt (Approved)", executor: "Designer", reviewer: "Leader", form: "Revision Log" },
      ]
    },
    {
      code: "C",
      name: "TRIỂN KHAI — 3D & BẢN VẼ KỸ THUẬT",
      color: "#D97706",
      duration: "03 - 06 tuần",
      steps: [
        { code: "C1", task: "Triển khai mặt bằng chi tiết (furniture layout)", deliverable: "AutoCAD Layout", executor: "Designer", reviewer: "Leader", form: "CAD Template" },
        { code: "C2", task: "Dựng hình 3D, render phối cảnh chính", deliverable: "3D Renders (min 5 góc/không gian)", executor: "3D Viz", reviewer: "Leader", form: "Render Checklist" },
        { code: "C3", task: "Review 3D nội bộ + Present cho khách", deliverable: "3D duyệt + Material Board", executor: "Leader", reviewer: "Director", form: "PPT Template" },
        { code: "C4", task: "Triển khai mặt đứng, mặt cắt, chi tiết cấu tạo", deliverable: "Full Set bản vẽ kỹ thuật", executor: "Drafter", reviewer: "Leader", form: "Drawing Checklist" },
        { code: "C5", task: "Chuẩn bị Material Schedule + BOQ (Bảng khối lượng)", deliverable: "Material Schedule + BOQ", executor: "Designer & Drafter", reviewer: "Leader", form: "BOQ Template" },
        { code: "C6", task: "Kiểm soát bộ hồ sơ Thiết Kế Triển Khai hoàn chỉnh", deliverable: "Hồ sơ TK hoàn chỉnh (PDF + CAD)", executor: "Leader", reviewer: "Director", form: "QC Checklist" },
      ]
    },
    {
      code: "D",
      name: "BÀN GIAO & GIÁM SÁT",
      color: "#DC2626",
      duration: "Theo tiến độ TC",
      steps: [
        { code: "D1", task: "Present hồ sơ + Báo giá thi công cho khách", deliverable: "Báo giá TC được duyệt", executor: "Leader & Sales", reviewer: "Director", form: "BOQ + PPT" },
        { code: "D2", task: "Ký HĐ Thi công, bàn giao hồ sơ cho nhà thầu", deliverable: "HĐ TC + Hồ sơ thi công", executor: "Director", reviewer: "—", form: "HĐ Template" },
        { code: "D3", task: "Giám sát tác quyền thiết kế (site visit định kỳ)", deliverable: "Báo cáo tuần + Ảnh công trường", executor: "Designer & Leader", reviewer: "Director", form: "Site Report" },
        { code: "D4", task: "Nghiệm thu, bàn giao cho khách hàng", deliverable: "Biên bản nghiệm thu + Hồ sơ hoàn công", executor: "Leader", reviewer: "Director", form: "Completion Record" },
      ]
    }
  ]
};
