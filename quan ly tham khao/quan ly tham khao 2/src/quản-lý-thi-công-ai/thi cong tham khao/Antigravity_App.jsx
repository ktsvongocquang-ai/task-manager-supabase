import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════
// ANTIGRAVITY — Construction Management App
// Complete implementation per PRD v1.0
// ═══════════════════════════════════════════

// ── Persistent Storage Helpers ──
const STORE_KEY = "antigravity-data";
let _cache = null;

async function loadData() {
  if (_cache) return _cache;
  try {
    const r = await window.storage.get(STORE_KEY);
    _cache = r ? JSON.parse(r.value) : null;
  } catch { _cache = null; }
  if (!_cache) _cache = buildSeedData();
  return _cache;
}

async function saveData(data) {
  _cache = data;
  try { await window.storage.set(STORE_KEY, JSON.stringify(data)); } catch {}
}

// ── Seed / Demo Data ──
function buildSeedData() {
  return {
    projects: [
      { id: "p1", name: "Nhà phố Bình Thạnh", address: "123 Điện Biên Phủ, Q. Bình Thạnh", type: "townhouse3", area: 85, floors: 3, contractValue: 2800000000, startDate: "2026-01-15", handoverDate: "2026-08-20", progress: 45, budgetSpent: 42, riskLevel: "green", status: "active" },
      { id: "p2", name: "Biệt thự Thủ Đức", address: "45 Võ Văn Ngân, TP Thủ Đức", type: "villa", area: 200, floors: 2, contractValue: 5200000000, startDate: "2026-02-01", handoverDate: "2026-11-15", progress: 28, budgetSpent: 35, riskLevel: "yellow", status: "active" },
      { id: "p3", name: "Nhà phố Tân Bình", address: "78 Cộng Hòa, Q. Tân Bình", type: "townhouse2", area: 65, floors: 2, contractValue: 1900000000, startDate: "2026-03-01", handoverDate: "2026-09-30", progress: 12, budgetSpent: 10, riskLevel: "green", status: "active" },
      { id: "p4", name: "Nhà phố Gò Vấp", address: "56 Quang Trung, Q. Gò Vấp", type: "townhouse3", area: 75, floors: 3, contractValue: 2400000000, startDate: "2025-11-01", handoverDate: "2026-05-15", progress: 72, budgetSpent: 80, riskLevel: "red", status: "active" },
      { id: "p5", name: "Nhà phố Quận 7", address: "90 Nguyễn Thị Thập, Q.7", type: "townhouse2", area: 70, floors: 2, contractValue: 2100000000, startDate: "2026-02-15", handoverDate: "2026-10-01", progress: 22, budgetSpent: 20, riskLevel: "green", status: "active" },
    ],
    timeline: {
      p1: [
        { id: "t1", name: "Móng", start: "2026-01-15", end: "2026-02-10", progress: 100, budget: 420000000, spent: 415000000 },
        { id: "t2", name: "Kết cấu tầng trệt", start: "2026-02-11", end: "2026-03-10", progress: 100, budget: 560000000, spent: 550000000 },
        { id: "t3", name: "Kết cấu lầu 1", start: "2026-03-11", end: "2026-04-05", progress: 65, budget: 490000000, spent: 320000000 },
        { id: "t4", name: "Kết cấu lầu 2", start: "2026-04-06", end: "2026-05-01", progress: 0, budget: 490000000, spent: 0 },
        { id: "t5", name: "Mái + Chống thấm", start: "2026-05-02", end: "2026-05-20", progress: 0, budget: 210000000, spent: 0 },
        { id: "t6", name: "Tô trát + Hoàn thiện", start: "2026-05-21", end: "2026-07-15", progress: 0, budget: 420000000, spent: 0 },
        { id: "t7", name: "MEP (Điện, nước)", start: "2026-06-01", end: "2026-07-30", progress: 0, budget: 280000000, spent: 0 },
        { id: "t8", name: "Sơn + Vệ sinh + Bàn giao", start: "2026-08-01", end: "2026-08-20", progress: 0, budget: 140000000, spent: 0 },
      ],
    },
    diary: {
      p1: [
        { id: "d1", date: "2026-03-27", weather: "Nắng 33°C", workItem: "Kết cấu lầu 1", workers: { main: 5, helper: 3 }, note: "Hoàn thành đổ bê tông sàn lầu 1. Bê tông đạt chuẩn mác 300.", photos: 3, status: "approved", gps: "10.8012, 106.7109" },
        { id: "d2", date: "2026-03-26", weather: "Nắng 31°C", workItem: "Kết cấu lầu 1", workers: { main: 6, helper: 3 }, note: "Lắp đặt cốt thép sàn lầu 1, kiểm tra khoảng cách thép đai.", photos: 4, status: "approved", gps: "10.8012, 106.7109" },
        { id: "d3", date: "2026-03-25", weather: "Mưa rào chiều", workItem: "Kết cấu lầu 1", workers: { main: 4, helper: 2 }, note: "Ghép cốt pha dầm lầu 1. Buổi chiều mưa, dừng 2 tiếng.", photos: 2, status: "approved", gps: "10.8012, 106.7109" },
        { id: "d4", date: "2026-03-24", weather: "Nắng 32°C", workItem: "Kết cấu lầu 1", workers: { main: 5, helper: 3 }, note: "Tiếp tục cốt pha cột và dầm lầu 1.", photos: 3, status: "approved", gps: "10.8012, 106.7109" },
      ],
    },
    approvals: [
      { id: "a1", projectId: "p1", type: "qc", title: "QC: Cốt thép sàn lầu 1", date: "2026-03-27", status: "pending", detail: "12 mục kiểm tra, 11 pass, 1 chờ xác nhận khoảng cách thép đai vị trí D3." },
      { id: "a2", projectId: "p2", type: "material", title: "Đề xuất vật tư: Thép Pomina D16", date: "2026-03-27", status: "pending", detail: "Số lượng: 2.5 tấn. Ngân sách hạng mục còn lại: 85%. Nhà cung cấp: Đại Thiên Lộc." },
      { id: "a3", projectId: "p4", type: "variation", title: "Phát sinh: KH đổi gạch ốp WC", date: "2026-03-26", status: "pending", detail: "Từ gạch 30x60 Viglacera sang gạch 60x120 nhập khẩu. Chênh lệch: +18,500,000 VND. Thời gian: +3 ngày." },
      { id: "a4", projectId: "p4", type: "budget_alert", title: "Cảnh báo: Vượt ngân sách phần thô", date: "2026-03-27", status: "pending", detail: "Hạng mục kết cấu đã chi 80% ngân sách nhưng mới hoàn thành 65% khối lượng. Dự báo vượt 12%." },
    ],
    subcontractors: [
      { id: "s1", name: "Cty Điện Minh Phát", trade: "Điện", phone: "0909 123 456", rating: 4.5, projectIds: ["p1", "p2"] },
      { id: "s2", name: "Nước Toàn Thắng", trade: "Cấp thoát nước", phone: "0912 345 678", rating: 4.2, projectIds: ["p1", "p3"] },
      { id: "s3", name: "Nhôm kính Đại Phát", trade: "Nhôm kính", phone: "0938 567 890", rating: 4.0, projectIds: ["p2", "p4"] },
      { id: "s4", name: "Sơn Bảo Ngọc", trade: "Sơn nước", phone: "0977 890 123", rating: 4.7, projectIds: ["p1", "p4", "p5"] },
    ],
    milestones: {
      p1: [
        { id: "m1", name: "Nghiệm thu móng", status: "passed", approvedDate: "2026-02-10", paymentAmount: 560000000, paymentStatus: "paid" },
        { id: "m2", name: "Nghiệm thu kết cấu trệt", status: "passed", approvedDate: "2026-03-10", paymentAmount: 560000000, paymentStatus: "paid" },
        { id: "m3", name: "Nghiệm thu kết cấu lầu 1", status: "pending_internal", approvedDate: null, paymentAmount: 560000000, paymentStatus: "unpaid" },
        { id: "m4", name: "Nghiệm thu kết cấu lầu 2", status: "upcoming", approvedDate: null, paymentAmount: 560000000, paymentStatus: "unpaid" },
        { id: "m5", name: "Nghiệm thu hoàn thiện + Bàn giao", status: "upcoming", approvedDate: null, paymentAmount: 560000000, paymentStatus: "unpaid" },
      ],
    },
    notifications: [
      { id: "n1", level: "critical", msg: "Gò Vấp: Vượt ngân sách phần thô 12%", time: "10 phút trước", read: false },
      { id: "n2", level: "action", msg: "Bình Thạnh: QC cốt thép sàn L1 chờ duyệt", time: "30 phút trước", read: false },
      { id: "n3", level: "action", msg: "Thủ Đức: Đề xuất thép Pomina 2.5T chờ duyệt", time: "1 giờ trước", read: false },
      { id: "n4", level: "good", msg: "Quận 7: Hoàn thành đúng tiến độ tuần 4", time: "3 giờ trước", read: true },
      { id: "n5", level: "info", msg: "Tân Bình: Nhật ký hôm nay đã cập nhật", time: "4 giờ trước", read: true },
    ],
    finance: {
      monthlyInflow: 3360000000,
      monthlyOutflow: 2890000000,
      workingCapital: 1240000000,
      upcoming: [
        { desc: "KH Bình Thạnh — Đợt 3", amount: 560000000, dueDate: "2026-04-05", type: "in" },
        { desc: "TP Điện Minh Phát", amount: 125000000, dueDate: "2026-04-01", type: "out" },
        { desc: "NCC Thép Đại Thiên Lộc", amount: 340000000, dueDate: "2026-04-03", type: "out" },
        { desc: "KH Gò Vấp — Đợt 4", amount: 480000000, dueDate: "2026-04-10", type: "in" },
      ],
    },
    attendance: {
      p1: { thisWeek: { main: 28, helper: 16 }, thisMonth: { main: 112, helper: 64 }, dailyRate: { main: 450000, helper: 280000 } },
      p2: { thisWeek: { main: 18, helper: 10 }, thisMonth: { main: 72, helper: 40 }, dailyRate: { main: 450000, helper: 280000 } },
    },
  };
}

