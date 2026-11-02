// Bộ biểu mẫu giám sát DQH (GS-01 → GS-10). Một nguồn duy nhất cho Trạm giám sát và trợ lý AI.
// kind: 'diary' = nhật ký ngày (ghi vào daily_logs) · 'task' = giao việc (ghi vào construction_tasks)
//       'note'  = biên bản (ghi vào ai_notes, title bắt đầu bằng mã biểu mẫu)

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checks' | 'date';
export interface FormField {
  key: string; label: string; type: FieldType; required?: boolean;
  options?: string[]; placeholder?: string; suffix?: string;
}
export interface SupervisorForm {
  code: string; name: string; when: string; group: number;
  kind: 'diary' | 'task' | 'note'; noteKind?: 'bien_ban' | 'van_de';
  fields: FormField[];
}

export const ISSUE_TYPES = ['Vật tư', 'Bản vẽ', 'Nhân lực', 'Khách hàng', 'Mặt bằng', 'Khác'];
export const SUPPORT_FROM = ['Không cần', 'PM', 'Thiết kế', 'Xưởng', 'Mua hàng', 'Kế toán', 'Giám đốc'];
export const QC_CRITERIA = ['Kích thước đúng bản vẽ', 'Cao độ, độ phẳng, vuông góc', 'Mối nối, khe hở đều', 'Bề mặt, màu sắc không lỗi', 'Phụ kiện lắp đủ, vận hành êm', 'Vệ sinh sạch, bảo vệ thành phẩm'];

export const FORMS: SupervisorForm[] = [
  { code: 'GS-01', name: 'Khảo sát hiện trạng & đo đạc', when: 'Trong 24 giờ sau khi nhận hồ sơ', group: 1, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'kich_thuoc', label: 'Kích thước tổng thể đã đo (đo 2 lần)', type: 'textarea', required: true },
    { key: 'cao_do', label: 'Mốc cao độ ±0.00, độ phẳng tường – sàn', type: 'textarea' },
    { key: 'me', label: 'Vị trí điện nước, điều hoà hiện có', type: 'textarea' },
    { key: 'rui_ro', label: 'Rủi ro hiện trạng (nứt, thấm, lệch…)', type: 'textarea' },
    { key: 'anh', label: 'Link album ảnh hiện trạng', type: 'text' },
  ] },
  { code: 'GS-02', name: 'Bàn giao mặt bằng thi công', when: 'Trước ngày khởi công', group: 1, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'hien_trang', label: 'Hiện trạng khi nhận', type: 'textarea', required: true },
    { key: 'dien_nuoc', label: 'Điện, nước thi công', type: 'select', options: ['Đã có', 'Chưa có'] },
    { key: 'quy_dinh', label: 'Quy định toà nhà / giờ làm', type: 'textarea' },
    { key: 'ben_giao', label: 'Người giao (chủ nhà / BQL)', type: 'text' },
  ] },
  { code: 'GS-03', name: 'Kế hoạch thi công & phân tổ đội', when: 'Trước khởi công', group: 2, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'trinh_tu', label: 'Trình tự hạng mục', type: 'textarea', required: true },
    { key: 'to_doi', label: 'Tổ đội phụ trách từng hạng mục', type: 'textarea', required: true },
    { key: 'van_chuyen', label: 'Đường vận chuyển, thang máy, kích thước kiện', type: 'textarea' },
  ] },
  { code: 'GS-04', name: 'Giao việc đầu ngày cho tổ', when: 'Mỗi sáng 07:30', group: 3, kind: 'task', fields: [] },
  { code: 'GS-05', name: 'Nhận vật tư / hàng xưởng về công trình', when: 'Mỗi lần nhận hàng', group: 2, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'hang', label: 'Hàng nhận (tên, số lượng, mã lô)', type: 'textarea', required: true },
    { key: 'tinh_trang', label: 'Tình trạng', type: 'select', options: ['Đủ, đạt', 'Thiếu', 'Lỗi / hư hỏng'], required: true },
    { key: 'ghi_chu', label: 'Thiếu / lỗi gì', type: 'textarea' },
  ] },
  { code: 'GS-06', name: 'Sự cố / phát sinh', when: 'Ngay khi xảy ra', group: 3, kind: 'note', noteKind: 'van_de', fields: [
    { key: 'mo_ta', label: 'Mô tả sự cố / yêu cầu thay đổi', type: 'textarea', required: true },
    { key: 'loai', label: 'Loại', type: 'select', options: ISSUE_TYPES, required: true },
    { key: 'doi_chi_phi', label: 'Làm đổi chi phí hoặc phạm vi?', type: 'select', options: ['Không', 'Có — cần phiếu phát sinh, khách ký trước khi làm'], required: true },
    { key: 'ho_tro', label: 'Cần hỗ trợ từ', type: 'select', options: SUPPORT_FROM },
    { key: 'de_xuat', label: 'Đề xuất xử lý', type: 'textarea' },
  ] },
  { code: 'GS-07', name: 'Nhật ký ngày', when: 'Mỗi ngày trước 17:00', group: 3, kind: 'diary', fields: [] },
  { code: 'GS-08', name: 'Nghiệm thu nội bộ (tự kiểm)', when: 'Xong mỗi hạng mục / lô', group: 4, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'hang_muc', label: 'Hạng mục nghiệm thu', type: 'text', required: true },
    { key: 'tieu_chi', label: 'Tiêu chí đạt', type: 'checks', options: QC_CRITERIA },
    { key: 'loi', label: 'Lỗi còn lại (punch list)', type: 'textarea' },
    { key: 'ket_luan', label: 'Kết luận', type: 'select', options: ['Đạt', 'Đạt, sửa lỗi nhỏ', 'Không đạt — làm lại'], required: true },
  ] },
  { code: 'GS-09', name: 'Nghiệm thu bàn giao khách', when: 'Ngày bàn giao', group: 4, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'pham_vi', label: 'Phạm vi bàn giao', type: 'textarea', required: true },
    { key: 'ton_dong', label: 'Tồn đọng khách ghi nhận', type: 'textarea' },
    { key: 'han_xu_ly', label: 'Hạn xử lý tồn đọng', type: 'date' },
    { key: 'khach_ky', label: 'Khách đã ký biên bản?', type: 'select', options: ['Đã ký', 'Chưa ký'], required: true },
  ] },
  { code: 'GS-10', name: 'Đánh giá tổ đội sau công trình', when: 'Sau mỗi công trình', group: 5, kind: 'note', noteKind: 'bien_ban', fields: [
    { key: 'to_doi', label: 'Tổ đội / thầu phụ', type: 'text', required: true },
    { key: 'chat_luong', label: 'Chất lượng (1–5)', type: 'select', options: ['5', '4', '3', '2', '1'], required: true },
    { key: 'tien_do', label: 'Đúng tiến độ (1–5)', type: 'select', options: ['5', '4', '3', '2', '1'], required: true },
    { key: 'ky_luat', label: 'Kỷ luật, vệ sinh, an toàn (1–5)', type: 'select', options: ['5', '4', '3', '2', '1'], required: true },
    { key: 'de_xuat', label: 'Đề xuất thưởng / phạt / dùng tiếp', type: 'textarea' },
  ] },
];

