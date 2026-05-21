import { useState, useMemo, Fragment } from "react";
import { Download, Filter, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { DESIGN_PROCESS_TABLE, type ProcessStep } from "../data/designProcessTable";

/* ── Role Badge ─────────────────────────────────────────────── */
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Designer:          { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  "Designer & Leader": { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
  "Designer & Drafter": { bg: "#CFFAFE", text: "#155E75", border: "#67E8F9" },
  Leader:            { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Leader & Sales":  { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  Director:          { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
  "3D Viz":          { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  Drafter:           { bg: "#CCFBF1", text: "#134E4A", border: "#5EEAD4" },
  Sales:             { bg: "#FFE4E6", text: "#9F1239", border: "#FDA4AF" },
  Client:            { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  "Team Thiết Kế":   { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  "Leader & Director": { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
};

const RoleBadge = ({ role }: { role: string }) => {
  if (!role || role === "—") return <span className="text-gray-300 text-[10px]">—</span>;
  const c = ROLE_COLORS[role] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
  return (
    <span
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap"
    >
      {role}
    </span>
  );
};

/* ── Export Excel ────────────────────────────────────────────── */
function exportToExcel() {
  const rows: string[][] = [
    ["STT", "Giai đoạn", "Nhiệm vụ", "Kết quả", "Thực hiện", "Kiểm soát", "Form", "Thời gian"],
  ];
  DESIGN_PROCESS_TABLE.phases.forEach((p) => {
    rows.push([p.code, p.name, "", "", "", "", "", p.totalDuration]);
    p.steps.forEach((s) => rows.push([s.code, "", s.task, s.deliverable, s.executor, s.reviewer, s.form, s.duration]));
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 5 }, { wch: 14 }, { wch: 38 }, { wch: 26 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DQH Process");
  XLSX.writeFile(wb, "DQH_Design_Process.xlsx");
}

/* ── Main Component ─────────────────────────────────────────── */
export default function WorkflowProcessTable() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    DESIGN_PROCESS_TABLE.phases.forEach((p) =>
      p.steps.forEach((s) => {
        set.add(s.executor);
        if (s.reviewer !== "—") set.add(s.reviewer);
      })
    );
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    return DESIGN_PROCESS_TABLE.phases
      .map((phase) => {
        const steps = phase.steps.filter((s) => {
          const q = search.toLowerCase();
          const matchSearch = !q || s.task.toLowerCase().includes(q) || s.deliverable.toLowerCase().includes(q);
          const matchRole = !filterRole || s.executor === filterRole || s.reviewer === filterRole;
          return matchSearch && matchRole;
        });
        return { ...phase, steps };
      })
      .filter((p) => p.steps.length > 0);
  }, [search, filterRole]);

  const totalSteps = filtered.reduce((s, p) => s + p.steps.length, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border ${
                filterRole ? "bg-purple-50 text-purple-700 border-purple-300" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Filter size={12} />
              {filterRole || "Lọc vai trò"}
            </button>
            {showFilter && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { setFilterRole(null); setShowFilter(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 ${!filterRole ? "font-semibold text-purple-700" : "text-gray-600"}`}
                >Tất cả</button>
                {allRoles.map((r) => (
                  <button key={r} onClick={() => { setFilterRole(r); setShowFilter(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 ${filterRole === r ? "font-semibold text-purple-700" : "text-gray-600"}`}
                  >{r}</button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..."
              className="pl-7 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-purple-200" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{totalSteps} bước</span>
          <button onClick={exportToExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
            <Download size={12} /> Excel
          </button>
        </div>
      </div>

      {/* Table — fixed layout with % widths */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed', minWidth: '750px' }}>
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">STT</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Giai đoạn</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Nhiệm vụ</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Kết quả</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Thực hiện</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Kiểm soát</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase">Form</th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase text-center">T.Gian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((phase) => (
                <Fragment key={phase.code}>
                  {/* Phase header */}
                  <tr style={{ backgroundColor: phase.bgLight }}>
                    <td className="px-2 py-2 border-b border-gray-200 align-top">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded text-white font-bold text-[11px]"
                        style={{ backgroundColor: phase.color }}>{phase.code}</span>
                    </td>
                    <td className="px-2 py-2 border-b border-gray-200 align-top">
                      <span className="font-bold text-[11px] text-gray-900 leading-tight block">{phase.name}</span>
                    </td>
                    <td className="px-2 py-2 border-b border-gray-200 text-[11px] font-medium text-gray-700 align-top leading-snug">{phase.phaseTask}</td>
                    <td className="px-2 py-2 border-b border-gray-200 text-[10px] text-gray-600 align-top leading-snug">{phase.phaseDeliverable}</td>
                    <td className="px-2 py-2 border-b border-gray-200 align-top"><RoleBadge role={phase.phaseExecutor} /></td>
                    <td className="px-2 py-2 border-b border-gray-200 align-top"><RoleBadge role={phase.phaseReviewer} /></td>
                    <td className="px-2 py-2 border-b border-gray-200 text-[10px] text-gray-600 align-top">{phase.phaseForm}</td>
                    <td className="px-2 py-2 border-b border-gray-200 text-center align-top">
                      <span className="text-[10px] font-semibold text-gray-700 bg-white/70 border border-gray-300 px-1.5 py-0.5 rounded">{phase.totalDuration}</span>
                    </td>
                  </tr>
                  {/* Steps */}
                  {phase.steps.map((step, idx) => (
                    <tr key={step.code}
                      className={`hover:bg-gray-50/80 ${idx < phase.steps.length - 1 ? "border-b border-gray-100" : "border-b border-gray-200"}`}>
                      <td className="px-2 py-1.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: phase.color }}>{step.code}</span>
                      </td>
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5 text-[11px] text-gray-800 leading-snug">{step.task}</td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-600 leading-snug">{step.deliverable}</td>
                      <td className="px-2 py-1.5"><RoleBadge role={step.executor} /></td>
                      <td className="px-2 py-1.5"><RoleBadge role={step.reviewer} /></td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-500 leading-snug">{step.form}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-[10px] text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{step.duration}</span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 items-center">
        <span className="text-[10px] text-gray-400 font-medium">Giai đoạn:</span>
        {DESIGN_PROCESS_TABLE.phases.map((p) => (
          <div key={p.code} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: p.color }} />
            <span className="text-[10px] text-gray-500">{p.code}. {p.name.split("—")[0].trim()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
