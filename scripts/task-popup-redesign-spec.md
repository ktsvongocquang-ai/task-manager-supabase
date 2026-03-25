# Task Popup — Redesign Spec
> Mục đích: Mô tả chính xác các thay đổi cần thực hiện trên popup Task hiện tại để phù hợp với quy trình làm việc Marketing.

---

## 1. Tổng quan thay đổi

| Hạng mục | Hiện tại | Sau khi chỉnh |
|---|---|---|
| Chiều rộng popup | ~640px (dọc) | Tối đa ~1020px (ngang) |
| Cấu trúc nội dung | Hook → Vấn đề → Giải pháp (textarea riêng lẻ) | Bảng 5 cột theo từng section |
| Số section | 3 (Hook, Vấn đề, Giải pháp) | 4 (Mở đầu, Vấn đề, Giải pháp, CTA) |
| Trường kèm theo mỗi section | Không có | Source clip + Chú thích & minh họa |
| Textarea | Scroll cố định, không tự giãn | Tự giãn theo nội dung (auto-resize) |

---

## 2. Layout tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Title · ID · Badge ưu tiên · [Lưu trữ] [✕]               │
├─────────────────────────────────────────────────────────────────────┤
│  META BAR (1 hàng ngang, 5 cột đều nhau):                          │
│  Trạng thái │ Người thực hiện │ Nền tảng │ Định dạng │ Lịch đăng  │
├──────┬──────────┬───────────────────┬──────────────┬────────────────┤
│ STT  │ Nội dung │ Kịch bản          │ Source clip  │ Chú thích      │
│      │          │                   │              │ & minh họa     │
├──────┼──────────┼───────────────────┼──────────────┼────────────────┤
│  1   │ Mở đầu  │ textarea          │ clip items   │ note + ảnh     │
│  2   │ Vấn đề  │ textarea          │ clip items   │ note + ảnh     │
│  3   │ Giải pháp│ textarea         │ clip items   │ note + ảnh     │
│  4   │ CTA     │ textarea          │ clip items   │ note + ảnh     │
├─────────────────────────────────────────────────────────────────────┤
│  FOOTER: [Lưu trữ]                          [Hủy] [Lưu lại]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Header

**Giữ nguyên** so với thiện tại, chỉ bỏ field "Dự án" ra khỏi header (chuyển vào meta bar nếu cần, hoặc bỏ hẳn nếu không dùng trong context marketing).

```
- Title task (truncate nếu dài)
- ID task (TSK-xxxxxxx)
- Badge ưu tiên (Trung bình / Cao / Thấp) — dropdown
- Button: Lưu trữ, icon mic, icon share, icon delete, ✕
```

---

## 4. Meta bar

Thay thế 2 hàng metadata hiện tại (Trạng thái + Người thực hiện + Nền tảng / Định dạng + Lịch đăng + Mục tiêu) bằng **1 hàng ngang duy nhất** gồm 5 ô:

```
border-bottom: 0.5px solid border-color
display: grid
grid-template-columns: repeat(5, 1fr)
```

| Cột | Field | Loại input |
|---|---|---|
| 1 | Trạng thái | Select: Idea / In progress / Done |
| 2 | Người thực hiện | Select / User picker |
| 3 | Nền tảng | Select: Facebook / TikTok / Instagram |
| 4 | Định dạng | Select: Reels / Story / Post |
| 5 | Lịch đăng | Date input |

Mỗi ô:
```css
padding: 8px 12px;
border-right: 0.5px solid var(--border-color);
```
Label trên (10px, uppercase, muted) — Value dưới (12px, font-weight 500).

---

## 5. Bảng nội dung (phần thay đổi lớn nhất)

### 5.1 Cấu trúc cột

```
table-layout: fixed
width: 100%
border-collapse: collapse
```

| Cột | Tên hiển thị | Width |
|---|---|---|
| STT | STT | 38px |
| Nội dung | Nội dung | 110px |
| Kịch bản | Kịch bản | ~34% |
| Source clip | Source clip | ~20% |
| Chú thích & minh họa | Chú thích & minh họa | ~26% |

