// Thư viện mẫu tiến độ thi công nội thất DQH. Ngày tính theo NGÀY LÀM VIỆC (nghỉ Chủ nhật).
// Đây là mẫu tham khảo để khỏi gõ lại từ đầu: nạp xong PM chỉnh theo thực tế từng công trình.
export interface TemplateItem { category: string; name: string; start: number; days: number }
export interface ScheduleTemplate { id: string; name: string; note: string; scale: number }

const BASE: TemplateItem[] = [
  { category: '1. Chuẩn bị', name: 'Bàn giao mặt bằng, che chắn bảo vệ (GS-02)', start: 0, days: 1 },
  { category: '1. Chuẩn bị', name: 'Đo hiện trạng, chụp album (GS-01)', start: 0, days: 1 },
  { category: '2. Phá dỡ & xây', name: 'Tháo dỡ, vận chuyển xà bần', start: 1, days: 3 },
  { category: '2. Phá dỡ & xây', name: 'Xây, chỉnh tường ngăn', start: 4, days: 3 },
  { category: '3. Điện nước, điều hoà', name: 'Đi ống điện, nước âm tường', start: 5, days: 5 },
  { category: '3. Điện nước, điều hoà', name: 'Đi ống đồng, thoát nước điều hoà', start: 7, days: 3 },
  { category: '4. Trần, tường, sàn', name: 'Khung trần thạch cao', start: 10, days: 4 },
  { category: '4. Trần, tường, sàn', name: 'Chống thấm, ốp lát WC', start: 10, days: 5 },
  { category: '4. Trần, tường, sàn', name: 'Bả matit, sơn lót', start: 14, days: 4 },
  { category: '4. Trần, tường, sàn', name: 'Lát sàn gỗ / đá / gạch', start: 18, days: 4 },
  { category: '5. Sản xuất xưởng', name: 'Đo kích thước sản xuất tại công trình', start: 10, days: 1 },
  { category: '5. Sản xuất xưởng', name: 'Sản xuất đồ gỗ tại xưởng', start: 11, days: 15 },
  { category: '5. Sản xuất xưởng', name: 'Nhận hàng xưởng về công trình (GS-05)', start: 26, days: 1 },
  { category: '6. Lắp đặt nội thất', name: 'Lắp tủ bếp, đá bếp', start: 27, days: 3 },
  { category: '6. Lắp đặt nội thất', name: 'Lắp tủ áo, kệ, vách', start: 27, days: 4 },
  { category: '6. Lắp đặt nội thất', name: 'Lắp cửa, phụ kiện cửa', start: 30, days: 2 },
  { category: '7. Hoàn thiện', name: 'Sơn hoàn thiện', start: 31, days: 4 },
  { category: '7. Hoàn thiện', name: 'Lắp thiết bị điện, đèn, vệ sinh', start: 33, days: 3 },
  { category: '7. Hoàn thiện', name: 'Rèm, giấy dán tường, decor', start: 35, days: 2 },
  { category: '8. Nghiệm thu, bàn giao', name: 'Vệ sinh công nghiệp', start: 37, days: 1 },
  { category: '8. Nghiệm thu, bàn giao', name: 'Nghiệm thu nội bộ (GS-08)', start: 38, days: 1 },
  { category: '8. Nghiệm thu, bàn giao', name: 'Sửa lỗi theo danh sách', start: 39, days: 3 },
  { category: '8. Nghiệm thu, bàn giao', name: 'Nghiệm thu bàn giao khách (GS-09)', start: 42, days: 1 },
];

export const TEMPLATES: ScheduleTemplate[] = [
  { id: 'can-ho', name: 'Căn hộ cải tạo nội thất', note: 'khoảng 43 ngày làm việc', scale: 1 },
  { id: 'van-phong', name: 'Văn phòng / showroom nhỏ', note: 'khoảng 35 ngày làm việc', scale: 0.8 },
  { id: 'nha-pho', name: 'Nhà phố hoàn thiện nội thất', note: 'khoảng 65 ngày làm việc', scale: 1.5 },
  { id: 'biet-thu', name: 'Biệt thự hoàn thiện nội thất', note: 'khoảng 90 ngày làm việc', scale: 2.1 },
];

/** Cộng n ngày làm việc (bỏ Chủ nhật) vào ngày ISO. n = 0 trả về chính ngày đó (dời sang thứ Hai nếu là CN). */
export function addWorkdays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  while (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  let left = n;
  while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); if (d.getUTCDay() !== 0) left--; }
  return d.toISOString().slice(0, 10);
}

/** Dựng danh sách việc có ngày thật từ mẫu + ngày khởi công. */
export function buildFromTemplate(t: ScheduleTemplate, startDate: string) {
  return BASE.map(i => {
    const s = Math.round(i.start * t.scale);
    const days = Math.max(1, Math.round(i.days * t.scale));
    const start = addWorkdays(startDate, s);
    return { category: i.category, name: i.name, start_date: start, end_date: addWorkdays(start, days - 1), days };
  });
}