export const SOP_GROUPS = [
  { n: 1, name: 'Khảo sát & nhận mặt bằng', sla: 'Phiếu khảo sát + album ảnh trong 24 giờ', text: 'Đo kích thước tổng thể 2 lần, kiểm vuông góc, độ phẳng, mốc cao độ, vị trí điện nước. Ghi rủi ro hiện trạng trước khi khách ký hợp đồng thi công.' },
  { n: 2, name: 'Rà bản vẽ & chuẩn bị', sla: 'Xong trước khi xưởng xuất hàng', text: 'Đọc bản vẽ dưới góc nhìn thi công: đường vận chuyển, kiện có lọt thang máy, đấu nối điện nước. Lập kế hoạch và chia tổ. Kiểm hàng khi nhận.' },
  { n: 3, name: 'Điều độ hằng ngày & phát sinh', sla: '07:30 có mặt, 17:00 nộp nhật ký', text: 'Giao việc từng tổ đầu ngày. Ghi sự cố ngay khi xảy ra. Mọi việc làm thêm hoặc đổi phương án phải có phiếu phát sinh khách ký trước khi làm.' },
  { n: 4, name: 'Nghiệm thu & bàn giao', sla: 'Tự kiểm xong mỗi hạng mục', text: 'Tự kiểm theo 6 tiêu chí trước khi mời PM và khách. Lập danh sách lỗi, điều thợ sửa dứt điểm, ký biên bản bàn giao, tải album hoàn thiện.' },
  { n: 5, name: 'Đánh giá & rút kinh nghiệm', sla: 'Trong 3 ngày sau bàn giao', text: 'Chấm tổ đội theo chất lượng, tiến độ, kỷ luật. Ghi lại phát sinh và bài học để dùng cho công trình sau.' },
];

/** Gom các trường đã điền thành đoạn văn để lưu và để trợ lý AI đọc lại. */
export function formatForm(form: SupervisorForm, values: Record<string, any>): string {
  return form.fields.map(f => {
    const v = values[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length && f.type !== 'checks')) return null;
    if (f.type === 'checks') {
      const ok: string[] = Array.isArray(v) ? v : [];
      return `${f.label}: ${ok.length}/${f.options!.length} đạt` + (ok.length < f.options!.length ? ` — chưa đạt: ${f.options!.filter(o => !ok.includes(o)).join('; ')}` : '');
    }
    return `${f.label}: ${v}`;
  }).filter(Boolean).join('\n');
}
