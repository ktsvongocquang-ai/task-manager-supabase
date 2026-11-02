// Trạng thái: mọi bảng quy về 4 giá trị chuẩn. Phải khớp hàm SQL dqh_norm_status.
import { CoreError } from './db.js';

export const STATUSES = ['todo', 'doing', 'done', 'cancelled'];

const DONE = ['hoàn thành', 'done', 'completed', 'published', 'đã xong'];
const CANCELLED = ['hủy bỏ', 'huỷ bỏ', 'rejected', 'archived', 'lưu trữ', 'cancelled', 'canceled'];
const TODO = ['chưa bắt đầu', 'cần làm', 'todo', 'mới', 'mới tạo', 'upcoming', 'pending', 'idea', 'open', 'scheduled', 'draft', 'preparing'];

export function normStatus(s) {
  if (s == null) return 'todo';
  const v = String(s).trim().toLowerCase();
  if (DONE.includes(v)) return 'done';
  if (CANCELLED.includes(v)) return 'cancelled';
  if (TODO.includes(v)) return 'todo';
  return 'doing';
}

// Giá trị ghi ngược vào từng bảng gốc (đúng từ vựng UI hiện tại đang dùng).
const TO_SOURCE = {
  core:         { todo: 'Chưa bắt đầu', doing: 'Đang thực hiện', done: 'Hoàn thành', cancelled: 'Hủy bỏ' },
  construction: { todo: 'TODO', doing: 'DOING', done: 'DONE', cancelled: null },
  marketing:    { todo: 'TODO', doing: 'DOING', done: 'DONE', cancelled: 'REJECTED' },
  personal:     { todo: 'todo', doing: 'doing', done: 'done', cancelled: 'archived' },
};

export function toSourceStatus(source, status) {
  const s = String(status ?? '').trim().toLowerCase();
  if (!STATUSES.includes(s)) throw new CoreError(400, `Trạng thái không hợp lệ: "${status}". Dùng: ${STATUSES.join(', ')}`);
  const map = TO_SOURCE[source];
  if (!map) throw new CoreError(400, `Nguồn việc không hợp lệ: ${source}`);
  const v = map[s];
  if (v == null) throw new CoreError(400, `Việc thi công không có trạng thái "${s}". Hãy dùng done hoặc xoá trong app.`);
  return v;
}

const PRIORITY = {
  core:         { high: 'Cao', medium: 'Trung bình', low: 'Thấp', urgent: 'Khẩn cấp' },
  construction: { high: 'Cao', medium: 'Trung bình', low: 'Thấp', urgent: 'Khẩn cấp' },
  marketing:    { high: 'high', medium: 'medium', low: 'low', urgent: 'high' },
  personal:     { high: 'high', medium: 'medium', low: 'low', urgent: 'high' },
};
export function toSourcePriority(source, p) {
  if (!p) return PRIORITY[source]?.medium ?? 'Trung bình';
  return PRIORITY[source]?.[String(p).toLowerCase()] ?? String(p);
}

export const SOURCE_TABLE = {
  core: 'tasks',
  construction: 'construction_tasks',
  marketing: 'marketing_tasks',
  personal: 'personal_tasks',
};
