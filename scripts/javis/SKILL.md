---
name: khai-toan-pdf
description: Tạo file PDF khái toán nội thất DQH theo cấu hình khách (diện tích, số phòng, phân khúc, phong cách, phạm vi) rồi gửi qua Zalo bằng zalo_send_file, hoặc gửi link cấu hình qua Messenger. Dùng khi khách hỏi chi phí, xin khái toán, xin file dự toán.
---

# Gửi PDF khái toán DQH

## 1. Thu thập đủ 5 thông tin (hỏi lại nếu thiếu)
| Thông tin | Trường | Giá trị hợp lệ |
|---|---|---|
| Diện tích thông thủy | `area` | 35 đến 350 (m²) |
| Số phòng ngủ | `beds` | 1, 2, 3, 4 |
| Số WC | `baths` | 1, 2, 3 |
| Phân khúc vật tư | `tier` | `standard` (Tiêu chuẩn) hoặc `luxury` (Cao cấp) |
| Phong cách | `style` | `modern` (Hiện đại) hoặc `modern_luxury` (Modern Luxury) |

Tuỳ chọn: `clientName` (tên khách hoặc tên căn hộ), `startDate` (YYYY-MM-DD), `scope` (xem mục 4).
KHÔNG đặt `showSchedule: true`: tiến độ chưa được duyệt để gửi khách.

## 2. Tạo PDF
Chạy:
```bash
/opt/javis/scripts/khai-toan-pdf.sh '{"clientName":"Chị Hoa","area":70,"beds":2,"baths":2,"tier":"standard","style":"modern"}'
```
- Thành công (mã 0): stdout là đường dẫn file PDF trong outbox; stderr có dòng `LINK: https://...`.
- Mã 2: dữ liệu sai, đọc `details` trong stderr rồi hỏi lại khách cho đúng.
- Mã 3: sai khoá API, báo admin, không thử lại.
- Mã 4: lỗi máy chủ, thử lại 1 lần, vẫn lỗi thì gửi link `https://dqh.vercel.app/khai-toan/index.html` và báo admin.

## 3. Gửi cho khách
- **Zalo:** gọi `zalo_send_file` với `{ "threadId": "<id>", "threadType": 0, "paths": ["<đường dẫn từ bước 2>"], "caption": "Dạ em gửi anh/chị bản khái toán sơ bộ theo cấu hình mình chọn ạ." }` (`threadType` 1 nếu là nhóm).
- **Messenger** (chưa gửi được file): gửi link sau `LINK:`. Link mở sẵn đúng cấu hình trên web và không chứa tên hay số điện thoại.

Khi nói với khách: đây là **khái toán sơ bộ, chỉ mang tính tham khảo**. Không gọi là "báo giá", không hứa giảm giá hay ưu đãi. Mời khách đặt lịch khảo sát để có số chính xác.

## 4. Phạm vi (`scope`, chỉ thêm khi khách nói rõ)
Bỏ trống thì dùng mặc định: phá dỡ 100%, cải tạo WC, trần thạch cao, sơn bả, sàn gỗ tầm trung, đèn cao cấp, điện đi mới, đồ gỗ Melamine tiêu chuẩn, đồ rời tiêu chuẩn, đá thạch anh, thiết bị bếp tiêu chuẩn, rèm hai lớp.

| Khoá | Giá trị |
|---|---|
| `demolition`, `wcRenovation`, `ceiling`, `painting`, `freshAir`, `epoxyGrout` | `true` / `false` |
| `demoLevel` | `20` / `50` / `100` |
| `staircase` | `none` / `basic` / `luxury` |
| `flooring` | `none` / `standard` / `luxury` |
| `floorMaterial` | `wood` / `tile` |
| `lighting`, `smarthome`, `loose` | `none` / `standard` / `luxury` |
| `speaker` | `none` / `basic` / `luxury` |
| `electrical` | `none` / `light_mod` / `full_mod` |
| `wood` | `none` / `melamine_economy` / `melamine_standard` / `laminate` |
| `stone` | `none` / `standard_stone` / `luxury_stone` |
| `appliances`, `wcEquipment` | `none` / `basic` / `luxury` |
| `curtain` | `none` / `normal` / `electric` |
| `ac` | `none` / `wall` / `ducted` |

Ví dụ khách muốn sàn gạch, không làm trần: `"scope": {"floorMaterial":"tile","ceiling":false}`.
