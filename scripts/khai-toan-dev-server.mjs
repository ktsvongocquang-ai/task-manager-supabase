// Máy chủ chạy thử API PDF khái toán ở máy local (mô phỏng hàm Vercel).
// Chạy:  KHAI_TOAN_API_KEY=xxx node scripts/khai-toan-dev-server.mjs   (cổng mặc định 3210)
import http from 'node:http';
import handler from '../api/khai-toan/pdf.js';

const port = Number(process.env.PORT || 3210);
http.createServer((req, res) => {
  if (req.url.split('?')[0] === '/api/khai-toan/pdf') return handler(req, res);
  res.statusCode = 404; res.end('Not found');
}).listen(port, () => console.log(`Khai toan PDF API: http://localhost:${port}/api/khai-toan/pdf`));
