import { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen, GitBranch, Calculator, ChevronDown,
  AlertTriangle, CheckCircle2, Plus, Trash2, Download, Upload,
  Lightbulb, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package,
  RefreshCw, TriangleAlert, Zap, Settings, Megaphone,
  Loader2, Gem, FileSpreadsheet, Coins, HardHat, Map, Wrench
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchModules,
  fetchSectionsForModule,
  fetchWorkflows,
  fetchWorkflowWithSteps,
  type TrainingModule,
  type Section,
  type Workflow,
  type WorkflowStep,
} from "../../services/trainingService";

// ─── ICON REGISTRY ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BookOpen, GitBranch, Calculator, Sparkles, Ruler, Palette, Layers,
  FileText, Users, ClipboardList, FolderOpen, Package, RefreshCw,
  CheckCircle2, Zap, Settings, Megaphone, TriangleAlert, Gem,
  FileSpreadsheet, Coins, HardHat, Map, Wrench,
};
const getIcon = (name: string | null) => ICON_MAP[name || ""] || BookOpen;

// ─── COLOR SCHEME PER MODULE ─────────────────────────────────
const MC: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  foundation:         { bg: "#7C3AED", bgLight: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
  "design-knowledge": { bg: "#059669", bgLight: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  workflow:           { bg: "#D97706", bgLight: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  "tools-templates":  { bg: "#6B7280", bgLight: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
  estimation:         { bg: "#0891B2", bgLight: "#ECFEFF", text: "#155E75", border: "#A5F3FC" },
  "sales-marketing":  { bg: "#DC2626", bgLight: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
};

// ─── ESTIMATION DATA ─────────────────────────────────────────
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

// ─── SHARED UI ───────────────────────────────────────────────

const LoadingSpinner = ({ text = "Đang tải..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Loader2 size={28} className="text-purple-500 animate-spin" />
    <span className="text-sm text-gray-500">{text}</span>
  </div>
);

// ─── INLINE CONTENT RENDERERS ────────────────────────────────

const InlineItems = ({ items }: { items: { title: string; body: string }[] }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
    {items.map((item, i) => (
      <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="font-semibold text-xs text-gray-900 mb-1 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-purple-100 text-purple-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
          {item.title}
        </div>
        <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
      </div>
    ))}
  </div>
);

const InlineTable = ({ table }: { table: string[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
    <table className="w-full text-xs">
      <thead className="bg-gray-50">
        <tr>{table[0].map((h, i) => <th key={i} className="text-left px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide text-[10px]">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {table.slice(1).map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium text-gray-900" : "text-gray-600"}`}>{cell}</td>)}
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
          <span className="text-[9px] font-bold text-red-600 uppercase">✗ SAI</span>
          <p className="text-[11px] text-gray-700 mt-1">{m.wrong}</p>
        </div>
        <div className="bg-green-50 p-3">
          <span className="text-[9px] font-bold text-green-600 uppercase">✓ CHUẨN DQH</span>
          <p className="text-[11px] text-gray-700 mt-1">{m.right}</p>
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
  if (sub.content_type === "text" && sub.content) return <p className="text-[11px] text-gray-600 leading-relaxed mt-2 whitespace-pre-line bg-gray-50 rounded-lg p-3 border border-gray-100">{sub.content}</p>;
  if (sub.items) return <InlineItems items={sub.items} />;
  if (sub.table) return <InlineTable table={sub.table} />;
  if (sub.mistakes) return <InlineMistakes mistakes={sub.mistakes} />;
  return null;
};

// ─── FLAT SECTION MODULE (Modules 1, 2, 4, 5, 6) ────────────

const FlatSectionModule = ({ moduleId, moduleSlug }: { moduleId: string; moduleSlug: string }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const colors = MC[moduleSlug] || MC.foundation;

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchSectionsForModule(moduleId).then(data => {
      setSections(data);
      // Auto-open the first section
      if (data.length > 0) setOpenIds(new Set([data[0].id]));
      setLoading(false);
    });
  }, [moduleId]);

  if (loading) return <LoadingSpinner />;
  if (sections.length === 0) return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
      <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-400">Chưa có nội dung cho module này</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isOpen = openIds.has(section.id);
        const Icon = getIcon(section.icon);
        const subsCount = section.subsections?.length || 0;

        return (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Section header */}
            <button
              onClick={() => toggle(section.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
            >
              {/* Color bar + badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold px-2 py-1 rounded text-white" style={{ backgroundColor: colors.bg }}>
                  {section.number}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bgLight }}>
                  <Icon size={16} style={{ color: colors.text }} />
                </div>
              </div>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900">{section.title}</div>
                {section.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{section.description}</p>}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {subsCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    {subsCount} mục
                  </span>
                )}
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: colors.border }}>
                {/* Lead quote */}
                {section.content && (
                  <div className="mt-3 mb-4 flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.bgLight }}>
                    <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: colors.text }} />
                    <p className="text-[11px] italic" style={{ color: colors.text }}>{section.content}</p>
                  </div>
                )}

                {/* Subsections inline */}
                {section.subsections && section.subsections.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    {section.subsections.map((sub: any) => (
                      <div key={sub.id}>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.bg }} />
                          {sub.heading}
                        </h4>
                        <SubsectionContent sub={sub} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mt-3 text-center py-4">Đang cập nhật nội dung...</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── WORKFLOW MODULE (Module 3) — Card-based ─────────────────

const WorkflowModule = ({ moduleId }: { moduleId: string }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [allSteps, setAllSteps] = useState<Record<string, WorkflowStep[]>>({});
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const colors = MC.workflow;

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchWorkflows(moduleId).then(async (wfs) => {
      setWorkflows(wfs);
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
    <div className="space-y-2">
      {workflows.map((wf) => {
        const Icon = getIcon(wf.icon);
        const steps = allSteps[wf.id] || [];
        const isOpen = openIds.has(wf.id);

        return (
          <div key={wf.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Workflow header row */}
            <button
              onClick={() => toggle(wf.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-amber-50/30 transition-colors"
            >
              <span className="text-[10px] font-bold px-2 py-1 rounded text-white flex-shrink-0" style={{ backgroundColor: colors.bg }}>
                {wf.number}
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bgLight }}>
                <Icon size={16} style={{ color: colors.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900">{wf.title}</div>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{wf.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {steps.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {steps.length} bước
                  </span>
                )}
                {wf.checklist && wf.checklist.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {wf.checklist.length} checklist
                  </span>
                )}
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Expanded — Steps table */}
            {isOpen && (
              <div className="border-t border-amber-200">
                {/* Lead quote */}
                {wf.lead_quote && (
                  <div className="px-4 py-2.5 bg-amber-50 flex items-start gap-2 border-b border-amber-100">
                    <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 italic leading-relaxed">"{wf.lead_quote}"</p>
                  </div>
                )}

                {/* Steps — compact process table */}
                {steps.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {steps.map((step, si) => (
                      <div key={step.id} className="px-4 py-3 flex gap-3 hover:bg-gray-50/50 transition-colors">
                        {/* Step number */}
                        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors.bg }}>
                          {si + 1}
                        </div>

                        {/* Step content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm text-gray-900">{step.phase}</span>
                            {step.owner && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 font-medium">
                                👤 {step.owner}
                              </span>
                            )}
                          </div>
                          {/* Actions list */}
                          {step.actions && step.actions.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {step.actions.map((a, ai) => (
                                <li key={ai} className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed">
                                  <CheckCircle2 size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {steps.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-6">Đang cập nhật quy trình chi tiết...</p>
                )}

                {/* Checklist footer */}
                {wf.checklist && wf.checklist.length > 0 && (
                  <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                    <div className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <ClipboardList size={12} /> Checklist cần chuẩn bị
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {wf.checklist.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2 text-[11px] text-green-800 bg-white rounded px-2.5 py-1.5 border border-green-200">
                          <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
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
        id: Date.now() + i, category: r["Khu vực"] || "Phòng khách", name: r["Hạng mục"] || "",
        length: +r["Dài (mm)"] || 0, width: +r["Rộng (mm)"] || 0, height: +r["Cao (mm)"] || 0,
        unit: r["Đơn vị"] || "m²", material: r["Vật liệu"] || "", notes: "",
      }));
      if (mapped.length) setItems(mapped);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const colors = MC.estimation;
  const inputCls = "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white";

  return (
    <div className="space-y-3">
      {/* Project info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
              <option value="quiet-luxury">Quiet Luxury</option><option value="modern-luxury">Modern Luxury</option><option value="indochine">Indochine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={addItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg" style={{ backgroundColor: colors.bg }}>
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                    <td className="px-2 py-1.5"><select value={item.category} onChange={e => update(item.id, "category", e.target.value)} className="w-28 px-1.5 py-1 text-xs border border-gray-200 rounded bg-white">{Object.keys(BASE_RATES).map(k => <option key={k}>{k}</option>)}</select></td>
                    <td className="px-2 py-1.5"><input value={item.name} onChange={e => update(item.id, "name", e.target.value)} placeholder="Tên" className="w-32 px-1.5 py-1 text-xs border border-gray-200 rounded" /></td>
                    {["length", "width", "height"].map(f => (
                      <td key={f} className="px-1 py-1.5"><input type="number" value={(item as any)[f] || ""} onChange={e => update(item.id, f, parseFloat(e.target.value) || 0)} className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded font-mono" /></td>
                    ))}
                    <td className="px-1 py-1.5"><select value={item.unit} onChange={e => update(item.id, "unit", e.target.value)} className="w-14 px-1 py-1 text-xs border border-gray-200 rounded"><option>m²</option><option>md</option><option>cái</option></select></td>
                    <td className="px-2 py-1.5"><input value={item.material} onChange={e => update(item.id, "material", e.target.value)} placeholder="Vật liệu" className="w-32 px-1.5 py-1 text-xs border border-gray-200 rounded" /></td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-500">{area.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">{fmt(cost)} ₫</td>
                    <td className="px-1 py-1.5 text-right"><button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl p-4 flex justify-between items-center text-white" style={{ backgroundColor: colors.bg }}>
        <div>
          <div className="text-[10px] font-bold uppercase opacity-80">{TIER_MULTIPLIER[info.tier].label}</div>
          <div className="text-xs opacity-70">{items.length} hạng mục · {totals.area.toFixed(2)} m²</div>
        </div>
        <div className="text-2xl font-bold">{fmt(totals.cost)} <span className="text-lg opacity-60">₫</span></div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function TrainingHub() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("foundation");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules().then(data => {
      if (data && data.length > 0) setModules(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = modules.find(m => m.slug === activeSlug);
  const colors = MC[activeSlug] || MC.foundation;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner text="Đang tải Training Hub..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: colors.bg }}>
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">DQH Training Hub</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Hệ thống kiến thức nội bộ · Quy trình · Công cụ</p>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-60px)]">
        {/* LEFT SIDEBAR — Desktop */}
        <div className="w-60 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
          <div className="py-2 flex-1">
            {modules.map((m) => {
              const Icon = getIcon(m.icon);
              const isActive = activeSlug === m.slug;
              const mColor = MC[m.slug] || MC.foundation;
              return (
                <button
                  key={m.slug}
                  onClick={() => setActiveSlug(m.slug)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all ${
                    isActive ? "bg-gray-50 border-r-2" : "hover:bg-gray-50/50"
                  }`}
                  style={isActive ? { borderRightColor: mColor.bg } : undefined}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: isActive ? mColor.bg : mColor.bgLight }}
                  >
                    <Icon size={15} style={{ color: isActive ? "#fff" : mColor.text }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold truncate ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                      {m.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* DQH branding */}
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">DQH Interior Design</p>
            <p className="text-[9px] text-gray-300">Quiet Luxury · Since 2020</p>
          </div>
        </div>

        {/* MOBILE tabs */}
        <div className="md:hidden bg-white border-b border-gray-200 w-full fixed top-[52px] z-10 overflow-x-auto">
          <div className="flex px-2 py-1.5 gap-1">
            {modules.map((m) => {
              const isActive = activeSlug === m.slug;
              const mColor = MC[m.slug] || MC.foundation;
              return (
                <button
                  key={m.slug}
                  onClick={() => setActiveSlug(m.slug)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    isActive ? "text-white shadow-sm" : "text-gray-600 bg-gray-100"
                  }`}
                  style={isActive ? { backgroundColor: mColor.bg } : undefined}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-4 md:p-6 overflow-auto md:mt-0 mt-10">
          {/* Module title */}
          {active && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: colors.bg }} />
              <div>
                <h2 className="text-base font-bold text-gray-900">{active.title}</h2>
                <p className="text-xs text-gray-500">{active.description}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!active ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Chọn module để bắt đầu</p>
            </div>
          ) : active.slug === "estimation" ? (
            <EstimationModule />
          ) : active.slug === "workflow" ? (
            <WorkflowModule moduleId={active.id} />
          ) : (
            <FlatSectionModule moduleId={active.id} moduleSlug={active.slug} />
          )}
        </div>
      </div>
    </div>
  );
}