### 5.2 Thead

```css
background: var(--background-secondary);
font-size: 10px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.05em;
color: var(--text-tertiary);
padding: 7px 12px;
border-bottom: 0.5px solid var(--border-color);
border-right: 0.5px solid var(--border-color);
```

### 5.3 Cột STT
```
text-align: center
font-size: 11px
color: var(--text-tertiary)
padding: 10px 0
```

### 5.4 Cột Nội dung (quan trọng — phải đủ rộng 110px)

Mỗi ô gồm 3 thành phần xếp dọc:
```
1. Badge màu (tên section)
2. Tên mô tả ngắn (vd: "Hook", "Pain point", "Case thực tế", "Follow")
3. Meta text nhỏ (vd: "Facebook · Reels")
```

Badge theo section:
```
Mở đầu  → background: #E1F5EE; color: #085041
Vấn đề  → background: #FCEBEB; color: #791F1F
Giải pháp → background: #E6F1FB; color: #0C447C
CTA     → background: #FAEEDA; color: #633806

border-radius: 4px
font-size: 10px
font-weight: 500
padding: 2px 8px
```

### 5.5 Cột Kịch bản

**Thay thế hoàn toàn** các textarea Hook chọn / Vấn đề / Giải pháp hiện tại.

```html
<textarea
  class="kb-ta"
  oninput="autoResize(this)"
  placeholder="Viết kịch bản..."
/>
```

```css
.kb-ta {
  width: 100%;
  border: none;
  background: none;
  resize: none;
  font-size: 12px;
  color: var(--text-primary);
  padding: 9px 12px;
  line-height: 1.7;
  min-height: 68px;
  overflow: hidden;
}
```

Auto-resize JS (bắt buộc):
```js
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
// Chạy lần đầu khi load để các textarea đã có nội dung cũng được giãn đúng
document.querySelectorAll('.kb-ta, .chu-ta').forEach(el => autoResize(el));
```

### 5.6 Cột Source clip

Hiển thị danh sách file clip đã gắn + nút thêm:

```html
<div class="src-cell">
  <!-- Lặp cho mỗi clip -->
  <div class="src-item">
    <span class="src-dot"></span>
    <span class="src-name">DJI_20260120152249_0117_D.MP4</span>
  </div>
  <!-- Nút thêm -->
  <div class="src-add">+ Thêm clip</div>
</div>
```

```css
.src-cell { padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; }

.src-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--text-secondary);
  padding: 4px 8px;
  border: 0.5px solid var(--border-color);
  border-radius: 5px;
  background: var(--background-secondary);
  cursor: pointer;
}
.src-item:hover { border-color: var(--border-color-hover); }

.src-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #E24B4A; /* đỏ — biểu thị file video */
  flex-shrink: 0;
}

.src-name {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}

.src-add {
  font-size: 11px; color: var(--text-tertiary);
  border: 0.5px dashed var(--border-color);
  border-radius: 5px; padding: 4px 8px;
  cursor: pointer; text-align: center;
}
.src-add:hover { color: var(--text-secondary); }
```

### 5.7 Cột Chú thích & minh họa (gộp 2 phần)

Cột này chia làm 2 vùng ngăn cách bởi một đường kẻ mỏng:

**Vùng trên — Chú thích (textarea tự giãn):**
```html
<textarea class="chu-ta" oninput="autoResize(this)" placeholder="Ghi chú dựng video..." />
```
```css
.chu-ta {
  width: 100%; border: none; background: none; resize: none;
  font-size: 11px; color: var(--text-secondary);
  padding: 9px 12px; line-height: 1.7; min-height: 68px; overflow: hidden;
}
```

**Đường kẻ ngăn cách:**
```html
<div style="height: 0.5px; background: var(--border-color); margin: 0 10px;"></div>
```

