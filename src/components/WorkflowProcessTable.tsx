import { useState, Fragment } from "react";
import { Download, ChevronDown, ChevronRight, Clock, User, Shield } from "lucide-react";
import * as XLSX from "xlsx";
import { DESIGN_PROCESS_TABLE } from "../data/designProcessTable";

// ─── ROLE BADGE ──────────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
  if (role === "—") return <span className="text-gray-300">—</span>;

  const colors: Record<string, string> = {
    Designer: "bg-blue-50 text-blue-700 border-blue-200",
    "Designer & Leader": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Designer & Drafter": "bg-cyan-50 text-cyan-700 border-cyan-200",
    Leader: "bg-purple-50 text-purple-700 border-purple-200",
    "Leader & Sales": "bg-pink-50 text-pink-700 border-pink-200",
    Director: "bg-amber-50 text-amber-700 border-amber-200",
    "3D Viz": "bg-emerald-50 text-emerald-700 border-emerald-200",
    Drafter: "bg-teal-50 text-teal-700 border-teal-200",
    Sales: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const c = colors[role] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${c}`}>
      {role}
    </span>
  );
};

// ─── PHASE HEADER ROW ────────────────────────────────────────
const PhaseHeader = ({
  phase,
  isOpen,
  onToggle,
}: {
  phase: (typeof DESIGN_PROCESS_TABLE.phases)[0];
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <tr
    onClick={onToggle}
    className="cursor-pointer group"
    style={{ backgroundColor: phase.color + "10" }}
  >
    <td
      colSpan={6}
      className="px-4 py-3 border-b border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: phase.color }}
          >
            {phase.code}
          </span>
          <div>
            <span className="font-bold text-sm text-gray-900">
              {phase.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-500">{phase.duration}</span>
              <span className="text-[11px] text-gray-400 ml-2">
                ({phase.steps.length} bước)
              </span>
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>
    </td>
  </tr>
);

// ─── EXPORT EXCEL ────────────────────────────────────────────
function exportToExcel() {
  const rows: string[][] = [];
  rows.push(["STT", "Nhiệm vụ", "Kết quả / Deliverable", "Thực hiện", "Kiểm soát", "Form / Template", "Thời gian"]);

  DESIGN_PROCESS_TABLE.phases.forEach((phase) => {
    rows.push([`${phase.code}. ${phase.name}`, "", "", "", "", "", phase.duration]);
    phase.steps.forEach((step) => {
      rows.push([
        step.code,
        step.task,
        step.deliverable,
        step.executor,
        step.reviewer,
        step.form,
        "",
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Auto column widths
  ws["!cols"] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DQH Design Process");
  XLSX.writeFile(wb, "DQH_Design_Process.xlsx");
}

// ─── MAIN TABLE COMPONENT ────────────────────────────────────
export default function WorkflowProcessTable() {
  const [openPhases, setOpenPhases] = useState<Set<string>>(
    new Set(DESIGN_PROCESS_TABLE.phases.map((p) => p.code))
  );

  const togglePhase = (code: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const expandAll = () =>
    setOpenPhases(new Set(DESIGN_PROCESS_TABLE.phases.map((p) => p.code)));
  const collapseAll = () => setOpenPhases(new Set());

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {DESIGN_PROCESS_TABLE.phases.length} giai đoạn ·{" "}
            {DESIGN_PROCESS_TABLE.phases.reduce((s, p) => s + p.steps.length, 0)} bước
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-[11px] text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded hover:bg-purple-50"
            >
              Mở tất cả
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-[11px] text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded hover:bg-purple-50"
            >
              Thu gọn
            </button>
          </div>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Download size={13} />
          Tải Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[52px]">
                  STT
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Nhiệm vụ
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[200px]">
                  Kết quả
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[140px]">
                  <span className="inline-flex items-center gap-1">
                    <User size={11} /> Thực hiện
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[100px]">
                  <span className="inline-flex items-center gap-1">
                    <Shield size={11} /> Kiểm soát
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[160px]">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {DESIGN_PROCESS_TABLE.phases.map((phase) => {
                const isOpen = openPhases.has(phase.code);
                return (
                  <Fragment key={phase.code}>
                    <PhaseHeader
                      phase={phase}
                      isOpen={isOpen}
                      onToggle={() => togglePhase(phase.code)}
                    />
                    {isOpen &&
                      phase.steps.map((step, idx) => (
                        <tr
                          key={step.code}
                          className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                            idx === phase.steps.length - 1
                              ? "border-b-gray-200"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{
                                color: phase.color,
                                backgroundColor: phase.color + "15",
                              }}
                            >
                              {step.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {step.task}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {step.deliverable}
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge role={step.executor} />
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge role={step.reviewer} />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {step.form}
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {DESIGN_PROCESS_TABLE.phases.map((p) => (
          <div key={p.code} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-[11px] text-gray-500">
              {p.code}. {p.name.split("—")[0].trim()} ({p.duration})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


