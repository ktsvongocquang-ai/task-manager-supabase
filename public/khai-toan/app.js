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
  // Logic tính toán + đơn giá nằm ở calc.js (dùng chung với API PDF phía máy chủ).
  const K = window.KhaiToanCalc;
  const labels = K.LABELS, itemNames = K.ITEM_NAMES;
  const { money, compact, dateText, mondayIfWeekend, addWorkdays } = K;

  function value(name) {
    const el = form.elements[name];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value;
    return el.value;
  }
  function n(id, fallback = 0) { return Number($("#" + id)?.value) || fallback; }
  function on(id) { return !!$("#" + id)?.checked; }
  function iso(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function autoRooms() {
    const rooms = K.autoRooms(n("area", 85));
    $("#bedCount").value = String(rooms[0]); $("#bathCount").value = String(rooms[1]);
  }
  // Đọc form thành đầu vào chuẩn của KhaiToanCalc.calculate (giữ nguyên cách đọc cũ).
  function readForm() {
    const scope = {
      demolition: on("demolition"), demoLevel: value("demoLevel"), wcRenovation: on("wcRenovation"),
      ceiling: on("ceiling"), painting: on("painting"), freshAir: on("freshAir"), epoxyGrout: on("epoxyGrout")
    };
    ["staircase", "flooring", "floorMaterial", "lighting", "electrical", "smarthome", "wood", "loose", "stone",
      "appliances", "wcEquipment", "curtain", "ac", "speaker"].forEach(k => { scope[k] = value(k); });
    return {
      area: n("area", 85), beds: n("bedCount", 2), baths: n("bathCount", 2),
      tier: value("tier") || "standard", style: value("style") || "modern",
      startDate: value("startDate"), scope
    };
  }
  function calculate() {
    current = K.calculate(readForm());
    render();
  }
  function render() {
    const { total, area, tier, style, items, schedule } = current;
    $("#grandTotal").textContent = money(total); $("#grandTotalBottom").textContent = money(total);
    $("#rateBadge").textContent = compact(total / area) + "/m²";
    $("#summaryMeta").textContent = area + " m² • " + labels[tier] + " • " + labels[style];
    $("#workDays").textContent = schedule.workDays + " ngày"; $("#handoverDate").textContent = dateText(schedule.end); $("#itemCount").textContent = items.length;
    $("#breakdown").innerHTML = items.map(x => '<div class="cost-row"><div><strong>' + itemNames[x.key] + '</strong><small>' + K.detailFor(x, current) + '</small></div><b>' + money(x.amount) + '</b></div>').join("");
    $("#scheduleWork").textContent = schedule.workDays; $("#scheduleCalendar").textContent = schedule.calendarDays;
    $("#timeline").innerHTML = schedule.tasks.map(x => { const begin = addWorkdays(schedule.start, x.start), end = addWorkdays(begin, x.duration - 1); return '<div class="timeline-row ' + x.phase + '"><div><strong>' + x.name + '</strong><small>' + dateText(begin) + ' → ' + dateText(end) + '</small></div><b>' + x.duration + ' ngày</b></div>'; }).join("");
  }
  // Xuất PDF: in mẫu dùng chung (print-template.js) trong iframe ẩn để giống bản máy chủ.
  // Lỗi bất kỳ (trình duyệt cũ, chưa nạp mẫu...) -> quay về window.print() như cũ.
  function printEstimate() {
    try {
      if (!window.KhaiToanPrint || !current) throw new Error("no template");
      const html = window.KhaiToanPrint.renderHtml(current, {
        clientName: $("#clientName").value.trim(), showSchedule: false,
        fontBaseUrl: new URL("./fonts/", location.href).href
      });
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
      document.body.appendChild(frame);
      const cleanup = () => setTimeout(() => frame.remove(), 1000);
      frame.onload = () => {
        const w = frame.contentWindow;
        const go = () => { try { w.focus(); w.addEventListener("afterprint", cleanup); w.print(); } catch (e) { frame.remove(); window.print(); } };
        (w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve()).then(go, go);
        setTimeout(() => frame.isConnected && frame.remove(), 120000);
      };
      frame.srcdoc = html;
    } catch (e) {
      window.print();
    }
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
  $("#printBtn").addEventListener("click", printEstimate);
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
  // ?cfg=<base64url JSON> (cùng định dạng body của API PDF): mở sẵn cấu hình đã điền,
  // dùng làm link gửi khách qua Messenger. Cấu hình sai thì bỏ qua, giữ mặc định.
  function applyCfgParam() {
    const raw = new URLSearchParams(location.search).get("cfg");
    if (!raw) return false;
    try {
      const v = K.validateRequest(K.decodeCfg(raw));
      if (!v.ok) return false;
      const c = v.value, data = { area: String(c.area), bedCount: String(c.beds), bathCount: String(c.baths), startDate: c.startDate, tier: c.tier, style: c.style };
      Object.keys(c.scope).forEach(k => { data[k] = typeof c.scope[k] === "boolean" ? c.scope[k] : String(c.scope[k]); });
      if (c.clientName) data.clientName = c.clientName;
      applyData(data);
      return true;
    } catch (e) { return false; }
  }
  setInitialDate(); if (!applyCfgParam()) calculate(); renderPlans();
})();
