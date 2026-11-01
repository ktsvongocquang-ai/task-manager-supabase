# Xuất PDF khái toán phía máy chủ

API `POST /api/khai-toan/pdf` nhận cấu hình khái toán (JSON) và trả về **file PDF A4 (application/pdf)**, có logo/chữ DQH, font Be Vietnam Pro nhúng sẵn, số liệu tính bằng **đúng module dùng chung với giao diện** `/khai-toan/`.

## Cấu trúc

| File | Vai trò |
|---|---|
| `public/khai-toan/calc.js` | Công thức + đơn giá (chép nguyên văn từ app.js cũ), kiểm tra đầu vào, mã hoá `?cfg=`. Chạy cả trình duyệt lẫn Node. |
| `public/khai-toan/print-template.js` | Mẫu in HTML dùng chung: máy chủ render ra PDF, nút "Xuất PDF" trên web in đúng mẫu này. |
| `public/khai-toan/fonts/` | Be Vietnam Pro (Regular/Medium/SemiBold/Bold, giấy phép OFL). |
| `lib/khai-toan/pdf.js` | Mở Chromium headless, `page.setContent()` rồi `page.pdf()`. |
| `api/khai-toan/pdf.js` | Endpoint Vercel: khoá API, giới hạn tần suất, kiểm tra đầu vào, trả PDF. |
| `tests/khai-toan/*` | Kiểm thử số liệu, so khớp với app.js gốc trên Chromium thật, kiểm thử API, kiểm tra nội dung PDF. |

## Vì sao chọn puppeteer-core + @sparticuz/chromium

Ưu tiên theo yêu cầu: một mẫu HTML in dùng chung cho cả máy chủ lẫn trình duyệt, nên bản khách tự in và bản gửi qua Zalo giống nhau, và chữ tiếng Việt dựng bằng Chromium nên dấu luôn đúng. Gói `@sparticuz/chromium` nén khoảng 60 MB, vẫn dưới giới hạn 250 MB của hàm Vercel. Đo ở máy local: lần đầu khoảng 1,2-1,8 giây (gồm khởi động Chromium), các lần sau khoảng 0,6 giây. Trên Vercel lần chạy "lạnh" phải giải nén Chromium nên chậm hơn (thường vài giây), vẫn dưới mức 10 giây yêu cầu. `maxDuration` để 30 giây cho chắc chắn.

## Biến môi trường (Vercel → Settings → Environment Variables)

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `KHAI_TOAN_API_KEY` | **Có** | Khoá bí mật, gửi qua header `Authorization: Bearer <khoá>`. Chưa đặt thì API trả 503. |
| `KHAI_TOAN_RATE_LIMIT` | Không | Số yêu cầu tối đa / phút / IP (mặc định 20). |
| `KHAI_TOAN_PUBLIC_BASE_URL` | Không | Gốc link `?cfg=` trả về trong header (mặc định `https://dqh.vercel.app`). |

Tạo khoá ngẫu nhiên: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

> Node.js của project Vercel cần **22.x trở lên** (yêu cầu của `@sparticuz/chromium` 153).

## Đầu vào

```json
{
  "clientName": "Chị Hoa",            // tuỳ chọn, tối đa 100 ký tự
  "phone": "0909 123 456",            // tuỳ chọn
  "area": 70,                         // bắt buộc, 35-350
  "beds": 2,                          // bắt buộc, 1-4
  "baths": 2,                         // bắt buộc, 1-3
  "tier": "standard",                 // standard | luxury  (nhận cả "Tiêu chuẩn" | "Cao cấp")
  "style": "modern",                  // modern | modern_luxury  (nhận cả "Hiện đại" | "Modern Luxury")
  "startDate": "2026-11-09",          // tuỳ chọn, mặc định hôm nay + 7 ngày
  "showSchedule": false,              // tuỳ chọn, mặc định false (ẩn tiến độ)
  "scope": {                          // tuỳ chọn; thiếu khoá nào thì dùng mặc định như giao diện
    "demolition": true, "demoLevel": 100,          // 20 | 50 | 100
    "wcRenovation": true, "ceiling": true, "painting": true,
    "staircase": "none",                            // none | basic | luxury
    "flooring": "standard", "floorMaterial": "wood",// none|standard|luxury ; wood|tile
    "lighting": "luxury",                           // none | standard | luxury
    "electrical": "full_mod",                       // none | light_mod | full_mod
    "smarthome": "none",                            // none | standard | luxury
    "wood": "melamine_standard",                    // none | melamine_economy | melamine_standard | laminate
    "loose": "standard",                            // none | standard | luxury
    "stone": "standard_stone",                      // none | standard_stone | luxury_stone
    "appliances": "basic", "wcEquipment": "none",   // none | basic | luxury
    "curtain": "normal",                            // none | normal | electric
    "ac": "none",                                   // none | wall | ducted
    "speaker": "none",                              // none | basic | luxury
    "freshAir": false, "epoxyGrout": false
  }
}
```

(Chú thích `//` chỉ để giải thích, JSON gửi đi không được có.) Trường lạ hoặc giá trị sai → **400** kèm danh sách lỗi tiếng Việt trong `details`.

## Đầu ra

- `200 application/pdf` (tải về dạng file). Header phụ (không chứa dữ liệu cá nhân):
  `X-Khai-Toan-Total` (tổng, đồng), `X-Khai-Toan-Work-Days`, `X-Khai-Toan-Link` (link mở sẵn cấu hình, dùng cho Messenger).
