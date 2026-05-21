import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen, GitBranch, Calculator, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, Upload,
  Lightbulb, ArrowLeft, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package,
  RefreshCw, TriangleAlert, Zap, Settings, Megaphone,
  Search, Loader2, Gem, FileSpreadsheet, Coins, BedDouble,
  Crown, Monitor, HardHat, Map, Wrench
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchModules,
  fetchSectionsForModule,
  fetchWorkflows,
  fetchWorkflowWithSteps,
  searchTrainingContent,
  type TrainingModule,
  type Section,
  type Subsection,
  type Workflow,
  type WorkflowStep,
} from "../../services/trainingService";

// ─── ICON REGISTRY ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BookOpen, GitBranch, Calculator, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package, RefreshCw,
  CheckCircle2, Zap, Settings, Megaphone, TriangleAlert, Gem,
  FileSpreadsheet, Coins, BedDouble, Crown, Monitor, HardHat, Map, Wrench,
};
const getIcon = (name: string | null) => ICON_MAP[name || ""] || BookOpen;

// ─── MODULE PHASE COLORS (like SESAN color bands) ────────────
const MODULE_COLORS: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  foundation:       { bg: "#7C3AED", bgLight: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
  "design-knowledge": { bg: "#059669", bgLight: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  workflow:         { bg: "#D97706", bgLight: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  "tools-templates":  { bg: "#6B7280", bgLight: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
  estimation:       { bg: "#0891B2", bgLight: "#ECFEFF", text: "#155E75", border: "#A5F3FC" },
  "sales-marketing":  { bg: "#DC2626", bgLight: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
};

// ─── ESTIMATION DATA (stays client-side) ─────────────────────
const BASE_RATES: Record<string, number> = {
  "Phòng khách": 4500000, "Phòng ngủ": 4000000, "Phòng bếp": 6500000,
  "Phòng tắm": 5500000, "Phòng làm việc": 3800000, "Hành lang / Khác": 3200000,
  "Tủ kệ": 4200000, "Đồ rời": 5000000,
};
const TIER_MULTIPLIER: Record<string, { label: string; x: number }> = {
  standard: { label: "Standard (8–10tr/m²)", x: 1.0 },
  premium:  { label: "Premium (12–15tr/m²)", x: 1.4 },
  luxury:   { label: "Luxury (18tr+/m²)",    x: 1.9 },
};
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

// ─── SHARED COMPONENTS ───────────────────────────────────────

const LoadingSpinner = ({ text = "Đang tải..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Loader2 size={28} className="text-purple-500 animate-spin" />
    <span className="text-sm text-gray-500">{text}</span>
  </div>
);

// ─── ACCORDION ROW (core UI pattern — expand inline) ─────────

const AccordionRow = ({
  id, color, title, subtitle, badge, children, defaultOpen = false
}: {
  id: string; color: string; title: string; subtitle?: string; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0" style={{ backgroundColor: color }}>
                {badge}
              </span>
            )}
            <span className="font-semibold text-sm text-gray-900 truncate">{title}</span>
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 ml-4 border-l-2" style={{ borderColor: color + "30" }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── INLINE CONTENT RENDERERS (no deep navigation) ───────────

const InlineItems = ({ items }: { items: { title: string; body: string }[] }) => (
  <div className="space-y-2 mt-2">
    {items.map((item, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
        <div className="font-medium text-sm text-gray-900 mb-1">{item.title}</div>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
      </div>
    ))}
  </div>
);

const InlineTable = ({ table }: { table: string[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
    <table className="w-full text-xs">
      <thead className="bg-gray-50">
        <tr>
          {table[0].map((h, i) => (
            <th key={i} className="text-left px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {table.slice(1).map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => (
              <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium text-gray-900" : "text-gray-600"}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InlineMistakes = ({ mistakes }: { mistakes: { wrong: string; right: string }[] }) => (
  <div className="space-y-2 mt-2">
    {mistakes.map((m, j) => (
      <div key={j} className="grid grid-cols-2 gap-px rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-red-50 p-3">
          <span className="text-[10px] font-bold text-red-600 uppercase">✗ SAI</span>
          <p className="text-xs text-gray-700 mt-1">{m.wrong}</p>
        </div>
        <div className="bg-green-50 p-3">
          <span className="text-[10px] font-bold text-green-600 uppercase">✓ CHUẨN</span>
          <p className="text-xs text-gray-700 mt-1">{m.right}</p>
        </div>
      </div>
    ))}
  </div>
);

const SubsectionContent = ({ sub }: { sub: any }) => {
  const meta = sub.metadata || {};
  if (sub.content_type === "list" && meta.items) return <InlineItems items={meta.items} />;
  if (sub.content_type === "table" && meta.table) return <InlineTable table={meta.table} />;
  if (sub.content_type === "mistakes" && meta.mistakes) return <InlineMistakes mistakes={meta.mistakes} />;
  if (sub.content_type === "text" && sub.content) return <p className="text-xs text-gray-600 leading-relaxed mt-2 whitespace-pre-line">{sub.content}</p>;
  // Fallback format
  if (sub.items) return <InlineItems items={sub.items} />;
  if (sub.table) return <InlineTable table={sub.table} />;
  if (sub.mistakes) return <InlineMistakes mistakes={sub.mistakes} />;
  return null;
};

// ─── FLAT SECTION MODULE (Modules 1, 2, 4, 5, 6) ────────────
// ALL content visible as accordion rows — no deep page navigation

const FlatSectionModule = ({ moduleId, moduleSlug }: { moduleId: string; moduleSlug: string }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = MODULE_COLORS[moduleSlug] || MODULE_COLORS.foundation;

  useEffect(() => {
    setLoading(true);
    fetchSectionsForModule(moduleId).then(data => {
      setSections(data);
      setLoading(false);
    });
  }, [moduleId]);

  if (loading) return <LoadingSpinner />;
  if (sections.length === 0) return (
    <div className="text-center py-12">
      <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-400">Chưa có nội dung</p>
    </div>
  );

  return (
    <div className="space-y-0 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Module header band */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: colors.bg }}>
        <span className="text-white font-bold text-sm uppercase tracking-wide">Nội dung</span>
        <span className="text-white/70 text-xs">{sections.length} phần</span>
      </div>

      {sections.map((section) => (
        <AccordionRow
          key={section.id}
          id={section.id}
          color={colors.bg}
          badge={section.number}
          title={section.title}
          subtitle={section.description || undefined}
        >
          {/* Show lead quote if available */}
          {section.content && (
            <p className="text-xs text-gray-500 italic mt-1 mb-3 pl-2 border-l-2" style={{ borderColor: colors.bg + "40" }}>
              {section.content}
            </p>
          )}

          {/* Render subsections INLINE */}
          {section.subsections && section.subsections.length > 0 ? (
            <div className="space-y-3">
              {section.subsections.map((sub: any) => (
                <div key={sub.id}>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{sub.heading}</h4>
                  <SubsectionContent sub={sub} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mt-2">Đang cập nhật nội dung...</p>
          )}
        </AccordionRow>
      ))}
    </div>
  );
};

// ─── WORKFLOW TABLE MODULE (Module 3) — SESAN-style ──────────

const WorkflowTableModule = ({ moduleId }: { moduleId: string }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [allSteps, setAllSteps] = useState<Record<string, WorkflowStep[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedWf, setExpandedWf] = useState<string | null>(null);
  const colors = MODULE_COLORS.workflow;

  useEffect(() => {
    setLoading(true);
    fetchWorkflows(moduleId).then(async (wfs) => {
      setWorkflows(wfs);
      // Pre-load all steps for all workflows
      const stepsMap: Record<string, WorkflowStep[]> = {};
      await Promise.all(wfs.map(async (wf) => {
        const full = await fetchWorkflowWithSteps(wf.id);
        if (full?.steps) stepsMap[wf.id] = full.steps;
      }));
      setAllSteps(stepsMap);
      setLoading(false);
    });
  }, [moduleId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header band */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: colors.bg }}>
        <span className="text-white font-bold text-sm uppercase tracking-wide">Quy trình</span>
        <span className="text-white/70 text-xs">{workflows.length} workflows</span>
      </div>

      {/* Workflow process table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-12">STT</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Giai đoạn</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Mô tả</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Checklist</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workflows.map((wf) => {
              const steps = allSteps[wf.id] || [];
              const isExpanded = expandedWf === wf.id;
              const Icon = getIcon(wf.icon);
              return (
                <tbody key={wf.id}>
                  {/* Main workflow row */}
                  <tr
                    onClick={() => setExpandedWf(isExpanded ? null : wf.id)}
                    className="cursor-pointer hover:bg-amber-50/50 transition-colors"
                    style={{ borderLeft: `3px solid ${colors.bg}` }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: colors.bg }}>
                        {wf.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-amber-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 text-sm">{wf.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{wf.description}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {wf.checklist && wf.checklist.length > 0 ? `${wf.checklist.length} items` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </td>
                  </tr>

                  {/* Expanded detail — step table */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="bg-amber-50/30 border-t border-amber-100">
                          {/* Lead quote */}
                          {wf.lead_quote && (
                            <p className="text-xs text-amber-800 italic px-6 py-2 bg-amber-50 border-b border-amber-100">
                              "{wf.lead_quote}"
                            </p>
                          )}

                          {/* Steps as sub-table */}
                          {steps.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-amber-50">
                                  <th className="text-left px-6 py-2 text-[9px] font-bold text-amber-700 uppercase w-8">#</th>
                                  <th className="text-left px-4 py-2 text-[9px] font-bold text-amber-700 uppercase">Bước / Phase</th>
                                  <th className="text-left px-4 py-2 text-[9px] font-bold text-amber-700 uppercase">Thực hiện</th>
                                  <th className="text-left px-4 py-2 text-[9px] font-bold text-amber-700 uppercase">Nhiệm vụ chi tiết</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100/50">
                                {steps.map((step, si) => (
                                  <tr key={step.id} className="hover:bg-white/50">
                                    <td className="px-6 py-2.5 text-amber-600 font-bold">{si + 1}</td>
                                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{step.phase}</td>
                                    <td className="px-4 py-2.5">
                                      {step.owner && (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-gray-200 text-gray-700">
                                          {step.owner}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-600">
                                      <ul className="space-y-0.5">
                                        {(step.actions || []).map((a, ai) => (
                                          <li key={ai} className="flex items-start gap-1.5">
                                            <span className="text-amber-400 mt-0.5">•</span>
                                            <span>{a}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-gray-400 italic px-6 py-4">Chưa có bước chi tiết</p>
                          )}

                          {/* Checklist */}
                          {wf.checklist && wf.checklist.length > 0 && (
                            <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Checklist:</span>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {wf.checklist.map((c, ci) => (
                                  <span key={ci} className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-white border border-amber-200 rounded px-2 py-0.5">
                                    <CheckCircle2 size={10} className="text-amber-500" />
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── ESTIMATION MODULE ───────────────────────────────────────

const defaultItem = (id: number) => ({
  id, category: "Phòng khách", name: "", length: 0, width: 0, height: 0,
  unit: "m²", material: "", notes: "",
});

const EstimationModule = () => {
  const [info, setInfo] = useState({ name: "", client: "", tier: "premium", style: "quiet-luxury" });
  const [items, setItems] = useState([{ ...defaultItem(1), name: "Tủ TV âm tường", length: 3500, width: 600, height: 2400, material: "Veneer sồi trắng + sơn PU" }]);
  const fileRef = useRef<HTMLInputElement>(null);

  const calcItem = (item: any) => {
    const rate = BASE_RATES[item.category] ?? 4000000;
    const mx = TIER_MULTIPLIER[info.tier].x;
    const area = item.unit === "m²" ? (item.length / 1000) * (item.width / 1000)
               : item.unit === "md" ? item.length / 1000 : 1;
    return { area, cost: area * rate * mx };
  };

  const totals = useMemo(() => items.reduce((acc, it) => {
    const { area, cost } = calcItem(it);
    return { area: acc.area + area, cost: acc.cost + cost };
  }, { area: 0, cost: 0 }), [items, info.tier]);

  const addItem = () => setItems(prev => [...prev, defaultItem(Date.now())]);
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const update = (id: number, field: string, val: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const exportExcel = () => {
    const rows: any[] = items.map(it => {
      const { area, cost } = calcItem(it);
      return { "Khu vực": it.category, "Hạng mục": it.name, "Dài (mm)": it.length, "Rộng (mm)": it.width, "Cao (mm)": it.height, "Đơn vị": it.unit, "Vật liệu": it.material, "KL": +area.toFixed(2), "Thành tiền (VND)": Math.round(cost) };
    });
    rows.push({ "Khu vực": "", "Hạng mục": "TỔNG CỘNG", "Dài (mm)": "", "Rộng (mm)": "", "Cao (mm)": "", "Đơn vị": "", "Vật liệu": "", "KL": +totals.area.toFixed(2), "Thành tiền (VND)": Math.round(totals.cost) });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dự toán");
    XLSX.writeFile(wb, `DuToan_${info.name || "DQH"}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`);
  };

  const importExcel = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.filter((r: any) => r["Hạng mục"] && r["Hạng mục"] !== "TỔNG CỘNG").map((r: any, i: number) => ({
        id: Date.now() + i,
        category: r["Khu vực"] || "Phòng khách",
        name: r["Hạng mục"] || "",
        length: +r["Dài (mm)"] || 0,
        width: +r["Rộng (mm)"] || 0,
        height: +r["Cao (mm)"] || 0,
        unit: r["Đơn vị"] || "m²",
        material: r["Vật liệu"] || "",
        notes: "",
      }));
      if (mapped.length) setItems(mapped);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const colors = MODULE_COLORS.estimation;
  const inputCls = "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 bg-white";

  return (
    <div>
      {/* Project info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Tên dự án", field: "name", placeholder: "VD: Verosa F11" },
            { label: "Khách hàng", field: "client", placeholder: "VD: Anh Nguyễn" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</label>
              <input value={(info as any)[field]} onChange={e => setInfo({ ...info, [field]: e.target.value })} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phân khúc</label>
            <select value={info.tier} onChange={e => setInfo({ ...info, tier: e.target.value })} className={inputCls}>
              {Object.entries(TIER_MULTIPLIER).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phong cách</label>
            <select value={info.style} onChange={e => setInfo({ ...info, style: e.target.value })} className={inputCls}>
              <option value="quiet-luxury">Quiet Luxury</option>
              <option value="modern-luxury">Modern Luxury</option>
              <option value="indochine">Indochine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={addItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors" style={{ backgroundColor: colors.bg }}>
          <Plus size={14} /> Thêm hạng mục
        </button>
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50">
          <Upload size={14} /> Import
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
        <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Khu vực", "Hạng mục", "Dài", "Rộng", "Cao", "Đv", "Vật liệu", "KL", "Thành tiền", ""].map((h, i) => (
                  <th key={i} className={`px-2 py-2 text-[9px] font-bold text-gray-500 uppercase tracking-wide ${i >= 7 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const { area, cost } = calcItem(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5">
                      <select value={item.category} onChange={e => update(item.id, "category", e.target.value)} className="w-28 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white">
                        {Object.keys(BASE_RATES).map(k => <option key={k}>{k}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={item.name} onChange={e => update(item.id, "name", e.target.value)} placeholder="Tên" className="w-32 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none" />
                    </td>
                    {["length", "width", "height"].map(f => (
                      <td key={f} className="px-1 py-1.5">
                        <input type="number" value={(item as any)[f] || ""} onChange={e => update(item.id, f, parseFloat(e.target.value) || 0)} className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none font-mono" />
                      </td>
                    ))}
                    <td className="px-1 py-1.5">
                      <select value={item.unit} onChange={e => update(item.id, "unit", e.target.value)} className="w-14 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none">
                        <option>m²</option><option>md</option><option>cái</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={item.material} onChange={e => update(item.id, "material", e.target.value)} placeholder="Vật liệu" className="w-32 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none" />
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-500">{area.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">{fmt(cost)} ₫</td>
                    <td className="px-1 py-1.5 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white" style={{ backgroundColor: colors.bg }}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">{TIER_MULTIPLIER[info.tier].label}</div>
          <div className="text-xs opacity-70">{items.length} hạng mục · {totals.area.toFixed(2)} m²</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{fmt(totals.cost)} <span className="text-lg opacity-60">₫</span></div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function TrainingHub() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [activeModuleSlug, setActiveModuleSlug] = useState<string>("foundation");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules().then(data => {
      if (data && data.length > 0) {
        setModules(data);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const activeModule = modules.find(m => m.slug === activeModuleSlug);
  const colors = MODULE_COLORS[activeModuleSlug] || MODULE_COLORS.foundation;

  const renderModuleContent = () => {
    if (!activeModule) return (
      <div className="text-center py-16">
        <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">Chọn module bên trái</p>
      </div>
    );

    if (activeModule.slug === "estimation") return <EstimationModule />;
    if (activeModule.slug === "workflow") return <WorkflowTableModule moduleId={activeModule.id} />;
    return <FlatSectionModule moduleId={activeModule.id} moduleSlug={activeModule.slug} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Đang tải Training Hub..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Training Hub</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">DQH Interior · Kiến thức nội bộ</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-60px)]">
        {/* LEFT SIDEBAR — Module nav (compact) */}
        <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
          <div className="py-2">
            {modules.map((m) => {
              const Icon = getIcon(m.icon);
              const isActive = activeModuleSlug === m.slug;
              const mColor = MODULE_COLORS[m.slug] || MODULE_COLORS.foundation;
              return (
                <button
                  key={m.slug}
                  onClick={() => setActiveModuleSlug(m.slug)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isActive ? mColor.bg : mColor.bgLight }}
                  >
                    <Icon size={14} style={{ color: isActive ? "#fff" : mColor.text }} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold truncate ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                      {m.title}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{m.description?.substring(0, 40)}</div>
                  </div>
                  {isActive && <div className="w-1 h-5 rounded-full ml-auto flex-shrink-0" style={{ backgroundColor: mColor.bg }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* MOBILE tabs */}
        <div className="md:hidden bg-white border-b border-gray-200 w-full fixed top-[52px] z-10">
          <div className="flex overflow-x-auto px-2 py-1.5 gap-1">
            {modules.map((m) => {
              const isActive = activeModuleSlug === m.slug;
              const mColor = MODULE_COLORS[m.slug] || MODULE_COLORS.foundation;
              return (
                <button
                  key={m.slug}
                  onClick={() => setActiveModuleSlug(m.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-gray-600 bg-gray-100"
                  }`}
                  style={isActive ? { backgroundColor: mColor.bg } : undefined}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 p-4 md:p-6 overflow-auto md:mt-0 mt-10">
          {/* Module title bar */}
          {activeModule && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: colors.bg }} />
              <div>
                <h2 className="text-base font-bold text-gray-900">{activeModule.title}</h2>
                <p className="text-xs text-gray-500">{activeModule.description}</p>
              </div>
            </div>
          )}
          {renderModuleContent()}
        </div>
      </div>
    </div>
  );
}