// ── Formatters ──
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);
const fmtM = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + " tr";
  return fmt(n);
};
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);

// ── Colors ──
const COLORS = {
  bg: "#0B0F14", surface: "#131921", surfaceHover: "#1A2332", card: "#161E2A",
  border: "#1E2A3A", borderHover: "#2A3A50",
  primary: "#3B82F6", primaryDim: "#1E3A5F", primaryGlow: "rgba(59,130,246,0.15)",
  accent: "#F59E0B", accentDim: "#78500B",
  success: "#10B981", successBg: "rgba(16,185,129,0.12)",
  warning: "#F59E0B", warningBg: "rgba(245,158,11,0.12)",
  danger: "#EF4444", dangerBg: "rgba(239,68,68,0.12)",
  text: "#E8ECF1", textSec: "#8B95A5", textDim: "#5A6577",
  pink: "#EC4899", pinkBg: "rgba(236,72,153,0.12)",
  teal: "#14B8A6", tealBg: "rgba(20,184,166,0.12)",
};

const statusColor = (level) => {
  if (level === "green" || level === "passed" || level === "approved" || level === "paid") return COLORS.success;
  if (level === "yellow" || level === "pending" || level === "pending_internal" || level === "action") return COLORS.warning;
  if (level === "red" || level === "critical" || level === "unpaid") return COLORS.danger;
  return COLORS.textDim;
};