- `400` sai dữ liệu, `401` thiếu hoặc sai khoá, `405` sai phương thức, `429` quá tần suất, `503` chưa cấu hình khoá, `500` lỗi tạo PDF.
- PDF **không được lưu** ở máy chủ (trả thẳng trong response), log chỉ ghi diện tích, dung lượng, thời gian; không ghi tên hay số điện thoại.

## Link công khai (GET, không cần khoá): dành cho trợ lý chat

```
https://dqh.vercel.app/api/khai-toan/pdf?area=60&beds=2&baths=2&tier=standard&style=modern
https://dqh.vercel.app/api/khai-toan/khai-toan-60m2.pdf?area=60&beds=2&baths=2&tier=standard&style=modern   (cùng kết quả, có đuôi .pdf)
```

- Bắt buộc: `area` (35-350), `beds` (1-4), `baths` (1-3), `tier` (standard | luxury), `style` (modern | modern_luxury).
- Tuỳ chọn: `name` (tối đa 40 ký tự), `ac` (none|wall|ducted), `smarthome` (none|standard|luxury), `speaker` (none|basic|luxury), `freshAir` (true|false). Phạm vi khác dùng mặc định.
- Trả `application/pdf`, `Content-Disposition: inline; filename="khai-toan-<area>m2.pdf"`: bấm là mở ngay trên điện thoại. Hỗ trợ cả HEAD (cho trình xem trước link).
- Luôn ẩn tiến độ. Tham số lạ hoặc sai trả 400 kèm `details`. Riêng các tham số theo dõi (`fbclid`, `utm_*`, `zarsrc`...) mà Zalo hay Messenger tự gắn thêm thì được bỏ qua.
- Chống lạm dụng: giới hạn `KHAI_TOAN_PUBLIC_RATE_LIMIT` lần/phút/IP (mặc định 10), vượt thì trả 429. Bản PDF được cache theo cấu hình: CDN Vercel cache theo URL (`s-maxage` đến 0 giờ, giờ VN), mỗi instance còn cache thêm 1 giờ theo cấu hình đã chuẩn hoá. Vì vậy cùng cấu hình thì không render lại.
- Lưu ý: tên khách (`name`) nằm trên URL và trong bản cache CDN đến hết ngày. Không đưa số điện thoại vào link.

## Ví dụ curl

```bash
curl -X POST https://dqh.vercel.app/api/khai-toan/pdf \
  -H "Authorization: Bearer $KHAI_TOAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Chị Hoa","area":70,"beds":2,"baths":2,"tier":"standard","style":"modern"}' \
  -o khai-toan.pdf
```

### Quy trình cho trợ lý Thi Xinh (Zalo)

```bash
OUTBOX=/data/state/connector-home/zalo-dqh-admin-3e1331/.zalo-agent-cli/outbox
FILE="$OUTBOX/khai-toan-$(date +%s).pdf"
curl -sf -X POST https://dqh.vercel.app/api/khai-toan/pdf \
  -H "Authorization: Bearer $KHAI_TOAN_API_KEY" -H "Content-Type: application/json" \
  -d @cau-hinh.json -o "$FILE"
```

Sau đó gọi MCP `zalo_send_file` với `{ threadId, threadType: 0, paths: ["<FILE>"], caption: "Khái toán sơ bộ theo cấu hình anh/chị chọn" }`. Nên xoá file trong outbox sau khi gửi (không giữ quá 24 giờ, ví dụ cron `find "$OUTBOX" -name 'khai-toan-*.pdf' -mmin +1440 -delete`).

**Messenger** (chưa gửi được file): gửi link trong header `X-Khai-Toan-Link`, dạng
`https://dqh.vercel.app/khai-toan/index.html?cfg=<base64url JSON>`. Trang Khái toán mở sẵn đúng cấu hình; link không chứa tên hay số điện thoại.

## Chạy ở máy local và kiểm thử

```bash
npm install
KHAI_TOAN_API_KEY=test-key npm run khai-toan:dev     # http://localhost:3210/api/khai-toan/pdf
npm run test:khai-toan                               # số liệu, kiểm tra đầu vào (không cần trình duyệt)
npm run test:khai-toan:browser                       # API + so khớp app.js gốc trên Chromium thật
node tests/khai-toan/pdf-inspect.mjs file.pdf --expect-total=725.400.000 --no-schedule --png-dir=out
```

Ở máy local, API dùng Chrome của gói `puppeteer` (devDependency) hoặc biến `CHROME_PATH`. Trên Vercel tự chuyển sang `@sparticuz/chromium`.

## Lưu ý khi sửa

- Đổi đơn giá hoặc công thức: chỉ sửa `calc.js`, rồi cập nhật số kỳ vọng trong `tests/khai-toan/cases.mjs`. `tests/khai-toan/fixtures/app.original.js` là bản app.js trước khi tách module, dùng làm chuẩn so khớp.
- Mẫu in không được chứa "báo giá", "cam kết", "ưu đãi", "giảm giá" ở phần thân, không dùng em dash. Font Be Vietnam Pro không có glyph "→", máy chủ không có font dự phòng nên chỉ dùng ký tự có trong font.
- Giới hạn tần suất lưu trong bộ nhớ của từng instance, chỉ ở mức cơ bản. Cần chặt hơn thì dùng Vercel Firewall hoặc Upstash.
