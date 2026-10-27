// Vercel Edge Middleware — chỉ can thiệp route /p và /p/:token (landing page
// công khai DQH Architects). App là SPA (Vite), crawler share-link (Facebook/
// Zalo/Telegram...) không chạy JS nên không đọc được meta do React render ra
// — phải trả sẵn HTML có đúng <title>/og:* ngay từ đây cho riêng các bot này.
// Người dùng thật (browser UA bình thường) vẫn đi tiếp vào SPA như cũ.

export const config = {
  matcher: ['/p', '/p/:token*'],
};

const BOT_UA_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Zalo|Pinterest|vkShare|Discordbot|SkypeUriPreview|redditbot|Googlebot|bingbot|Applebot/i;

const SITE_URL = 'https://dqh.vercel.app';
const OG_TITLE = 'DQH Architects – Thiết kế & thi công nội thất trọn gói TP.HCM';
const OG_DESC =
  'DQH Architects – Design & Build nội thất cao cấp tại TP.HCM: công trình tiêu biểu, chi phí tham khảo, quy trình và bảo hành rõ ràng. Đặt lịch tư vấn với kiến trúc sư.';
const OG_IMAGE = `${SITE_URL}/og-dqh.jpg`;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function renderBotHtml(pageUrl: string) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(OG_TITLE)}</title>
<meta name="description" content="${escapeHtml(OG_DESC)}">
<link rel="canonical" href="${escapeHtml(pageUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DQH Architects">
<meta property="og:url" content="${escapeHtml(pageUrl)}">
<meta property="og:title" content="${escapeHtml(OG_TITLE)}">
<meta property="og:description" content="${escapeHtml(OG_DESC)}">
<meta property="og:image" content="${escapeHtml(OG_IMAGE)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="vi_VN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(OG_TITLE)}">
<meta name="twitter:description" content="${escapeHtml(OG_DESC)}">
<meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}">
</head>
<body>
<h1>${escapeHtml(OG_TITLE)}</h1>
<p>${escapeHtml(OG_DESC)}</p>
</body>
</html>`;
}

export default function middleware(request: Request): Response | undefined {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_RE.test(ua)) return undefined; // người dùng thật — đi tiếp vào SPA như bình thường

  return new Response(renderBotHtml(request.url), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
