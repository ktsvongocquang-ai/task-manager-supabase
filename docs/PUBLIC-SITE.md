# Trang công khai chạy riêng (landing, portfolio, link khách xem tiến độ)

Cùng một repo, cùng database, **hai dự án Vercel**:

| | App nội bộ (dự án hiện tại) | Trang công khai (dự án mới) |
|---|---|---|
| Nội dung | Toàn bộ app, API, MCP, cron | `/` landing, `/p`, `/p/:token`, `/c/:token` (khách xem tiến độ), `/khai-toan/` |
| Biến môi trường | như hiện tại | `VITE_APP_MODE=public`, `PUBLIC_SITE=1`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (+ biến `KHAI_TOAN_*` nếu dùng PDF) |
| API | đầy đủ | chỉ `/api/khai-toan/*` (middleware chặn phần còn lại) |
| Service worker / PWA | có | không |

Lợi ích: app nội bộ deploy lỗi không làm sập trang khách đang xem; khách lạ không tải mã nguồn app nội bộ;
không có khoá admin nào trên dự án công khai.

## Tạo dự án thứ hai (làm 1 lần, khoảng 5 phút)

1. Vercel → **Add New → Project** → chọn repo `task-manager-supabase`.
2. Đặt tên, ví dụ `dqh-public`. Framework: Vite. Build command và Output giữ mặc định (`vite build`, `dist`).
3. Environment Variables (Production + Preview):
   - `VITE_APP_MODE` = `public`
   - `PUBLIC_SITE` = `1`
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` = như app nội bộ (**không** thêm `SUPABASE_SERVICE_ROLE_KEY`)
4. Deploy. Gắn tên miền khách nhìn thấy (ví dụ `dqharchitects.vn` hoặc `xem.dqharchitects.vn`).
5. Vào **Settings → Cron Jobs** của dự án công khai: tắt cron (các job trên dự án này đều bị middleware chặn, tắt cho sạch).

Sau khi trang công khai chạy ổn: đổi các link đang gửi khách (`/p`, `/c/...`) sang tên miền mới.
App nội bộ vẫn mở được các đường dẫn cũ nên link đã gửi không bị gãy.