// ═══ ICONS (inline SVG) ═══
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const paths = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m6 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5.007M9 17v1a3 3 0 006 0v-1m-6 0h6",
    check: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
    doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    money: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    tool: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    truck: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0M17 16V8h3l3 4v4h-6z",
    mic: "M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 1a3 3 0 00-3 3v4a3 3 0 006 0V4a3 3 0 00-3-3z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    plus: "M12 4v16m8-8H4",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {(paths[name] || "").split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
};

// ═══ REUSABLE COMPONENTS ═══

const Dot = ({ color, size = 10 }) => (
  <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
);

const Badge = ({ children, color = COLORS.primary, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg || color + "1A", letterSpacing: 0.3 }}>{children}</span>
);

const Pill = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? COLORS.primary : COLORS.border}`, background: active ? COLORS.primaryDim : "transparent", color: active ? COLORS.primary : COLORS.textSec, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}>
    {children}
  </button>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, cursor: onClick ? "pointer" : "default", transition: "border-color .2s, transform .15s", ...style }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; } }} onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "none"; } }}>
    {children}
  </div>
);

const Button = ({ children, variant = "primary", size = "md", onClick, style, disabled }) => {
  const styles = {
    primary: { bg: COLORS.primary, color: "#fff", border: "none" },
    success: { bg: COLORS.success, color: "#fff", border: "none" },
    danger: { bg: COLORS.danger, color: "#fff", border: "none" },
    ghost: { bg: "transparent", color: COLORS.textSec, border: `1px solid ${COLORS.border}` },
    warning: { bg: COLORS.warning, color: "#000", border: "none" },
  };
  const s = styles[variant] || styles.primary;
  const pad = size === "sm" ? "6px 12px" : size === "lg" ? "12px 24px" : "8px 16px";
  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  return (
    <button disabled={disabled} onClick={onClick} style={{ padding: pad, borderRadius: 8, background: s.bg, color: s.color, border: s.border, fontSize: fs, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all .2s", display: "inline-flex", alignItems: "center", gap: 6, ...style }}>
      {children}
    </button>
  );
};

const ProgressBar = ({ value, color = COLORS.primary, height = 6, bg }) => (
  <div style={{ width: "100%", height, borderRadius: height, background: bg || COLORS.surface, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, value)}%`, height: "100%", borderRadius: height, background: color, transition: "width .6s ease" }} />
  </div>
);

const SectionTitle = ({ icon, children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontSize: 15, fontWeight: 600 }}>
      {icon && <Icon name={icon} size={18} color={COLORS.primary} />}
      {children}
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: 40, color: COLORS.textDim }}>
    <Icon name={icon} size={40} color={COLORS.textDim} />
    <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>{title}</div>
    <div style={{ marginTop: 4, fontSize: 12 }}>{sub}</div>
  </div>
);

// ═══ VIEWS ═══

