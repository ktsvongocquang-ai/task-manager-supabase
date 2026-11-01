/*
 * Khái toán nội thất DQH: module tính toán DÙNG CHUNG cho trình duyệt và Node.
 *
 * - Trình duyệt: nạp bằng <script src="./calc.js"> -> window.KhaiToanCalc
 * - Node (API /api/khai-toan/pdf): import file này (side effect) -> globalThis.KhaiToanCalc
 *
 * QUAN TRỌNG: công thức và đơn giá được chép NGUYÊN VĂN từ app.js cũ (bản trước
 * khi tách module). Không đổi bất kỳ con số nào; mọi thay đổi phải chạy lại
 * kiểm thử tests/khai-toan (so khớp với bản app.js gốc chạy trên trình duyệt thật).
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  root.KhaiToanCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // ── Bảng đơn giá (giữ nguyên) ──
  const RATES = {
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
      // Giá Loa âm trần & Keo ron Epoxy là ƯỚC TÍNH THAM KHẢO (chưa có giá
      // nhà cung cấp thật), cần xác nhận lại trước khi dùng chính thức.
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

  const LABELS = {
    standard: "Tiêu chuẩn", luxury: "Cao cấp", modern: "Hiện đại",
    modern_luxury: "Modern Luxury", melamine_economy: "Gỗ Melamine kinh tế",
    melamine_standard: "Gỗ Melamine tiêu chuẩn", laminate: "Gỗ Laminate & sơn",
    standard_stone: "Đá thạch anh", luxury_stone: "Đá nung kết",
    light_mod: "Điện cải tạo nhẹ", full_mod: "Điện đi mới toàn bộ",
    basic: "Tiêu chuẩn", normal: "Rèm hai lớp", electric: "Rèm điện",
    wall: "Điều hòa treo tường", ducted: "Điều hòa âm trần"
  };
  const ITEM_NAMES = {
    demolition: "Phá dỡ & xây mới", wc: "Cải tạo khu vệ sinh", staircase: "Cải tạo cầu thang",
    ceiling: "Trần thạch cao", painting: "Sơn bả tường trần", flooring: "Hoàn thiện sàn",
    lighting: "Hệ thống chiếu sáng", electrical: "Hệ thống điện", smarthome: "Điện thông minh",
    wood: "Đồ gỗ liền tường", loose: "Đồ rời may đo", stone: "Đá hoàn thiện",
    appliances: "Thiết bị bếp", wcEquipment: "Thiết bị vệ sinh", curtain: "Rèm cửa",
    ac: "Điều hòa", freshAir: "Hệ thống cấp khí tươi", speaker: "Loa âm trần", epoxyGrout: "Keo ron Epoxy"
  };
  const WC_EQUIPMENT_LABELS = { basic: "Inax (phổ thông)", luxury: "Toto / Moen (cao cấp)" };

  // Nhóm hạng mục: theo đúng thứ tự các khối "Phạm vi thi công" trên giao diện.
  const GROUPS = [
    { key: "rough", name: "Cải tạo thô & trần tường", items: ["demolition", "wc", "staircase", "ceiling", "painting"] },
    { key: "floor", name: "Hoàn thiện sàn", items: ["flooring"] },
    { key: "mep", name: "MEP & chiếu sáng", items: ["lighting", "electrical", "smarthome"] },
    { key: "interior", name: "Nội thất & vật liệu", items: ["wood", "loose", "stone"] },
    { key: "equipment", name: "Thiết bị & tiện nghi", items: ["appliances", "wcEquipment", "curtain", "ac", "speaker", "freshAir", "epoxyGrout"] }
  ];

  // Phạm vi mặc định = trạng thái mặc định của form trên giao diện.
  const DEFAULT_SCOPE = {
    demolition: true, demoLevel: 100, wcRenovation: true, ceiling: true, painting: true,
    staircase: "none", flooring: "standard", floorMaterial: "wood",
    lighting: "luxury", electrical: "full_mod", smarthome: "none",
    wood: "melamine_standard", loose: "standard", stone: "standard_stone",
    appliances: "basic", wcEquipment: "none", curtain: "normal", ac: "none", speaker: "none",
    freshAir: false, epoxyGrout: false
  };
  // Giá trị hợp lệ của từng lựa chọn phạm vi ("bool" = true/false).
  const SCOPE_ENUMS = {
    demolition: "bool", demoLevel: [20, 50, 100], wcRenovation: "bool", ceiling: "bool", painting: "bool",
    staircase: ["none", "basic", "luxury"], flooring: ["none", "standard", "luxury"], floorMaterial: ["wood", "tile"],
    lighting: ["none", "standard", "luxury"], electrical: ["none", "light_mod", "full_mod"],
    smarthome: ["none", "standard", "luxury"], wood: ["none", "melamine_economy", "melamine_standard", "laminate"],
    loose: ["none", "standard", "luxury"], stone: ["none", "standard_stone", "luxury_stone"],
    appliances: ["none", "basic", "luxury"], wcEquipment: ["none", "basic", "luxury"],
    curtain: ["none", "normal", "electric"], ac: ["none", "wall", "ducted"], speaker: ["none", "basic", "luxury"],
    freshAir: "bool", epoxyGrout: "bool"
  };

  // ── Tiện ích định dạng (giữ nguyên) ──
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
  // Gợi ý số phòng theo diện tích (giống nút "Làm mới" trên giao diện).
  function autoRooms(area) {
    const a = Number(area) || 85;
    return a < 55 ? [1, 1] : a <= 90 ? [2, 2] : a <= 125 ? [3, 2] : [4, 3];
  }

  /**
   * Tính khái toán.
   * input = { area, beds, baths, tier, style, startDate: "YYYY-MM-DD", scope: {...} }
   * Trả về { area, beds, baths, tier, style, startDate, scope, items, total, schedule }
   */
  function calculate(input) {
    input = input || {};
    const s = Object.assign({}, DEFAULT_SCOPE, input.scope || {});
    const value = name => s[name];
    const on = name => !!s[name];
    const area = Math.min(350, Math.max(35, Number(input.area) || 85));
    const beds = Number(input.beds) || 2, baths = Number(input.baths) || 2;
    const tier = input.tier || "standard", style = input.style || "modern";
    const r = structuredClone(RATES[tier]);
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
      // Gạch thường rẻ hơn gỗ cùng phân khúc ~15%: hệ số ƯỚC TÍNH tham khảo thị trường chung.
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
    const schedule = buildSchedule(area, items, s, input.startDate);
    return { area, beds, baths, tier, style, startDate: input.startDate, scope: s, items, total, schedule };
  }

  function buildSchedule(area, items, scope, startDate) {
    const value = name => scope[name];
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
    const start = mondayIfWeekend(new Date(startDate + "T12:00:00")), end = addWorkdays(start, maxDay);
    return { tasks, workDays: maxDay, calendarDays: Math.round((end - start) / 86400000) + 1, start, end };
  }

  // Dòng diễn giải dưới tên hạng mục (giữ nguyên chữ như giao diện).
  function detailFor(x, result) {
    const s = result.scope, value = name => s[name];
    if (x.key === "demolition") return "Mức cải tạo " + value("demoLevel") + "% • " + result.area + " m²";
    if (x.key === "wc") return result.baths + " WC • chống thấm & ốp lát";
    if (x.key === "ceiling" || x.key === "painting") return result.area + " m²";
    if (x.key === "wcEquipment") return WC_EQUIPMENT_LABELS[value("wcEquipment")] || "";
    if (x.key === "freshAir") return "Thu hồi nhiệt & lọc bụi mịn";
    if (x.key === "epoxyGrout") return "Chống thấm ron gạch khu ướt";
    if (x.key === "flooring") return LABELS[value("flooring")] + " · " + (value("floorMaterial") === "tile" ? "Sàn gạch" : "Sàn gỗ");
    const map = { lighting: value("lighting"), electrical: value("electrical"), smarthome: value("smarthome"), wood: value("wood"), loose: value("loose"), stone: value("stone"), appliances: value("appliances"), curtain: value("curtain"), ac: value("ac"), staircase: value("staircase"), speaker: value("speaker") };
    return LABELS[map[x.key]] || "";
  }

  // ── Kiểm tra đầu vào API (chặt) ──
  const TOP_KEYS = ["clientName", "phone", "area", "beds", "baths", "tier", "style", "startDate", "scope", "showSchedule"];
  const ALIASES = {
    tier: { "standard": "standard", "tieu chuan": "standard", "luxury": "luxury", "cao cap": "luxury" },
    style: { "modern": "modern", "hien dai": "modern", "modern_luxury": "modern_luxury", "modern luxury": "modern_luxury" }
  };
  function fold(s) {
    return String(s).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  }
  function toNumber(v) {
    if (typeof v === "number") return v;
    if (typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v)) return Number(v);
    return NaN;
  }
  function isValidDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return y >= 2020 && y <= 2100 && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  // Ngày khởi công mặc định: hôm nay + 7 ngày (giờ Việt Nam), dời sang thứ Hai nếu rơi vào cuối tuần.
  function defaultStartDate(now) {
    const vn = new Date((now || new Date()).getTime() + 7 * 3600000);
    const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + 7));
    if (d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 2);
    if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  /** Trả về { ok: true, value } hoặc { ok: false, errors: [...] } */
  function validateRequest(body) {
    const errors = [];
    if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, errors: ["Body phải là một đối tượng JSON."] };
    Object.keys(body).forEach(k => { if (!TOP_KEYS.includes(k)) errors.push("Trường không được hỗ trợ: " + k); });

    let clientName = "";
    if (body.clientName != null) {
      if (typeof body.clientName !== "string") errors.push("clientName phải là chuỗi.");
      else {
        clientName = body.clientName.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
        if (clientName.length > 100) errors.push("clientName tối đa 100 ký tự.");
      }
    }
    let phone = "";
    if (body.phone != null && body.phone !== "") {
      if (typeof body.phone !== "string" || !/^[0-9+ .()-]{8,20}$/.test(body.phone.trim())) errors.push("phone không hợp lệ (8-20 ký tự số, có thể có + . - khoảng trắng).");
      else phone = body.phone.trim();
    }

    const area = toNumber(body.area);
    if (body.area == null) errors.push("Thiếu area (diện tích, m²).");
    else if (!Number.isFinite(area) || area < 35 || area > 350) errors.push("area phải là số từ 35 đến 350 (m²).");

    const beds = toNumber(body.beds);
    if (body.beds == null) errors.push("Thiếu beds (số phòng ngủ).");
    else if (!Number.isInteger(beds) || beds < 1 || beds > 4) errors.push("beds phải là số nguyên từ 1 đến 4.");
    const baths = toNumber(body.baths);
    if (body.baths == null) errors.push("Thiếu baths (số WC).");
    else if (!Number.isInteger(baths) || baths < 1 || baths > 3) errors.push("baths phải là số nguyên từ 1 đến 3.");

    const tier = body.tier == null ? undefined : ALIASES.tier[fold(body.tier)];
    if (body.tier == null) errors.push("Thiếu tier (standard | luxury).");
    else if (!tier) errors.push("tier không hợp lệ, chỉ nhận: standard (Tiêu chuẩn) | luxury (Cao cấp).");
    const style = body.style == null ? undefined : ALIASES.style[fold(body.style)];
    if (body.style == null) errors.push("Thiếu style (modern | modern_luxury).");
    else if (!style) errors.push("style không hợp lệ, chỉ nhận: modern (Hiện đại) | modern_luxury (Modern Luxury).");

    let startDate = defaultStartDate();
    if (body.startDate != null) {
      if (!isValidDate(body.startDate)) errors.push("startDate phải có dạng YYYY-MM-DD hợp lệ (năm 2020-2100).");
      else startDate = body.startDate;
    }

    const scope = Object.assign({}, DEFAULT_SCOPE);
    if (body.scope != null) {
      if (typeof body.scope !== "object" || Array.isArray(body.scope)) errors.push("scope phải là đối tượng.");
      else Object.keys(body.scope).forEach(k => {
        const rule = SCOPE_ENUMS[k], v = body.scope[k];
        if (!rule) return errors.push("scope." + k + " không được hỗ trợ.");
        if (rule === "bool") {
          if (typeof v !== "boolean") errors.push("scope." + k + " phải là true hoặc false.");
          else scope[k] = v;
        } else if (k === "demoLevel") {
          const nv = toNumber(v);
          if (!rule.includes(nv)) errors.push("scope.demoLevel chỉ nhận 20 | 50 | 100.");
          else scope[k] = nv;
        } else if (!rule.includes(v)) errors.push("scope." + k + " chỉ nhận: " + rule.join(" | ") + ".");
        else scope[k] = v;
      });
    }

    let showSchedule = false;
    if (body.showSchedule != null) {
      if (typeof body.showSchedule !== "boolean") errors.push("showSchedule phải là true hoặc false.");
      else showSchedule = body.showSchedule;
    }

    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { clientName, phone, area, beds, baths, tier, style, startDate, scope, showSchedule } };
  }

  // ── Link cấu hình ?cfg=<base64url JSON> (không chứa tên / SĐT khách) ──
  function encodeCfg(v) {
    const json = JSON.stringify({ area: v.area, beds: v.beds, baths: v.baths, tier: v.tier, style: v.style, startDate: v.startDate, scope: v.scope });
    const b64 = typeof btoa === "function"
      ? btoa(String.fromCharCode.apply(null, Array.from(new TextEncoder().encode(json))))
      : Buffer.from(json, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeCfg(param) {
    const b64 = String(param).replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const json = typeof atob === "function"
      ? new TextDecoder().decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0)))
      : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  }

  return {
    RATES, LABELS, ITEM_NAMES, WC_EQUIPMENT_LABELS, GROUPS, DEFAULT_SCOPE, SCOPE_ENUMS,
    money, compact, dateText, mondayIfWeekend, addWorkdays, areaFactor, autoRooms,
    calculate, buildSchedule, detailFor, validateRequest, defaultStartDate, encodeCfg, decodeCfg
  };
});
