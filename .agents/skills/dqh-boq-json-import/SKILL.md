---
name: dqh-boq-json-import
description: Chuẩn hóa bảng báo giá, BOQ, dự toán, ảnh chụp Excel, PDF hoặc text thành JSON chuẩn để paste vào app DQH. Use when cần đưa dữ liệu báo giá/BOQ từ nguồn bất kỳ vào app DQH, tạo nhóm hạng mục và dòng công việc có mã dòng, ĐVT, khối lượng, đơn giá, ghi chú, warnings để người dùng kiểm tra trước khi lưu.
---

# DQH BOQ JSON Import

## Mục tiêu

Biến mọi bảng báo giá/BOQ/dự toán thành một JSON duy nhất để app DQH đọc được ở nút **Nhập JSON AI** trong tab BOQ.

Luồng chuẩn:

1. Đọc ảnh, Excel, PDF hoặc text báo giá.
2. Phân biệt dòng nhóm và dòng công việc.
3. Chuẩn hóa về JSON theo schema DQH.
4. Chỉ trả JSON hợp lệ, không giải thích ngoài JSON.
5. Ghi mọi điểm không chắc vào `warnings`.

## Quy tắc phân loại

- `group`: nhóm hạng mục lớn, ví dụ `Phần thô`, `Phần hoàn thiện`, `MEP`, `Nội thất`.
- `item`: dòng công việc cụ thể có thể có ĐVT, khối lượng, đơn giá.
- Nếu có mã dòng gốc như `A`, `A.1`, `B.2`, giữ nguyên.
- Nếu thiếu mã dòng, tự tạo theo thứ tự: nhóm `A`, `B`, `C`; dòng con `A.1`, `A.2`.
- Không bịa dữ liệu. Nếu thiếu thì dùng `null` hoặc `0` và thêm cảnh báo.
- Số tiền phải là number, không có dấu phân cách hoặc chữ `VND`.
- `quote_unit_price` là đơn giá báo giá/hợp đồng, không phải chi phí thực tế.
- Không đưa chi phí đã thanh toán vào BOQ trừ khi nguồn ghi rõ đó là chi phí thực tế.

## JSON Schema

Đọc chi tiết trong [references/schema-and-prompt.md](references/schema-and-prompt.md).

## Output bắt buộc

Chỉ xuất JSON hợp lệ:

```json
{
  "project_name": null,
  "currency": "VND",
  "source_type": "excel_image",
  "boq_groups": [],
  "warnings": []
}
```

Không bọc trong markdown, không thêm lời giải thích.