// ── 1. DASHBOARD (Manager Surface Layer) ──
function DashboardView({ data, onNavigate }) {
  const unread = data.notifications.filter(n => !n.read).length;
  const pendingApprovals = data.approvals.filter(a => a.status === "pending").length;

  return (
    <div>
      {/* Company finance strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Thu tháng này", value: fmtM(data.finance.monthlyInflow), color: COLORS.success, icon: "arrowRight" },
          { label: "Chi tháng này", value: fmtM(data.finance.monthlyOutflow), color: COLORS.danger, icon: "arrowRight" },
          { label: "Vốn lưu động", value: fmtM(data.finance.workingCapital), color: COLORS.primary, icon: "money" },
        ].map((item, i) => (
          <Card key={i} style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
          </Card>
        ))}
      </div>

      {/* Traffic light projects */}
      <SectionTitle icon="building">
        Công trình ({data.projects.length})
      </SectionTitle>

      {data.projects.map(p => (
        <Card key={p.id} onClick={() => onNavigate("project", p.id)} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{p.address}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12, flexShrink: 0 }}>
              {/* 3 traffic dots */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Dot color={p.progress >= (daysBetween(p.startDate, "2026-03-28") / daysBetween(p.startDate, p.handoverDate) * 100 - 5) ? COLORS.success : p.progress >= (daysBetween(p.startDate, "2026-03-28") / daysBetween(p.startDate, p.handoverDate) * 100 - 15) ? COLORS.warning : COLORS.danger} />
                <span style={{ fontSize: 8, color: COLORS.textDim }}>TĐ</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Dot color={p.budgetSpent <= p.progress * 1.1 ? COLORS.success : p.budgetSpent <= p.progress * 1.3 ? COLORS.warning : COLORS.danger} />
                <span style={{ fontSize: 8, color: COLORS.textDim }}>TC</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Dot color={statusColor(p.riskLevel)} />
                <span style={{ fontSize: 8, color: COLORS.textDim }}>RR</span>
              </div>
              <div style={{ width: 40, textAlign: "right" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{p.progress}%</span>
              </div>
            </div>
          </div>
          <ProgressBar value={p.progress} color={statusColor(p.riskLevel)} height={3} bg={COLORS.surface} />
        </Card>
      ))}

      {/* Approval queue */}
      {pendingApprovals > 0 && (
        <>
          <SectionTitle icon="check" action={<Badge color={COLORS.warning} bg={COLORS.warningBg}>{pendingApprovals} chờ duyệt</Badge>}>
            Cần hành động
          </SectionTitle>
          {data.approvals.filter(a => a.status === "pending").map(a => (
            <Card key={a.id} onClick={() => onNavigate("approval", a.id)} style={{ marginBottom: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Dot color={a.type === "budget_alert" ? COLORS.danger : a.type === "variation" ? COLORS.accent : a.type === "qc" ? COLORS.teal : COLORS.primary} size={8} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{a.detail}</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{a.date}</div>
                </div>
                <Icon name="arrowRight" size={14} color={COLORS.textDim} />
              </div>
            </Card>
          ))}
        </>
      )}

      {/* Notifications preview */}
      <SectionTitle icon="bell" action={unread > 0 && <Badge color={COLORS.danger} bg={COLORS.dangerBg}>{unread} mới</Badge>}>
        Thông báo gần đây
      </SectionTitle>
      {data.notifications.slice(0, 4).map(n => (
        <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, opacity: n.read ? 0.6 : 1 }}>
          <Dot color={statusColor(n.level)} size={8} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: COLORS.text }}>{n.msg}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 2. PROJECT DETAIL (Middle Layer) ──
function ProjectView({ data, projectId, onNavigate }) {
  const p = data.projects.find(x => x.id === projectId);
  const tl = data.timeline[projectId] || [];
  const diary = (data.diary[projectId] || []).slice(0, 5);
  const ms = (data.milestones[projectId] || []);
  const att = data.attendance[projectId];
  const subs = data.subcontractors.filter(s => s.projectIds.includes(projectId));
  const daysLeft = daysBetween("2026-03-28", p.handoverDate);
  const totalBudget = tl.reduce((s, t) => s + t.budget, 0);
  const totalSpent = tl.reduce((s, t) => s + t.spent, 0);

  const [tab, setTab] = useState("timeline");

  if (!p) return <EmptyState icon="building" title="Không tìm thấy công trình" />;

  return (
    <div>
      {/* Project header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button onClick={() => onNavigate("dashboard")} style={{ background: "none", border: "none", color: COLORS.textSec, cursor: "pointer", padding: 0, display: "flex" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{p.name}</span>
          <Dot color={statusColor(p.riskLevel)} />
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>{p.address}</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { label: "Tiến độ", value: p.progress + "%", color: COLORS.primary },
          { label: "Còn lại", value: daysLeft + " ngày", color: COLORS.accent },
          { label: "Đã chi", value: fmtM(totalSpent), color: totalSpent / totalBudget > p.progress / 100 * 1.15 ? COLORS.danger : COLORS.success },
          { label: "Hợp đồng", value: fmtM(p.contractValue), color: COLORS.text },
        ].map((k, i) => (
          <Card key={i} style={{ padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>{k.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: k.color, marginTop: 2 }}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "timeline", label: "Timeline", icon: "calendar" },
          { id: "diary", label: "Nhật ký", icon: "camera" },
          { id: "finance", label: "Tài chính", icon: "money" },
          { id: "milestone", label: "Nghiệm thu", icon: "check" },
          { id: "sub", label: "Thầu phụ", icon: "truck" },
          { id: "attendance", label: "Chấm công", icon: "users" },
        ].map(t => <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pill>)}
      </div>

      {/* Tab content */}
      {tab === "timeline" && (
        <div>
          {tl.map((item, i) => {
            const isActive = item.progress > 0 && item.progress < 100;
            return (
              <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 2 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${item.progress === 100 ? COLORS.success : isActive ? COLORS.primary : COLORS.textDim}`, background: item.progress === 100 ? COLORS.success : "transparent", flexShrink: 0 }} />
                  {i < tl.length - 1 && <div style={{ width: 1, flex: 1, background: COLORS.border }} />}
                </div>
                <Card style={{ flex: 1, padding: 10, marginBottom: 6, borderLeft: isActive ? `3px solid ${COLORS.primary}` : "3px solid transparent", borderRadius: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? COLORS.primary : item.progress === 100 ? COLORS.success : COLORS.textSec }}>{item.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.progress === 100 ? COLORS.success : isActive ? COLORS.primary : COLORS.textDim }}>{item.progress}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{item.start} → {item.end}</div>
                  <ProgressBar value={item.progress} color={item.progress === 100 ? COLORS.success : COLORS.primary} height={3} bg={COLORS.surface} />
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>
                    Ngân sách: {fmtM(item.spent)} / {fmtM(item.budget)} ({Math.round(item.spent / item.budget * 100)}%)
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {tab === "diary" && (
        <div>
          {diary.length === 0 ? <EmptyState icon="camera" title="Chưa có nhật ký" sub="Kỹ sư sẽ cập nhật hàng ngày" /> :
            diary.map(d => (
              <Card key={d.id} style={{ marginBottom: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge color={COLORS.success} bg={COLORS.successBg}>{d.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}</Badge>
                    <span style={{ fontSize: 11, color: COLORS.textDim }}>{d.date}</span>
                  </div>
                  <span style={{ fontSize: 10, color: COLORS.textDim }}>{d.weather}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 6 }}>{d.note}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: COLORS.textDim }}>
                  <span><Icon name="camera" size={12} color={COLORS.textDim} /> {d.photos} ảnh</span>
                  <span><Icon name="users" size={12} color={COLORS.textDim} /> {d.workers.main}TC + {d.workers.helper}TP</span>
                  <span>GPS: {d.gps}</span>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {tab === "finance" && (
        <div>
          {/* Earned Value */}
          <Card style={{ marginBottom: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Earned Value Analysis</div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>% Khối lượng xong</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>{p.progress}%</div>
                <ProgressBar value={p.progress} color={COLORS.primary} height={4} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>% Ngân sách đã chi</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: p.budgetSpent > p.progress * 1.15 ? COLORS.danger : COLORS.success }}>{p.budgetSpent}%</div>
                <ProgressBar value={p.budgetSpent} color={p.budgetSpent > p.progress * 1.15 ? COLORS.danger : COLORS.success} height={4} />
              </div>
            </div>
            {p.budgetSpent > p.progress * 1.15 && (
              <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: COLORS.dangerBg, fontSize: 11, color: COLORS.danger }}>
                Cảnh báo: Chi tiền nhanh hơn tiến độ. Dự báo vượt ngân sách {Math.round((p.budgetSpent / p.progress - 1) * 100)}% khi hoàn thành.
              </div>
            )}
          </Card>

          {/* Per-item breakdown */}
          {tl.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
              <span style={{ color: COLORS.text }}>{item.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: COLORS.textDim }}>{fmtM(item.spent)}/{fmtM(item.budget)}</span>
                <span style={{ color: item.spent / item.budget > 0.9 && item.progress < 90 ? COLORS.danger : COLORS.textSec, fontWeight: 600, width: 36, textAlign: "right" }}>{Math.round(item.spent / item.budget * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "milestone" && (
        <div>
          {ms.map((m, i) => (
            <Card key={m.id} style={{ marginBottom: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>
                    {m.status === "passed" ? `Duyệt: ${m.approvedDate}` : m.status === "pending_internal" ? "Đang QC nội bộ" : "Chưa đến"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge color={statusColor(m.status)} bg={m.status === "passed" ? COLORS.successBg : m.status === "pending_internal" ? COLORS.warningBg : undefined}>
                    {m.status === "passed" ? "Pass" : m.status === "pending_internal" ? "QC..." : "Upcoming"}
                  </Badge>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{fmtM(m.paymentAmount)}</div>
                  <Badge color={statusColor(m.paymentStatus)} bg={m.paymentStatus === "paid" ? COLORS.successBg : COLORS.dangerBg}>
                    {m.paymentStatus === "paid" ? "Đã TT" : "Chưa TT"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "sub" && (
        <div>
          {subs.length === 0 ? <EmptyState icon="truck" title="Chưa có thầu phụ" sub="Thêm từ danh sách thầu phụ" /> :
            subs.map(s => (
              <Card key={s.id} style={{ marginBottom: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim }}>{s.trade} · {s.phone}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="star" size={14} color={COLORS.accent} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{s.rating}</span>
                  </div>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {tab === "attendance" && (
        <div>
          {att ? (
            <>
              <Card style={{ marginBottom: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Tuần này</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{att.thisWeek.main}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim }}>Công thợ chính</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.teal }}>{att.thisWeek.helper}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim }}>Công thợ phụ</div>
                  </div>
                </div>
              </Card>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Tháng này</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textDim }}>Thợ chính: {att.thisMonth.main} công</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{fmtM(att.thisMonth.main * att.dailyRate.main)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textDim }}>Thợ phụ: {att.thisMonth.helper} công</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{fmtM(att.thisMonth.helper * att.dailyRate.helper)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>Tổng chi nhân công tháng</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent }}>
                    {fmtM(att.thisMonth.main * att.dailyRate.main + att.thisMonth.helper * att.dailyRate.helper)}
                  </div>
                </div>
              </Card>
            </>
          ) : <EmptyState icon="users" title="Chưa có dữ liệu chấm công" sub="Dữ liệu tổng hợp từ nhật ký hàng ngày" />}
        </div>
      )}
    </div>
  );
}

// ── 3. ENGINEER REPORT ──
function EngineerView({ data, onSubmit }) {
  const p = data.projects[0];
  const tl = (data.timeline[p.id] || []).find(t => t.progress > 0 && t.progress < 100) || (data.timeline[p.id] || [])[0];
  const lastDiary = (data.diary[p.id] || [])[0];

  const [confirmed, setConfirmed] = useState(false);
  const [workers, setWorkers] = useState({ main: lastDiary?.workers.main || 4, helper: lastDiary?.workers.helper || 2 });
  const [photos, setPhotos] = useState(0);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: COLORS.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name="check" size={30} color={COLORS.success} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.success }}>Đã gửi báo cáo!</div>
        <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 8 }}>Dữ liệu đang đồng bộ lên hệ thống...</div>
        <Button variant="ghost" style={{ marginTop: 20 }} onClick={() => setSubmitted(false)}>Tạo báo cáo mới</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Báo cáo hôm nay</div>
      <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 16 }}>{p.name} · 28/03/2026</div>

      {/* Smart suggestion */}
      <Card style={{ marginBottom: 12, padding: 14, borderLeft: `3px solid ${COLORS.primary}`, borderRadius: 0 }}>
        <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, marginBottom: 6 }}>AI ĐỀ XUẤT</div>
        <div style={{ fontSize: 13, color: COLORS.text }}>
          Hôm nay theo kế hoạch: <strong>{tl?.name || "—"}</strong>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
          Thời tiết: Nắng 33°C · GPS: 10.8012, 106.7109
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button size="sm" onClick={() => setConfirmed(true)} variant={confirmed ? "success" : "primary"}>
            {confirmed ? "Đã xác nhận" : "Đúng"}
          </Button>
          <Button size="sm" variant="ghost">Sửa hạng mục</Button>
        </div>
      </Card>

      {/* Workers */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
          <Icon name="users" size={14} color={COLORS.primary} /> Nhân sự
          <span style={{ fontSize: 10, color: COLORS.textDim, fontWeight: 400, marginLeft: 6 }}>(hôm qua: {lastDiary?.workers.main}TC + {lastDiary?.workers.helper}TP)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Thợ chính", key: "main" },
            { label: "Thợ phụ", key: "helper" },
          ].map(w => (
            <div key={w.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: COLORS.textSec }}>{w.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setWorkers(p => ({ ...p, [w.key]: Math.max(0, p[w.key] - 1) }))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, width: 24, textAlign: "center" }}>{workers[w.key]}</span>
                <button onClick={() => setWorkers(p => ({ ...p, [w.key]: p[w.key] + 1 }))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Photo capture */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
          <Icon name="camera" size={14} color={COLORS.primary} /> Ảnh công trình
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: photos }).map((_, i) => (
            <div key={i} style={{ width: 60, height: 60, borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={20} color={COLORS.success} />
            </div>
          ))}
          <button onClick={() => setPhotos(p => Math.min(10, p + 1))} style={{ width: 60, height: 60, borderRadius: 8, border: `2px dashed ${COLORS.border}`, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.textDim, gap: 2 }}>
            <Icon name="camera" size={20} color={COLORS.textDim} />
            <span style={{ fontSize: 8 }}>Chụp</span>
          </button>
        </div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 6 }}>Tối thiểu 2 ảnh · Watermark tự động · Chỉ camera in-app</div>
      </Card>

      {/* Voice / text note */}
      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
          <Icon name="mic" size={14} color={COLORS.primary} /> Ghi chú
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập hoặc bấm mic để nói..." rows={3} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text, fontSize: 12, resize: "none", fontFamily: "inherit" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Button size="sm" variant="ghost">
            <Icon name="mic" size={14} /> Nói
          </Button>
        </div>
      </Card>

      {/* Submit */}
      <Button size="lg" variant="success" style={{ width: "100%", justifyContent: "center" }} disabled={photos < 2 || !confirmed} onClick={() => setSubmitted(true)}>
        <Icon name="check" size={18} /> Gửi báo cáo
      </Button>
      {(photos < 2 || !confirmed) && (
        <div style={{ fontSize: 10, color: COLORS.warning, textAlign: "center", marginTop: 6 }}>
          {!confirmed && "Xác nhận hạng mục · "}{photos < 2 && `Cần thêm ${2 - photos} ảnh`}
        </div>
      )}
    </div>
  );
}

// ── 4. CLIENT VIEW (Homeowner) ──
function ClientView({ data }) {
  const p = data.projects[0];
  const diary = (data.diary[p.id] || []);
  const ms = (data.milestones[p.id] || []);
  const daysLeft = daysBetween("2026-03-28", p.handoverDate);
  const totalPaid = ms.filter(m => m.paymentStatus === "paid").reduce((s, m) => s + m.paymentAmount, 0);

  return (
    <div>
      {/* Countdown hero */}
      <div style={{ textAlign: "center", padding: "20px 0", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 1 }}>Ngày bàn giao dự kiến</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: COLORS.primary, lineHeight: 1.1, marginTop: 4 }}>{daysLeft}</div>
        <div style={{ fontSize: 13, color: COLORS.textSec }}>ngày nữa</div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar value={p.progress} color={COLORS.primary} height={8} bg={COLORS.surface} />
          <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600, marginTop: 6 }}>Tổng thể: {p.progress}%</div>
        </div>
      </div>

      {/* Finance summary */}
      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Giá trị hợp đồng</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{fmtM(p.contractValue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Đã thanh toán</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.success }}>{fmtM(totalPaid)}</div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={totalPaid / p.contractValue * 100} color={COLORS.success} height={4} />
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{Math.round(totalPaid / p.contractValue * 100)}% đã thanh toán</div>
        </div>
      </Card>

      {/* Milestones */}
      <SectionTitle icon="check">Mốc nghiệm thu</SectionTitle>
      {ms.map(m => (
        <Card key={m.id} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: m.status === "passed" ? COLORS.success : m.status === "pending_internal" ? COLORS.warningBg : COLORS.surface, border: `2px solid ${m.status === "passed" ? COLORS.success : m.status === "pending_internal" ? COLORS.warning : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.status === "passed" && <Icon name="check" size={14} color="#fff" />}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{m.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>{m.status === "passed" ? m.approvedDate : m.status === "pending_internal" ? "Đang kiểm tra..." : "Sắp tới"}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: m.paymentStatus === "paid" ? COLORS.success : COLORS.textDim }}>{fmtM(m.paymentAmount)}</span>
          </div>
        </Card>
      ))}

      {/* Daily story */}
      <SectionTitle icon="camera">Nhật ký xây dựng</SectionTitle>
      {diary.map(d => (
        <Card key={d.id} style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{d.date}</span>
            <span style={{ fontSize: 10, color: COLORS.textDim }}>{d.weather}</span>
          </div>
          {/* Photo placeholder */}
          <div style={{ width: "100%", height: 140, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.primaryDim}, ${COLORS.surface})`, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: COLORS.textDim }}>
              <Icon name="camera" size={24} color={COLORS.textDim} />
              <div style={{ fontSize: 10, marginTop: 4 }}>{d.photos} ảnh · Watermark GPS</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{d.note}</div>
        </Card>
      ))}
    </div>
  );
}

// ── 5. FINANCE VIEW ──
function FinanceView({ data }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Tài chính tổng hợp</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <Card style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Thu tháng này</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{fmtM(data.finance.monthlyInflow)}</div>
        </Card>
        <Card style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Chi tháng này</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.danger }}>{fmtM(data.finance.monthlyOutflow)}</div>
        </Card>
      </div>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase" }}>Vốn lưu động hiện tại</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.primary }}>{fmtM(data.finance.workingCapital)}</div>
      </Card>

      <SectionTitle icon="calendar">Dòng tiền sắp tới (30 ngày)</SectionTitle>
      {data.finance.upcoming.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.text }}>{item.desc}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>{item.dueDate}</div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: item.type === "in" ? COLORS.success : COLORS.danger }}>
            {item.type === "in" ? "+" : "-"}{fmtM(item.amount)}
          </span>
        </div>
      ))}

      <SectionTitle icon="chart">Ngân sách theo công trình</SectionTitle>
      {data.projects.map(p => {
        const tl = data.timeline[p.id] || [];
        const totalBudget = tl.reduce((s, t) => s + t.budget, 0) || p.contractValue;
        const totalSpent = tl.reduce((s, t) => s + t.spent, 0) || (p.budgetSpent * p.contractValue / 100);
        const ratio = totalBudget ? totalSpent / totalBudget * 100 : 0;
        return (
          <Card key={p.id} style={{ marginBottom: 8, padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: COLORS.text, fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: ratio > 85 ? COLORS.danger : COLORS.textSec }}>{fmtM(totalSpent)} / {fmtM(totalBudget)}</span>
            </div>
            <ProgressBar value={ratio} color={ratio > 90 ? COLORS.danger : ratio > 75 ? COLORS.warning : COLORS.success} height={4} />
          </Card>
        );
      })}
    </div>
  );
}

// ── 6. SUBCONTRACTOR LIST ──
function SubcontractorView({ data }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Thầu phụ</div>
        <Button size="sm"><Icon name="plus" size={14} /> Thêm</Button>
      </div>
      {data.subcontractors.map(s => (
        <Card key={s.id} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{s.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 2 }}>{s.trade}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{s.phone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="star" size={14} color={COLORS.accent} />
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{s.rating}</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{s.projectIds.length} công trình</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <Button size="sm" variant="ghost">Gửi báo giá</Button>
            <Button size="sm" variant="ghost">Xem lịch sử</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── 7. REPORTS VIEW ──
function ReportsView({ data }) {
  const reports = [
    { name: "Báo cáo tiến độ tuần", format: "PDF", icon: "doc", color: COLORS.danger },
    { name: "Tổng hợp tài chính tháng", format: "Excel", icon: "chart", color: COLORS.success },
    { name: "Hồ sơ nghiệm thu QC", format: "PDF", icon: "check", color: COLORS.teal },
    { name: "Đối soát thầu phụ", format: "PDF + Excel", icon: "truck", color: COLORS.accent },
    { name: "Bảng chấm công", format: "Excel", icon: "users", color: COLORS.pink },
    { name: "Báo cáo gửi khách hàng", format: "PDF (branded)", icon: "eye", color: COLORS.primary },
  ];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Xuất báo cáo</div>
      {reports.map((r, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: r.color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={r.icon} size={18} color={r.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>{r.format}</div>
              </div>
            </div>
            <Button size="sm" variant="ghost"><Icon name="download" size={14} /> Tạo</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ═══ MAIN APP ═══
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [viewParam, setViewParam] = useState(null);
  const [role, setRole] = useState("manager");

  useEffect(() => {
    loadData().then(d => { setData(d); setLoading(false); });
  }, []);

  const navigate = useCallback((v, param) => {
    setView(v);
    setViewParam(param || null);
  }, []);

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, letterSpacing: -0.5 }}>ANTIGRAVITY</div>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>Loading...</div>
        </div>
      </div>
    );
  }

  const navItems = {
    manager: [
      { id: "dashboard", icon: "home", label: "Tổng quan" },
      { id: "finance_overview", icon: "money", label: "Tài chính" },
      { id: "subs", icon: "truck", label: "Thầu phụ" },
      { id: "reports", icon: "doc", label: "Báo cáo" },
      { id: "settings", icon: "tool", label: "Cài đặt" },
    ],
    engineer: [
      { id: "engineer", icon: "camera", label: "Báo cáo" },
      { id: "dashboard", icon: "home", label: "CT của tôi" },
    ],
    client: [
      { id: "client", icon: "home", label: "Nhà của tôi" },
    ],
  };

  const renderView = () => {
    if (role === "client") return <ClientView data={data} />;
    if (role === "engineer" && view === "engineer") return <EngineerView data={data} />;
    switch (view) {
      case "dashboard": return <DashboardView data={data} onNavigate={navigate} />;
      case "project": return <ProjectView data={data} projectId={viewParam} onNavigate={navigate} />;
      case "finance_overview": return <FinanceView data={data} />;
      case "subs": return <SubcontractorView data={data} />;
      case "reports": return <ReportsView data={data} />;
      default: return <DashboardView data={data} onNavigate={navigate} />;
    }
  };

  const unreadCount = data.notifications.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.primary, letterSpacing: -0.5 }}>ANTIGRAVITY</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Role switcher */}
          <div style={{ display: "flex", gap: 2, background: COLORS.surface, borderRadius: 8, padding: 2 }}>
            {[
              { id: "manager", label: "QL" },
              { id: "engineer", label: "KS" },
              { id: "client", label: "KH" },
            ].map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setView(r.id === "client" ? "client" : r.id === "engineer" ? "engineer" : "dashboard"); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: role === r.id ? COLORS.primary : "transparent", color: role === r.id ? "#fff" : COLORS.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>{r.label}</button>
            ))}
          </div>
          {role === "manager" && (
            <div style={{ position: "relative" }}>
              <Icon name="bell" size={20} color={COLORS.textSec} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: COLORS.danger, fontSize: 8, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {renderView()}
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-around", padding: "6px 0", zIndex: 50 }}>
        {(navItems[role] || navItems.manager).map(item => {
          const isActive = view === item.id || (item.id === "dashboard" && view === "project");
          return (
            <button key={item.id} onClick={() => { setView(item.id); setViewParam(null); }} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 12px", cursor: "pointer", color: isActive ? COLORS.primary : COLORS.textDim, transition: "color .2s" }}>
              <Icon name={item.icon} size={20} color={isActive ? COLORS.primary : COLORS.textDim} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
