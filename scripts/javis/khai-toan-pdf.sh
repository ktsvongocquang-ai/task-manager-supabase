#!/usr/bin/env bash
# Tạo PDF khái toán DQH và lưu vào outbox Zalo connector. In ra đường dẫn file (1 dòng) khi thành công.
#
# Cách dùng:
#   khai-toan-pdf.sh '<JSON cấu hình>'            # hoặc
#   echo '<JSON>' | khai-toan-pdf.sh
# Ví dụ:
#   khai-toan-pdf.sh '{"clientName":"Chị Hoa","area":70,"beds":2,"baths":2,"tier":"standard","style":"modern"}'
#
# Biến môi trường:
#   KHAI_TOAN_API_KEY   (bắt buộc)
#   KHAI_TOAN_API_URL   (mặc định https://dqh.vercel.app/api/khai-toan/pdf)
#   ZALO_OUTBOX         (mặc định outbox của zalo-dqh-admin-3e1331)
#
# Mã thoát: 0 = OK (stdout: đường dẫn PDF; stderr dòng "LINK: ..." để gửi Messenger)
#           2 = dữ liệu sai (stderr: JSON lỗi, đọc "details"), 3 = sai khoá, 4 = lỗi khác
set -u
API_URL="${KHAI_TOAN_API_URL:-https://dqh.vercel.app/api/khai-toan/pdf}"
OUTBOX="${ZALO_OUTBOX:-/data/state/connector-home/zalo-dqh-admin-3e1331/.zalo-agent-cli/outbox}"
: "${KHAI_TOAN_API_KEY:?Thiếu biến KHAI_TOAN_API_KEY}"

BODY="${1:-$(cat)}"
mkdir -p "$OUTBOX"
# Dọn PDF khái toán cũ hơn 24 giờ (không giữ dữ liệu khách quá hạn)
find "$OUTBOX" -maxdepth 1 -name 'khai-toan-*.pdf' -mmin +1440 -delete 2>/dev/null || true

FILE="$OUTBOX/khai-toan-$(date +%Y%m%d-%H%M%S)-$RANDOM.pdf"
HDR="$(mktemp)"
CODE=$(curl -sS -X POST "$API_URL" \
  -H "Authorization: Bearer $KHAI_TOAN_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY" -D "$HDR" -o "$FILE" -w '%{http_code}' --max-time 45)

LINK=$(grep -i '^x-khai-toan-link:' "$HDR" | cut -d' ' -f2- | tr -d '\r')
rm -f "$HDR"

if [ "$CODE" = "200" ]; then
  echo "$FILE"
  [ -n "$LINK" ] && echo "LINK: $LINK" >&2
  exit 0
fi
cat "$FILE" >&2; echo >&2; rm -f "$FILE"
case "$CODE" in
  400) exit 2 ;;
  401) exit 3 ;;
  *) echo "HTTP $CODE" >&2; exit 4 ;;
esac