**Vùng dưới — Ảnh minh họa:**
```html
<div class="chu-thumb">
  <div class="thumb-label">Ảnh minh họa</div>
  <!-- Lặp cho mỗi ảnh đã thêm -->
  <div class="thumb-item">Tên ảnh / mô tả</div>
  <!-- Nút thêm -->
  <div class="thumb-add">+ Thêm ảnh</div>
</div>
```
```css
.chu-thumb { padding: 6px 10px; display: flex; flex-direction: column; gap: 4px; }
.thumb-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
.thumb-item { font-size: 11px; color: var(--text-secondary); padding: 3px 7px; border: 0.5px solid var(--border-color); border-radius: 4px; background: var(--background-secondary); }
.thumb-add { font-size: 11px; color: var(--text-tertiary); border: 0.5px dashed var(--border-color); border-radius: 4px; padding: 3px 7px; cursor: pointer; text-align: center; }
```

---

## 6. Data model — 4 section cố định

Thay vì lưu riêng `hook`, `van_de`, `giai_phap` — cấu trúc lại thành array:

```json
{
  "sections": [
    {
      "id": "mo_dau",
      "label": "Mở đầu",
      "badge_color": "teal",
      "description": "Hook",
      "kich_ban": "...",
      "source_clips": ["DJI_0117_D.MP4"],
      "anh_minh_hoa": ["Thiết kế cho người ở một mình"],
      "chu_thich": "Thumbnail: ..."
    },
    {
      "id": "van_de",
      "label": "Vấn đề",
      "badge_color": "red",
      "description": "Pain point",
      "kich_ban": "...",
      "source_clips": ["DJI_0118_D.MP4"],
      "anh_minh_hoa": [],
      "chu_thich": ""
    },
    {
      "id": "giai_phap",
      "label": "Giải pháp",
      "badge_color": "blue",
      "description": "Case thực tế",
      "kich_ban": "...",
      "source_clips": ["DJI_0090_D.MP4", "DJI_0119_D.MP4", "DJI_0120_D.MP4"],
      "anh_minh_hoa": ["Nội thất màu sắc trung tính", "Ảnh sáng tự nhiên"],
      "chu_thich": "Source 119 lấy giây 7–22..."
    },
    {
      "id": "cta",
      "label": "CTA",
      "badge_color": "amber",
      "description": "Follow",
      "kich_ban": "...",
      "source_clips": ["DJI_0126_D.MP4"],
      "anh_minh_hoa": [],
      "chu_thich": ""
    }
  ]
}
```

---

## 7. Checklist kỹ thuật cho dev

- [ ] Tăng `max-width` của popup modal lên `1020px`
- [ ] Xóa các field `hook_chon`, `van_de`, `giai_phap` dạng textarea đơn lẻ
- [ ] Xóa field "Dự án" dropdown ở header (hoặc giữ nếu cần cho context khác)
- [ ] Gộp 2 hàng metadata thành 1 hàng `meta-bar` 5 cột
- [ ] Thêm field "Định dạng" và "Nền tảng" vào meta bar (đã có, chỉ cần bố cục lại)
- [ ] Dựng component `<SectionTable>` render 4 hàng cố định
- [ ] Mỗi hàng: `STT | Nội dung | Kịch bản (textarea) | Source clip (list) | Chú thích + ảnh`
- [ ] Implement `autoResize()` cho tất cả textarea trong bảng
- [ ] API: cập nhật endpoint save task để nhận cấu trúc `sections[]` thay vì các field riêng lẻ
- [ ] Migration: map dữ liệu cũ (`hook` → `sections[0].kich_ban`, v.v.)
- [ ] Hover state trên mỗi `<tr>`: `background: var(--background-secondary)`

---

## 8. Các field giữ nguyên (không thay đổi)

- Header: title, ID, badge ưu tiên, các icon action
- Footer: nút Lưu trữ (trái), Hủy + Lưu lại (phải)
- Logic save/cancel/archive
- Người thực hiện (user picker)
- Lịch đăng (date picker)
