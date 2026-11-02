# Trợ lý AI cho DQH — API + MCP

Một lớp API mỏng để trợ lý AI (Claude, ChatGPT, bot Zalo/Telegram) **báo cáo, giao việc, ghi chép**
trên dữ liệu thật của app, không đụng tới UI và bảng cũ.

```
Trợ lý AI ──MCP──► /api/mcp ──► lib/core/* ──► view v_projects / v_tasks / v_logs ──► bảng gốc
Script/Zalo ─REST─► /api/v1/*  ─┘
```

- Đọc qua **view hợp nhất** (gom `tasks`, `construction_tasks`, `marketing_tasks`, `personal_tasks`…).
- Ghi vào **đúng bảng gốc**, đúng từ vựng trạng thái UI đang dùng → việc AI giao hiện ngay trong app.
- Trạng thái chuẩn hoá còn 4 giá trị: `todo` / `doing` / `done` / `cancelled`.

## 1. Cài đặt (làm 1 lần)

1. **Supabase → SQL Editor**: chạy `supabase/migrations/20261102_ai_api_mcp.sql`
   (chỉ thêm view, 3 bảng mới `ai_notes`, `ai_api_keys`, `ai_audit_log`, và vài cột thiếu ở `daily_logs`; không xoá gì).
2. **Supabase → Settings → API**: tạo service role key mới, vô hiệu key cũ (key cũ có thể đã lộ ra frontend).
3. **Vercel → Settings → Environment Variables**:
   - XOÁ `VITE_SUPABASE_SERVICE_ROLE_KEY` (biến có tiền tố `VITE_` bị nhúng vào JS công khai).
   - THÊM `SUPABASE_SERVICE_ROLE_KEY` = key mới (không chọn "expose to browser").
   - (tuỳ chọn) `SUPABASE_URL`; nếu không có sẽ dùng `VITE_SUPABASE_URL`.
4. Deploy, rồi kiểm tra: `https://dqh.vercel.app/api/v1/health` → `{"ok":true,...}`.

