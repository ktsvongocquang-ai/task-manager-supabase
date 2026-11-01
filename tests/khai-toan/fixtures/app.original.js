(() => {
  "use strict";
  document.title = "Khái Toán Nội Thất | DQH Architects";

  // Chế độ nhúng trong workspace Landing Page DQH — đọc trước khi dựng UI.
  const isEmbedded = new URLSearchParams(location.search).get("embed") === "1";

  document.body.innerHTML = `<header class="topbar"><a class="brand" href="#" aria-label="DQH Architects — Khái Toán Nội Thất"><span class="brand-mark">DQH</span><span><strong>KHÁI TOÁN</strong><small>NỘI THẤT &amp; TIẾN ĐỘ</small></span></a><div class="header-actions"><span class="status-pill"><span class="status-dot"></span>Tự động cập nhật</span><button class="button ghost" id="themeToggle" type="button">◑ <span>Giao diện</span></button><button class="button primary" id="printBtn" type="button">↓ <span>Xuất PDF</span></button></div></header>
<main class="page">
<section class="intro"><div><span class="eyebrow">CÔNG CỤ DỰ TOÁN SƠ BỘ</span><h1>Từ nhu cầu đến ngân sách<br><em>trong vài phút.</em></h1></div><p>Điều chỉnh quy mô, vật liệu và phạm vi thi công. Bảng chi phí cùng kế hoạch gói đầu sẽ được tính lại tức thời.</p></section>
<div class="workspace">
<form class="config-panel" id="estimateForm">
<section class="panel project-panel">
<div class="panel-heading"><div><span class="step">01</span><h2>Thông tin công trình</h2></div><button type="button" class="text-button" id="resetBtn">Làm mới</button></div>
<div class="field-grid">
<label class="field wide"><span>Tên dự án / Chủ đầu tư</span><input id="clientName" name="clientName" value="CĂN HỘ LANDMARK" autocomplete="off"></label>
<label class="field area-field"><span>Diện tích thông thủy</span><div class="input-suffix"><input id="area" name="area" type="number" min="35" max="350" value="100"><b>m²</b></div></label>
<label class="field"><span>Phòng ngủ</span><select id="bedCount" name="bedCount"><option value="1">1 phòng</option><option value="2">2 phòng</option><option value="3" selected>3 phòng</option><option value="4">4 phòng</option></select></label>
<label class="field"><span>Phòng vệ sinh</span><select id="bathCount" name="bathCount"><option value="1">1 WC</option><option value="2" selected>2 WC</option><option value="3">3 WC</option></select></label>
<label class="field"><span>Ngày dự kiến khởi công</span><input id="startDate" name="startDate" type="date" value="2026-04-11"></label>
</div>
<div class="segmented-block"><span class="field-label">Phân khúc vật tư</span><div class="segmented"><label><input type="radio" name="tier" value="standard" checked><span>Tiêu chuẩn<small>Cân bằng chi phí</small></span></label><label><input type="radio" name="tier" value="luxury"><span>Cao cấp<small>Vật liệu chọn lọc</small></span></label></div></div>
<div class="segmented-block"><span class="field-label">Phong cách thiết kế</span><div class="segmented"><label><input type="radio" name="style" value="modern" checked><span>Hiện đại<small>Tối ưu công năng</small></span></label><label><input type="radio" name="style" value="modern_luxury"><span>Modern Luxury<small>Chi tiết cao cấp</small></span></label></div></div>
</section>
<section class="panel option-panel">
<div class="panel-heading"><div><span class="step">02</span><h2>Phạm vi thi công</h2></div><span class="subtle">Chọn các hạng mục cần làm</span></div>
<div class="option-section"><h3><span>01</span>Cải tạo thô &amp; trần tường</h3>
<label class="check-card accent"><input type="checkbox" id="demolition" checked><span class="check-ui"></span><span><strong>Phá dỡ &amp; xây mới</strong><small>Tháo dỡ, xây trát, vận chuyển phế thải</small></span><b>Theo m²</b></label>
<div class="mini-segment"><span>Mức độ cải tạo</span><label><input type="radio" name="demoLevel" value="20"><i>20%</i></label><label><input type="radio" name="demoLevel" value="50"><i>50%</i></label><label><input type="radio" name="demoLevel" value="100" checked><i>100%</i></label></div>
<div class="check-row"><label class="check-card"><input type="checkbox" id="wcRenovation" checked><span class="check-ui"></span><span><strong>Cải tạo WC</strong><small>Chống thấm, ốp lát, cấp thoát nước</small></span></label><label class="check-card"><input type="checkbox" id="ceiling" checked><span class="check-ui"></span><span><strong>Trần thạch cao mới</strong><small>Khung chống ẩm, khe rèm âm</small></span></label><label class="check-card"><input type="checkbox" id="painting" checked><span class="check-ui"></span><span><strong>Sơn bả tường trần</strong><small>Bả phẳng, lót kháng kiềm, sơn phủ</small></span></label><label class="field"><span>Cầu thang</span><select name="staircase"><option value="none">Không cải tạo</option><option value="basic">Gói tiêu chuẩn</option><option value="luxury">Gói cao cấp</option></select></label></div>
</div>
<div class="option-section"><h3><span>02</span>Hoàn thiện sàn</h3><div class="option-grid three"><label class="choice-card"><input type="radio" name="flooring" value="none"><span><strong>Giữ hiện trạng</strong><small>Không cải tạo sàn</small></span></label><label class="choice-card"><input type="radio" name="flooring" value="standard" checked><span><strong>Tầm trung</strong><small>Gỗ 12 mm / gạch chuẩn</small></span></label><label class="choice-card"><input type="radio" name="flooring" value="luxury"><span><strong>Cao cấp</strong><small>Gỗ xương cá / porcelain</small></span></label></div>
<label class="field-label top-gap">Chất liệu sàn</label><div class="option-grid two compact"><label class="choice-card"><input type="radio" name="floorMaterial" value="wood" checked><span><strong>Sàn gỗ</strong><small>Gỗ công nghiệp / xương cá</small></span></label><label class="choice-card"><input type="radio" name="floorMaterial" value="tile"><span><strong>Sàn gạch</strong><small>Gạch chuẩn / porcelain</small></span></label></div></div>
<div class="option-section"><h3><span>03</span>MEP &amp; chiếu sáng</h3>
<label class="field-label">Hệ thống đèn</label><div class="option-grid three compact"><label class="choice-card"><input type="radio" name="lighting" value="none"><span><strong>Không gồm</strong></span></label><label class="choice-card"><input type="radio" name="lighting" value="standard"><span><strong>Tiêu chuẩn</strong><small>Đèn Chip Afaco phổ thông · Downlight &amp; LED hắt</small></span></label><label class="choice-card"><input type="radio" name="lighting" value="luxury" checked><span><strong>Cao cấp</strong><small>Đèn Chip Philips CRI 95 · Spotlight &amp; ray nam châm</small></span></label></div>
<label class="field-label top-gap">Điện &amp; công tắc</label><div class="option-grid three compact"><label class="choice-card"><input type="radio" name="electrical" value="none"><span><strong>Giữ hiện trạng</strong></span></label><label class="choice-card"><input type="radio" name="electrical" value="light_mod"><span><strong>Cải tạo nhẹ</strong></span></label><label class="choice-card"><input type="radio" name="electrical" value="full_mod" checked><span><strong>Đi mới toàn bộ</strong></span></label></div>
<label class="field-label top-gap">Điện thông minh</label><div class="option-grid three compact"><label class="choice-card"><input type="radio" name="smarthome" value="none" checked><span><strong>Không sử dụng</strong></span></label><label class="choice-card"><input type="radio" name="smarthome" value="standard"><span><strong>Gói cơ bản</strong></span></label><label class="choice-card"><input type="radio" name="smarthome" value="luxury"><span><strong>Gói cao cấp</strong></span></label></div>
</div>
<div class="option-section"><h3><span>04</span>Nội thất &amp; vật liệu</h3>
<label class="field-label">Đồ gỗ liền tường</label><div class="option-grid two"><label class="choice-card"><input type="radio" name="wood" value="none"><span><strong>Không gồm đồ gỗ</strong></span></label><label class="choice-card"><input type="radio" name="wood" value="melamine_economy"><span><strong>Melamine kinh tế</strong><small>MDF chống ẩm</small></span></label><label class="choice-card"><input type="radio" name="wood" value="melamine_standard" checked><span><strong>Melamine tiêu chuẩn</strong><small>An Cường / Minh Long</small></span></label><label class="choice-card"><input type="radio" name="wood" value="laminate"><span><strong>Laminate &amp; sơn</strong><small>Hoàn thiện cao cấp</small></span></label></div>
<label class="field-label top-gap">Đồ rời may đo</label><div class="option-grid three compact"><label class="choice-card"><input type="radio" name="loose" value="none"><span><strong>Không gồm</strong></span></label><label class="choice-card"><input type="radio" name="loose" value="standard" checked><span><strong>Tiêu chuẩn</strong></span></label><label class="choice-card"><input type="radio" name="loose" value="luxury"><span><strong>Cao cấp</strong></span></label></div>
<label class="field-label top-gap">Đá hoàn thiện</label><div class="option-grid three compact"><label class="choice-card"><input type="radio" name="stone" value="none"><span><strong>Không gồm</strong></span></label><label class="choice-card"><input type="radio" name="stone" value="standard_stone" checked><span><strong>Thạch anh</strong></span></label><label class="choice-card"><input type="radio" name="stone" value="luxury_stone"><span><strong>Đá nung kết</strong></span></label></div>
</div>
<div class="option-section"><h3><span>05</span>Thiết bị &amp; tiện nghi</h3><div class="equipment-grid"><div><label class="field-label">Thiết bị bếp</label><select name="appliances"><option value="none">Không bao gồm</option><option value="basic" selected>Gói tiêu chuẩn</option><option value="luxury">Gói cao cấp</option></select></div><div><label class="field-label">Thiết bị vệ sinh</label><select name="wcEquipment"><option value="none" selected>Không bao gồm</option><option value="basic">Inax (phổ thông)</option><option value="luxury">Toto / Moen (cao cấp)</option></select></div><div><label class="field-label">Rèm cửa</label><select name="curtain"><option value="none">Không bao gồm</option><option value="normal" selected>Rèm hai lớp</option><option value="electric">Rèm điện</option></select></div><div><label class="field-label">Điều hòa</label><select name="ac"><option value="none" selected>Không bao gồm</option><option value="wall">Treo tường Inverter</option><option value="ducted">Âm trần nối ống gió</option></select></div><div><label class="field-label">Loa âm trần</label><select name="speaker"><option value="none" selected>Không bao gồm</option><option value="basic">Gói cơ bản</option><option value="luxury">Gói cao cấp</option></select></div></div>
<label class="check-card spaced"><input type="checkbox" id="freshAir"><span class="check-ui"></span><span><strong>Hệ thống cấp khí tươi</strong><small>Thu hồi nhiệt, lọc bụi mịn</small></span><b>Thiết bị bổ sung</b></label>
<label class="check-card"><input type="checkbox" id="epoxyGrout"><span class="check-ui"></span><span><strong>Keo ron Epoxy</strong><small>Chống thấm ron gạch, chống bám bẩn khu ướt</small></span><b>Thiết bị bổ sung</b></label></div>
</section>
</form>
<aside class="results">
<section class="summary-card panel"><div class="summary-top"><div><span class="eyebrow">TỔNG MỨC ĐẦU TƯ</span><strong id="grandTotal">0 ₫</strong></div><span class="rate-badge" id="rateBadge">0 triệu/m²</span></div><div class="summary-meta" id="summaryMeta"></div><div class="kpi-grid"><div><span>Thi công thực tế</span><strong id="workDays">0 ngày</strong></div><div><span>Ngày bàn giao</span><strong id="handoverDate">-</strong></div><div><span>Số hạng mục</span><strong id="itemCount">0</strong></div></div></section>
<section class="detail-card panel"><div class="tabs"><button class="tab active" data-tab="cost" type="button">Chi phí</button><button class="tab" data-tab="schedule" type="button">Tiến độ</button><button class="tab" data-tab="plans" type="button">Phương án <span id="planCount">0</span></button></div>
<div class="tab-panel active" id="tab-cost"><div class="table-head"><span>Hạng mục</span><span>Thành tiền</span></div><div class="breakdown" id="breakdown"></div><div class="total-row"><span>Tổng khái toán</span><strong id="grandTotalBottom">0 ₫</strong></div><p class="disclaimer">Chi phí mang tính tham khảo sơ bộ, chưa thay thế báo giá khảo sát và hồ sơ kỹ thuật.</p></div>
<div class="tab-panel" id="tab-schedule"><div class="schedule-summary"><div><span id="scheduleWork">0</span><small>ngày làm việc</small></div><div><span id="scheduleCalendar">0</span><small>ngày lịch</small></div></div><div class="phase-legend"><i class="rough"></i>Thô <i class="finish"></i>Hoàn thiện</div><div class="timeline" id="timeline"></div></div>
<div class="tab-panel" id="tab-plans"><div class="plan-toolbar"><div><strong>So sánh phương án</strong><small>Lưu tối đa 6 cấu hình trong trình duyệt</small></div><button type="button" class="button primary small" id="savePlanBtn">+ Lưu phương án</button></div><div id="plansList" class="plans-list"></div><button type="button" class="text-button danger" id="clearPlansBtn">Xóa tất cả phương án</button></div>
</section></aside></div></main>
<button class="assistant-toggle" id="assistantToggle" type="button" aria-label="Mở trợ lý">💬</button>
<section class="assistant" id="assistantPanel" aria-hidden="true"><header><div><span>💬</span><div><strong>Trợ lý khái toán</strong><small>Hỗ trợ theo cấu hình hiện tại</small></div></div><button type="button" id="assistantClose">×</button></header><div class="assistant-body" id="assistantBody"><p class="bot-message">Chào bạn! Tôi có thể giải thích chi phí, tiến độ hoặc gợi ý tối ưu ngân sách.</p><div class="quick-replies"><button type="button">Vì sao chi phí thay đổi?</button><button type="button">Gợi ý tiết kiệm ngân sách</button><button type="button">Tiến độ được tính thế nào?</button></div></div><form id="assistantForm"><input id="assistantInput" placeholder="Nhập câu hỏi..." autocomplete="off"><button>↑</button></form></section>
<div class="toast" id="toast" role="status"></div>
  `;

  if (isEmbedded) document.body.classList.add("embedded");

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const form = $("#estimateForm");
  const storageKey = "khai-toan-plans-v1";
  let current = null;
  const t = {
    standard: {
      demolition: 400000, ceiling: 600000, painting: 400000,
      flooring: { standard: 520000, luxury: 850000 },
      lighting: { standard: 350000, luxury: 500000 },
      electrical: { light_mod: 150000, full_mod: 400000 },
      wood: { melamine_economy: 3100000, melamine_standard: 3600000, laminate: 4300000 },
      loose: { standard: 1000000, luxury: 1200000 },
      stone: { standard_stone: 800000, luxury_stone: 1600000 },
      staircase: { basic: 45000000, luxury: 70000000 },
      appliances: { basic: 45000000, luxury: 85000000 },
      wcEquipment: { basic: 15000000, luxury: 30000000 },
      curtain: { normal: 400000, electric: 700000 },
      ac: { wall: 45000000, ducted: 70000000 },
      freshAir: 32500000,
      smarthome: { standard: 350000, luxury: 1000000 },
      // Giá Loa âm trần & Keo ron Epoxy là ƯỚC TÍNH THAM KHẢO (chưa có báo giá
      // nhà cung cấp thật) — cần xác nhận/điều chỉnh lại trước khi dùng báo giá chính thức.
      speaker: { basic: 8000000, luxury: 18000000 },
      epoxyGrout: 3000000
    },
    luxury: {
      demolition: 500000, ceiling: 750000, painting: 550000,
      flooring: { standard: 650000, luxury: 1100000 },
      lighting: { standard: 450000, luxury: 650000 },
      electrical: { light_mod: 200000, full_mod: 450000 },
      wood: { melamine_economy: 3500000, melamine_standard: 4000000, laminate: 4700000 },
      loose: { standard: 1100000, luxury: 1300000 },
      stone: { standard_stone: 1000000, luxury_stone: 2200000 },
      staircase: { basic: 45000000, luxury: 70000000 },
      appliances: { basic: 45000000, luxury: 85000000 },
      wcEquipment: { basic: 15000000, luxury: 30000000 },
      curtain: { normal: 400000, electric: 700000 },
      ac: { wall: 53000000, ducted: 90000000 },
      freshAir: 44000000,
      smarthome: { standard: 450000, luxury: 1250000 },
      speaker: { basic: 10000000, luxury: 24000000 },
      epoxyGrout: 3800000
    }
  };
  const labels = {
    standard: "Tiêu chuẩn", luxury: "Cao cấp", modern: "Hiện đại",
    modern_luxury: "Modern Luxury", melamine_economy: "Gỗ Melamine kinh tế",
    melamine_standard: "Gỗ Melamine tiêu chuẩn", laminate: "Gỗ Laminate & sơn",
    standard_stone: "Đá thạch anh", luxury_stone: "Đá nung kết",
    light_mod: "Điện cải tạo nhẹ", full_mod: "Điện đi mới toàn bộ",
    basic: "Tiêu chuẩn", normal: "Rèm hai lớp", electric: "Rèm điện",
    wall: "Điều hòa treo tường", ducted: "Điều hòa âm trần"
  };
  const itemNames = {
    demolition: "Phá dỡ & xây mới", wc: "Cải tạo khu vệ sinh", staircase: "Cải tạo cầu thang",
    ceiling: "Trần thạch cao", painting: "Sơn bả tường trần", flooring: "Hoàn thiện sàn",
    lighting: "Hệ thống chiếu sáng", electrical: "Hệ thống điện", smarthome: "Điện thông minh",
    wood: "Đồ gỗ liền tường", loose: "Đồ rời may đo", stone: "Đá hoàn thiện",
    appliances: "Thiết bị bếp", wcEquipment: "Thiết bị vệ sinh", curtain: "Rèm cửa",
    ac: "Điều hòa", freshAir: "Hệ thống cấp khí tươi", speaker: "Loa âm trần", epoxyGrout: "Keo ron Epoxy"
  };
  const wcEquipmentLabels = { basic: "Inax (phổ thông)", luxury: "Toto / Moen (cao cấp)" };

  function value(name) {
    const el = form.elements[name];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value;
    return el.value;
  }
  function n(id, fallback = 0) { return Number($("#" + id)?.value) || fallback; }
  function on(id) { return !!$("#" + id)?.checked; }
  function money(amount) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Math.round(amount));
  }
  function compact(amount) {
    return amount >= 1e9
      ? (amount / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " tỷ"
      : (amount / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " triệu";
  }
  function dateText(date) {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }
  function iso(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function mondayIfWeekend(date) {
    const d = new Date(date); d.setHours(12, 0, 0, 0);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  }
  function addWorkdays(date, days) {
    const d = new Date(date); let left = Math.max(0, days);
    while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left--; }
    return d;
  }
  function areaFactor(area) {
    if (area <= 80) return Math.max(.92, .82 + area / 80 * .18);
    if (area <= 100) return 1 + (area - 80) / 20 * .25;
    if (area <= 150) return 1.25 + (area - 100) / 50 * .25;
    if (area <= 200) return 1.5 + (area - 150) / 50 * .22;
    return 1.72 + (area - 200) / 100 * .3;
  }
  function autoRooms() {
    const a = n("area", 85);
    const rooms = a < 55 ? [1, 1] : a <= 90 ? [2, 2] : a <= 125 ? [3, 2] : [4, 3];
    $("#bedCount").value = String(rooms[0]); $("#bathCount").value = String(rooms[1]);
  }
  function calculate() {
    const area = Math.min(350, Math.max(35, n("area", 85)));
    const beds = n("bedCount", 2), baths = n("bathCount", 2);
    const tier = value("tier") || "standard", style = value("style") || "modern";
    const r = structuredClone(t[tier]);
    if (style === "modern_luxury") {
      r.ceiling += 120000; r.lighting.luxury += 150000;
      Object.keys(r.wood).forEach(k => r.wood[k] += 650000);
      Object.keys(r.loose).forEach(k => r.loose[k] += 200000);
      Object.keys(r.stone).forEach(k => r.stone[k] += 250000);
    }
    const items = [];
    const add = (key, amount) => { if (amount > 0) items.push({ key, amount: Math.round(amount) }); };
    if (on("demolition")) {
      const level = Number(value("demoLevel") || 100), factor = level === 20 ? 1 : level === 50 ? 1.35 : 1.75;
      add("demolition", r.demolition * factor * area);
    }
    if (on("wcRenovation")) add("wc", 28000000 * baths);
    const staircase = value("staircase");
    if (staircase !== "none") add("staircase", r.staircase[staircase]);
    if (on("ceiling")) add("ceiling", r.ceiling * area);
    if (on("painting")) add("painting", r.painting * area);
    const flooring = value("flooring");
    if (flooring !== "none") {
      // Gạch thường rẻ hơn gỗ cùng phân khúc ~15% — hệ số ƯỚC TÍNH tham khảo thị trường chung.
      const floorMaterial = value("floorMaterial") || "wood";
      add("flooring", r.flooring[flooring] * area * (floorMaterial === "tile" ? 0.85 : 1));
    }
    const lighting = value("lighting"); if (lighting !== "none") add("lighting", r.lighting[lighting] * area);
    const electrical = value("electrical"); if (electrical !== "none") add("electrical", r.electrical[electrical] * area);
    const smarthome = value("smarthome"); if (smarthome !== "none") add("smarthome", r.smarthome[smarthome] * 85);
    const wood = value("wood");
    if (wood !== "none") {
      const factor = Math.max(.5, .5 + .4 * (beds / 2) + .1 * (baths / 2));
      add("wood", r.wood[wood] * area * factor);
    }
    const loose = value("loose");
    if (loose !== "none") {
      const effective = area <= 75 ? Math.max(area, 60) : 75 + (area - 75) * .25;
      add("loose", r.loose[loose] * effective * (.55 + .45 * (beds / 2)));
    }
    const stone = value("stone");
    if (stone !== "none") {
      const effective = area <= 70 ? Math.max(area, 55) : 70 + (area - 70) * .3;
      add("stone", r.stone[stone] * effective * (.75 + .25 * (baths / 2)));
    }
    const appliances = value("appliances"); if (appliances !== "none") add("appliances", r.appliances[appliances]);
    const wcEquipment = value("wcEquipment"); if (wcEquipment !== "none") add("wcEquipment", r.wcEquipment[wcEquipment] * baths);
    const curtain = value("curtain");
    if (curtain !== "none") {
      const effective = area <= 75 ? Math.max(area, 60) : 75 + (area - 75) * .25;
      add("curtain", r.curtain[curtain] * effective * (.35 + .65 * (beds / 2)));
    }
    const roomFactor = (beds + 1) / 4, effectiveAC = area <= 100 ? Math.max(area, 45) : 100 + (area - 100) * .15;
    const ac = value("ac"); if (ac !== "none") add("ac", r.ac[ac] * effectiveAC / 100 * roomFactor);
    if (on("freshAir")) add("freshAir", r.freshAir * effectiveAC / 100 * roomFactor);
    const speaker = value("speaker"); if (speaker !== "none") add("speaker", r.speaker[speaker] * roomFactor);
    if (on("epoxyGrout")) add("epoxyGrout", r.epoxyGrout * baths);
    const total = items.reduce((sum, x) => sum + x.amount, 0);
    const schedule = buildSchedule(area, items);
    current = { area, beds, baths, tier, style, items, total, schedule };
    render();
  }
  function buildSchedule(area, items) {
    const factor = areaFactor(area), keys = new Set(items.map(x => x.key));
    const demoLevel = Number(value("demoLevel") || 100), dm = demoLevel === 20 ? .6 : demoLevel === 50 ? 1 : 1.5;
    const tasks = []; const push = (name, start, duration, phase) => tasks.push({ name, start, duration: Math.max(2, Math.round(duration)), phase });
    let base = 0;
    push("Khảo sát & chốt hồ sơ", 0, 3, "rough");
    if (keys.has("demolition")) { push("Phá dỡ & vận chuyển", 3, 6 * factor * dm, "rough"); base = 3 + Math.round(4 * factor * dm); }
    if (keys.has("wc") || keys.has("staircase") || keys.has("demolition")) push("Xây trát & chống thấm", base, 7 * factor, "rough");
    if (keys.has("electrical") || keys.has("ac") || keys.has("freshAir") || keys.has("speaker")) push("MEP âm tường trần", base + 2, (value("electrical") === "full_mod" ? 11 : 6) * factor, "rough");
    const finish = base + Math.round(8 * factor);
    if (keys.has("ceiling")) push("Thi công trần", finish, 10 * factor, "finish");
    if (keys.has("painting")) push("Bả & sơn hoàn thiện", finish + 4, 12 * factor, "finish");
    if (keys.has("wood")) push("Sản xuất đồ gỗ tại xưởng", 5, 26 * factor, "finish");
    if (keys.has("flooring")) push("Hoàn thiện sàn", finish + 12, 6 * factor, "finish");
    if (keys.has("lighting") || keys.has("electrical")) push("Lắp đèn & thiết bị điện", finish + 15, 5 * factor, "finish");
    if (keys.has("wood")) push("Lắp đặt đồ gỗ", finish + 16, 9 * factor, "finish");
    if (keys.has("stone") || keys.has("appliances") || keys.has("wcEquipment") || keys.has("epoxyGrout")) push("Lắp thiết bị & đá", finish + 20, 6 * factor, "finish");
    if (keys.has("loose") || keys.has("curtain")) push("Lắp đồ rời & rèm", finish + 25, 4 * factor, "finish");
    push("Vệ sinh, nghiệm thu & bàn giao", finish + 29, 4 * factor, "finish");
    const maxDay = Math.max(...tasks.map(x => x.start + x.duration));
    const start = mondayIfWeekend(new Date(value("startDate") + "T12:00:00")), end = addWorkdays(start, maxDay);
    return { tasks, workDays: maxDay, calendarDays: Math.round((end - start) / 86400000) + 1, start, end };
  }
  function render() {
    const { total, area, tier, style, items, schedule, baths } = current;
    const detailFor = x => {
      if (x.key === "demolition") return "Mức cải tạo " + value("demoLevel") + "% • " + area + " m²";
      if (x.key === "wc") return baths + " WC • chống thấm & ốp lát";
      if (x.key === "ceiling" || x.key === "painting") return area + " m²";
      if (x.key === "wcEquipment") return wcEquipmentLabels[value("wcEquipment")] || "";
      if (x.key === "freshAir") return "Thu hồi nhiệt & lọc bụi mịn";
      if (x.key === "epoxyGrout") return "Chống thấm ron gạch khu ướt";
      if (x.key === "flooring") return labels[value("flooring")] + " · " + (value("floorMaterial") === "tile" ? "Sàn gạch" : "Sàn gỗ");
      const map = { flooring: value("flooring"), lighting: value("lighting"), electrical: value("electrical"), smarthome: value("smarthome"), wood: value("wood"), loose: value("loose"), stone: value("stone"), appliances: value("appliances"), curtain: value("curtain"), ac: value("ac"), staircase: value("staircase"), speaker: value("speaker") };
      return labels[map[x.key]] || "";
    };
    $("#grandTotal").textContent = money(total); $("#grandTotalBottom").textContent = money(total);
    $("#rateBadge").textContent = compact(total / area) + "/m²";
    $("#summaryMeta").textContent = area + " m² • " + labels[tier] + " • " + labels[style];
    $("#workDays").textContent = schedule.workDays + " ngày"; $("#handoverDate").textContent = dateText(schedule.end); $("#itemCount").textContent = items.length;
    $("#breakdown").innerHTML = items.map(x => '<div class="cost-row"><div><strong>' + itemNames[x.key] + '</strong><small>' + detailFor(x) + '</small></div><b>' + money(x.amount) + '</b></div>').join("");
    $("#scheduleWork").textContent = schedule.workDays; $("#scheduleCalendar").textContent = schedule.calendarDays;
    $("#timeline").innerHTML = schedule.tasks.map(x => { const begin = addWorkdays(schedule.start, x.start), end = addWorkdays(begin, x.duration - 1); return '<div class="timeline-row ' + x.phase + '"><div><strong>' + x.name + '</strong><small>' + dateText(begin) + ' → ' + dateText(end) + '</small></div><b>' + x.duration + ' ngày</b></div>'; }).join("");
  }
  function serialize() {
    const data = {};
    $$("input,select", form).forEach(el => {
      if ((el.type === "radio" || el.type === "checkbox") && !el.checked) {
        if (el.type === "checkbox") data[el.id] = false;
        return;
      }
      data[el.name || el.id] = el.type === "checkbox" ? el.checked : el.value;
    });
    return data;
  }
  function applyData(data) {
    $$("input,select", form).forEach(el => {
      const key = el.name || el.id;
      if (!(key in data)) return;
      if (el.type === "radio") el.checked = el.value === data[key];
      else if (el.type === "checkbox") el.checked = !!data[key];
      else el.value = data[key];
    });
    calculate();
  }
  function plans() { try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; } }
  function renderPlans() {
    const list = plans(); $("#planCount").textContent = list.length;
    $("#plansList").innerHTML = list.length
      ? list.map((p, i) => '<article class="plan-item"><header><strong>' + escapeHtml(p.name) + '</strong><b>' + money(p.total) + '</b></header><p>' + p.area + ' m² • ' + p.items + ' hạng mục • ' + p.workDays + ' ngày</p><div class="plan-actions"><button data-load="' + i + '">Nạp phương án</button><button data-delete="' + i + '">Xóa</button></div></article>').join("")
      : '<div class="empty-state">Chưa có phương án nào được lưu.</div>';
  }
  function escapeHtml(s) { const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2200); }
  function activateTab(id) {
    $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === id));
    $$(".tab-panel").forEach(x => x.classList.toggle("active", x.id === "tab-" + id));
  }
  function answer(question) {
    const q = question.toLowerCase();
    if (q.includes("tiết kiệm") || q.includes("tối ưu")) {
      const top = [...current.items].sort((a, b) => b.amount - a.amount).slice(0, 2).map(x => itemNames[x.key]).join(" và ");
      return "Hai nhóm chi phí lớn nhất hiện là " + top + ". Hãy thử chuyển vật liệu về mức tiêu chuẩn hoặc giữ lại hạng mục có sẵn.";
    }
    if (q.includes("tiến độ") || q.includes("ngày")) return "Tiến độ ước tính " + current.schedule.workDays + " ngày làm việc, từ " + dateText(current.schedule.start) + " đến " + dateText(current.schedule.end) + ".";
    if (q.includes("chi phí") || q.includes("thay đổi")) return "Tổng hiện tại là " + money(current.total) + ". Chi phí thay đổi theo diện tích, số phòng, phân khúc vật tư và phạm vi bạn chọn.";
    return "Đây là khái toán sơ bộ. Tổng hiện tại " + money(current.total) + ", tương đương " + compact(current.total / current.area) + "/m².";
  }
  function addChat(text, mine) {
    const p = document.createElement("p"); p.className = mine ? "user-message" : "bot-message"; p.textContent = text;
    $("#assistantBody").appendChild(p); $("#assistantBody").scrollTop = $("#assistantBody").scrollHeight;
  }

  form.addEventListener("input", e => { if (e.target.id === "area") { clearTimeout(form.timer); form.timer = setTimeout(calculate, 80); } else calculate(); });
  form.addEventListener("change", calculate);
  $$(".tab").forEach(x => x.addEventListener("click", () => activateTab(x.dataset.tab)));
  $("#printBtn").addEventListener("click", () => window.print());
  $("#themeToggle").addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("khai-theme", document.body.classList.contains("dark") ? "dark" : "light"); });
  $("#resetBtn").addEventListener("click", () => { form.reset(); setInitialDate(); autoRooms(); calculate(); toast("Đã khôi phục cấu hình mặc định"); });
  $("#savePlanBtn").addEventListener("click", () => {
    const list = plans(); if (list.length >= 6) return toast("Chỉ lưu tối đa 6 phương án");
    list.push({ name: $("#clientName").value || "Phương án " + (list.length + 1), total: current.total, area: current.area, items: current.items.length, workDays: current.schedule.workDays, data: serialize() });
    localStorage.setItem(storageKey, JSON.stringify(list)); renderPlans(); toast("Đã lưu phương án");
  });
  $("#plansList").addEventListener("click", e => {
    const load = e.target.dataset.load, del = e.target.dataset.delete, list = plans();
    if (load !== undefined) { applyData(list[Number(load)].data); activateTab("cost"); toast("Đã nạp phương án"); }
    if (del !== undefined) { list.splice(Number(del), 1); localStorage.setItem(storageKey, JSON.stringify(list)); renderPlans(); }
  });
  $("#clearPlansBtn").addEventListener("click", () => { localStorage.removeItem(storageKey); renderPlans(); toast("Đã xóa các phương án"); });
  const assistant = $("#assistantPanel");
  $("#assistantToggle").addEventListener("click", () => { assistant.classList.toggle("open"); assistant.setAttribute("aria-hidden", String(!assistant.classList.contains("open"))); });
  $("#assistantClose").addEventListener("click", () => assistant.classList.remove("open"));
  $$(".quick-replies button").forEach(b => b.addEventListener("click", () => { addChat(b.textContent, true); setTimeout(() => addChat(answer(b.textContent), false), 180); }));
  $("#assistantForm").addEventListener("submit", e => { e.preventDefault(); const input = $("#assistantInput"), q = input.value.trim(); if (!q) return; addChat(q, true); input.value = ""; setTimeout(() => addChat(answer(q), false), 180); });
  function setInitialDate() { const d = new Date(); d.setDate(d.getDate() + 7); $("#startDate").value = iso(mondayIfWeekend(d)); }
  if (localStorage.getItem("khai-theme") === "dark") document.body.classList.add("dark");
  setInitialDate(); calculate(); renderPlans();
})();
