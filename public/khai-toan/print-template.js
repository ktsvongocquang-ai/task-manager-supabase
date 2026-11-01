/*
 * Mẫu in (print template) khái toán DQH: DÙNG CHUNG cho
 *   - máy chủ: API /api/khai-toan/pdf render HTML này bằng Chromium rồi page.pdf()
 *   - trình duyệt: nút "Xuất PDF" in chính HTML này trong iframe ẩn
 * nên bản khách tự in và bản máy chủ gửi đi giống nhau.
 *
 * Phụ thuộc: KhaiToanCalc (calc.js) phải được nạp trước.
 * Quy ước nội dung: KHÔNG dùng các chữ "báo giá", "cam kết", "ưu đãi", "giảm giá"
 * ở phần thân; không dùng dấu gạch ngang dài (em dash).
 */
(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module && module.exports) module.exports = api;
  root.KhaiToanPrint = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const CONTACT = {
    hotline: "0799 666 866",
    email: "dqh.architects@gmail.com",
    address: "105-107 Trần Văn Dư, Phường 13, Tân Bình, TP.HCM"
  };
  const DISCLAIMER = "Khái toán sơ bộ, chỉ mang tính tham khảo. Báo giá chính xác theo khảo sát và bản vẽ thực tế.";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // Ngày lập theo giờ Việt Nam (máy chủ Vercel chạy giờ UTC).
  function issuedText(date) {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
  }
  function startText(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y, m, d] = iso.split("-");
    return d + "/" + m + "/" + y;
  }

  /**
   * @param result  kết quả KhaiToanCalc.calculate(...)
   * @param opts    { clientName, phone, showSchedule=false, issuedAt=Date, fontCss?: string, fontBaseUrl?: string }
   *   - fontCss: CSS @font-face dựng sẵn (máy chủ nhúng base64)
   *   - fontBaseUrl: thư mục chứa BeVietnamPro-*.ttf (trình duyệt)
   */
  function renderHtml(result, opts) {
    const calc = root.KhaiToanCalc;
    opts = opts || {};
    const showSchedule = opts.showSchedule === true;
    const { money, compact, dateText, addWorkdays, LABELS, ITEM_NAMES, GROUPS } = calc;
    const fontCss = opts.fontCss || fontFaceCss(opts.fontBaseUrl || "./fonts/");

    // Bảng hạng mục theo nhóm
    let stt = 0;
    const byKey = {};
    result.items.forEach(x => { byKey[x.key] = x; });
    const groupRows = GROUPS.map(g => {
      const rows = g.items.filter(k => byKey[k]).map(k => byKey[k]);
      if (!rows.length) return "";
      const sub = rows.reduce((s, x) => s + x.amount, 0);
      return '<tbody class="grp"><tr class="grp-head"><td colspan="3">' + esc(g.name) + '</td><td class="num">' + esc(money(sub)) + '</td></tr>' +
        rows.map(x => '<tr><td class="stt">' + (++stt) + '</td><td class="name">' + esc(ITEM_NAMES[x.key]) + '</td><td class="detail">' +
          esc(calc.detailFor(x, result)) + '</td><td class="num">' + esc(money(x.amount)) + '</td></tr>').join("") + '</tbody>';
    }).join("");

    const perM2 = result.total / result.area;
    const s = result.schedule;
    const scheduleHtml = showSchedule ? (
      '<section class="block sched"><h2>Tiến độ dự kiến</h2>' +
      '<div class="kpis">' +
      kpi("Thi công thực tế", s.workDays + " ngày làm việc") +
      kpi("Tổng thời gian", s.calendarDays + " ngày lịch") +
      kpi("Khởi công", dateText(s.start)) +
      kpi("Bàn giao dự kiến", dateText(s.end)) +
      '</div><table class="tbl tasks"><thead><tr><th>Công việc</th><th>Thời gian</th><th class="num">Số ngày</th></tr></thead><tbody>' +
      s.tasks.map(t => {
        const b = addWorkdays(s.start, t.start), e = addWorkdays(b, t.duration - 1);
        // Dùng chữ "đến" thay mũi tên: Be Vietnam Pro không có glyph "→" (máy chủ không có font dự phòng).
        return '<tr class="' + t.phase + '"><td>' + esc(t.name) + '</td><td>' + esc(dateText(b) + " đến " + dateText(e)) + '</td><td class="num">' + t.duration + '</td></tr>';
      }).join("") +
      '</tbody></table><p class="note">Tiến độ tính theo ngày làm việc (thứ Hai đến thứ Sáu), sẽ được xác nhận sau khảo sát.</p></section>'
    ) : "";

    const client = opts.clientName ? '<div><span>Khách hàng</span><b>' + esc(opts.clientName) + '</b></div>' : "";
    const phone = opts.phone ? '<div><span>Điện thoại</span><b>' + esc(opts.phone) + '</b></div>' : "";

    const footer =
      '<div class="foot-inner"><p class="disc">' + esc(DISCLAIMER) + '</p>' +
      '<p class="contact"><b>DQH Architects</b> · Hotline ' + esc(CONTACT.hotline) + ' · ' + esc(CONTACT.email) + ' · ' + esc(CONTACT.address) + '</p></div>';

    return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Khái toán nội thất | DQH Architects</title><style>' +
      fontCss + CSS + '</style></head><body>' +
      // Chân trang cố định: lặp lại ở mọi trang khi in. Khoảng trống tfoot giữ chỗ để nội dung không đè lên.
      '<footer class="page-foot">' + footer + '</footer>' +
      '<table class="layout"><tfoot><tr><td><div class="foot-space"></div></td></tr></tfoot><tbody><tr><td>' +
      '<header class="head"><div class="brand"><span class="mark">DQH</span><div><b>DQH ARCHITECTS</b><small>Interior Design &amp; Build Studio</small></div></div>' +
      '<div class="meta"><div><span>Ngày lập</span><b>' + esc(issuedText(opts.issuedAt || new Date())) + '</b></div>' + client + phone + '</div></header>' +
      '<h1>KHÁI TOÁN NỘI THẤT</h1>' +
      '<section class="block cfg"><div class="grid">' +
      cfgCell("Diện tích thông thủy", result.area + " m²") +
      cfgCell("Phòng ngủ", result.beds + " phòng") +
      cfgCell("Phòng vệ sinh", result.baths + " WC") +
      cfgCell("Phân khúc vật tư", LABELS[result.tier]) +
      cfgCell("Phong cách thiết kế", LABELS[result.style]) +
      cfgCell("Ngày khởi công dự kiến", startText(result.startDate)) +
      '</div></section>' +
      '<section class="summary"><div><span>Tổng khái toán</span><strong>' + esc(money(result.total)) + '</strong><small>' + esc(compact(result.total)) + '</small></div>' +
      '<div><span>Đơn giá bình quân</span><strong class="sm">' + esc(money(perM2)) + '/m²</strong><small>≈ ' + esc(compact(perM2)) + '/m²</small></div>' +
      '<div><span>Số hạng mục</span><strong class="sm">' + result.items.length + '</strong></div></section>' +
      '<section class="block"><h2>Chi tiết hạng mục</h2><table class="tbl items"><thead><tr><th class="stt">#</th><th>Hạng mục</th><th>Diễn giải</th><th class="num">Thành tiền</th></tr></thead>' +
      groupRows +
      '<tbody class="totals"><tr class="total"><td colspan="3">Tổng cộng</td><td class="num">' + esc(money(result.total)) + '</td></tr>' +
      '<tr class="avg"><td colspan="3">Đơn giá bình quân trên m² (' + result.area + ' m²)</td><td class="num">' + esc(money(perM2)) + '</td></tr></tbody></table></section>' +
      scheduleHtml +
      '</td></tr></tbody></table></body></html>';

    function kpi(label, val) { return '<div><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div>'; }
    function cfgCell(label, val) { return '<div><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div>'; }
  }

  // @font-face Be Vietnam Pro theo URL (dùng cho trình duyệt)
  function fontFaceCss(base) {
    const w = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
    return Object.keys(w).map(n => "@font-face{font-family:'Be Vietnam Pro';font-style:normal;font-weight:" + w[n] +
      ";src:url('" + base + "BeVietnamPro-" + n + ".ttf') format('truetype');font-display:block}").join("");
  }

  const CSS = `
@page{size:A4;margin:12mm 13mm 10mm}
@page{@bottom-right{content:"Trang " counter(page) "/" counter(pages);font:7.5pt 'Be Vietnam Pro',sans-serif;color:#8A8070}}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Be Vietnam Pro',sans-serif;color:#2C2920;font-size:9pt;line-height:1.38;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
table.layout{width:100%;border-collapse:collapse}
table.layout>tbody>tr>td,table.layout>tfoot>tr>td{padding:0}
.foot-space{height:17mm}
.page-foot{position:fixed;left:0;right:0;bottom:0;height:15mm}
.foot-inner{border-top:1px solid #B8913A;padding-top:2.2mm;font-size:7.6pt;color:#5C554A}
.foot-inner p{margin:0 0 1mm}
.foot-inner .disc{font-weight:600;color:#2C2920}
.head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:3mm;border-bottom:2px solid #1A1814}
.brand{display:flex;align-items:center;gap:3mm}
.brand .mark{display:inline-flex;align-items:center;justify-content:center;width:15mm;height:15mm;background:#1A1814;color:#B8913A;font-weight:700;font-size:12pt;letter-spacing:.06em}
.brand b{display:block;font-size:11pt;letter-spacing:.12em}
.brand small{display:block;color:#8A8070;font-size:7.6pt;letter-spacing:.08em;text-transform:uppercase}
.meta{text-align:right;font-size:8.4pt}
.meta div{margin-bottom:.6mm}
.meta span{color:#8A8070;margin-right:2mm}
h1{font-size:16pt;letter-spacing:.1em;margin:4mm 0 3mm;font-weight:700;color:#1A1814}
h2{font-size:9.6pt;letter-spacing:.12em;text-transform:uppercase;margin:0 0 2.2mm;color:#1A1814;font-weight:700}
.block{margin-bottom:4mm}
.cfg .grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #E4DED3;border-radius:1.5mm;overflow:hidden}
.cfg .grid div{padding:1.7mm 3mm;border-right:1px solid #E4DED3;border-bottom:1px solid #E4DED3}
.cfg .grid div:nth-child(3n){border-right:0}
.cfg .grid div:nth-last-child(-n+3){border-bottom:0}
.cfg span,.summary span,.kpis span{display:block;font-size:7.2pt;letter-spacing:.1em;text-transform:uppercase;color:#8A8070;font-weight:600}
.cfg b{font-size:9.6pt;font-weight:600}
.summary{display:grid;grid-template-columns:1.5fr 1.2fr .7fr;gap:0;background:#1A1814;color:#F5F2EC;border-radius:1.5mm;margin-bottom:4mm}
.summary div{padding:2.8mm 4mm}
.summary div+div{border-left:1px solid rgba(255,255,255,.12)}
.summary strong{display:block;font-size:16pt;color:#D4BC95;font-weight:700;line-height:1.2;margin-top:.6mm}
.summary strong.sm{font-size:11.5pt;color:#F5F2EC}
.summary small{color:#C4C0B8;font-size:7.6pt}
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-size:7.2pt;letter-spacing:.1em;text-transform:uppercase;color:#8A8070;font-weight:600;text-align:left;padding:1.3mm 2mm;border-bottom:1px solid #2C2920}
.tbl td{padding:1.15mm 2mm;border-bottom:1px solid #EEE9E0;vertical-align:top}
.tbl .num{text-align:right;white-space:nowrap}
.tbl .stt{width:7mm;color:#8A8070}
.tbl .name{font-weight:600;width:52mm}
.tbl .detail{color:#5C554A}
.grp{break-inside:avoid}
.grp-head td{background:#F5F2EC;font-weight:700;font-size:8.2pt;letter-spacing:.06em;text-transform:uppercase;color:#1A1814;border-bottom:1px solid #E4DED3}
.totals{break-inside:avoid}
.totals .total td{border-top:2px solid #1A1814;border-bottom:0;font-weight:700;font-size:11pt;padding-top:2.4mm}
.totals .total .num{color:#9A7428}
.totals .avg td{color:#5C554A;border-bottom:0}
.sched{break-inside:avoid}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #E4DED3;border-radius:1.5mm;margin-bottom:2.5mm}
.kpis div{padding:2mm 3mm}
.kpis div+div{border-left:1px solid #E4DED3}
.kpis b{font-size:9.6pt}
.tasks td{padding:1.1mm 2mm;font-size:8.4pt}
.tasks tr.rough td:first-child{border-left:2.5px solid #D4BC95}
.tasks tr.finish td:first-child{border-left:2.5px solid #B8913A}
.note{font-size:7.8pt;color:#8A8070;margin:1.6mm 0 0}
@media screen{body{max-width:210mm;margin:0 auto;padding:12mm 13mm;display:flex;flex-direction:column}.page-foot{position:static;height:auto;margin-top:6mm;order:2}.foot-space{display:none}}
`;

  return { renderHtml, fontFaceCss, CONTACT, DISCLAIMER };
});