## 2. Tạo khoá cho trợ lý

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/create-ai-key.mjs --name "Claude của Quang" --scopes read,write --as "Võ Ngọc Quang"
```

- Khoá dạng `dqh_...`, **chỉ hiện 1 lần**. Database chỉ lưu bản băm.
- `--scopes read` cho trợ lý chỉ xem báo cáo; thêm `write` để giao việc / ghi chép.
- `--as`: tên người đứng tên các thao tác (người giao việc, tác giả nhật ký).
- Thu hồi: `node scripts/create-ai-key.mjs --revoke dqh_xxxxxxxx`
- Mọi lệnh ghi được lưu ở bảng `ai_audit_log`.

## 3. Kết nối vào Claude

**Claude Code:**
```bash
claude mcp add --transport http dqh https://dqh.vercel.app/api/mcp --header "Authorization: Bearer dqh_..."
```

**claude.ai / Claude Desktop (connector tuỳ chỉnh):** ô "Request headers" (nhập `Bearer dqh_...`) hiện chỉ mở cho một số tổ chức và là khoá dùng chung cho cả tổ chức. Nếu không thấy ô này, dùng Claude Code, hoặc tạm dùng `mcp-remote` như dưới. Muốn mỗi người đăng nhập riêng trên claude.ai / ChatGPT thì cần thêm lớp OAuth (việc tiếp theo).

**Claude Desktop qua `mcp-remote`** (cầu nối tạm, `claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "dqh": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://dqh.vercel.app/api/mcp", "--header", "Authorization: Bearer dqh_..."]
    }
  }
}
```

Máy chủ MCP này chạy kiểu Streamable HTTP không trạng thái (POST, trả JSON). Xác thực bằng header `Authorization`;
nếu một ứng dụng chỉ hỗ trợ đăng nhập OAuth thì chưa kết nối trực tiếp được.

## 4. 10 tool

| Nhóm | Tool | Ví dụ câu nói |
|---|---|---|
| Xem | `list_projects` | "Đang có những công trình nào?" |
| | `get_project_status` | "Nhà Thảo Điền tới đâu rồi?" |
| | `list_tasks` | "Minh đang có việc gì?", "Việc trễ của Q7" |
| Giao việc | `create_task` | "Giao anh Thắng kiểm tra điện nhà Thảo Điền trước thứ 6" |
| | `update_task` | "Việc đi ống điện tầng 2 xong rồi" |
| Ghi chép | `add_log` | "Nhật ký Q7: đội anh Cường 3 người, bắn vách bếp 70%, thiếu cây U nhôm, mai gắn giường master" |
| | `search_logs` | "Tuần trước Q7 có vấn đề gì?" |
| Báo cáo | `report_daily` | "Báo cáo hôm nay" — kèm danh sách công trình **chưa nộp nhật ký** |
| | `report_weekly` | "Báo cáo tuần này" |
| | `report_overdue` | "Ai đang trễ việc?" |

`create_task` / `update_task` luôn **xem trước** (`confirm=false`), AI đọc lại cho người dùng, chỉ ghi khi được đồng ý.

Nhật ký công trình (`add_log`, `kind=nhat_ky`, dự án thi công) đi thẳng vào Nhật ký công trường của app với các
trường: khu vực, đội, số công, hạng mục, % hoàn thành, vướng mắc + phân loại, cần hỗ trợ từ, kế hoạch mai.

## 5. REST (cho script, bot Zalo/Telegram, cron)

Header: `Authorization: Bearer dqh_...`

| | |
|---|---|
| `GET /api/v1/projects?q=&source=` | danh sách dự án |
| `GET /api/v1/projects/:source/:id/status` | tình trạng 1 dự án |
| `GET /api/v1/tasks?assignee=&project=&status=open&overdue=true` | lọc việc |
| `POST /api/v1/tasks` | giao việc |
| `PATCH /api/v1/tasks/:source/:id` | cập nhật việc |
| `POST /api/v1/logs` | ghi chép / nhật ký |
| `GET /api/v1/logs/search?q=` | tìm ghi chép |
| `GET /api/v1/reports/daily` · `weekly` · `overdue` | báo cáo (có trường `text` đọc được ngay) |

## 6. Lịch tự động (Vercel Cron, giờ UTC)

| Job | Lịch trong vercel.json | Giờ VN | Việc |
|---|---|---|---|
| diary-reminder | `30 9 * * 1-6` | 16:30 T2–T7 | Nhắn riêng giám sát + nhóm: công trình chưa nộp nhật ký |
| daily-report | `30 10 * * 1-6` | 17:30 T2–T7 | Báo cáo ngày vào nhóm |
| weekly-report | `45 10 * * 6` | 17:45 T7 | Báo cáo tuần vào nhóm |

Cần biến môi trường: `CRON_SECRET` (≥16 ký tự), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GROUP_CHAT_ID` (số âm, lấy bằng `getUpdates` sau khi thêm bot vào nhóm).
Gói Hobby: cron có thể chạy lệch trong vòng 1 giờ; gói Pro chạy đúng phút. Mỗi job chỉ gửi 1 lần/ngày (bảng `ai_cron_runs`), chạy tay lại thì thêm `&force=1`.

## 7. Kiểm thử

```bash
node --test tests/core/core.test.mjs
```
Chạy trên Supabase giả trong bộ nhớ: tìm người có/không dấu, ghi đúng bảng, xem trước không ghi,
khoá chỉ đọc bị chặn ghi, khoá thu hồi bị chặn, định tuyến qua rewrite của Vercel.

## Giới hạn hiện tại

- Lệnh ghi qua MCP nhận `request_id`: AI gọi lại cùng mã (mạng chập chờn) sẽ không ghi trùng.

- Khoá API đọc được dữ liệu của mọi dự án (không theo RLS từng người) — chỉ cấp cho trợ lý của quản lý.
- Gói Vercel Hobby tối đa 12 function: thư mục `api/` đang dùng đúng 12 (`send-telegram` đã gộp vào `api/v1.js`).
